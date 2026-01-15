"use client";

import StatsCard from "@/components/ui/StatsCard";
import OverviewChart from "@/components/dashboard/OverviewChart";
import { BadgeDollarSign, Users, TrendingUp, AlertTriangle, ArrowRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Mock Data (simulating complex backend data)
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
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-text-muted mt-1 font-medium">Real-time financial overview & risk analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 rounded-xl bg-white/5 text-text-muted hover:text-white hover:bg-white/10 transition-all border border-white/5 font-medium text-sm backdrop-blur-md">
            Export Data
          </button>
          <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Report
          </button>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={item} className="group">
          <StatsCard
            label="Total Outstanding"
            value="Rp 1.25M"
            trend="12.5%"
            trendUp={false}
            icon={BadgeDollarSign}
            color="rose"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Main Chart Section */}
          <motion.div variants={item} className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-white">Recovery Performance</h3>
                <p className="text-sm text-text-muted mt-1">Daily collection metrics vs targets</p>
              </div>

              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                {['Daily', 'Weekly', 'Monthly'].map((period, i) => (
                  <button
                    key={period}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${i === 0 ? 'bg-white/10 text-white shadow-sm' : 'text-text-muted hover:text-white'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full">
              <OverviewChart />
            </div>
          </motion.div>

          {/* High Priority Table */}
          <motion.div variants={item} className="glass-panel p-8 rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Priority Attention
              </h3>
              <Link href="/contracts" className="text-xs font-semibold text-primary hover:text-primary-foreground transition-colors flex items-center gap-1 group">
                View All Risk <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {highPriority.map((contract) => (
                <div key={contract.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 text-rose-400 flex flex-col items-center justify-center border border-rose-500/20 group-hover:border-rose-500/40 transition-colors">
                      <span className="text-xs font-bold">{contract.days}</span>
                      <span className="text-[9px] uppercase font-medium opacity-70">Days</span>
                    </div>
                    <div>
                      <p className="font-bold text-white group-hover:text-primary transition-colors">{contract.name}</p>
                      <p className="text-xs text-text-muted mt-0.5 font-mono">{contract.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Arrears</p>
                      <p className="font-bold text-white tabular-nums">{contract.arrears}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wide">
                      {contract.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-8">
          <motion.div variants={item} className="glass-panel p-8 rounded-3xl h-full border border-white/5 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6">Live Activity Feed</h3>

            <div className="relative border-l border-white/10 ml-4 space-y-8 flex-1">
              {recentCollections.map((log, i) => (
                <div key={log.id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary ring-4 ring-app shadow-[0_0_10px_rgba(16,185,129,0.4)] group-hover:scale-125 transition-transform"></div>

                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white group-hover:text-secondary transition-colors">{log.name}</p>
                    </div>
                    <span className="text-[10px] font-medium text-text-muted/60">{log.time}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm text-secondary font-bold tracking-tight">{log.amount}</p>
                    <span className="h-1 w-1 rounded-full bg-white/20"></span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wide font-medium">{log.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-3.5 mt-8 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-text-muted hover:text-white transition-all border border-white/5 hover:border-white/10 focus:ring-2 focus:ring-primary/20">
              View Audit Log
            </button>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
