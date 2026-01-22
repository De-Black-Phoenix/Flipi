import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app-shell/app-shell";

const bricolageGrotesque = localFont({
  src: [
    { path: "../public/fonts/BricolageGrotesque-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/BricolageGrotesque-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/BricolageGrotesque-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/BricolageGrotesque-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Flipi - Need it? Flipi.",
  description: "A friendly community platform for giving and receiving items",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${bricolageGrotesque.variable} font-sans min-h-[100dvh] overflow-hidden`}>
        <Script
          src="https://js.paystack.co/v1/inline.js"
          strategy="lazyOnload"
        />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

