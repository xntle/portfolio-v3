import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

// Import Inter and set it as the default font
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});
export const metadata: Metadata = {
  title: "An :-)",

  description: "Thai An's Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 transition-colors duration-300`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
