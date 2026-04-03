import type { Metadata } from "next";
import { Dangrek, Geist_Mono } from "next/font/google";
import { AppContainer } from "@/components/AppContainer";
import "./globals.css";

const dangrek = Dangrek({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dangrek",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Impo",
  description: "Find the imposter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dangrek.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AppContainer className="flex min-h-full flex-1 flex-col">
          {children}
        </AppContainer>
      </body>
    </html>
  );
}
