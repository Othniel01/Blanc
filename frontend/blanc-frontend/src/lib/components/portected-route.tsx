"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/services/auth";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login"); // redirect if no token
      return;
    }

    // ✅ check if token is expired
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        clearToken();
        router.replace("/login");
      }
    } catch {
      clearToken();
      router.replace("/login");
    }
  }, [router]);

  return <>{children}</>;
}
