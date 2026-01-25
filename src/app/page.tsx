"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatsCard from "@/components/ui/StatsCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import { BadgeDollarSign, Users, TrendingUp, AlertTriangle, ArrowRight, Activity, Download, LayoutList, CalendarClock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn, formatIDR, formatDate } from "@/lib/utils";
import { useContractStats } from "@/hooks/useContracts";
import Badge from "@/components/ui/Badge";
import ContractDetailSheet from "@/components/ui/ContractDetailSheet";
import { Contract } from "@/lib/api";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const router = useRouter();
  const { data: stats, isLoading } = useContractStats();
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailOpen(true);
  };

  if (isLoading || !stats) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm font-medium text-text-muted animate-pulse">Loading Dashboard...</p>
      </div>
    )
  }

  const { summary, highPriority, recent } = stats;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-text-muted mt-0.5 font-medium">Real-time financial overview & risk analysis.</p>
        </div>
        <div className="flex gap-2.5 w-full md:w-auto">
          <button className="flex-1 md:flex-none justify-center px-4 py-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors text-sm font-medium shadow-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button className="flex-1 md:flex-none justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Report
          </button>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item} className="group">
          <StatsCard
            label="Total Outstanding"
            value={formatIDR(Number(summary.total_outstanding))}
            trend="Live"
            trendUp={false}
            icon={BadgeDollarSign}
            color="destructive"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Active Contracts"
            value={Number(summary.total_contracts).toLocaleString()}
            trend={`${summary.total_handlers} Handlers`}
            trendUp={true}
            icon={LayoutList}
            color="primary"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Total Loan Value"
            value={formatIDR(Number(summary.total_loan_amount))}
            trend="Portfolio"
            trendUp={true}
            icon={TrendingUp}
            color="secondary"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Total Arrears (Risk)"
            value={formatIDR(Number(summary.total_arrears))}
            trend="Exposure"
            trendUp={false}
            icon={AlertTriangle}
            color="accent"
          />
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Chart Section */}
          <motion.div variants={item} className="p-6 rounded-xl border border-border-subtle bg-card shadow-sm h-[400px]">
            {/* Chart Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-text-main">Recovery Performance</h3>
                <p className="text-xs text-text-muted mt-0.5">Daily collection metrics vs targets</p>
              </div>

              <div className="flex bg-bg-app p-0.5 rounded-lg border border-border-subtle">
                {['Daily', 'Weekly', 'Monthly'].map((period, i) => (
                  <button
                    key={period}
                    className={cn(
                      "px-3 py-1 text-[11px] font-semibold rounded-md transition-all",
                      i === 0
                        ? "bg-card text-text-main shadow-sm border border-border-subtle"
                        : "text-text-muted hover:text-text-main"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px] w-full">
              <OverviewChart />
            </div>
          </motion.div>

          {/* High Priority Table */}
          <motion.div variants={item} className="p-6 rounded-xl border border-border-subtle bg-card shadow-sm">
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
              {highPriority.length === 0 ? (
                <div className="text-center py-8 text-text-muted text-sm">No high priority contracts found.</div>
              ) : (
                highPriority.map((contract) => (
                  <div
                    key={contract.nid}
                    onClick={() => openDetail(contract)}
                    className="group flex items-center justify-between p-3 rounded-lg bg-bg-app/50 border border-border-subtle hover:border-border-strong hover:bg-bg-card-hover transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center border border-rose-500/20 shadow-sm">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">{contract.customer_name || contract.cname}</p>
                        <p className="text-[11px] text-text-muted font-mono">{contract.ccontract_no}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Arrears</p>
                        <p className="text-sm font-bold text-text-main tabular-nums">{formatIDR(Number(contract.narrears))}</p>
                      </div>
                      <Badge variant="danger" glow>
                        HIGH
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          <motion.div variants={item} className="p-6 rounded-xl h-full border border-border-subtle bg-card shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-text-main mb-6">Recent Contracts</h3>

            <div className="relative border-l border-border-subtle ml-2 space-y-6 flex-1">
              {recent.length === 0 ? (
                <div className="text-center py-10 text-text-muted text-sm">No recent activity.</div>
              ) : (
                recent.map((contract, i) => (
                  <div key={contract.nid} className="relative pl-6 group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-card group-hover:scale-110 transition-transform shadow-sm"></div>

                    <div className="flex justify-between items-start mb-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate max-w-[120px]">
                          {contract.customer_name || contract.cname}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-text-muted/70">{formatDate(contract.dcreated_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-secondary font-bold tracking-tight">{formatIDR(Number(contract.nloan_amount))}</p>
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
          </motion.div>
        </div>

      </div>

      <ContractDetailSheet
        contract={selectedContract}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={() => router.push('/contracts')}
      />
    </motion.div>
  );
}
