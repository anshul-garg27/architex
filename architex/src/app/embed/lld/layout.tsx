// ---------------------------------------------------------------------------
// Embed Layout — Minimal wrapper for embeddable LLD widgets (LLD-141)
// ---------------------------------------------------------------------------
// No activity bar, no status bar, no sidebar. Just the content.
// ---------------------------------------------------------------------------

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Architex — Embeddable LLD Widget",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function EmbedLLDLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {children}
    </div>
  );
}
