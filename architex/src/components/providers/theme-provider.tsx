"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ReactNode, useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

/**
 * One-way sync: ui-store (source of truth) → next-themes (applies to DOM).
 * The previous bidirectional sync caused an infinite update loop because
 * the two effects wrote to each other's dependencies.
 */
function ThemeSynchronizer({ children }: { children: ReactNode }) {
  const { setTheme: setNextTheme } = useTheme();
  const uiTheme = useUIStore((s) => s.theme);

  useEffect(() => {
    setNextTheme(uiTheme);
  }, [uiTheme, setNextTheme]);

  return <>{children}</>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSynchronizer>{children}</ThemeSynchronizer>
    </NextThemesProvider>
  );
}
