"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export function SessionDebug() {
  const { data: session, isPending, error } = useSession();

  useEffect(() => {
    console.log("Session Debug:", {
      session,
      isPending,
      error,
      isAuthenticated: !!session?.user,
      cookies: document.cookie,
    });
  }, [session, isPending, error]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 text-xs rounded z-50 max-w-xs">
      <div>Session: {session?.user ? "✅" : "❌"}</div>
      <div>Loading: {isPending ? "⏳" : "✅"}</div>
      <div>User: {session?.user?.email || "None"}</div>
    </div>
  );
}
