"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, FileText, BarChart3, Settings, ShieldCheck, LogOut, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Contracts", href: "/contracts" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: BarChart3, label: "Analytics", href: "/analytics" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass-panel border-r border-white/5 flex flex-col z-50 bg-[#030712]/80 backdrop-blur-xl">
            {/* Logo */}
            <div className="p-8 flex items-center gap-3.5">
                <div className="relative group">
                    <div className="absolute inset-0 bg-primary/50 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                        <ShieldCheck className="text-white h-6 w-6" />
                    </div>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white leading-none">AMAR</h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mt-1.5 ml-0.5">Collection</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-1.5">
                <p className="px-4 text-[10px] font-bold text-text-muted/50 uppercase tracking-widest mb-4 ml-1">Menu</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="block relative group">
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary/10 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}

                            <div className={cn(
                                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group-hover:bg-white/[0.03]",
                                isActive ? "text-white" : "text-text-muted/80 hover:text-white"
                            )}>
                                <Icon className={cn(
                                    "h-5 w-5 transition-colors duration-200",
                                    isActive ? "text-primary drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]" : "group-hover:text-primary/80"
                                )} />
                                <span className="font-medium tracking-wide text-sm">{item.label}</span>

                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeDot"
                                        className="absolute right-4 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(79,70,229,1)]"
                                    />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer */}
            <div className="p-4 border-t border-white/5 mx-4 mb-4">
                <div className="group flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer border border-white/5 hover:border-white/10 active:scale-95">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 blur opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative h-10 w-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-xs font-bold text-black border-[3px] border-[#0b1121] shadow-lg">
                            AD
                        </div>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-[#0b1121] rounded-full"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">Admin User</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium truncate">Super Admin</p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                </div>
            </div>
        </aside>
    );
}
