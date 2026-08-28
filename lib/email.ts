import nodemailer from "nodemailer";

export interface EmergencyEmailDispatchParams {
  lat: number;
  lng: number;
  address?: string | null;
  occurred_at: string;
  name?: string | null;
  recipients: string[];
}

export interface EmergencyEmailDispatchResult {
  sent: boolean;
  status: "sent" | "skipped_missing_credentials" | "failed";
  recipient?: string;
  message?: string;
  messageId?: string;
}

/**
 * Dispatches a formatted emergency collision alert email via SMTP / Nodemailer.
 */
export async function sendEmergencyEmailAlert(
  params: EmergencyEmailDispatchParams
): Promise<EmergencyEmailDispatchResult> {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT?.trim() || "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() ||
    (user ? `Emergency Response <${user}>` : "Emergency Dispatch <alerts@emergency.local>");

  const validRecipients = params.recipients
    .map((r) => r.trim())
    .filter((r) => r.length > 3 && r.includes("@"));

  if (validRecipients.length === 0) {
    return {
      sent: false,
      status: "failed",
      message: "No valid email recipients provided.",
    };
  }

  const recipientString = validRecipients.join(", ");

  if (!host || !user || !pass) {
    return {
      sent: false,
      status: "skipped_missing_credentials",
      recipient: recipientString,
      message:
        "SMTP credentials not configured. Please specify SMTP_HOST, SMTP_USER, and SMTP_PASS.",
    };
  }

  const formattedTime = params.occurred_at
    ? new Date(params.occurred_at).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    : "Unknown Time";

  const victim = params.name?.trim() || "Unidentified Driver / Vehicle";
  const mapsUrl = `https://www.google.com/maps?q=${params.lat},${params.lng}`;
  const addressText = params.address || "Coordinates recorded (Address unresolved)";

  const emailSubject = `🚨 [URGENT] Emergency Traffic Accident Alert — ${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Emergency Traffic Alert</title>
      </head>
      <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #EDEDED;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111111; border: 1px solid #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #F1616B; padding: 20px 28px; text-align: left;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">
                🚨 EMERGENCY TRAFFIC ACCIDENT ALERT
              </h1>
              <p style="margin: 4px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;">
                Immediate emergency medical and traffic response required
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Location Item -->
                <tr>
                  <td style="padding-bottom: 18px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888888; font-family: monospace; letter-spacing: 0.05em;">Incident Location</div>
                    <div style="font-size: 16px; font-weight: 600; color: #FFFFFF; margin-top: 4px;">${addressText}</div>
                  </td>
                </tr>

                <!-- Coordinates Item -->
                <tr>
                  <td style="padding-bottom: 18px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888888; font-family: monospace; letter-spacing: 0.05em;">GPS Coordinates</div>
                    <div style="font-size: 14px; font-family: monospace; color: #3291FF; margin-top: 4px;">${params.lat.toFixed(6)}, ${params.lng.toFixed(6)}</div>
                  </td>
                </tr>

                <!-- Victim / Driver Item -->
                <tr>
                  <td style="padding-bottom: 18px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888888; font-family: monospace; letter-spacing: 0.05em;">Driver / Vehicle Identifier</div>
                    <div style="font-size: 14px; color: #EDEDED; margin-top: 4px;">${victim}</div>
                  </td>
                </tr>

                <!-- Timestamp -->
                <tr>
                  <td style="padding-bottom: 24px;">
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #888888; font-family: monospace; letter-spacing: 0.05em;">Occurred At</div>
                    <div style="font-size: 13px; color: #A1A1A1; margin-top: 4px;">${formattedTime}</div>
                  </td>
                </tr>

                <!-- Action Button -->
                <tr>
                  <td align="center" style="padding-top: 8px; padding-bottom: 8px;">
                    <a href="${mapsUrl}" target="_blank" style="display: inline-block; background-color: #3291FF; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(50, 145, 255, 0.3);">
                      📍 Open Navigation in Google Maps
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 16px 28px; border-top: 1px solid #1F1F1F; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #666666; font-family: monospace;">
                Automated Incident Dispatch System • Emergency Notification Protocol
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      // Force IPv4 to prevent ENETUNREACH errors when IPv6 is unsupported by the local network
      family: 4,
      auth: {
        user: user,
        pass: pass,
      },
    } as any);

    const info = await transporter.sendMail({
      from: from,
      to: validRecipients,
      subject: emailSubject,
      text: `EMERGENCY ALERT: Traffic incident at ${addressText} (${params.lat}, ${params.lng}). Person: ${victim}. Time: ${formattedTime}. Maps: ${mapsUrl}`,
      html: emailHtml,
    });

    console.info(
      `[Email] Alert email sent successfully to ${recipientString} (Message ID: ${info.messageId})`
    );

    return {
      sent: true,
      status: "sent",
      recipient: recipientString,
      messageId: info.messageId,
      message: `Email alert delivered to ${recipientString}`,
    };
  } catch (error) {
    const errText = error instanceof Error ? error.message : String(error);
    console.error(`[Email] Failed to send emergency email:`, errText);
    return {
      sent: false,
      status: "failed",
      recipient: recipientString,
      message: errText,
    };
  }
}
