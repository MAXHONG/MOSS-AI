"use client";

import { I18nProvider } from "@/core/i18n/context";
import { AuthProvider } from "@/core/auth/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>{children}</I18nProvider>
    </AuthProvider>
  );
}
