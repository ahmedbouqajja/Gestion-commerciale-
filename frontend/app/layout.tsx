import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Smart Promo AI — Intelligence commerciale & recommandation d'offres",
  description:
    "Plateforme SaaS d'intelligence commerciale pour le retail : analyse des ventes, recommandation d'offres IA, prévisions et détection des ruptures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
