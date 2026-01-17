"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin, Building, AlertCircle, Calendar, CreditCard, Wallet, Clock } from "lucide-react";
import { formatIDR, formatDate } from "@/lib/utils";
import { Contract } from "@/lib/api";
import Badge from "@/components/ui/Badge";

interface Props {
    contract: Contract | null;
    isOpen: boolean;
    onClose: () => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
    return (
        <div className="flex items-start gap-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-bg-app flex items-center justify-center flex-shrink-0">
                <Icon className="h-4 w-4 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-text-muted uppercase tracking-wide font-medium">{label}</p>
                <p className="text-sm text-text-main font-medium mt-0.5 break-words">{value || "-"}</p>
            </div>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="pt-4">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">{title}</h3>
            <div className="space-y-1 bg-bg-app/50 rounded-lg p-3 border border-border-subtle">
                {children}
            </div>
        </div>
    );
}

export default function ContractDetailSheet({ contract, isOpen, onClose }: Props) {
    // Lock body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!contract) return null;

    const isOverdue = Number(contract.narrears) > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 h-full w-full max-w-lg bg-card border-l border-border-subtle shadow-2xl z-50 flex flex-col"
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
                                <Badge variant={isOverdue ? "danger" : "success"} glow={isOverdue}>
                                    {isOverdue ? "Overdue" : "On Track"}
                                </Badge>
                            </div>

                            {/* Customer Info */}
                            <Section title="Customer Information">
                                <InfoRow icon={User} label="Name" value={contract.customer_name || contract.cname} />
                                <InfoRow icon={CreditCard} label="NIK" value={contract.customer_nik} />
                                <InfoRow icon={Phone} label="Phone" value={contract.customer_phone} />
                                <InfoRow icon={Mail} label="Email" value={contract.customer_email} />
                            </Section>

                            {/* Address */}
                            <Section title="Addresses">
                                <InfoRow icon={MapPin} label="Home Address" value={contract.caddress_home} />
                                <InfoRow icon={MapPin} label="KTP Address" value={contract.caddress_ktp} />
                            </Section>

                            {/* Work Info */}
                            {contract.coffice_name && (
                                <Section title="Employment">
                                    <InfoRow icon={Building} label="Company" value={contract.coffice_name} />
                                    <InfoRow icon={MapPin} label="Office Address" value={contract.coffice_address} />
                                </Section>
                            )}

                            {/* Emergency Contact */}
                            {contract.cec_name && (
                                <Section title="Emergency Contact">
                                    <InfoRow icon={AlertCircle} label="Name" value={contract.cec_name} />
                                    <InfoRow icon={Phone} label="Phone" value={contract.cec_phone} />
                                    <InfoRow icon={MapPin} label="Address" value={contract.cec_address} />
                                </Section>
                            )}

                            {/* Loan Details */}
                            <Section title="Loan Details">
                                <InfoRow icon={Wallet} label="Loan Amount" value={formatIDR(Number(contract.nloan_amount) || 0)} />
                                <InfoRow icon={Clock} label="Tenor" value={contract.ntenor ? `${contract.ntenor} bulan` : "-"} />
                                <InfoRow icon={CreditCard} label="Arrears" value={formatIDR(Number(contract.narrears) || 0)} />
                                <InfoRow icon={CreditCard} label="Card Count" value={contract.ncard_count} />
                                <InfoRow icon={Wallet} label="VA Account" value={contract.cva_account} />
                            </Section>

                            {/* Dates */}
                            <Section title="Important Dates">
                                <InfoRow icon={Calendar} label="Disbursement Date" value={formatDate(contract.ddisbursement)} />
                                <InfoRow icon={Calendar} label="Last Payment" value={formatDate(contract.dlast_payment)} />
                                <InfoRow icon={Calendar} label="Area Date" value={formatDate(contract.darea_date)} />
                            </Section>

                            {/* Handler */}
                            <Section title="Assignment">
                                <InfoRow icon={User} label="Handler" value={contract.chandler} />
                                <InfoRow icon={MapPin} label="Area" value={contract.carea} />
                                <InfoRow icon={CreditCard} label="Customer ID" value={contract.ccust_id} />
                            </Section>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-border-subtle flex gap-3 flex-shrink-0 bg-card z-10">
                            <button className="flex-1 px-4 py-2 rounded-lg bg-bg-app border border-border-subtle text-text-main text-sm font-medium hover:bg-bg-card-hover transition-colors">
                                Edit Contract
                            </button>
                            <button className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20">
                                Record Payment
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

