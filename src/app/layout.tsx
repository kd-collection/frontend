import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-app text-text-main selection:bg-primary/30 min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col min-h-screen relative z-10 transition-colors duration-300">
              <TopBar />
              <main className="flex-1 p-8 overflow-y-auto scroll-smooth">
                <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {children}
                </div>
              </main>
            </div>

            {/* Ambient Background Glows - Adjusted for simpler theme */}
            <div className="fixed top-0 left-64 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-0" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
