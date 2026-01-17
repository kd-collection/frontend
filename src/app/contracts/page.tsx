"use client";

import { useEffect, useState } from "react";
import { formatIDR, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Search, Filter, MoreHorizontal, ArrowUpDown, Download, CheckSquare, Square, RefreshCcw, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Contract {
    nid: number;
    ccontract_no: string;
    cname: string;
    noutstanding: number;
    narrears: number;
    dlast_payment?: string;
    darea_date?: string;
    chandler?: string;
}

// Fallback Mock Data extended
const MOCK_CONTRACTS: Contract[] = [
    { nid: 1, ccontract_no: "CTR-2026-001", cname: "Budi Santoso", noutstanding: 5000000, narrears: 500000, darea_date: "2026-01-15", chandler: "Agent X" },
    { nid: 2, ccontract_no: "CTR-2026-002", cname: "Amanda Manopo", noutstanding: 12500000, narrears: 0, darea_date: "2026-01-20", chandler: "Agent Y" },
    { nid: 3, ccontract_no: "CTR-2026-003", cname: "Raffi Ahmad", noutstanding: 75000000, narrears: 12000000, darea_date: "2026-01-10", chandler: "Agent Z" },
    { nid: 4, ccontract_no: "CTR-2026-004", cname: "Deddy Corbuzier", noutstanding: 2500000, narrears: 0, darea_date: "2026-02-01", chandler: "Agent X" },
    { nid: 5, ccontract_no: "CTR-2026-005", cname: "Nagita Slavina", noutstanding: 15000000, narrears: 2500000, darea_date: "2026-01-18", chandler: "Agent Y" },
    { nid: 6, ccontract_no: "CTR-2026-006", cname: "Taufik Hidayat", noutstanding: 8500000, narrears: 1500000, darea_date: "2026-01-25", chandler: "Agent Z" },
    { nid: 7, ccontract_no: "CTR-2026-007", cname: "Susi Susanti", noutstanding: 3000000, narrears: 0, darea_date: "2026-02-05", chandler: "Agent X" },
];

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('http://localhost:3000/api/contracts');
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                if (data && data.data) {
                    setContracts(data.data);
                } else {
                    setContracts(MOCK_CONTRACTS);
                }
                setLoading(false);
            } catch (e) {
                setTimeout(() => {
                    setContracts(MOCK_CONTRACTS);
                    setLoading(false);
                }, 800);
            }
        }
        fetchData();
    }, []);

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

    const filteredContracts = contracts.filter(c =>
        c.cname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ccontract_no.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
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
                        Filters
                        {/* Filter Badge */}
                        <span className="flex items-center justify-center bg-primary-subtle text-primary text-[10px] h-5 w-5 rounded font-bold">2</span>
                    </button>
                    <button
                        onClick={() => setLoading(true)}
                        className="p-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover hover:rotate-180 transition-all duration-500 shadow-sm"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="rounded-xl border border-border-subtle bg-card overflow-hidden flex flex-col shadow-sm">

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border-subtle bg-bg-app/50 text-xs font-bold text-text-muted uppercase tracking-wider backdrop-blur-sm">
                    <div className="col-span-1 flex items-center">
                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100 transition-opacity">
                            {selectedIds.length === contracts.length && contracts.length > 0 ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-text-main group transition-colors">
                        Contract No <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="col-span-3">Customer Info</div>
                    <div className="col-span-2 text-right">Balance</div>
                    <div className="col-span-2">Handler</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Action</div>
                </div>

                {/* Table Body */}
                {loading ? (
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
                                        className={cn(
                                            "grid grid-cols-12 gap-4 px-6 py-3.5 items-center transition-all duration-200 group relative",
                                            isSelected ? "bg-primary-subtle" : "hover:bg-bg-card-hover"
                                        )}
                                    >
                                        <div className="col-span-1 flex items-center z-10">
                                            <button onClick={() => toggleSelect(contract.nid)}>
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-text-muted group-hover:text-text-main transition-colors" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="col-span-2 font-mono text-xs text-text-muted group-hover:text-primary transition-colors font-medium">
                                            {contract.ccontract_no}
                                        </div>

                                        <div className="col-span-3">
                                            <p className="font-semibold text-text-main text-sm">{contract.cname || "Unknown Customer"}</p>
                                            <p className="text-[11px] text-text-muted mt-0.5">Due: {contract.darea_date}</p>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <p className="text-sm font-medium text-text-main">{formatIDR(contract.noutstanding)}</p>
                                            {contract.narrears > 0 && (
                                                <p className="text-[10px] text-destructive font-medium">+{formatIDR(contract.narrears)} Arrears</p>
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[10px] font-bold text-primary flex items-center justify-center uppercase border border-primary-subtle">
                                                {(contract.chandler || "A").charAt(0)}
                                            </div>
                                            <span className="text-xs text-text-muted">{contract.chandler || "Unassigned"}</span>
                                        </div>

                                        <div className="col-span-1 flex justify-center">
                                            <Badge variant={contract.narrears > 0 ? "danger" : "success"} glow={contract.narrears > 0}>
                                                {contract.narrears > 0 ? "Overdue" : "On Track"}
                                            </Badge>
                                        </div>

                                        <div className="col-span-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 rounded-md hover:bg-bg-app text-text-muted hover:text-text-main transition-colors">
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
    );
}
