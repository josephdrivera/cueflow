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
        {/* Font preloading removed as we're using Google Fonts */}
      </head>
      <body
        className={clsx(
          "min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable
        )}
        suppressHydrationWarning
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
