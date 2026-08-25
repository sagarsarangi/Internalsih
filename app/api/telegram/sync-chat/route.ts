import { NextResponse } from "next/server";
import { getTelegramBotInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
