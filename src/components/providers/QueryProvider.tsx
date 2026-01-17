"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Stale time: 1 minute (data considered fresh for 1 min)
                staleTime: 60 * 1000,
                // Retry 1 time on failure
                retry: 1,
                // Refetch on window focus
                refetchOnWindowFocus: false,
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
