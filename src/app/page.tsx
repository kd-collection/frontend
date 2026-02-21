"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StatsCard from "@/components/ui/StatsCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import { BadgeDollarSign, TrendingUp, AlertTriangle, Activity, Download, LayoutList } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatIDR } from "@/lib/utils";
import { useContractStats } from "@/hooks/useContracts";
import ContractDetailSheet from "@/components/ui/ContractDetailSheet";
import HighPriorityList from "@/components/dashboard/HighPriorityList";
import RecentActivity from "@/components/dashboard/RecentActivity";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
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

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center flex-col gap-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-text-main">Failed to load dashboard metrics.</p>
          <p className="text-xs text-text-muted">A network error occurred or the server is unreachable.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 mt-2 text-xs font-semibold rounded-lg bg-card border border-border-subtle hover:bg-bg-card-hover text-text-main transition-colors shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
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
            <HighPriorityList contracts={highPriority} onOpenDetail={openDetail} />
          </motion.div>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          <motion.div variants={item} className="p-6 rounded-xl h-full border border-border-subtle bg-card shadow-sm flex flex-col">
            <RecentActivity contracts={recent} />
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
