"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "default" | "success" | "warning" | "danger" | "neutral" | "outline";
    className?: string;
    glow?: boolean;
}

export default function Badge({ children, variant = "default", className, glow = false }: BadgeProps) {
    const variants = {
        default: "bg-primary/10 text-primary hover:bg-primary/20",
        success: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
        danger: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
        neutral: "bg-white/5 text-text-muted hover:bg-white/10",
        outline: "bg-transparent border border-white/20 text-white hover:border-white/40",
    };

    const glows = {
        default: "shadow-[0_0_10px_rgba(79,70,229,0.3)]",
        success: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
        warning: "shadow-[0_0_10px_rgba(245,158,11,0.3)]",
        danger: "shadow-[0_0_10px_rgba(244,63,94,0.3)]",
        neutral: "",
        outline: "",
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold border border-transparent transition-all duration-300",
            variants[variant],
            glow && glows[variant],
            // If no specific variant defined border, add a subtle one for glass feel:
            variant !== 'outline' && "border-white/5",
            className
        )}>
            {children}
        </span>
    );
}
