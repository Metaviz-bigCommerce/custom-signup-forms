import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/context/session";
import { ToastProvider } from "@/components/common/Toast";

// Inter - The gold standard for SaaS applications
// Used by Linear, Vercel, Stripe, and many top-tier apps
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// JetBrains Mono - For code/IDs display
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Signup Flow Customization - BigCommerce",
  description: "Customize and manage your BigCommerce store signup forms with advanced form builder, email templates, and request management.",
  keywords: ["BigCommerce", "Signup Forms", "Form Builder", "E-commerce"],
  openGraph: {
    title: "Signup Flow Customization - BigCommerce",
    description: "Customize and manage your BigCommerce store signup forms",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
