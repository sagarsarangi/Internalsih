import { Textbee } from "@textbee/sdk";

export interface SmsDispatchParams {
  lat: number;
  lng: number;
  address?: string | null;
  occurred_at: string;
  name?: string | null;
  recipient: string; // E.164 phone number, e.g. "+14155550101"
}

export interface SmsDispatchResult {
  sent: boolean;
  status: "sent" | "skipped_missing_credentials" | "failed";
  recipient?: string;
  message?: string;
  messageId?: string;
}

/**
 * Dispatches a compact plain-text emergency SMS alert via the TextBee API.
 * Reads TEXTBEE_API_KEY from env (required) and TEXTBEE_DEVICE_ID (optional —
 * when absent the API uses the account's default device or the one with the
 * most recent heartbeat).
 */
export async function sendSmsAlert(
  params: SmsDispatchParams
): Promise<SmsDispatchResult> {
  const apiKey = process.env.TEXTBEE_API_KEY?.trim();
  const deviceId = process.env.TEXTBEE_DEVICE_ID?.trim() || undefined;

  if (!apiKey) {
    const msg =
      "SMS alert cannot be dispatched. Missing: TEXTBEE_API_KEY.";
    console.warn(`[SMS] ${msg}`);
    return {
      sent: false,
      status: "skipped_missing_credentials",
      recipient: params.recipient,
      message: msg,
    };
  }

  const formattedTime = params.occurred_at
    ? new Date(params.occurred_at).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Unknown time";

  const victimName = params.name?.trim() || "Unidentified Person/Vehicle";
  const mapsUrl = `https://maps.google.com/maps?q=${params.lat},${params.lng}`;
  const locationText =
    params.address || `${params.lat.toFixed(5)}, ${params.lng.toFixed(5)}`;

  // Compact single-message format — keep well under 160 chars per segment
  const smsBody =
    `🚨 EMERGENCY ACCIDENT ALERT\n` +
    `📍 ${locationText}\n` +
    `👤 ${victimName}\n` +
    `⏰ ${formattedTime}\n` +
    `🗺 ${mapsUrl}`;

  try {
    const textbee = new Textbee({ apiKey });

    const sendOptions: Parameters<typeof textbee.sendSms>[0] = {
      recipients: [params.recipient],
      message: smsBody,
    };

    // Only pass deviceId if explicitly configured
    if (deviceId) {
      sendOptions.deviceId = deviceId;
    }

    const result = await textbee.sendSms(sendOptions);

    console.info(
      `[SMS] Emergency SMS dispatched successfully to ${params.recipient}`,
      result
    );

    return {
      sent: true,
      status: "sent",
      recipient: params.recipient,
      message: `SMS alert delivered to ${params.recipient}`,
      messageId: String(
        (result as { data?: { id?: unknown } })?.data?.id ?? ""
      ),
    };
  } catch (error: unknown) {
    const errorText = error instanceof Error ? error.message : String(error);
    console.warn(`[SMS] Alert dispatch failed: ${errorText}`);
    return {
      sent: false,
      status: "failed",
      recipient: params.recipient,
      message: errorText,
    };
  }
}
