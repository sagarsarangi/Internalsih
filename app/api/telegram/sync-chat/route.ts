import { NextResponse, NextRequest } from "next/server";
import { getTelegramBotInfo } from "@/lib/telegram";
import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = sessionCookie ? await verifySession(sessionCookie) : null;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botInfo = await getTelegramBotInfo();
    const configuredChatId = process.env.TELEGRAM_ALERT_CHAT_ID?.trim() || null;

    return NextResponse.json({
      ok: true,
      bot: botInfo,
      configuredChatId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch Telegram bot info",
      },
      { status: 500 }
    );
  }
}
