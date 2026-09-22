import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Übergabe",
  description: "Sprich deine offenen Punkte ein. Hör dein Briefing, wenn du zurück bist.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Übergabe" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#14110f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-md flex-1 flex flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
          {children}
        </div>
      </body>
    </html>
  );
}
