// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { getToken, clearToken } from "@/lib/services/auth";

// export default function ProtectedRoute({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const router = useRouter();
//   const [checking, setChecking] = useState(true); // track token validation

//   useEffect(() => {
//     const token = getToken();

//     if (!token) {
//       router.replace("/login");
//       return;
//     }

//     // check token expiry
//     try {
//       const payload = JSON.parse(atob(token.split(".")[1]));
//       if (payload.exp * 1000 < Date.now()) {
//         clearToken();
//         router.replace("/login");
//       }
//     } catch {
//       clearToken();
//       router.replace("/login");
//     } finally {
//       setChecking(false);
//     }
//   }, [router]);

//   if (checking) {
//     return <p>Loading...</p>; // or a spinner
//   }

//   return <>{children}</>;
// }
