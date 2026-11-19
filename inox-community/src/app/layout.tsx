import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { RegisterSW } from "@/components/RegisterSW";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "INOX COMMUNITY",
  description: "La community di Inox Racing Puglia: garage, raduni, contest e classifiche.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Inox", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f1012",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getCurrentUser();
  let username: string | null = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    username = data?.username ?? null;
  }

  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Barlow:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        {children}
        <BottomNav username={username} />
        <RegisterSW />
      </body>
    </html>
  );
}
