import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Done Jobs",
  description: "Ledige stillinger",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-pearl text-midnight">
        {children}
      </body>
    </html>
  );
}
