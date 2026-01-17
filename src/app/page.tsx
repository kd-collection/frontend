"use client";

import StatsCard from "@/components/ui/StatsCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import { BadgeDollarSign, Users, TrendingUp, AlertTriangle, ArrowRight, Activity, Download } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Mock Data
const recentCollections = [
  { id: 1, name: "Budi Santoso", amount: "Rp 500.000", time: "2m ago", status: "Paid", avatar: "BS" },
  { id: 2, name: "Siti Aminah", amount: "Rp 1.200.000", time: "15m ago", status: "Partial", avatar: "SA" },
  { id: 3, name: "Ahmad Rizky", amount: "Rp 750.000", time: "1h ago", status: "Paid", avatar: "AR" },
  { id: 4, name: "Dewi Lestari", amount: "Rp 3.000.000", time: "3h ago", status: "Paid", avatar: "DL" },
];

const highPriority = [
  { id: "CTR-2026-001", name: "Budi Santoso", arrears: "Rp 5.500.000", risk: "High", days: 45 },
  { id: "CTR-2026-089", name: "Kevin Sanjaya", arrears: "Rp 12.000.000", risk: "Critical", days: 60 },
  { id: "CTR-2026-112", name: "Marcus Gideon", arrears: "Rp 8.200.000", risk: "High", days: 32 },
];

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
        <div className="flex gap-2.5">
          <button className="px-4 py-2 rounded-lg bg-card border border-border-subtle text-text-muted hover:text-text-main hover:bg-bg-card-hover transition-colors text-sm font-medium shadow-sm flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
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
            value="Rp 1.25M"
            trend="12.5%"
            trendUp={false}
            icon={BadgeDollarSign}
            color="destructive"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Active Customers"
            value="1,284"
            trend="5.2%"
            trendUp={true}
            icon={Users}
            color="primary"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Recovery Rate"
            value="84.2%"
            trend="2.1%"
            trendUp={true}
            icon={TrendingUp}
            color="secondary"
          />
        </motion.div>
        <motion.div variants={item} className="group">
          <StatsCard
            label="Risk Exposure"
            value="142"
            trend="4.3%"
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
                Priority Attention
              </h3>
              <Link href="/contracts" className="text-xs font-semibold text-primary hover:text-primary/70 transition-colors flex items-center gap-1 group">
                View All Risk <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {highPriority.map((contract) => (
                <div key={contract.id} className="group flex items-center justify-between p-3 rounded-lg bg-bg-app/50 border border-border-subtle hover:border-border-strong hover:bg-bg-card-hover transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-900/10 text-destructive flex flex-col items-center justify-center border border-rose-100 dark:border-rose-900/20">
                      <span className="text-xs font-bold">{contract.days}</span>
                      <span className="text-[8px] uppercase font-bold opacity-70">Days</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">{contract.name}</p>
                      <p className="text-[11px] text-text-muted font-mono">{contract.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Arrears</p>
                      <p className="text-sm font-bold text-text-main tabular-nums">{contract.arrears}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/20 text-destructive border border-rose-200 dark:border-rose-800 uppercase tracking-wide">
                      {contract.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          <motion.div variants={item} className="p-6 rounded-xl h-full border border-border-subtle bg-card shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-text-main mb-6">Live Activity Feed</h3>

            <div className="relative border-l border-border-subtle ml-2 space-y-6 flex-1">
              {recentCollections.map((log, i) => (
                <div key={log.id} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary border-2 border-card group-hover:scale-110 transition-transform shadow-sm"></div>

                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">{log.name}</p>
                    </div>
                    <span className="text-[10px] font-medium text-text-muted/70">{log.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-xs text-secondary font-bold tracking-tight">{log.amount}</p>
                    <span className="h-0.5 w-0.5 rounded-full bg-text-muted/50"></span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wide font-medium">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-2.5 mt-6 rounded-lg bg-bg-app hover:bg-bg-card-hover text-xs font-semibold text-text-muted hover:text-text-main transition-all border border-border-subtle hover:border-border-strong">
              View Audit Log
            </button>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
