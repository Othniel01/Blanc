"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/lib/components/ui/button";
import endpoint from "@/lib/routes/init";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");

    if (refreshToken) {
      try {
        await fetch(`${endpoint}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }

    // 🚫 Remove tokens from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // 🔄 Redirect to login
    router.push("/login");
  };

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      className="w-full md:w-auto"
    >
      Logout
    </Button>
  );
}
