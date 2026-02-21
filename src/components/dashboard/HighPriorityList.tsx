import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatIDR } from "@/lib/utils";
import { Contract } from "@/lib/api";
import { useContractSheet } from "@/components/dashboard/ContractSheetProvider";

interface HighPriorityListProps {
    contracts: Contract[];
}

export default function HighPriorityList({ contracts }: HighPriorityListProps) {
    const { openDetail } = useContractSheet();
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    Highest Arrears (Priority)
                </h3>
                <Link href="/contracts?sortBy=arrears&sortOrder=DESC" className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors flex items-center gap-1 group">
                    View All Risk <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
            </div>

            <div className="space-y-3">
                {contracts.length === 0 ? (
                    <div className="text-center py-8 text-text-muted text-sm">No high priority contracts found.</div>
                ) : (
                    contracts.map((contract) => (
                        <button
                            key={contract.nid}
                            type="button"
                            onClick={() => openDetail(contract)}
                            className="w-full text-left group flex items-center justify-between p-3 rounded-lg bg-bg-app/50 border border-border-subtle hover:border-border-strong hover:bg-bg-card-hover transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ring-offset-1 ring-offset-bg-app"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center border border-rose-500/20 shadow-sm">
                                    <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">{contract.customerName}</p>
                                    <p className="text-[11px] text-text-muted font-mono truncate">{contract.contractNo}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 pl-2">
                                <div className="text-right hidden sm:block shrink-0">
                                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Arrears</p>
                                    <p className="text-sm font-bold text-text-main tabular-nums">{formatIDR(contract.arrears)}</p>
                                </div>
                                <Badge variant="danger" glow className="shrink-0">
                                    HIGH
                                </Badge>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </>
    );
}
