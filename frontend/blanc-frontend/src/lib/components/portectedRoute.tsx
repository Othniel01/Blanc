"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getRefreshToken, refreshAccessToken } from "@/lib/routes/http";
import { clearToken, getToken } from "../services/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      let token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const isExpired = () => {
        try {
          const payload = JSON.parse(atob(token!.split(".")[1]));
          return payload.exp * 1000 < Date.now();
        } catch {
          return true;
        }
      };

      if (isExpired()) {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearToken();
          router.replace("/login");
          return;
        }

        try {
          token = await refreshAccessToken();
        } catch {
          clearToken();
          router.replace("/login");
          return;
        }
      }

      setChecking(false);
    };

    verifyToken();
  }, [router]);

  if (checking) {
    return (
      <div className="flex justify-center items-center h-screen">
        Checking authentication...
      </div>
    );
  }

  return <>{children}</>;
}
