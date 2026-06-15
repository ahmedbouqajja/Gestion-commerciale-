import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Assistant Prof Maroc AI',
  description:
    'Préparez vos Jdada, contrôles, examens et exercices en quelques minutes grâce à l\'intelligence artificielle. Conçu pour les enseignants marocains.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
