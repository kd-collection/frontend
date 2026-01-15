"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BreadcrumbsProps {
    className?: string;
}

export default function Breadcrumbs({ className }: BreadcrumbsProps) {
    const pathname = usePathname();
    const paths = pathname.split('/').filter(Boolean);

    if (paths.length === 0) return null;

    return (
        <nav className={cn("flex items-center text-sm text-text-muted mb-4", className)}>
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join('/')}`;
                const isLast = index === paths.length - 1;

                return (
                    <span key={path} className="flex items-center">
                        <span className="mx-2 opacity-50">/</span>
                        {isLast ? (
                            <span className="text-white font-medium capitalize">{path}</span>
                        ) : (
                            <Link href={href} className="hover:text-white transition-colors capitalize">
                                {path}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
