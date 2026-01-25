import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import ClientLayout from "@/components/layout/ClientLayout";
import NavigationLoader from "@/components/NavigationLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Dashboard",
  description: "A gamified personal operating system.",
  icons: {
    icon: [
      { url: '/penguin_logo.png', sizes: 'any' },
      { url: '/penguin_logo.png', sizes: '16x16', type: 'image/png' },
      { url: '/penguin_logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/penguin_logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <StoreProvider>
          <NavigationLoader />
          <ClientLayout>{children}</ClientLayout>
        </StoreProvider>
      </body>
    </html>
  );
}
