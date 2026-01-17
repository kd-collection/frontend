"use client";

import { useState, useEffect, useCallback } from "react";
import { formatIDR, cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { api, Contract } from "@/lib/api"; // Keep api for getContractById for now
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ContractDetailSheet from "@/components/ui/ContractDetailSheet";
import { Search, Filter, MoreHorizontal, ArrowUpDown, Download, CheckSquare, Square, RefreshCcw, Plus, LayoutList, ChevronDown, ChevronUp, Trash2, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useContractSettings } from "@/hooks/useContractSettings";
import { useContracts, useDeleteContract } from "@/hooks/useContracts";
import { CONTRACT_COLUMNS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";
import { useDebounce } from "@/hooks/useDebounce";

export default function ContractsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Initialize state from URL Params or defaults
    const initialPage = Number(searchParams.get("page")) || 1;
    const initialSearch = searchParams.get("q") || "";

    // Pagination State
    const [page, setPage] = useState(initialPage);
    const LIMIT = 10;

    // Search State
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const debouncedSearch = useDebounce(searchQuery, 500); // 500ms delay

    // Level 1: Sort & Filter State
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "created_at");
    const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") || "DESC");
    const [filterHandler, setFilterHandler] = useState(searchParams.get("handler") || "");

    // URL Synchronization Effect
    const createQueryString = useCallback(
        (params: Record<string, string | number | null>) => {
            const newSearchParams = new URLSearchParams(searchParams.toString());

            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === "" || value === 1) {
                    newSearchParams.delete(key);
                } else {
                    newSearchParams.set(key, String(value));
                }
            });

            return newSearchParams.toString();
        },
        [searchParams]
    );

    // Update URL when page or debouncedSearch changes
    // Update URL when page or debouncedSearch changes
    useEffect(() => {
        const queryString = createQueryString({
            page: page === 1 ? null : page,
            q: debouncedSearch === "" ? null : debouncedSearch,
            sortBy: sortBy === "created_at" ? null : sortBy,
            sortOrder: sortOrder === "DESC" ? null : sortOrder,
            handler: filterHandler === "" ? null : filterHandler
        });

        const currentString = searchParams.toString();
        // Prevent infinite loop: Only push if URL actually needs to change
        if (queryString !== currentString) {
            router.push(pathname + (queryString ? `?${queryString}` : ""), { scroll: false });
        }
    }, [page, debouncedSearch, sortBy, sortOrder, filterHandler, createQueryString, pathname, router, searchParams]);

    // Handlers
    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(prev => prev === "ASC" ? "DESC" : "ASC");
        } else {
            setSortBy(column);
            setSortOrder("DESC"); // Default new sort to DESC
        }
    };

    // Refined Reset Logic: Sync page reset on search change
    const [prevSearch, setPrevSearch] = useState(initialSearch);
    if (debouncedSearch !== prevSearch) {
        setPage(1);
        setPrevSearch(debouncedSearch);
    }

    // React Query Hooks (Updated with Object Params)
    const { data: queryResult, isLoading, refetch, isRefetching } = useContracts({
        page,
        limit: LIMIT,
        search: debouncedSearch,
        sortBy,
        sortOrder,
        handler: filterHandler
    });
    const { mutate: deleteContract, isPending: isDeleting } = useDeleteContract();

    const contracts = queryResult?.data || [];
    const pagination = queryResult?.pagination;

    const { toast } = useToast();

    // Check for Demo Mode - Only show once on mount/first load
    useEffect(() => {
        if (!isLoading && contracts.length > 0 && process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && page === 1) {
            // Toast removed to reduce noise on navigation, or can keep it
            // toast("Running in Demo Mode. Using mock data.", "info");
        }
    }, [isLoading, contracts.length, page, toast]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    const [detailContract, setDetailContract] = useState<Contract | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Settings Hook
    const { visibleColumns, mounted } = useContractSettings();

    // Debug: Log loading state
    console.log('[DEBUG] ContractsPage:', { isLoading, mounted, contractsLength: contracts.length, queryResult });

    const openContractDetail = async (contractId: number) => {
        const response = await api.getContractById(contractId);
        if (response.success && response.data) {
            setDetailContract(response.data);
            setIsDetailOpen(true);
        }
    };

    const closeContractDetail = () => {
        setIsDetailOpen(false);
        setDetailContract(null);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === contracts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(contracts.map(c => c.nid));
        }
    };

    const handleDeleteSelected = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} contract(s)? This action cannot be undone.`)) {
            return;
        }

        // Parallel deletions
        const promises = selectedIds.map(id =>
            new Promise<void>((resolve, reject) => {
                deleteContract(id, {
                    onSuccess: () => resolve(),
                    onError: (err) => reject(err)
                });
            })
        );

        try {
            await Promise.all(promises);
            toast(`Successfully deleted ${selectedIds.length} contract(s)`, "success");
            setSelectedIds([]); // Clear selection
            refetch(); // Ensure list is refreshed
        } catch (error) {
            toast("Failed to delete some contracts", "error");
        }
    };

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // Client-side filtering removed as we use server-side search
    const filteredContracts = contracts;

    const gridTemplateColumns = [
        "60px", // Checkbox + #
        ...CONTRACT_COLUMNS.filter(c => visibleColumns.includes(c.id)).map(c => c.width),
        "50px" // Action
    ].join(" ");

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <Breadcrumbs />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-text-main tracking-tight">Contracts Database</h1>
                            <p className="text-sm text-text-muted mt-0.5 font-medium">Manage lending contracts, track payments, and assign handlers.</p>
                        </div>
                        <div className="flex gap-2.5">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors border border-border-subtle text-sm font-medium shadow-sm">
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">Export</span>
                            </button>
                            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                New Contract
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
                            placeholder="Search by Contract No or Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border-subtle rounded-lg py-2 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    onClick={handleDeleteSelected}
                                    disabled={isDeleting}
                                    className="px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium hover:bg-destructive/20 transition-all flex items-center gap-2"
                                >
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    <span className="hidden sm:inline">Delete ({selectedIds.length})</span>
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Handler Filter Mockup */}
                        <div className="relative">
                            <select
                                value={filterHandler}
                                onChange={(e) => {
                                    setFilterHandler(e.target.value);
                                    setPage(1); // Reset page on filter
                                }}
                                className="appearance-none px-4 py-2 pl-9 rounded-lg bg-card border border-border-subtle text-sm font-medium text-text-main hover:bg-bg-card-hover shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                            >
                                <option value="">All Handlers</option>
                                <option value="Agent X">Agent X</option>
                                <option value="Agent Y">Agent Y</option>
                                <option value="Agent Z">Agent Z</option>
                            </select>
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted pointer-events-none" />
                        </div>
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

                    {/* Table Header */}
                    <div
                        className="grid gap-4 px-6 py-3 border-b border-border-subtle bg-bg-app/50 text-xs font-bold text-text-muted uppercase tracking-wider backdrop-blur-sm"
                        style={{ gridTemplateColumns }}
                    >
                        <div className="flex items-center gap-2">
                            <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100 transition-opacity">
                                {selectedIds.length === contracts.length && contracts.length > 0 ? (
                                    <CheckSquare className="h-4 w-4 text-primary" />
                                ) : (
                                    <Square className="h-4 w-4" />
                                )}
                            </button>
                            <span>#</span>
                        </div>

                        {visibleColumns.includes('contract_no') && (
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:text-text-main group transition-colors select-none"
                                onClick={() => handleSort('contract_no')}
                            >
                                Contract No
                                {sortBy === 'contract_no' ? (
                                    sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                                ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        )}

                        {visibleColumns.includes('customer_info') && (
                            <div>Customer Info</div>
                        )}

                        {visibleColumns.includes('balance') && (
                            <div
                                className="flex items-center justify-end gap-2 cursor-pointer hover:text-text-main group transition-colors select-none"
                                onClick={() => handleSort('outstanding')}
                            >
                                Balance
                                {sortBy === 'outstanding' ? (
                                    sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                                ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        )}

                        {visibleColumns.includes('handler') && (
                            <div>Handler</div>
                        )}

                        {visibleColumns.includes('status') && (
                            <div className="text-center">Status</div>
                        )}

                        {visibleColumns.includes('loan_amount') && (
                            <div
                                className="flex items-center justify-end gap-2 cursor-pointer hover:text-text-main group transition-colors select-none"
                                onClick={() => handleSort('loan_amount')}
                            >
                                Loan Amount
                                {sortBy === 'loan_amount' ? (
                                    sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                                ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        )}

                        {visibleColumns.includes('tenor') && (
                            <div className="text-center">Tenor</div>
                        )}

                        {visibleColumns.includes('va_account') && (
                            <div>VA Account</div>
                        )}

                        {visibleColumns.includes('area') && (
                            <div>Area</div>
                        )}

                        {visibleColumns.includes('due_date') && (
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:text-text-main group transition-colors select-none"
                                onClick={() => handleSort('due_date')}
                            >
                                Due Date
                                {sortBy === 'due_date' ? (
                                    sortOrder === 'ASC' ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />
                                ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                        )}

                        {visibleColumns.includes('disbursement_date') && (
                            <div>Disburse Date</div>
                        )}

                        <div className="text-center">Action</div>
                    </div>

                    {/* Table Body */}
                    {(isLoading || !mounted) ? (
                        <div className="h-96 flex flex-col items-center justify-center gap-4">
                            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                            <p className="text-sm font-medium text-text-muted animate-pulse">Syncing Database...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border-subtle bg-card">
                            {filteredContracts.map((contract, i) => {
                                const isSelected = selectedIds.includes(contract.nid);
                                return (
                                    <div
                                        key={contract.nid}
                                        onClick={() => openContractDetail(contract.nid)}
                                        style={{ gridTemplateColumns }}
                                        className={cn(
                                            "grid gap-4 px-6 py-3.5 items-center transition-all duration-200 group relative cursor-pointer",
                                            isSelected ? "bg-primary-subtle" : "hover:bg-bg-card-hover"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 z-10">
                                            <button onClick={(e) => { e.stopPropagation(); toggleSelect(contract.nid); }}>
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-text-muted group-hover:text-text-main transition-colors" />
                                                )}
                                            </button>
                                            <span className="text-xs font-mono text-text-muted">{(page - 1) * LIMIT + i + 1}</span>
                                        </div>

                                        {visibleColumns.includes('contract_no') && (
                                            <div className="font-mono text-xs text-text-muted group-hover:text-primary transition-colors font-medium">
                                                {contract.ccontract_no}
                                            </div>
                                        )}

                                        {visibleColumns.includes('customer_info') && (
                                            <div>
                                                <p className="font-semibold text-text-main text-sm">{contract.customer_name || contract.cname || "Unknown Customer"}</p>
                                                <p className="text-[11px] text-text-muted mt-0.5">Due: {contract.darea_date ? new Date(contract.darea_date).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        )}

                                        {visibleColumns.includes('balance') && (
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-text-main">{formatIDR(Number(contract.noutstanding))}</p>
                                                {Number(contract.narrears) > 0 && (
                                                    <p className="text-[10px] text-destructive font-medium">+{formatIDR(Number(contract.narrears))} Arrears</p>
                                                )}
                                            </div>
                                        )}

                                        {visibleColumns.includes('handler') && (
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[10px] font-bold text-primary flex items-center justify-center uppercase border border-primary-subtle">
                                                    {(contract.chandler || "A").charAt(0)}
                                                </div>
                                                <span className="text-xs text-text-muted">{contract.chandler || "Unassigned"}</span>
                                            </div>
                                        )}

                                        {visibleColumns.includes('status') && (
                                            <div className="flex justify-center">
                                                <Badge
                                                    variant={Number(contract.narrears) > 0 ? "danger" : "success"}
                                                    glow={Number(contract.narrears) > 0}
                                                    className="min-w-[90px] justify-center"
                                                >
                                                    {Number(contract.narrears) > 0 ? "Overdue" : "On Track"}
                                                </Badge>
                                            </div>
                                        )}

                                        {visibleColumns.includes('loan_amount') && (
                                            <div className="text-right text-xs font-mono text-text-main">
                                                {formatIDR(Number(contract.nloan_amount || 0))}
                                            </div>
                                        )}

                                        {visibleColumns.includes('tenor') && (
                                            <div className="text-center text-xs text-text-muted">
                                                {contract.ntenor || '-'}
                                            </div>
                                        )}

                                        {visibleColumns.includes('va_account') && (
                                            <div className="font-mono text-xs text-text-muted">
                                                {contract.cva_account || '-'}
                                            </div>
                                        )}

                                        {visibleColumns.includes('area') && (
                                            <div className="text-xs text-text-muted truncate">
                                                {contract.carea || contract.caddress_ktp || '-'}
                                            </div>
                                        )}

                                        {visibleColumns.includes('due_date') && (
                                            <div className="text-xs text-text-muted">
                                                {contract.darea_date ? new Date(contract.darea_date).getDate() : '-'}
                                            </div>
                                        )}

                                        {visibleColumns.includes('disbursement_date') && (
                                            <div className="text-xs text-text-muted">
                                                {contract.ddisbursement || '-'}
                                            </div>
                                        )}

                                        <div className="flex justify-center">
                                            <button
                                                className="p-1.5 rounded-md hover:bg-bg-app text-text-muted hover:text-text-main transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Selection Border Indicator */}
                                        {isSelected && (
                                            <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
                                        )}
                                    </div>
                                );
                            })}

                            {filteredContracts.length === 0 && (
                                <div className="p-16 flex flex-col items-center justify-center text-center">
                                    <div className="h-16 w-16 mb-4 rounded-2xl bg-bg-app flex items-center justify-center">
                                        {searchQuery ? (
                                            <Search className="h-8 w-8 text-text-muted/50" />
                                        ) : (
                                            <LayoutList className="h-8 w-8 text-text-muted/50" />
                                        )}
                                    </div>

                                    {searchQuery ? (
                                        <>
                                            <h3 className="text-lg font-semibold text-text-main">No matches found</h3>
                                            <p className="text-sm text-text-muted mt-1 max-w-xs mx-auto">
                                                No contracts matching <span className="font-mono text-xs bg-bg-app px-1.5 py-0.5 rounded border border-border-subtle">"{searchQuery}"</span>
                                            </p>
                                            <button
                                                onClick={() => setSearchQuery("")}
                                                className="mt-6 px-4 py-2 rounded-lg bg-bg-app border border-border-subtle text-sm font-medium text-text-main hover:bg-bg-card-hover transition-all"
                                            >
                                                Clear Search
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold text-text-main">No contracts yet</h3>
                                            <p className="text-sm text-text-muted mt-1 max-w-sm mx-auto">
                                                Your database is empty. Contracts will appear here once they are created or synchronized.
                                            </p>
                                            <button className="mt-6 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
                                                <Plus className="h-4 w-4" />
                                                Create First Contract
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-bg-app/30 backdrop-blur-sm">
                        <p className="text-xs text-text-muted">
                            Showing {filteredContracts.length} of {pagination?.total || contracts.length} results
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
            </div>

            {/* Contract Detail Sheet */}
            <ContractDetailSheet
                contract={detailContract}
                isOpen={isDetailOpen}
                onClose={closeContractDetail}
            />
        </>
    );
}
