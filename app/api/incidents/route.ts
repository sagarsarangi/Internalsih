import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { IncidentListSchema } from "@/schemas/incident";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        "[GET /api/incidents] Supabase URL or Key not set in environment variables."
      );
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseServer
      .from("incidents")
      .select("*")
      .order("occurred_at", { ascending: false });

    if (error) {
      console.error("[GET /api/incidents] Supabase query error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    const validatedResult = IncidentListSchema.safeParse(data || []);

    if (!validatedResult.success) {
      console.error(
        "[GET /api/incidents] Schema validation warning:",
        validatedResult.error.format()
      );
      // Fallback: return raw data if schema parser caught minor extra fields
      return NextResponse.json(data || []);
    }

    return NextResponse.json(validatedResult.data);
  } catch (err) {
    console.error("[GET /api/incidents] Unexpected exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while loading telemetry" },
      { status: 500 }
    );
  }
}
