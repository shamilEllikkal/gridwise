import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "GRIDWISE — Electricity use made clear",
    template: "%s | GRIDWISE",
  },
  description:
    "Understand your home's electricity use, appliances, solar power and estimated bill with GRIDWISE.",
  keywords: ["electricity monitoring", "energy management", "smart home", "power consumption", "GRIDWISE"],
  authors: [{ name: "TERRACODE" }],
  creator: "TERRACODE",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "GRIDWISE — Electricity use made clear",
    description: "Understand your home's electricity use, appliances, solar power and estimated bill.",
    siteName: "GRIDWISE",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1510" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgb(20, 31, 24)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgb(240, 253, 244)",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
