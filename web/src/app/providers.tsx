"use client";

import { AuthContext, useAuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return (
    <LanguageProvider>
      <AuthContext.Provider value={auth}>
        {children}
        <Toaster position="top-center" richColors />
      </AuthContext.Provider>
    </LanguageProvider>
  );
}
