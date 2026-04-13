import "@/lib/fix-stuck-module";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";
import { QueryProvider } from "@/providers/QueryProvider";

// @ts-expect-error -- Clerk v7 conditional exports resolve at runtime but not in static analysis with moduleResolution: "bundler"
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "@/components/ui/toast";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { UpdateToast } from "@/components/pwa/UpdateToast";
import "./globals.css";

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
  return (
    <html
      lang="en"
      className={`h-full antialiased ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-background text-foreground">
        <ClerkProvider>
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
        </ClerkProvider>
      </body>
    </html>
  );
}
