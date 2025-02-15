"use client";

import localFont from "next/font/local";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";
import { clsx } from "clsx";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={clsx(
        "min-h-screen font-sans antialiased",
        geistSans.variable,
        geistMono.variable
      )}>
        <AppRouterCacheProvider>
          <NextThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <AuthProvider>
                <SettingsProvider>
                  {children}
                </SettingsProvider>
              </AuthProvider>
            </LocalizationProvider>
          </NextThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
