import { SignJWT, jwtVerify } from "jose";
import type { SessionPayload } from "@/schemas/auth";

export const SESSION_COOKIE_NAME = "admin_session";
const SESSION_EXPIRATION = "12h";
const DEFAULT_FALLBACK_SECRET = "default_secret_for_local_dev_only_change_in_production_min_32_chars";

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || DEFAULT_FALLBACK_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Signs a JWT session token valid for 12 hours
 */
export async function signSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const secretKey = getJwtSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_EXPIRATION)
    .sign(secretKey);
}

/**
 * Verifies a JWT session token and extracts the payload
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
