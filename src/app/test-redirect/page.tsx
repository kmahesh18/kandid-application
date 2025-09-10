"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

export default function TestRedirect() {
  const { data: session, isPending } = useSession();

  useEffect(() => {
    console.log("Test redirect - session:", session);
    console.log("Test redirect - isPending:", isPending);
    console.log("Test redirect - cookies:", document.cookie);
    
    if (!isPending && session?.user) {
      console.log("Test redirect - should redirect to dashboard");
      window.location.href = "/dashboard";
    }
  }, [session, isPending]);

  return (
    <div className="p-8">
      <h1>Test Redirect Page</h1>
      <p>Session: {session?.user ? "Authenticated" : "Not authenticated"}</p>
      <p>Loading: {isPending ? "Yes" : "No"}</p>
      <p>User: {session?.user?.email || "None"}</p>
      <button 
        onClick={() => window.location.href = "/dashboard"}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Manual Redirect to Dashboard
      </button>
    </div>
  );
}
