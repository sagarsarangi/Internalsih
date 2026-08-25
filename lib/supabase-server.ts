import { createClient } from "@supabase/supabase-js";

// Ensure this file is never imported into client-side bundles
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://placeholder-project.supabase.co";

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder-service-role-key";

if (
  !process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.NODE_ENV === "production"
) {
  console.warn(
    "[SECURITY WARNING] SUPABASE_SERVICE_ROLE_KEY is not set in environment variables."
  );
}

/**
 * Server-only Supabase client with service-role privileges.
 * Bypasses RLS for secure server-side operations.
 */
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
