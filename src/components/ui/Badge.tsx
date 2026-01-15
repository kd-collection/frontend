"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "neutral" | "outline";
    className?: string;
    glow?: boolean; // Kept for API compatibility but now handles subtle pulsing
}

export default function Badge({ children, variant = "default", className, glow = false }: BadgeProps) {
    const variants = {
        default: "bg-primary-subtle text-primary border-primary/20",
        success: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        danger: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        neutral: "bg-slate-100 dark:bg-slate-800 text-text-muted border-border-subtle",
        outline: "bg-transparent border-border-strong text-text-main",
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors duration-300",
            variants[variant],
            glow && "animate-pulse", // Subtle alive feel
            className
        )}>
            {children}
        </span>
    );
}
