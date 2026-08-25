import { NextRequest, NextResponse } from "next/server";
import {
  SimulateAccidentPayloadSchema,
  IncidentSchema,
} from "@/schemas/incident";
import { reverseGeocode } from "@/lib/geocode";
import { supabaseServer } from "@/lib/supabase-server";
import {
  sendIncidentTelegramAlert,
  TelegramDispatchResult,
} from "@/lib/telegram";
import {
  sendEmergencyEmailAlert,
  EmergencyEmailDispatchResult,
} from "@/lib/email";
import { sendSmsAlert, SmsDispatchResult } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // 1. Validate payload against Zod schema
    const parseResult = SimulateAccidentPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid simulated accident payload",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { lat, lng, timestamp, name, channels } = parseResult.data;

    // 2. Best-effort reverse geocoding via LocationIQ (with OSM fallback)
    const address = await reverseGeocode(lat, lng);
    if (address) {
      console.info(
        `[Simulate Accident API] Resolved incident location via LocationIQ: "${address}"`
      );
    } else {
      console.info(
        `[Simulate Accident API] Incident location will be recorded using raw coordinates [${lat}, ${lng}]`
      );
    }

    const resolvedName = name?.trim() || "Unidentified Driver / Vehicle";

    // Track dispatch results across enabled channels
    let telegramResult: TelegramDispatchResult | null = null;
    let emailResult: EmergencyEmailDispatchResult | null = null;
    let smsResult: SmsDispatchResult | null = null;

    // 3. Multi-Channel Dispatch Logic
    // Honors user-selected channel from modal; Telegram recipient comes from env (TELEGRAM_ALERT_CHAT_ID)
    const isTelegramEnabled = Boolean(channels?.telegram?.enabled);
    const isEmailEnabled = Boolean(
      channels?.email?.enabled && channels?.email?.recipient
    );
    const isSmsEnabled = Boolean(
      channels?.sms?.enabled && channels?.sms?.recipient
    );

    const dispatchPromises: Promise<unknown>[] = [];

    if (isTelegramEnabled) {
      dispatchPromises.push(
        sendIncidentTelegramAlert({
          lat,
          lng,
          address,
          occurred_at: timestamp,
          name: resolvedName,
        }).then((res) => {
          telegramResult = res;
        })
      );
    }

    if (isEmailEnabled && channels?.email?.recipient) {
      const recipients = channels.email.recipient
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      dispatchPromises.push(
        sendEmergencyEmailAlert({
          lat,
          lng,
          address,
          occurred_at: timestamp,
          name: resolvedName,
          recipients,
        }).then((res) => {
          emailResult = res;
        })
      );
    }

    let resolvedSmsRecipient: string | null = null;
    if (isSmsEnabled && channels?.sms?.recipient) {
      const rawInput = channels.sms.recipient.trim();
      const digitsOnly = rawInput.replace(/\D/g, "");

      if (digitsOnly.length === 10) {
        resolvedSmsRecipient = `+91${digitsOnly}`;
      } else if (rawInput.startsWith("+91") && digitsOnly.length === 12) {
        resolvedSmsRecipient = `+${digitsOnly}`;
      } else {
        resolvedSmsRecipient = `+91${digitsOnly.slice(-10)}`;
      }

      dispatchPromises.push(
        sendSmsAlert({
          lat,
          lng,
          address,
          occurred_at: timestamp,
          name: resolvedName,
          recipient: resolvedSmsRecipient,
        }).then((res) => {
          smsResult = res;
        })
      );
    }

    if (dispatchPromises.length === 0) {
      return NextResponse.json(
        {
          error: "No alert channel or recipient specified",
          details:
            "Please select an alert channel (Telegram, Email, or SMS) and enter the recipient in the dispatch modal.",
        },
        { status: 400 }
      );
    }

    // Await all selected dispatches concurrently
    await Promise.all(dispatchPromises);

    // 4. Strict Alert Verification: Ensure at least one chosen channel succeeded
    const attemptedDispatches: { channel: string; sent: boolean; msg?: string }[] = [];
    if (telegramResult) {
      const t: TelegramDispatchResult = telegramResult;
      attemptedDispatches.push({
        channel: "Telegram",
        sent: t.sent,
        msg: t.message,
      });
    }
    if (emailResult) {
      const e: EmergencyEmailDispatchResult = emailResult;
      attemptedDispatches.push({
        channel: "Email",
        sent: e.sent,
        msg: e.message,
      });
    }
    if (smsResult) {
      const s: SmsDispatchResult = smsResult;
      attemptedDispatches.push({
        channel: "SMS",
        sent: s.sent,
        msg: s.message,
      });
    }

    const anySuccess = attemptedDispatches.some((d) => d.sent);

    if (!anySuccess && attemptedDispatches.length > 0) {
      const failureSummary = attemptedDispatches
        .map((d) => `${d.channel}: ${d.msg || "Delivery failed"}`)
        .join(" | ");

      console.warn(
        `[Simulate Accident API] All emergency alert dispatches failed. Aborting DB persistence. Reason: ${failureSummary}`
      );

      return NextResponse.json(
        {
          error: "Emergency alert dispatch failed. Incident was NOT recorded in the database.",
          details: failureSummary,
          _telegram: telegramResult,
          _email: emailResult,
          _sms: smsResult,
        },
        { status: 422 }
      );
    }

    // Build clean sparse alert recipient fields
    const telegramVal = isTelegramEnabled
      ? process.env.TELEGRAM_ALERT_CHAT_ID?.trim() || null
      : null;
    const emailVal = isEmailEnabled
      ? channels?.email?.recipient?.trim() || null
      : null;
    const smsVal = isSmsEnabled && resolvedSmsRecipient
      ? resolvedSmsRecipient
      : null;

    // 5. Insert record into Supabase incidents table using service-role client
    const insertPayload: Record<string, unknown> = {
      lat,
      lng,
      address,
      occurred_at: timestamp,
      status: "confirmed",
      victim_name: resolvedName,
      telegram: telegramVal,
      email: emailVal,
      sms: smsVal,
    };

    let { data, error } = await supabaseServer
      .from("incidents")
      .insert(insertPayload)
      .select()
      .single();

    // Fallback in case columns have not been migrated yet in Supabase
    if (error && error.message?.includes("column")) {
      console.warn(
        "[Simulate Accident API] Sparse columns (telegram/email/sms) not detected. Retrying with base columns..."
      );
      const fallbackPayload = {
        lat,
        lng,
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
      console.error("[Simulate Accident API] Database insert failed:", error);
      return NextResponse.json(
        {
          error: "Failed to persist incident in database after alert was verified",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 6. Validate DB record against IncidentSchema
    const validatedIncident = IncidentSchema.safeParse(data);
    const incidentRecord = validatedIncident.success
      ? validatedIncident.data
      : data;

    // 7. Return 201 Created with persisted row & all dispatch results
    return NextResponse.json(
      {
        ...incidentRecord,
        _telegram: telegramResult,
        _email: emailResult,
        _sms: smsResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Simulate Accident API] Unexpected server error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during accident simulation",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
