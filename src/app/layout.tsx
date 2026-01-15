import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amar Collection | Prime CRM",
  description: "Advanced Collection Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app text-text-main selection:bg-primary/30 min-h-screen`}
      >
        <div className="bg-noise" />
        <div className="flex min-h-screen bg-[url('/bg-pattern.svg')] bg-fixed bg-cover">
          <Sidebar />
          <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10 transition-all duration-300">
            <TopBar />
            <main className="flex-1 p-8 overflow-y-auto scroll-smooth">
              <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {children}
              </div>
            </main>
          </div>

          {/* Ambient Background Glows */}
          <div className="fixed top-0 left-64 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-screen -z-0 opacity-40 animate-pulse-slow" />
          <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[128px] pointer-events-none mix-blend-screen -z-0 opacity-20" />
        </div>
      </body>
    </html>
  );
}
