"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface AuthRedirectProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthRedirect({ children, requireAuth = true, redirectTo = "/dashboard" }: AuthRedirectProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("AuthRedirect debug:", { 
      session: session?.user ? "authenticated" : "not authenticated", 
      isPending, 
      requireAuth, 
      redirectTo,
      shouldRedirect: !requireAuth && session?.user
    });

    if (isPending) return; // Wait for session check to complete

    if (requireAuth && !session?.user) {
      console.log("Redirecting to login - not authenticated");
      router.push("/auth/login");
    } else if (!requireAuth && session?.user) {
      console.log("Redirecting to dashboard - already authenticated");
      // Use replace instead of push for authentication redirects
      window.location.replace(redirectTo);
    }
  }, [session, isPending, requireAuth, redirectTo, router]);

  // Show loading or content based on auth state
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (requireAuth && !session?.user) {
    return null; // Will redirect to login
  }

  if (!requireAuth && session?.user) {
    return null; // Will redirect to dashboard
  }

  return <>{children}</>;
}
