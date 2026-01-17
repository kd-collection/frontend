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
        default: "bg-primary/10 text-primary border-primary/20",
        success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        neutral: "bg-slate-100 dark:bg-slate-800 text-text-muted border-border-subtle",
        outline: "bg-transparent border-border-strong text-text-main",
    };

    const dotColors = {
        default: "bg-primary",
        success: "bg-emerald-500",
        warning: "bg-amber-500",
        danger: "bg-rose-500",
        neutral: "bg-slate-400",
        outline: "bg-text-main",
    };

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-300",
            variants[variant],
            className
        )}>
            {/* Semantic Dot */}
            <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                dotColors[variant],
                glow && "animate-pulse shadow-[0_0_8px_rgba(var(--color-destructive),0.5)]"
            )} />
            {children}
        </span>
    );
}
