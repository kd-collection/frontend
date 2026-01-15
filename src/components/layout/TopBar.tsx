"use client";

import { Bell, Search } from "lucide-react";

export default function TopBar() {
    return (
        <header className="sticky top-0 z-40 w-full glass-panel border-b border-border-subtle h-16 flex items-center justify-between px-8 bg-app/50 backdrop-blur-xl">
            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search contracts, names, or NIK..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-text-muted hover:text-white">
                    <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                    <Bell className="h-5 w-5" />
                </button>
            </div>
        </header>
    );
}
