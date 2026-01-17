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

    // Semantic mapping
    const colorStyles = {
        primary: "text-primary bg-primary-subtle border-primary-subtle",
        secondary: "text-secondary bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30",
        accent: "text-accent bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800/30",
        destructive: "text-destructive bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30",
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
                            "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border",
                            trendUp
                                ? "bg-blue-50 dark:bg-blue-900/20 text-secondary border-blue-100 dark:border-blue-800/30"
                                : "bg-rose-50 dark:bg-rose-900/20 text-destructive border-rose-100 dark:border-rose-800/30"
                        )}>
                            {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                            {trend}
                        </span>
                        <span className="text-xs text-text-muted font-medium">vs last month</span>
                    </div>
                )}
            </div>
        </div>
    );
}
