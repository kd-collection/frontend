import Link from "next/link";
import { formatIDR, formatDate } from "@/lib/utils";
import { Contract } from "@/lib/api";

interface RecentActivityProps {
    contracts: Contract[];
}

export default function RecentActivity({ contracts }: RecentActivityProps) {
    return (
        <>
            <h3 className="text-base font-bold text-text-main mb-6">Recent Contracts</h3>

            <div className="relative border-l border-border-subtle ml-2 space-y-6 flex-1">
                {contracts.length === 0 ? (
                    <div className="text-center py-10 text-text-muted text-sm">No recent activity.</div>
                ) : (
                    contracts.map((contract) => (
                        <div key={contract.nid} className="relative pl-6 group">
                            {/* Timeline Dot */}
                            <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-card group-hover:scale-110 transition-transform shadow-sm"></div>

                            <div className="flex justify-between items-start mb-0.5 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">
                                        {contract.customerName}
                                    </p>
                                </div>
                                <span className="text-[10px] font-medium text-text-muted/70 shrink-0 mt-0.5">{formatDate(contract.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-xs text-secondary font-bold tracking-tight">{formatIDR(contract.loanAmount)}</p>
                                <span className="h-0.5 w-0.5 rounded-full bg-text-muted/50"></span>
                                <span className="text-[10px] text-text-muted uppercase tracking-wide font-medium">NEW Loan</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Link href="/contracts" className="block w-full mt-6">
                <button className="w-full py-2.5 rounded-lg bg-bg-app hover:bg-bg-card-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all border border-border-subtle hover:border-border-strong">
                    View All Contracts
                </button>
            </Link>
        </>
    );
}
