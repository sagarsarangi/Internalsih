import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";
import { sendSmsAlert, SmsDispatchResult } from "@/lib/sms";
import { supabaseServer } from "@/lib/supabase-server";
import { IncidentSchema } from "@/schemas/incident";

export async function POST(request: NextRequest) {
  try {
    let rawBody;
    try {
      rawBody = await request.json();
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (rawBody.event !== "accident_detected") {
      return NextResponse.json(
        { error: "Ignored event type" },
        { status: 400 }
      );
    }

    const { latitude, longitude, gps_valid } = rawBody;

    if (!gps_valid || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Invalid or missing GPS data in payload" },
        { status: 400 }
      );
    }

    // 1. Get SMS recipient from env — always treated as a 10-digit Indian number (+91)
    const rawSmsRecipient = process.env.HARDWARE_SMS_RECIPIENT?.trim();
    if (!rawSmsRecipient) {
      console.warn("[Hardware Webhook] HARDWARE_SMS_RECIPIENT not set in env.");
      return NextResponse.json(
        { error: "Hardware SMS recipient not configured in environment variables." },
        { status: 500 }
      );
    }

    const digitsOnly = rawSmsRecipient.replace(/\D/g, "");
    const resolvedSmsRecipient = `+91${digitsOnly.slice(-10)}`;

    const timestamp = new Date().toISOString();
    const resolvedName = "Hardware Smart Helmet";

    // 2. Reverse geocode
    const address = await reverseGeocode(latitude, longitude);
    
    console.info(`[Hardware Webhook] Auto-dispatching SMS to ${resolvedSmsRecipient} for incident at [${latitude}, ${longitude}]`);

    // 3. Dispatch SMS alert
    const smsResult: SmsDispatchResult = await sendSmsAlert({
      lat: latitude,
      lng: longitude,
      address,
      occurred_at: timestamp,
      name: resolvedName,
      recipient: resolvedSmsRecipient,
    });

    if (!smsResult.sent) {
      console.warn(`[Hardware Webhook] SMS dispatch failed: ${smsResult.message} `);
      return NextResponse.json(
        {
          error: "Emergency SMS dispatch failed. Incident was NOT recorded.",
          details: smsResult.message,
        },
        { status: 422 }
      );
    }

    // 4. Insert into Supabase
    const insertPayload: Record<string, unknown> = {
      lat: latitude,
      lng: longitude,
      address,
      occurred_at: timestamp,
      status: "confirmed",
      victim_name: resolvedName,
      sms: resolvedSmsRecipient,
    };

    let { data, error } = await supabaseServer
      .from("incidents")
      .insert(insertPayload)
      .select()
      .single();

    if (error && error.message?.includes("column")) {
      const fallbackPayload = {
        lat: latitude,
        lng: longitude,
        address,
        occurred_at: timestamp,
        status: "confirmed",
        victim_name: resolvedName,
      };
      const retryResult = await supabaseServer
        .from("incidents")
        .insert(fallbackPayload)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("[Hardware Webhook] Database insert failed:", error);
      return NextResponse.json(
        {
          error: "Failed to persist incident in database after alert was sent",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 5. Validate DB record and return
    const validatedIncident = IncidentSchema.safeParse(data);
    const incidentRecord = validatedIncident.success
      ? validatedIncident.data
      : data;

    return NextResponse.json(
      {
        ...incidentRecord,
        _sms: smsResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Hardware Webhook] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during hardware webhook processing",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
