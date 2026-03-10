import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Muhammad Iqbal Firmansyah | Interview AI Platform untuk Tes dan Wawancara Online",
  description: "Platform Interview AI untuk pelaksanaan tes dan wawancara kandidat secara online yang dikembangkan oleh Muhammad Iqbal Firmansyah. Sistem ini membantu proses seleksi kandidat menjadi lebih cepat, objektif, dan terstruktur menggunakan teknologi kecerdasan buatan.",
  keywords: [
    "Muhammad Iqbal Firmansyah",
    "Interview AI",
    "AI Interview Platform",
    "AI Recruitment Platform",
    "AI Interview System",
    "AI Hiring Platform",
    "AI Interview Assessment",
    "AI Recruitment Technology",
    "Automated Interview AI",
    "Online Interview AI",
    "AI Candidate Evaluation",
    "AI Talent Screening"
  ],
  openGraph: {
    title: "Interview AI Platform - Muhammad Iqbal Firmansyah",
    description: "Platform Interview AI untuk tes dan wawancara kandidat secara online yang membantu proses rekrutmen menjadi lebih cepat dan objektif menggunakan teknologi AI.",
    type: "website",
  }
};
// .

import UIProvider from "@/components/ui/UIProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-background text-white min-h-screen`}>
        {children}
        <UIProvider />
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": "Muhammad Iqbal Firmansyah",
                "jobTitle": "Software Developer",
                "description": "Developer yang membangun platform Interview AI untuk sistem rekrutmen otomatis berbasis kecerdasan buatan."
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "Interview AI",
                "applicationCategory": "Recruitment Software",
                "operatingSystem": "Web",
                "creator": {
                  "@type": "Person",
                  "name": "Muhammad Iqbal Firmansyah"
                }
              }
            ])
          }}
        />
      </body>
    </html>
  );
}

//update docker
