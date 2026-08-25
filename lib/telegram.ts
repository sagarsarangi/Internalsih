export interface TelegramDispatchParams {
  lat: number;
  lng: number;
  address?: string | null;
  occurred_at: string;
  name?: string | null;
}

export interface TelegramDispatchResult {
  sent: boolean;
  status: "sent" | "skipped_missing_credentials" | "skipped_placeholder" | "failed";
  recipient?: string;
  message?: string;
  messageId?: number;
}

export interface TelegramBotInfo {
  ok: boolean;
  username?: string;
  firstName?: string;
  botUrl?: string;
  error?: string;
}

/**
 * Fetches the Telegram bot info using `getMe`.
 */
export async function getTelegramBotInfo(): Promise<TelegramBotInfo> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/^[\"']|[\"']$/g, "");
  if (!botToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN is not configured" };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      next: { revalidate: 60 },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      return { ok: false, error: data?.description || "Failed to fetch bot info" };
    }

    const username = data.result?.username;
    return {
      ok: true,
      username: username,
      firstName: data.result?.first_name,
      botUrl: username ? `https://t.me/${username}` : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Dispatches an emergency collision alert to the preconfigured Telegram chat via the Telegram Bot API.
 * The recipient chat ID is read from the TELEGRAM_ALERT_CHAT_ID environment variable.
 * Formatted with rich HTML, driver details, geocoded address, and clickable Google Maps link.
 */
export async function sendIncidentTelegramAlert(
  params: TelegramDispatchParams
): Promise<TelegramDispatchResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim().replace(/^[\"']|[\"']$/g, "");
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    const missing: string[] = [];
    if (!botToken) missing.push("TELEGRAM_BOT_TOKEN");
    if (!chatId) missing.push("TELEGRAM_ALERT_CHAT_ID");

    const msg = `Telegram alert cannot be dispatched. Missing: ${missing.join(", ")}.`;
    console.warn(`[Telegram] ${msg}`);
    return {
      sent: false,
      status: "skipped_missing_credentials",
      message: msg,
    };
  }

  try {
    const formattedTime = params.occurred_at
      ? new Date(params.occurred_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "medium",
        })
      : "Unknown time";

    const victimName = params.name?.trim() || "Unidentified Person / Vehicle";
    const mapsUrl = `https://www.google.com/maps?q=${params.lat},${params.lng}`;

    const htmlMessage =
      `🚨 <b>EMERGENCY ACCIDENT ALERT</b> 🚨\n\n` +
      `📍 <b>Coordinates:</b> <code>${params.lat.toFixed(5)}, ${params.lng.toFixed(5)}</code>\n` +
      `🏢 <b>Location:</b> ${params.address || "Address unresolved (Coordinates recorded)"}\n` +
      `👤 <b>Driver/Victim:</b> ${victimName}\n` +
      `⏰ <b>Occurred At:</b> ${formattedTime}\n\n` +
      `🗺 <a href="${mapsUrl}">Open in Google Maps</a>\n\n` +
      `<i>Immediate emergency dispatch required.</i>`;

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlMessage,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      const errorText =
        data?.description ||
        `Telegram API error (Status ${response.status})`;
      console.warn(`[Telegram] Alert dispatch failed: ${errorText}`);
      return {
        sent: false,
        status: "failed",
        recipient: chatId,
        message: errorText,
      };
    }

    console.info(
      `[Telegram] Emergency alert dispatched successfully to chat ${chatId} (Message ID: ${data.result?.message_id})`
    );

    return {
      sent: true,
      status: "sent",
      recipient: chatId,
      messageId: data.result?.message_id,
      message: `Telegram alert delivered to chat ${chatId}`,
    };
  } catch (error: unknown) {
    const errorText = error instanceof Error ? error.message : String(error);
    console.warn(`[Telegram] Alert dispatch failed: ${errorText}`);
    return {
      sent: false,
      status: "failed",
      recipient: chatId,
      message: errorText,
    };
  }
}
