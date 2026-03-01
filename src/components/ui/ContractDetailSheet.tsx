"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, MapPin, Building, AlertCircle, Calendar, CreditCard, Wallet, Clock } from "lucide-react";
import { formatIDR, formatDate, formatPhoneNumber } from "@/lib/utils";
import { Contract } from "@/lib/api";
import Badge from "@/components/ui/Badge";
import { DataList, DataListItem } from "@/components/ui/DataList";
import { useTelephony } from "@/hooks/useTelephony";
import CallOverlay from "@/components/ui/CallOverlay";

interface Props {
    contract: Contract | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (contract: Contract) => void;
}

export default function ContractDetailSheet({ contract, isOpen, onClose, onEdit }: Props) {
    const [mounted, setMounted] = useState(false);
    const [showCallConfirm, setShowCallConfirm] = useState(false);
    const { initiateCall, hangupCall, isCalling, isHangingUp, currentCall, sipState, isMuted, toggleMute, unlockAudio, localAudioLevel, remoteAudioLevel } = useTelephony();

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
                                <h2 className="text-lg font-bold text-text-main">{contract.contractNo || contract.ccontract_no}</h2>
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

                            {/* SIP Connection Status */}
                            {sipState === 'registered' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-xs font-medium text-emerald-500">Ready to Call</p>
                                </div>
                            ) : sipState === 'failed' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                    <p className="text-xs font-medium text-red-400">SIP Registration Failed — Check extension credentials</p>
                                </div>
                            ) : sipState === 'reconnecting' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                                    <p className="text-xs font-medium text-orange-400">SIP Reconnecting...</p>
                                </div>
                            ) : sipState === 'connecting' || sipState === 'connected' ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                    <p className="text-xs font-medium text-yellow-500">Connecting to SIP server...</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-lg">
                                    <div className="h-2 w-2 rounded-full bg-gray-500" />
                                    <p className="text-xs font-medium text-gray-400">SIP Disconnected</p>
                                </div>
                            )}

                            {/* Active Call UI handled by CallOverlay */}

                            {/* Customer Info */}
                            <DataList title="Customer Information">
                                <DataListItem icon={User} label="Name" value={contract.customerName || contract.customer_name || contract.cname} />
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
                        <div className="px-6 py-4 border-t border-border-subtle flex flex-col gap-3 flex-shrink-0 bg-card z-10">
                            {/* Call Action */}
                            {currentCall ? (
                                /* Active call mini-bar */
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full py-3 px-4 rounded-xl bg-emerald-600/10 border border-emerald-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-emerald-400 capitalize flex items-center gap-2">
                                                {currentCall.state === 'up' ? 'Voice Call Connected' : `${currentCall.state}...`}
                                            </span>
                                            <span className="text-xs text-emerald-500/70 font-medium">Remote: {currentCall.destination}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => hangupCall(currentCall.id)}
                                        disabled={isHangingUp}
                                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                        {isHangingUp ? 'Ending...' : 'END CALL'}
                                    </button>
                                </motion.div>
                            ) : showCallConfirm ? (
                                <AnimatePresence>
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-inner flex flex-col gap-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-500 mt-0.5">
                                                <Phone className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-200">Start Voice Call?</h4>
                                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                                    This will securely connect your microphone via WebRTC to Asterisk and call <strong className="text-slate-300">{contract?.customer_phone}</strong>.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => setShowCallConfirm(false)}
                                                className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Unlock audio + AudioContext FIRST (synchronous, in user gesture context)
                                                    // This is the only safe window to enable autoplay for both
                                                    // the remote audio element AND the sounds AudioContext
                                                    unlockAudio();
                                                    initiateCall({
                                                        destination: contract?.customer_phone || "",
                                                        agentId: "101",
                                                    });
                                                    setShowCallConfirm(false);
                                                }}
                                                disabled={isCalling || sipState !== 'registered'}
                                                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Call Now
                                            </button>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            ) : contract?.customer_phone ? (
                                <button
                                    onClick={() => setShowCallConfirm(true)}
                                    disabled={isCalling || sipState !== 'registered'}
                                    className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${sipState === 'registered'
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 active:scale-[0.98]'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 shadow-none'
                                        }`}
                                >
                                    {sipState === 'registered' && (
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                                    )}

                                    {isCalling ? (
                                        <>
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Dialing...
                                        </>
                                    ) : sipState !== 'registered' ? (
                                        <>
                                            <Phone className="h-5 w-5" />
                                            {sipState === 'failed' ? 'SIP Auth Failed' : sipState === 'reconnecting' ? 'SIP Reconnecting...' : sipState === 'disconnected' ? 'SIP Offline' : 'Connecting SIP...'}
                                        </>
                                    ) : (
                                        <>
                                            <div className="rounded-full bg-white/20 p-1 group-hover:bg-white/30 transition-colors">
                                                <Phone className="h-4 w-4 text-white" />
                                            </div>
                                            Call Customer ({contract.customer_phone})
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full py-3.5 rounded-xl bg-slate-800/50 text-slate-500 font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-700/50">
                                    <AlertCircle className="h-5 w-5" />
                                    No Phone Number Available
                                </div>
                            )}

                            <div className="flex gap-3">
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
                        </div>
                    </motion.div>

                    {/* Full Screen Call Overlay */}
                    <CallOverlay
                        call={currentCall}
                        onHangup={hangupCall}
                        isHangingUp={isHangingUp}
                        isMuted={isMuted}
                        onToggleMute={toggleMute}
                        localAudioLevel={localAudioLevel}
                        remoteAudioLevel={remoteAudioLevel}
                    />
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

