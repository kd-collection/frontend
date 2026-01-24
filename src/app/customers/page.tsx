"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Plus, LayoutList, MoreHorizontal, Pencil, Trash2, RefreshCcw, User } from "lucide-react";
import { cn, formatPhoneNumber } from "@/lib/utils";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useDebounce } from "@/hooks/useDebounce";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerSettings } from "@/hooks/useCustomerSettings";
import { CUSTOMER_COLUMNS } from "@/lib/constants";
import { Customer } from "@/lib/api";
import CustomerDetailSheet from "@/components/ui/CustomerDetailSheet";

export default function CustomersPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Pagination State
    const initialPage = Number(searchParams.get("page")) || 1;
    const [page, setPage] = useState(initialPage);
    const LIMIT = 10;

    // Search State
    const initialSearch = searchParams.get("q") || "";
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const debouncedSearch = useDebounce(searchQuery, 500);

    // URL Sync
    const createQueryString = useCallback(
        (params: Record<string, string | number | null>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());
            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === "") {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, String(value));
                }
            });
            return newSearchParams.toString();
        },
        [searchParams]
    );

    useEffect(() => {
        const queryString = createQueryString({
            page: page === 1 ? null : page,
            q: debouncedSearch === "" ? null : debouncedSearch,
        });

        const currentString = searchParams.toString();
        if (queryString !== currentString) {
            router.push(pathname + (queryString ? `?${queryString}` : ""), { scroll: false });
        }
    }, [page, debouncedSearch, createQueryString, pathname, router, searchParams]);

    // Reset page on search
    const [prevSearch, setPrevSearch] = useState(initialSearch);
    if (debouncedSearch !== prevSearch) {
        setPage(1);
        setPrevSearch(debouncedSearch);
    }

    // Data Fetching
    const { data: queryResult, isLoading, refetch, isRefetching } = useCustomers({
        page,
        limit: LIMIT,
        search: debouncedSearch
    });

    const customers = queryResult?.data || [];
    const pagination = queryResult?.pagination;

    // Customer Settings (for column visibility)
    const { visibleColumns, mounted } = useCustomerSettings();

    // Detail State
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const openCustomerDetail = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsDetailOpen(true);
    };

    // Dynamic grid columns based on settings
    const gridTemplateColumns = [
        "40px", // Row number
        ...CUSTOMER_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(c => c.width),
        "80px" // Actions
    ].join(" ");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <Breadcrumbs />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-text-main tracking-tight">Customers Database</h1>
                        <p className="text-sm text-text-muted mt-0.5 font-medium">Manage customer profiles and contact information.</p>
                    </div>
                    <div className="flex gap-2.5">
                        <button
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Customer
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Name, NIK, or Phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border-subtle rounded-lg py-2 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className={cn(
                            "p-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-all duration-500 shadow-sm",
                            isRefetching && "animate-spin cursor-not-allowed opacity-50"
                        )}
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-border-subtle bg-card overflow-hidden flex flex-col shadow-sm">
                {/* Header */}
                <div
                    className="grid gap-4 px-6 py-3 border-b border-border-subtle bg-bg-app/50 text-xs font-bold text-text-muted uppercase tracking-wider backdrop-blur-sm"
                    style={{ gridTemplateColumns }}
                >
                    <div>#</div>
                    {visibleColumns.includes('name') && <div>Name</div>}
                    {visibleColumns.includes('nik') && <div>NIK</div>}
                    {visibleColumns.includes('phone') && <div>Phone</div>}
                    {visibleColumns.includes('address') && <div>Address</div>}
                    {visibleColumns.includes('company') && <div>Company</div>}
                    {visibleColumns.includes('emergency') && <div>Emergency</div>}
                    <div className="text-center">Action</div>
                </div>

                {/* Body */}
                {(isLoading || !mounted) ? (
                    <div className="h-96 flex flex-col items-center justify-center gap-4">
                        <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                        <p className="text-sm font-medium text-text-muted animate-pulse">Loading Customers...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border-subtle bg-card">
                        {customers.map((customer, i) => (
                            <div
                                key={customer.nid}
                                onClick={() => openCustomerDetail(customer)}
                                style={{ gridTemplateColumns }}
                                className="grid gap-4 px-6 py-3.5 items-center transition-all duration-200 group relative hover:bg-bg-card-hover cursor-pointer"
                            >
                                <div className="text-xs font-mono text-text-muted">{(page - 1) * LIMIT + i + 1}</div>

                                {visibleColumns.includes('name') && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                                            {(customer.cname || "U").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-text-main text-sm">{customer.cname || "Unknown"}</div>
                                            <div className="text-[10px] text-text-muted">{customer.cemail || "No email"}</div>
                                        </div>
                                    </div>
                                )}

                                {visibleColumns.includes('nik') && (
                                    <div className="text-xs font-mono text-text-muted">{customer.cnik || "-"}</div>
                                )}

                                {visibleColumns.includes('phone') && (
                                    <div className="text-xs text-text-muted">{(() => {
                                        const isValid = (p?: string | null) => p && p !== "-" && p !== "0" && p.trim() !== "";
                                        const bestPhone = isValid(customer.cphone) ? customer.cphone : customer.cphone2;
                                        return formatPhoneNumber(bestPhone);
                                    })()}</div>
                                )}

                                {visibleColumns.includes('address') && (
                                    <div className="text-xs text-text-muted truncate" title={customer.caddress_home || ""}>
                                        {customer.caddress_home || "-"}
                                    </div>
                                )}

                                {visibleColumns.includes('company') && (
                                    <div className="text-xs text-text-muted truncate" title={customer.coffice_name || ""}>
                                        {customer.coffice_name || "-"}
                                    </div>
                                )}

                                {visibleColumns.includes('emergency') && (
                                    <div className="text-xs text-text-muted truncate" title={customer.cec_name || ""}>
                                        {customer.cec_name || "-"}
                                    </div>
                                )}

                                <div className="flex justify-center gap-1">
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 rounded-md hover:bg-bg-app text-text-muted hover:text-primary transition-colors"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {customers.length === 0 && (
                            <div className="p-16 flex flex-col items-center justify-center text-center">
                                <div className="h-16 w-16 mb-4 rounded-2xl bg-bg-app flex items-center justify-center">
                                    <User className="h-8 w-8 text-text-muted/50" />
                                </div>
                                <h3 className="text-lg font-semibold text-text-main">No customers found</h3>
                                <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
                                    Try adjusting your search criteria or add a new customer.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-bg-app/30 backdrop-blur-sm">
                    <p className="text-xs text-text-muted">
                        Showing {customers.length} of {pagination?.total || customers.length} results
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-text-muted font-medium">
                            Page {page} of {pagination?.totalPages || 1}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || isLoading}
                                className="px-3 py-1 text-xs rounded-lg border border-border-subtle text-text-main disabled:opacity-50 hover:bg-bg-card-hover transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!pagination || page >= pagination.totalPages || isLoading}
                                className="px-3 py-1 text-xs rounded-lg border border-border-subtle text-text-main disabled:opacity-50 hover:bg-bg-card-hover transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CustomerDetailSheet
                customer={selectedCustomer}
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
            />
        </div>
    );
}
