"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, FileText, BarChart3, Settings, ShieldCheck, ChevronRight, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Contracts", href: "/contracts" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: Upload, label: "Import", href: "/import" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border-subtle bg-card shadow-sm flex flex-col z-50 transition-colors duration-300">
            {/* 
         --- Semantic Refactor ---
         Bg: bg-card (White/Slate-900)
         Border: border-border-subtle (Slate-200/Slate-800)
         Text: text-main / text-muted
         Active: bg-primary-subtle + text-primary
      */}

            {/* Logo */}
            <div className="p-8 flex items-center gap-3.5">
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white group-hover:scale-105 transition-transform duration-300">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-text-main leading-none">CollectPro</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mt-1 ml-0.5">Collection</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1">
                <p className="px-4 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1 opacity-70">Menu</p>

                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="block relative group">
                            <div className={cn(
                                "relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-primary-subtle text-primary font-semibold"
                                    : "text-text-muted hover:text-text-main hover:bg-bg-card-hover"
                            )}>
                                <Icon className={cn(
                                    "h-4 w-4 transition-colors duration-200",
                                    isActive ? "text-primary" : "group-hover:text-text-main"
                                )} />
                                <span className="text-sm tracking-normal">{item.label}</span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeSideBar"
                                        className="absolute left-0 h-full w-1 rounded-r-full bg-primary"
                                        initial={false}
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-border-subtle mx-4 mb-4">
                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-card-hover transition-colors cursor-pointer group">
                    <div className="relative">
                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            AD
                        </div>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-blue-500 border-2 border-card rounded-full" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-main truncate">Admin User</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium truncate">Online</p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </aside>
    );
}
