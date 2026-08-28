import { verifySession, SESSION_COOKIE_NAME } from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;
  
  if (!session) {
    redirect("/?login=true");
  }

  return <>{children}</>;
}
