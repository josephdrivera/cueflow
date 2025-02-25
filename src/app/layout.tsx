"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { geistSans, geistMono } from "./fonts";
import "./globals.css";
import { clsx } from "clsx";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/GeistVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeistMonoVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
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
