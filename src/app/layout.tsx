import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Treasury Minter Engine | PulseChain V3/V4",
  description: "Professional minting dashboard for PulseChain V3 and V4 Treasury tokens. Monitor multipliers, manage portfolios, and execute multihop mints.",
  keywords: ["PulseChain", "Treasury", "V3", "V4", "Minter", "DeFi", "MultiHop"],
  authors: [{ name: "Treasury Minter Engine" }],
  icons: {
    icon: "/treasury-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "bg-gray-900 border-gray-800 text-white",
          }}
          richColors
        />
      </body>
    </html>
  );
}
