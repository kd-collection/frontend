"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, PlusCircle } from "lucide-react";
import { Contract } from "@/lib/api";
import { useCreateContract, useUpdateContract } from "@/hooks/useContracts";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";

interface ContractFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract?: Contract | null; // If provided, we're in edit mode
}

interface FormData {
    ccontract_no: string;
    ncustomer_id: number;
    nloan_amount: number;
    noutstanding: number;
    ntenor: number;
    chandler: string;
    darea_date: string;
    ddisbursement: string;
}

const initialFormData: FormData = {
    ccontract_no: "",
    ncustomer_id: 0,
    nloan_amount: 0,
    noutstanding: 0,
    ntenor: 12,
    chandler: "",
    darea_date: "",
    ddisbursement: "",
};

export default function ContractFormModal({ isOpen, onClose, contract }: ContractFormModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [mounted, setMounted] = useState(false);
    const { toast } = useToast();

    // Fetch Customers for Dropdown
    const { data: customersData } = useCustomers({ limit: 100, sortBy: 'cname', sortOrder: 'ASC' });

    const { mutate: createContract, isPending: isCreating } = useCreateContract();
    const { mutate: updateContract, isPending: isUpdating } = useUpdateContract();

    const isEditMode = !!contract;
    const isPending = isCreating || isUpdating;

    // Prevent background scroll when modal is open
    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Populate form when editing
    useEffect(() => {
        if (contract) {
            setFormData({
                ccontract_no: contract.ccontract_no || "",
                ncustomer_id: Number(contract.ccust_id) || 0,
                nloan_amount: Number(contract.nloan_amount) || 0,
                noutstanding: Number(contract.noutstanding) || 0,
                ntenor: Number(contract.ntenor) || 12,
                chandler: contract.chandler || "",
                darea_date: contract.darea_date?.split('T')[0] || "",
                ddisbursement: contract.ddisbursement?.split('T')[0] || "",
            });
        } else {
            setFormData(initialFormData);
        }
    }, [contract, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.ccontract_no.trim()) {
            toast("Contract No is required", "error");
            return;
        }

        // Sanitize data: convert empty strings to undefined for optional fields
        const sanitizedData = {
            ...formData,
            ncustomer_id: formData.ncustomer_id || undefined,
            darea_date: formData.darea_date || undefined,
            ddisbursement: formData.ddisbursement || undefined,
            chandler: formData.chandler || undefined,
        };

        if (isEditMode && contract) {
            updateContract(
                { id: contract.nid, data: sanitizedData },
                {
                    onSuccess: () => {
                        toast("Contract updated successfully!", "success");
                        onClose();
                    },
                    onError: (error) => {
                        toast(error.message || "Failed to update contract", "error");
                    }
                }
            );
        } else {
            createContract(sanitizedData, {
                onSuccess: () => {
                    toast("Contract created successfully!", "success");
                    onClose();
                },
                onError: (error) => {
                    toast(error.message || "Failed to create contract", "error");
                }
            });
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div
                            className="bg-card border border-border-subtle rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/50">
                                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                                    {isEditMode ? (
                                        <>
                                            <Save className="h-5 w-5 text-primary" />
                                            Edit Contract
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="h-5 w-5 text-green-500" />
                                            New Contract
                                        </>
                                    )}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-bg-surface transition-colors"
                                >
                                    <X className="h-5 w-5 text-text-muted" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Contract No */}
                                <div>
                                    <label className={`block text-sm font-medium mb-1.5 ${isEditMode ? 'text-red-500' : 'text-text-muted'}`}>
                                        Contract No <span className="text-red-500">*</span>
                                    </label>
                                    {isEditMode && (
                                        <p className="text-xs text-red-400 mb-2">Contract No tidak dapat diubah</p>
                                    )}
                                    <input
                                        type="text"
                                        name="ccontract_no"
                                        value={formData.ccontract_no}
                                        onChange={handleChange}
                                        placeholder="e.g. CTR-2026-001"
                                        className={`w-full px-4 py-2.5 rounded-lg border text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${isEditMode ? 'bg-bg-surface/50 border-red-500/30 cursor-not-allowed opacity-70' : 'bg-bg-surface border-border-subtle'}`}
                                        disabled={isEditMode}
                                    />
                                </div>

                                {/* Customer Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-text-muted mb-1.5">
                                        Customer <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="ncustomer_id"
                                        value={formData.ncustomer_id || ""}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setFormData(prev => ({ ...prev, ncustomer_id: val }));
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                                    >
                                        <option value="0">Select Customer</option>
                                        {customersData?.data?.map((customer) => (
                                            <option key={customer.nid} value={customer.nid}>
                                                {customer.cname} - {customer.cnik}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-text-muted mt-1">
                                        Showing top 100 customers.
                                    </p>
                                </div>

                                {/* Loan Amount & Outstanding */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Loan Amount
                                        </label>
                                        <input
                                            type="number"
                                            name="nloan_amount"
                                            value={formData.nloan_amount || ""}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Outstanding
                                        </label>
                                        <input
                                            type="number"
                                            name="noutstanding"
                                            value={formData.noutstanding || ""}
                                            onChange={handleChange}
                                            placeholder="0"
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Tenor & Handler */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Tenor (months)
                                        </label>
                                        <input
                                            type="number"
                                            name="ntenor"
                                            value={formData.ntenor || ""}
                                            onChange={handleChange}
                                            placeholder="12"
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Handler
                                        </label>
                                        <input
                                            type="text"
                                            name="chandler"
                                            value={formData.chandler}
                                            onChange={handleChange}
                                            placeholder="e.g. Agent X"
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Due Date & Disbursement Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Due Date
                                        </label>
                                        <input
                                            type="date"
                                            name="darea_date"
                                            value={formData.darea_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-muted mb-1.5">
                                            Disbursement Date
                                        </label>
                                        <input
                                            type="date"
                                            name="ddisbursement"
                                            value={formData.ddisbursement}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-lg bg-bg-surface border border-border-subtle text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-border-subtle text-text-muted font-medium hover:bg-bg-surface transition-all"
                                        disabled={isPending}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isPending}
                                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {isEditMode ? "Saving..." : "Creating..."}
                                            </>
                                        ) : (
                                            <>
                                                {isEditMode ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                                                {isEditMode ? "Save Changes" : "Create Contract"}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
        , document.body);
}
