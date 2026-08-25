"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LoginModal } from "./login-modal";

export function LoginManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isOpen = searchParams.get("login") === "true";

  const handleClose = () => {
    // Remove the ?login=true from the URL without full reload
    const params = new URLSearchParams(searchParams.toString());
    params.delete("login");
    const newQuery = params.toString();
    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    router.replace(newUrl, { scroll: false });
  };

  return <LoginModal isOpen={isOpen} onClose={handleClose} />;
}
