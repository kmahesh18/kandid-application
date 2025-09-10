"use client";

import { AuthRedirect } from "@/components/auth-redirect";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthRedirect requireAuth={false} redirectTo="/dashboard">
      {children}
    </AuthRedirect>
  );
}
