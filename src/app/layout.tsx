import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "MiniPayBot | AI Financial Assistant on Celo",
  description:
    "Your AI financial assistant for Celo MiniPay. Chat to send stablecoins, check balances, or learn about Celo — every action is an on-chain transaction.",
  openGraph: {
    title: "MiniPayBot | AI Financial Assistant on Celo",
    description:
      "Chat with an AI agent that executes real Celo transactions. Built with ERC-8004, fee abstraction, and AI SDK.",
    type: "website",
  },
  other: {
    "talentapp:project_verification": "78a9fec0ab513c29992836f9de40eccd043fcf80915aa26398bf805d5b127363417c4e6332aa8068d4dbc9d4d2e0a018cb5124615a090a64ff341c4e7e652d40",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${dmSerifDisplay.variable} ${jetbrainsMono.variable} font-body antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
