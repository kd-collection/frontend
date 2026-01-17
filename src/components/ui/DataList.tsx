"use client";

import { cn } from "@/lib/utils";

interface DataListProps {
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export function DataList({ title, children, className }: DataListProps) {
    return (
        <div className={cn("pt-4 first:pt-0", className)}>
            {title && (
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">
                    {title}
                </h3>
            )}
            <div className="space-y-1 bg-bg-app/50 rounded-lg p-3 border border-border-subtle">
                {children}
            </div>
        </div>
    );
}

interface DataListItemProps {
    icon?: React.ElementType;
    label: string;
    value?: string | number | null;
    className?: string;
}

export function DataListItem({ icon: Icon, label, value, className }: DataListItemProps) {
    return (
        <div className={cn("flex items-start gap-3 py-2", className)}>
            {Icon && (
                <div className="h-8 w-8 rounded-lg bg-bg-app flex items-center justify-center flex-shrink-0 border border-border-subtle/50">
                    <Icon className="h-4 w-4 text-text-muted" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm text-text-main font-semibold mt-0.5 break-words leading-relaxed">
                    {value || <span className="text-text-muted/50">-</span>}
                </p>
            </div>
        </div>
    );
}
