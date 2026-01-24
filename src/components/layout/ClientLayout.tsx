"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen">
            <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative z-10 transition-colors duration-300 w-full">
                <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto scroll-smooth w-full">
                    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </main>
            </div>

            {/* Ambient Background Glows */}
            <div className="fixed top-0 left-0 lg:left-64 w-[800px] h-[800px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[128px] pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-0" />
        </div>
    );
}
