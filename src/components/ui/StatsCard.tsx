"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ElementType;
    className?: string; // Allow custom classes
    color?: "primary" | "secondary" | "accent" | "rose";
}

export default function StatsCard({ label, value, trend, trendUp, icon: Icon, color = "primary", className }: StatsCardProps) {
    const colorStyles = {
        primary: {
            text: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(79,70,229,0.15)]",
            iconBg: "bg-primary/20",
            gradient: "from-primary/20 to-transparent"
        },
        secondary: {
            text: "text-secondary",
            bg: "bg-secondary/10",
            border: "border-secondary/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
            iconBg: "bg-secondary/20",
            gradient: "from-secondary/20 to-transparent"
        },
        accent: {
            text: "text-accent",
            bg: "bg-accent/10",
            border: "border-accent/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
            iconBg: "bg-accent/20",
            gradient: "from-accent/20 to-transparent"
        },
        rose: {
            text: "text-rose-500",
            bg: "bg-rose-500/10",
            border: "border-rose-500/10",
            glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
            iconBg: "bg-rose-500/20",
            gradient: "from-rose-500/20 to-transparent"
        }
    }[color];

    return (
        <div className={cn(
            "glass-panel relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 border-white/5",
            colorStyles.glow,
            className
        )}>

            {/* Dynamic Gradient Background on Hover */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br pointer-events-none",
                colorStyles.gradient
            )} />

            <div className="relative z-10 flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm rounded-md font-medium text-text-muted/80 uppercase tracking-wider">{label}</p>
                </div>
                <div className={cn(
                    "p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-inner",
                    colorStyles.bg,
                    colorStyles.text
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white tracking-tight mb-2">{value}</h3>

                {trend && (
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/5",
                            trendUp ? "text-emerald-400" : "text-rose-400"
                        )}>
                            {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {trend}
                        </span>
                        <span className="text-xs text-text-muted font-medium">vs last month</span>
                    </div>
                )}
            </div>

            {/* Decorative Blur Blob */}
            <div className={cn(
                "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500 group-hover:opacity-40 group-hover:scale-150",
                colorStyles.bg.replace('/10', '') // Get the raw color for the blur
            )} />
        </div>
    );
}
