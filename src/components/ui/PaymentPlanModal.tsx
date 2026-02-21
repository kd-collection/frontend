"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Calculator, Save, RefreshCw, Trash2, Plus } from "lucide-react";
import { Contract, PaymentScheduleItem, api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PaymentPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract | null;
}

export default function PaymentPlanModal({ isOpen, onClose, contract }: PaymentPlanModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [mounted, setMounted] = useState(false);

    // Generator State
    const [totalDebt, setTotalDebt] = useState(0); // Outstanding
    const [dpAmount, setDpAmount] = useState(0);
    const [tenor, setTenor] = useState(6);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [mode, setMode] = useState<'SIMPLE' | 'CUSTOM'>('SIMPLE');

    // Schedule Items State
    const [scheduleItems, setScheduleItems] = useState<Partial<PaymentScheduleItem>[]>([]);

    useEffect(() => {
        setMounted(true);
        if (contract) {
            setTotalDebt(Number(contract.noutstanding));
        }
    }, [contract]);

    // Fetch existing schedule
    const { data: existingSchedule, isLoading: isLoadingSchedule } = useQuery({
        queryKey: ['schedule', contract?.nid],
        queryFn: async () => {
            if (!contract?.nid) return [];
            const res = await api.getPaymentSchedule(contract.nid);
            return (res as any).data || [];
        },
        enabled: !!contract?.nid && isOpen,
    });

    // Populate state on load
    useEffect(() => {
        if (existingSchedule && Array.isArray(existingSchedule) && existingSchedule.length > 0) {
            setScheduleItems(existingSchedule);
        } else {
            // Reset if no schedule found
            setScheduleItems([]);
        }
    }, [existingSchedule, isOpen]);

    // Save Mutation
    const { mutate: saveSchedule, isPending: isSaving } = useMutation({
        mutationFn: (items: Partial<PaymentScheduleItem>[]) => {
            if (!contract?.nid) throw new Error("No contract ID");
            return api.savePaymentSchedule(contract.nid, items);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedule', contract?.nid] });
            toast("Payment schedule saved successfully!", "success");
            onClose();
        },
        onError: (err) => {
            toast("Failed to save schedule", "error");
        }
    });

    // Generate Logic
    const handleGenerate = () => {
        if (dpAmount > totalDebt) {
            toast("DP cannot exceed total debt", "error");
            return;
        }

        const items: Partial<PaymentScheduleItem>[] = [];
        let currentDate = new Date(startDate);

        // 1. Add DP
        if (dpAmount > 0) {
            items.push({
                ddue_date: startDate,
                namount: dpAmount,
                cdescription: "Down Payment (DP)",
                cstatus: 'UNPAID'
            });
            // Move to next month for next payment
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        // 2. Add Installments
        const principal = totalDebt - dpAmount;
        if (tenor > 0) {
            const monthly = Math.floor(principal / tenor);
            let remainder = principal - (monthly * tenor);

            for (let i = 1; i <= tenor; i++) {
                let amount = monthly;
                if (i === tenor) amount += remainder;

                items.push({
                    ddue_date: currentDate.toISOString().split('T')[0],
                    namount: amount,
                    cdescription: `Installment ${i}/${tenor}`,
                    cstatus: 'UNPAID'
                });
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        }

        setScheduleItems(items);
        toast("Schedule generated preview", "info");
    };

    // Item Change
    const handleItemChange = (index: number, field: keyof PaymentScheduleItem, value: any) => {
        const newItems = [...scheduleItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setScheduleItems(newItems);
    };

    const handleDeleteItem = (index: number) => {
        const newItems = scheduleItems.filter((_, i) => i !== index);
        setScheduleItems(newItems);
    };

    const handleAddItem = () => {
        // Auto-calculate remaining amount
        const currentTotal = scheduleItems.reduce((acc, curr) => acc + Number(curr.namount || 0), 0);
        const remaining = Math.max(0, totalDebt - currentTotal);

        // Auto-predict date (1 month after last item, or today)
        let nextDate = new Date();
        if (scheduleItems.length > 0) {
            const lastDate = new Date(scheduleItems[scheduleItems.length - 1].ddue_date!);
            if (!isNaN(lastDate.getTime())) {
                nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
            }
        }

        setScheduleItems([...scheduleItems, {
            ddue_date: nextDate.toISOString().split('T')[0],
            namount: remaining,
            cdescription: 'New Payment',
            cstatus: 'UNPAID'
        }]);
    };

    // Formatting
    const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const totalScheduled = scheduleItems.reduce((acc, curr) => acc + Number(curr.namount || 0), 0);
    const isTotalMatch = Math.abs(totalScheduled - totalDebt) < 1; // Strict match (was 1000)

    if (!mounted || !isOpen || !contract) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto border border-border-subtle">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/50">
                                <div>
                                    <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Payment Plan Generator
                                    </h2>
                                    <p className="text-xs text-text-muted mt-0.5">
                                        Contract: <span className="font-mono text-primary font-medium">{contract.ccontract_no}</span>
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-surface transition-colors">
                                    <X className="h-5 w-5 text-text-muted" />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                                {/* Left Panel: Generator Controls */}
                                <div className="w-full md:w-1/3 bg-bg-surface/30 border-b md:border-b-0 md:border-r border-border-subtle p-6 overflow-y-auto space-y-6 shrink-0">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Outstanding</label>
                                        <div className="text-xl font-bold text-text-main mt-1 font-mono">{formatRp(totalDebt)}</div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-text-main border-b border-border-subtle pb-2">Plan Settings</h3>

                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Down Payment (DP)</label>
                                            <input
                                                type="text"
                                                value={dpAmount === 0 ? '' : dpAmount.toLocaleString('id-ID')}
                                                onChange={e => {
                                                    const val = e.target.value.replace(/\D/g, ''); // Remove non-digits
                                                    setDpAmount(val ? Number(val) : 0);
                                                }}
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg bg-bg-app border border-border-subtle text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Tenor (Months)</label>
                                            <input
                                                type="number"
                                                value={tenor}
                                                onChange={e => setTenor(Number(e.target.value))}
                                                className="w-full px-3 py-2 rounded-lg bg-bg-app border border-border-subtle text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-text-muted mb-1.5">Start Date</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-bg-app border border-border-subtle text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>

                                        <button
                                            onClick={handleGenerate}
                                            className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                        >
                                            <Calculator className="h-4 w-4" />
                                            Generate Plan
                                        </button>
                                    </div>

                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed font-medium">
                                            Generating a new plan will replace the preview list. Click "Save Schedule" to apply changes permanently.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Panel: Schedule Preview */}
                                <div className="flex-1 flex flex-col bg-card overflow-hidden">
                                    <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-bg-app/50">
                                        <h3 className="text-sm font-semibold text-text-main">Schedule Preview</h3>
                                        <button onClick={handleAddItem} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                            <Plus className="h-3 w-3" /> Add Row
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-bg-surface text-xs text-text-muted border-b border-border-subtle sticky top-0 z-10 backdrop-blur-md">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">#</th>
                                                    <th className="px-4 py-3 font-medium">Due Date</th>
                                                    <th className="px-4 py-3 font-medium">Description</th>
                                                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                    <th className="px-4 py-3 font-medium w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-subtle">
                                                {scheduleItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="px-4 py-12 text-center text-text-muted text-xs">
                                                            No schedule yet. Use the generator or add rows manually.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    scheduleItems.map((item, idx) => (
                                                        <tr key={idx} className="group hover:bg-bg-surface/50 transition-colors">
                                                            <td className="px-4 py-3 text-text-muted w-10">{idx + 1}</td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="date"
                                                                    value={String(item.ddue_date).split('T')[0]}
                                                                    onChange={e => handleItemChange(idx, 'ddue_date', e.target.value)}
                                                                    className="bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary focus:outline-none w-32 text-text-main"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                <input
                                                                    type="text"
                                                                    value={item.cdescription || ''}
                                                                    onChange={e => handleItemChange(idx, 'cdescription', e.target.value)}
                                                                    className="bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary focus:outline-none w-full text-text-main"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-right">
                                                                <input
                                                                    type="text"
                                                                    value={item.namount ? Number(item.namount).toLocaleString('id-ID') : ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value.replace(/\D/g, '');
                                                                        handleItemChange(idx, 'namount', val ? Number(val) : 0);
                                                                    }}
                                                                    className="bg-transparent border-b border-transparent hover:border-border-subtle focus:border-primary focus:outline-none w-24 sm:w-28 text-right font-mono text-text-main"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 text-center">
                                                                <button onClick={() => handleDeleteItem(idx)} className="text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="p-4 border-t border-border-subtle bg-bg-surface flex flex-col sm:flex-row items-center sm:justify-between gap-4 block md:shrink-0 sticky bottom-0 z-20">
                                        <div className="flex flex-col w-full sm:w-auto">
                                            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Total Scheduled</div>
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-lg font-bold font-mono ${isTotalMatch ? "text-green-600 dark:text-green-400" : (totalScheduled > totalDebt ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}`}>
                                                    {formatRp(totalScheduled)}
                                                </span>
                                            </div>
                                            {!isTotalMatch && (
                                                <div className="text-xs font-medium mt-1">
                                                    {totalScheduled > totalDebt ? (
                                                        <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1">
                                                            Surplus: +{formatRp(totalScheduled - totalDebt)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                                                            Remaining: {formatRp(totalDebt - totalScheduled)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                                            <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-sm text-text-muted hover:text-text-main transition-colors border border-border-subtle rounded-lg sm:border-transparent sm:rounded-none">Cancel</button>
                                            <button
                                                onClick={() => saveSchedule(scheduleItems)}
                                                disabled={isSaving || scheduleItems.length === 0}
                                                className="flex-1 sm:flex-none justify-center px-6 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 shadow-sm transition-all active:scale-95"
                                            >
                                                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                Save Schedule
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
