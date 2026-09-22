import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { PrivacyProvider } from "@/providers/PrivacyProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  variable: "--font-ibm-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Pessoal",
  description: "Gerencie suas finanças de forma simples e eficiente",
  applicationName: "Finance Pessoal",
  appleWebApp: {
    capable: true,
    title: "Finance Pessoal",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Finance Pessoal",
    description: "Gerencie suas finanças de forma simples e eficiente",
    type: "website",
    locale: "pt_BR",
    siteName: "Finance Pessoal",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D1117",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <PrivacyProvider>
          <InstallPrompt />
          <ServiceWorkerRegistration />
          {children}
        </PrivacyProvider>
      </body>
    </html>
  );
}
