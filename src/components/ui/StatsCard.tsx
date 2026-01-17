"use client";

import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface StatsCardProps {
    label: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ElementType;
    className?: string;
    color?: "primary" | "secondary" | "accent" | "destructive";
}

export default function StatsCard({ label, value, trend, trendUp, icon: Icon, color = "primary", className }: StatsCardProps) {

    // Semantic mapping - Unified styling pattern
    const colorStyles = {
        primary: "text-primary bg-primary-subtle border-primary/20",
        secondary: "text-primary bg-primary-subtle border-primary/20",
        accent: "text-primary bg-primary-subtle border-primary/20",
        destructive: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    }[color];

    return (
        <div className={cn(
            "relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5",
            "bg-card border border-border-subtle shadow-sm hover:shadow-md",
            className
        )}>

            <div className="flex justify-between items-start mb-4">
                <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">{label}</p>
                <div className={cn(
                    "p-2 rounded-lg border",
                    colorStyles
                )}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            <div>
                <h3 className="text-3xl font-bold text-text-main tracking-tight mb-2">{value}</h3>

                {trend && (
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "flex items-center gap-0.5 text-sm font-bold",
                            trendUp ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                            {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {trend}
                        </span>
                        <span className="text-xs text-text-muted">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
}
