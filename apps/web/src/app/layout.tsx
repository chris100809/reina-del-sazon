import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: 'Reina del Sazón — 2D→3D Reconstruction Studio',
  description: 'Enterprise-grade 2D to 3D reconstruction studio with Blender-style UI, physics, and AI enhancement',
  keywords: ['3D', 'reconstruction', 'CAD', 'Blender', 'WebGL', 'Three.js', 'physics', 'AI'],
  authors: [{ name: 'Reina del Sazón Team' }],
  creator: 'Reina del Sazón',
  publisher: 'Reina del Sazón',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://reina-del-sazon.dev',
    title: 'Reina del Sazón — 2D→3D Reconstruction Studio',
    description: 'Transform 2D images into interactive 3D models with professional tools',
    siteName: 'Reina del Sazón',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reina del Sazón',
    description: '2D→3D Reconstruction Studio',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0D0E12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="h-full bg-studio-bg text-studio-text antialiased">
        {children}
      </body>
    </html>
  );
}