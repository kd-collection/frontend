"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, PlusCircle } from "lucide-react";
import { Customer } from "@/lib/api";
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";

interface CustomerFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer?: Customer | null;
}

interface FormData {
    cnik: string;
    cname: string;
    cphone: string;
    cemail: string;
    caddress_home: string;
    caddress_ktp: string;
    coffice_name: string;
    coffice_address: string;
    cec_name: string;
    cec_phone: string;
    cec_address: string;
}

const initialFormData: FormData = {
    cnik: "",
    cname: "",
    cphone: "",
    cemail: "",
    caddress_home: "",
    caddress_ktp: "",
    coffice_name: "",
    coffice_address: "",
    cec_name: "",
    cec_phone: "",
    cec_address: "",
};

export default function CustomerFormModal({ isOpen, onClose, customer }: CustomerFormModalProps) {
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [mounted, setMounted] = useState(false);
    const { toast } = useToast();

    // Real API Hooks
    const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
    const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

    const isEditMode = !!customer;
    const isPending = isCreating || isUpdating;

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    useEffect(() => {
        if (customer) {
            setFormData({
                cnik: customer.cnik || "",
                cname: customer.cname || "",
                cphone: customer.cphone || "",
                cemail: customer.cemail || "",
                caddress_home: customer.caddress_home || "",
                caddress_ktp: customer.caddress_ktp || "",
                coffice_name: customer.coffice_name || "",
                coffice_address: customer.coffice_address || "",
                cec_name: customer.cec_name || "",
                cec_phone: customer.cec_phone || "",
                cec_address: customer.cec_address || "",
            });
        } else {
            setFormData(initialFormData);
        }
    }, [customer, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.cname.trim() || !formData.cnik.trim()) {
            toast("Name and NIK are required", "error");
            return;
        }

        // Clean payload
        const payload = { ...formData };

        if (isEditMode && customer) {
            updateCustomer({ id: customer.nid, data: payload }, {
                onSuccess: () => {
                    toast("Customer updated successfully", "success");
                    onClose();
                },
                onError: (err) => {
                    toast(err.message || "Failed to update", "error");
                }
            });
        } else {
            createCustomer(payload, {
                onSuccess: () => {
                    toast("Customer created successfully", "success");
                    onClose();
                },
                onError: (err) => {
                    toast(err.message || "Failed to create", "error");
                }
            });
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-card border border-border-subtle rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/50">
                                <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                                    {isEditMode ? <><Save className="h-5 w-5 text-primary" /> Edit Customer</> : <><PlusCircle className="h-5 w-5 text-green-500" /> New Customer</>}
                                </h2>
                                <button onClick={onClose} className="p-2 rounded-lg hover:bg-bg-surface transition-colors">
                                    <X className="h-5 w-5 text-text-muted" />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Identity Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Identity</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">NIK <span className="text-red-500">*</span></label>
                                                <input type="text" name="cnik" value={formData.cnik} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" placeholder="16 digit NIK" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Full Name <span className="text-red-500">*</span></label>
                                                <input type="text" name="cname" value={formData.cname} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Complete Name" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Phone</label>
                                                <input type="text" name="cphone" value={formData.cphone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" placeholder="08..." />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Email</label>
                                                <input type="email" name="cemail" value={formData.cemail} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" placeholder="email@example.com" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Address Info</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Home Address</label>
                                                <textarea name="caddress_home" value={formData.caddress_home} onChange={handleChange} rows={2} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none resize-none" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">KTP Address</label>
                                                <textarea name="caddress_ktp" value={formData.caddress_ktp} onChange={handleChange} rows={2} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none resize-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Work Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Employment</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Company Name</label>
                                                <input type="text" name="coffice_name" value={formData.coffice_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Office Address</label>
                                                <input type="text" name="coffice_address" value={formData.coffice_address} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Emergency Contact</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Contact Name</label>
                                                <input type="text" name="cec_name" value={formData.cec_name} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Phone</label>
                                                <input type="text" name="cec_phone" value={formData.cec_phone} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-sm font-medium text-text-muted mb-1 block">Address</label>
                                                <input type="text" name="cec_address" value={formData.cec_address} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle focus:ring-2 focus:ring-primary/50 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-border-subtle bg-bg-surface/50">
                                <div className="flex gap-3">
                                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-border-subtle text-text-muted font-medium hover:bg-bg-surface transition-all">Cancel</button>
                                    <button form="customer-form" type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                        {isEditMode ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                                        {isEditMode ? "Save Changes" : "Create Customer"}
                                    </button>
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
