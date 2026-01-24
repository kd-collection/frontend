"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin, Building, AlertCircle, Calendar, CreditCard, Wallet, Clock } from "lucide-react";
import { formatIDR, formatDate, formatPhoneNumber } from "@/lib/utils";
import { Contract } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { DataList, DataListItem } from "@/components/ui/DataList";

interface Props {
    contract: Contract | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (contract: Contract) => void;
}

export default function ContractDetailSheet({ contract, isOpen, onClose, onEdit }: Props) {
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

    if (!mounted || !contract) return null;

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
                                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Contract</p>
                                <h2 className="text-lg font-bold text-text-main">{contract.ccontract_no}</h2>
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
                            {/* Status Bar */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                                <div>
                                    <p className="text-xs text-text-muted">Outstanding Balance</p>
                                    <p className="text-2xl font-bold text-text-main">{formatIDR(Number(contract.noutstanding))}</p>
                                </div>
                                <Badge variant={Number(contract.narrears) > 0 ? "danger" : "success"} glow={Number(contract.narrears) > 0}>
                                    {Number(contract.narrears) > 0 ? "Overdue" : "On Track"}
                                </Badge>
                            </div>

                            {/* Customer Info */}
                            <DataList title="Customer Information">
                                <DataListItem icon={User} label="Name" value={contract.customer_name || contract.cname} />
                                <DataListItem icon={CreditCard} label="NIK" value={contract.customer_nik} />
                                <DataListItem icon={Phone} label="Phone" value={formatPhoneNumber(contract.customer_phone || contract.customer_phone2)} />
                                {contract.customer_phone && contract.customer_phone2 && (
                                    <DataListItem icon={Phone} label="Phone 2" value={formatPhoneNumber(contract.customer_phone2)} />
                                )}
                                <DataListItem icon={Mail} label="Email" value={contract.customer_email} />
                            </DataList>

                            {/* Address */}
                            <DataList title="Addresses">
                                <DataListItem icon={MapPin} label="Home Address" value={contract.caddress_home} />
                                <DataListItem icon={MapPin} label="KTP Address" value={contract.caddress_ktp} />
                            </DataList>

                            {/* Work Info */}
                            {contract.coffice_name && (
                                <DataList title="Employment">
                                    <DataListItem icon={Building} label="Company" value={contract.coffice_name} />
                                    <DataListItem icon={MapPin} label="Office Address" value={contract.coffice_address} />
                                </DataList>
                            )}

                            {/* Emergency Contact */}
                            {contract.cec_name && (
                                <DataList title="Emergency Contact">
                                    <DataListItem icon={AlertCircle} label="Name" value={contract.cec_name} />
                                    <DataListItem icon={Phone} label="Phone" value={formatPhoneNumber(contract.cec_phone)} />
                                    <DataListItem icon={MapPin} label="Address" value={contract.cec_address} />
                                </DataList>
                            )}

                            {/* Loan Details */}
                            <DataList title="Loan Details">
                                <DataListItem icon={Wallet} label="Loan Amount" value={formatIDR(Number(contract.nloan_amount) || 0)} />
                                <DataListItem icon={Clock} label="Tenor" value={contract.ntenor ? `${contract.ntenor} bulan` : "-"} />
                                <DataListItem icon={CreditCard} label="Arrears" value={formatIDR(Number(contract.narrears) || 0)} />
                                <DataListItem icon={CreditCard} label="Card Count" value={contract.ncard_count} />
                                <DataListItem icon={Wallet} label="VA Account" value={contract.cva_account} />
                            </DataList>

                            {/* Dates */}
                            <DataList title="Important Dates">
                                <DataListItem icon={Calendar} label="Disbursement Date" value={formatDate(contract.ddisbursement)} />
                                <DataListItem icon={Calendar} label="Last Payment" value={formatDate(contract.dlast_payment)} />
                                <DataListItem icon={Calendar} label="Area Date" value={formatDate(contract.darea_date)} />
                            </DataList>

                            {/* Handler */}
                            <DataList title="Assignment">
                                <DataListItem icon={User} label="Handler" value={contract.chandler} />
                                <DataListItem icon={MapPin} label="Area" value={contract.carea} />
                                <DataListItem icon={CreditCard} label="Customer ID" value={contract.ccust_id} />
                            </DataList>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-border-subtle flex gap-3 flex-shrink-0 bg-card z-10">
                            <button
                                onClick={() => {
                                    onEdit(contract);
                                    onClose();
                                }}
                                className="flex-1 px-4 py-2 rounded-lg bg-bg-app border border-border-subtle text-text-main text-sm font-medium hover:bg-bg-card-hover transition-colors">
                                Edit Contract
                            </button>
                            <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                                Record Payment
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

