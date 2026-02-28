import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";
import { Analytics } from "@vercel/analytics/react";

import { Providers } from "./providers";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import AnnouncementsBanner from "@/components/AnnouncementsBanner";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ErrorBoundary>
          <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
            <AuthProvider>
              <div className="relative flex flex-col min-h-screen">
                {/* <CustomCursor /> */}
                <AnnouncementsBanner />
                <Navbar />
                <main className="flex-grow w-full">
                  {children}
                </main>
                {/* Footer already includes FooterSponsors inside it */}
                <Footer />
              </div>
            </AuthProvider>
          </Providers>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}