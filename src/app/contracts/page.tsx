"use client";

import { useState, useEffect } from "react";
import { formatIDR, cn } from "@/lib/utils";
import { api, Contract } from "@/lib/api"; // Keep api for getContractById for now
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ContractDetailSheet from "@/components/ui/ContractDetailSheet";
import { Search, Filter, MoreHorizontal, ArrowUpDown, Download, CheckSquare, Square, RefreshCcw, Plus, LayoutList, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useContractSettings } from "@/hooks/useContractSettings";
import { useContracts } from "@/hooks/useContracts";
import { CONTRACT_COLUMNS } from "@/lib/constants";
import { useToast } from "@/components/ui/Toast";

export default function ContractsPage() {
    // React Query Hook
    const { data: contracts = [], isLoading, refetch, isRefetching } = useContracts();
    const { toast } = useToast();

    // Check for Demo Mode
    useEffect(() => {
        if (!isLoading && contracts.length > 0 && process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
            toast("Running in Demo Mode. Using mock data.", "info");
        }
    }, [isLoading, contracts.length, toast]);

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [detailContract, setDetailContract] = useState<Contract | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Settings Hook
    const { visibleColumns, mounted } = useContractSettings();

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

    const toggleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredContracts = contracts.filter(c => {
        const name = (c.customer_name || c.cname || '').toLowerCase();
        const contractNo = (c.ccontract_no || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || contractNo.includes(query);
    });

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
                        <button className="px-4 py-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main text-sm font-medium flex items-center gap-2 hover:bg-bg-card-hover shadow-sm transition-all">
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {/* Filter Badge */}
                            <span className="flex items-center justify-center bg-primary-subtle text-primary text-[10px] h-5 w-5 rounded font-bold">2</span>
                        </button>
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
                            <div className="flex items-center gap-2 cursor-pointer hover:text-text-main group transition-colors">
                                Contract No <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}

                        {visibleColumns.includes('customer_info') && (
                            <div>Customer Info</div>
                        )}

                        {visibleColumns.includes('balance') && (
                            <div className="text-right">Balance</div>
                        )}

                        {visibleColumns.includes('handler') && (
                            <div>Handler</div>
                        )}

                        {visibleColumns.includes('status') && (
                            <div className="text-center">Status</div>
                        )}

                        {visibleColumns.includes('loan_amount') && (
                            <div className="text-right">Loan Amount</div>
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
                            <div>Due Date</div>
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
                            <AnimatePresence>
                                {filteredContracts.map((contract, i) => {
                                    const isSelected = selectedIds.includes(contract.nid);
                                    return (
                                        <motion.div
                                            key={contract.nid}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.03, duration: 0.2 }}
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
                                                <span className="text-xs font-mono text-text-muted">{i + 1}</span>
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
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {filteredContracts.length === 0 && (
                                <div className="p-12 text-center">
                                    <p className="text-text-muted">No contracts found matching "{searchQuery}"</p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="mt-4 text-primary text-sm hover:underline"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border-subtle bg-bg-app/30 backdrop-blur-sm">
                        <p className="text-xs text-text-muted">Showing {filteredContracts.length} of {contracts.length} results</p>
                        <div className="flex gap-2">
                            <button className="px-3 py-1 text-xs rounded-lg border border-border-subtle text-text-main disabled:opacity-50 hover:bg-bg-card-hover" disabled>Previous</button>
                            <button className="px-3 py-1 text-xs rounded-lg border border-border-subtle text-text-main hover:bg-bg-card-hover">Next</button>
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
