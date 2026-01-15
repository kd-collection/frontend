"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-9 h-9" />; // Placeholder

    const isDark = theme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-muted hover:text-text-main group"
            aria-label="Toggle Theme"
        >
            <div className="relative h-5 w-5">
                <motion.div
                    initial={false}
                    animate={{ scale: isDark ? 0 : 1, opacity: isDark ? 0 : 1, rotate: isDark ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                >
                    <Sun className="h-5 w-5 text-amber-500" />
                </motion.div>

                <motion.div
                    initial={false}
                    animate={{ scale: isDark ? 1 : 0, opacity: isDark ? 1 : 0, rotate: isDark ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0"
                >
                    <Moon className="h-5 w-5 text-primary" />
                </motion.div>
            </div>
        </button>
    );
}
