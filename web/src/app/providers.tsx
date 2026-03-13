"use client";

import { AuthContext, useAuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return (
    <LanguageProvider>
      <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
    </LanguageProvider>
  );
}
