"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";

interface SessionContextType {
  user: { 
    id: string; 
    name: string; 
    email: string; 
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const SessionContext = createContext<SessionContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(isPending);
  }, [isPending]);

  const value = {
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session?.user,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useAuth must be used within a SessionProvider");
  }
  return context;
};
