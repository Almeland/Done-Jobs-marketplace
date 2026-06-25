import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: {
    default: "Done Jobs — Ledige stillinger i Norge",
    template: "%s | Done Jobs",
  },
  description:
    "Finn ledige stillinger fra norske bedrifter. Søk jobb, last opp CV og få matchet med relevante arbeidsgivere på Done Jobs.",
  metadataBase: new URL("https://done-jobs-marketplace.vercel.app"),
  openGraph: {
    siteName: "Done Jobs",
    locale: "nb_NO",
    type: "website",
  },
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
