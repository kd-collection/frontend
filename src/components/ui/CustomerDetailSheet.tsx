"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin, Building, AlertCircle, CreditCard } from "lucide-react";
import { Customer } from "@/lib/api";
import { formatPhoneNumber } from "@/lib/utils";
import { DataList, DataListItem } from "@/components/ui/DataList";

interface Props {
    customer: Customer | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomerDetailSheet({ customer, isOpen, onClose }: Props) {
    const [mounted, setMounted] = useState(false);

    // Lock body scroll when sheet is open
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

    if (!mounted || !customer) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 outline-none"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 h-screen w-full max-w-lg bg-card border-l border-border-subtle shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle flex-shrink-0">
                            <div>
                                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Customer Profile</p>
                                <h2 className="text-lg font-bold text-text-main">{customer.cname}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-bg-card-hover text-text-muted hover:text-text-main transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 overscroll-contain">

                            {/* Personal Info */}
                            <DataList title="Personal Information">
                                <DataListItem icon={User} label="Full Name" value={customer.cname} />
                                <DataListItem icon={CreditCard} label="NIK" value={customer.cnik} />
                                <DataListItem icon={Phone} label="Phone" value={formatPhoneNumber(customer.cphone)} />
                                {customer.cphone2 && (
                                    <DataListItem icon={Phone} label="Alternative Phone" value={formatPhoneNumber(customer.cphone2)} />
                                )}
                                <DataListItem icon={Mail} label="Email" value={customer.cemail} />
                            </DataList>

                            {/* Addresses */}
                            <DataList title="Addresses">
                                <DataListItem icon={MapPin} label="Home Address" value={customer.caddress_home} />
                                <DataListItem icon={MapPin} label="KTP Address" value={customer.caddress_ktp} />
                            </DataList>

                            {/* Work Info */}
                            {(customer.coffice_name || customer.coffice_address) && (
                                <DataList title="Employment">
                                    <DataListItem icon={Building} label="Company Name" value={customer.coffice_name} />
                                    <DataListItem icon={MapPin} label="Office Address" value={customer.coffice_address} />
                                </DataList>
                            )}

                            {/* Emergency Contact */}
                            {(customer.cec_name || customer.cec_phone) && (
                                <DataList title="Emergency Contact">
                                    <DataListItem icon={AlertCircle} label="Contact Name" value={customer.cec_name} />
                                    <DataListItem icon={Phone} label="Contact Phone" value={customer.cec_phone} />
                                    <DataListItem icon={MapPin} label="Contact Address" value={customer.cec_address} />
                                </DataList>
                            )}

                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-border-subtle flex gap-3 flex-shrink-0 bg-card z-10">
                            <button
                                className="flex-1 px-4 py-2 rounded-lg bg-bg-app border border-border-subtle text-text-main text-sm font-medium hover:bg-bg-card-hover transition-colors">
                                Edit Profile
                            </button>
                            <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                                View Contracts
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
