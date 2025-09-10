"use client";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  // Middleware handles auth redirects, so just render children
  return <>{children}</>;
}
