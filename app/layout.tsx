import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HRD Elite — Sistem Tes & Interview",
  description: "Platform asesmen revolusioner berbasis sains perilaku dan analitik tingkat lanjut untuk mengidentifikasi pemimpin masa depan.",
  keywords: ["HRD", "tes", "interview", "asesmen", "rekrutmen"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} bg-[#0a0b1e] text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
