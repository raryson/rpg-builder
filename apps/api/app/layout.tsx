import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RPG Builder API',
  description: 'Backend API for RPG Builder.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
