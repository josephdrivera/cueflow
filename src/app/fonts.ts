import localFont from 'next/font/local';

export const geistSans = localFont({
  src: [
    {
      path: './fonts/GeistVF.woff',
      style: 'normal',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
});

export const geistMono = localFont({
  src: [
    {
      path: './fonts/GeistMonoVF.woff',
      style: 'normal',
    },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
});
