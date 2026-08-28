import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { IncidentListSchema } from "@/schemas/incident";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing incident ID" }, { status: 400 });
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifySession(sessionCookie) : null;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { error } = await supabaseServer
      .from("incidents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[DELETE /api/incidents] Supabase error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/incidents] Unexpected exception:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the incident" },
      { status: 500 }
    );
  }
}
