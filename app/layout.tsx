import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Dangrek, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { AppContainer } from "@/components/AppContainer";
import "./globals.css";

const dangrek = Dangrek({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dangrek",
});

const notoDevanagari = Noto_Sans_Devanagari({
  weight: ["500", "600", "700"],
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-devanagari",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Find the imposter",
  description: "Pass-the-phone party game — everyone sees the word except one imposter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dangrek.variable} ${notoDevanagari.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <AppContainer className="flex min-h-full flex-1 flex-col">
          {children}
        </AppContainer>
        <Analytics />
      </body>
    </html>
  );
}
