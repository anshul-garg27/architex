import "@/lib/fix-stuck-module";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ToastContainer } from "@/components/ui/toast";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdateToast } from "@/components/pwa/UpdateToast";
import "./globals.css";

// Only import ClerkProvider when a publishable key is configured.
// Without it, Clerk's keyless mode shows an intrusive "Configure your application" popup.
let MaybeClerkProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    MaybeClerkProvider = require("@clerk/nextjs").ClerkProvider;
  } catch {
    // Clerk not available
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://architex.dev"),
  title: "Architex — Interactive Engineering Laboratory",
  description: "Design systems, visualize algorithms, and ace interviews.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Architex",
  },
  openGraph: {
    title: "Architex — Interactive Engineering Laboratory",
    description: "Design systems, visualize algorithms, and ace interviews.",
    url: "https://architex.dev",
    siteName: "Architex",
    locale: "en_US",
    type: "website",
    images: [{ url: "/api/og?title=Architex", width: 1200, height: 630, alt: "Architex" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Architex — Interactive Engineering Laboratory",
    description: "Design systems, visualize algorithms, and ace interviews.",
    images: ["/api/og?title=Architex"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6E56CF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const Wrapper = MaybeClerkProvider ?? (({ children: c }: { children: React.ReactNode }) => <>{c}</>);

  return (
    <html
      lang="en"
      className={`h-full antialiased ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <Wrapper>
          <ThemeProvider>
            <MotionProvider>
              <AnalyticsProvider>
                <QueryProvider>
                  <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground">
                    Skip to main content
                  </a>
                  {children}
                  <InstallPrompt />
                  <UpdateToast />
                  <ToastContainer />
                </QueryProvider>
              </AnalyticsProvider>
            </MotionProvider>
          </ThemeProvider>
        </Wrapper>
      </body>
    </html>
  );
}
