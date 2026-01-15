"use client";

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function TopBar() {
    return (
        <header className="sticky top-0 z-40 w-full bg-glass-bg border-b border-border-subtle backdrop-blur-md h-16 flex items-center justify-between px-8 transition-colors">
            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search contracts, names, or NIK..."
                        className="w-full bg-bg-app border border-border-strong rounded-full py-2 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                <button className="relative p-2 rounded-full hover:bg-bg-app text-text-muted hover:text-text-main transition-colors border border-transparent hover:border-border-subtle">
                    <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse shadow-sm"></span>
                    <Bell className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
