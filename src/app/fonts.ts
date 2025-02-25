import { Inter, Roboto_Mono } from 'next/font/google';

// Use Inter as a replacement for Geist Sans
export const geistSans = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

// Use Roboto Mono as a replacement for Geist Mono
export const geistMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});