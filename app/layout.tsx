import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/app-providers";
import { TopNav } from "@/components/layout/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokemon TCG Matchups",
  description: "SSR Next.js migration with HeroUI and Supabase auth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <TopNav />
          <main style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1rem 2rem" }}>
            {children}
          </main>
        </AppProviders>
      </body>
    </html>
  );
}
