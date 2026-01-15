"use client";

import { useEffect, useState } from "react";
import { formatIDR, cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Search, Filter, MoreHorizontal, ArrowUpDown, Download, CheckSquare, Square, RefreshCcw } from "lucide-react";
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
                // Simulate loading delay for effect
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
                        <h1 className="text-3xl font-bold text-white tracking-tight">Contracts Database</h1>
                        <p className="text-text-muted mt-1">Manage lending contracts, track payments, and assign handlers.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium">
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                        <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]">
                            + New Contract
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters & Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-1">
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by Contract No or Name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10 transition-all"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white text-sm font-medium flex items-center gap-2 hover:bg-white/10">
                        <Filter className="h-4 w-4" />
                        Filters
                        {/* Filter Badge */}
                        <span className="flex items-center justify-center bg-primary/20 text-primary text-[10px] h-5 w-5 rounded-md font-bold">2</span>
                    </button>
                    <button
                        onClick={() => setLoading(true)} // Re-trigger loading just for visual
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/10 hover:rotate-180 transition-all duration-500"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl shadow-black/50">

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/[0.02] text-xs font-bold text-text-muted uppercase tracking-wider">
                    <div className="col-span-1 flex items-center">
                        <button onClick={toggleSelectAll} className="opacity-50 hover:opacity-100 transition-opacity">
                            {selectedIds.length === contracts.length && contracts.length > 0 ? (
                                <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-white group transition-colors">
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
                        <div className="h-10 w-10 relative">
                            <span className="absolute inset-0 border-4 border-primary/20 rounded-full animate-ping"></span>
                            <span className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></span>
                        </div>
                        <p className="text-sm font-medium text-text-muted animate-pulse">Syncing Database...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5 bg-white/[0.01]">
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
                                            "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 group relative",
                                            isSelected ? "bg-primary/[0.08]" : "hover:bg-white/[0.03]"
                                        )}
                                    >
                                        <div className="col-span-1 flex items-center z-10">
                                            <button onClick={() => toggleSelect(contract.nid)}>
                                                {isSelected ? (
                                                    <CheckSquare className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Square className="h-4 w-4 text-text-muted group-hover:text-white transition-colors" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="col-span-2 font-mono text-xs text-text-muted group-hover:text-primary transition-colors font-medium">
                                            {contract.ccontract_no}
                                        </div>

                                        <div className="col-span-3">
                                            <p className="font-semibold text-white text-sm">{contract.cname || "Unknown Customer"}</p>
                                            <p className="text-[10px] text-text-muted mt-0.5">Due: {contract.darea_date}</p>
                                        </div>

                                        <div className="col-span-2 text-right">
                                            <p className="text-sm font-medium text-white">{formatIDR(contract.noutstanding)}</p>
                                            {contract.narrears > 0 && (
                                                <p className="text-[10px] text-rose-400 font-medium">+{formatIDR(contract.narrears)} Arrears</p>
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-bold text-white flex items-center justify-center">
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
                                            <button className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Selection Glow */}
                                        {isSelected && (
                                            <div className="absolute inset-0 border-l-2 border-primary bg-primary/[0.02] pointer-events-none" />
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
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                    <p className="text-xs text-text-muted">Showing {filteredContracts.length} of {contracts.length} results</p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white disabled:opacity-50 hover:bg-white/5" disabled>Previous</button>
                        <button className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white hover:bg-white/5">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
