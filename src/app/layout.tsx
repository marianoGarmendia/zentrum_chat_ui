import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";


import localFont from 'next/font/local';

const miFuente = localFont({
  src: [
    {
      path: '../../public/fonts/FSEmericWeb-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/FSEmericWeb-Bold.woff2',
      weight: '700',
      style: 'bold',
    },
  ],
  variable: '--font-naturgy',
  display: 'swap',
})

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  display: "swap",
});

export const metadata: Metadata = {
  title: "Agent IA",
  description: "Agent IA - FaceApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={miFuente.className}>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
