import { useState, useRef, useEffect } from "react";
import { Bell, Search, Menu, AlertTriangle, FileText, Check } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useContractStats } from "@/hooks/useContracts";
import { formatIDR, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface TopBarProps {
    onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const { data: stats } = useContractStats();

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Generate Notifications from Stats
    const notifications = [
        ...(stats?.highPriority || []).slice(0, 3).map(c => ({
            id: `arrear-${c.nid}`,
            title: 'High Risk Alert',
            message: `${c.customer_name || 'Customer'} has arrears of ${formatIDR(Number(c.narrears))}`,
            type: 'danger',
            time: 'Action Required'
        })),
        ...(stats?.recent || []).slice(0, 2).map(c => ({
            id: `new-${c.nid}`,
            title: 'New Contract',
            message: `${c.ccontract_no} - ${c.customer_name || 'Customer'}`,
            type: 'info',
            time: formatDate(c.dcreated_at)
        }))
    ];

    const unreadCount = notifications.length;

    return (
        <header className="sticky top-0 z-40 w-full bg-glass-bg border-b border-border-subtle backdrop-blur-md h-16 flex items-center justify-between px-4 lg:px-8 transition-colors gap-4">
            {/* Mobile Menu Toggle */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 -ml-2 rounded-lg text-text-muted hover:bg-bg-app transition-colors"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-md hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search contracts, names, or NIK..."
                        className="w-full bg-bg-app border border-border-strong rounded-full py-2 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                <ThemeToggle />

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`relative p-2 rounded-full hover:bg-bg-app transition-colors border border-transparent hover:border-border-subtle ${isNotifOpen ? 'bg-bg-app text-primary' : 'text-text-muted hover:text-text-main'}`}
                    >
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full animate-pulse shadow-sm ring-2 ring-card"></span>
                        )}
                        <Bell className="h-5 w-5" />
                    </button>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl border border-border-subtle shadow-xl overflow-hidden z-50 ring-1 ring-black/5"
                            >
                                <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-app/50 backdrop-blur-sm">
                                    <h3 className="font-semibold text-text-main text-sm">Notifications</h3>
                                    <button className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Mark all read
                                    </button>
                                </div>
                                <div className="max-h-96 overflow-y-auto custom-scrollbar overscroll-contain">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-text-muted text-sm">
                                            No new notifications
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border-subtle">
                                            {notifications.map((notif) => (
                                                <div key={notif.id} className="p-4 hover:bg-bg-app/50 transition-colors cursor-pointer group flex gap-3 items-start">
                                                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {notif.type === 'danger' ? <AlertTriangle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className={`text-sm font-semibold ${notif.type === 'danger' ? 'text-rose-600 dark:text-rose-400' : 'text-text-main'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-text-muted leading-tight">
                                                            {notif.message}
                                                        </p>
                                                        <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider pt-1">
                                                            {notif.time}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 bg-bg-app/50 border-t border-border-subtle text-center">
                                    <button className="text-xs text-text-muted hover:text-text-main transition-colors py-1">
                                        View All Activity
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
