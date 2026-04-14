import "@/styles/globals.css";

import { type Metadata } from "next";
import { Open_Sans } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: {
    default: "Spinotek Feedback Loop | Transform Feedback into Business Impact",
    template: "%s | Spinotek",
  },
  description: "Advanced Feedback Management System to hear your customers, analyze sentiment, and track the real-world impact of your business actions with AI-powered insights.",
  metadataBase: new URL("http://everloop.spinotek.com"),

  // Keyword untuk SEO berbagai industri (Universal)
  keywords: [
    "Feedback Management System",
    "Customer Experience Platform",
    "AI Sentiment Analysis",
    "Business Operational Excellence",
    "NPS Tracking Dashboard",
    "Google Maps Reviews Analytics",
    "Customer Churn Prevention",
    "Operational SOP Generator"
  ],

  authors: [{ name: "Spinotek Team", url: "https://spinotek.id" }],

  // Favicon & Assets (pastikan path-nya benar)
  icons: [{ rel: "icon", url: "/favicon.ico" }],

  // Open Graph (Tampilan saat link dashboard di-share di WhatsApp/LinkedIn)
  openGraph: {
    title: "Spinotek | AI-Driven Feedback Insights & Action Loop",
    description: "Empower your business growth by closing the loop between customer feedback and operational action.",
    url: "https://app.everloop.spinotek.com", // Ubah sesuai domainmu
    siteName: "Spinotek",
    images: [
      {
        url: "/og-image.png", // Gambar preview dashboard kamu (1200x630px)
        width: 1200,
        height: 630,
        alt: "Spinotek Dashboard Overview",
      },
    ],
    locale: "id_ID", // Atur ke en_US jika ingin pasar global
    type: "website",
  },

  robots: {
    index: true,
    follow: true,
  },
};

const open_sans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${open_sans.variable}`}>
      <body>
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
