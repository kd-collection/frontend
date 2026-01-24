"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Users, FileText, Settings, ShieldCheck, Upload, LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Contracts", href: "/contracts" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: Upload, label: "Import", href: "/import" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-screen w-64 border-r border-border-subtle bg-card shadow-2xl lg:shadow-sm flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo & Close */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
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

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 rounded-lg text-text-muted hover:bg-bg-app hover:text-text-main transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    <p className="px-4 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3 ml-1 opacity-70">Menu</p>

                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose} // Auto close on mobile click
                                className="block relative group"
                            >
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
                    <button className="flex items-center gap-3 w-full p-2.5 rounded-lg text-text-muted hover:text-destructive hover:bg-destructive/10 transition-all group">
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
