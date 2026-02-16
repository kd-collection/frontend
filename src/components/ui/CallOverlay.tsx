"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Volume2, User, MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";
import { CallSession } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CallOverlayProps {
    call: CallSession | null;
    onHangup: (channelId: string) => void;
    isHangingUp: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
}

export default function CallOverlay({ call, onHangup, isHangingUp, isMuted, onToggleMute }: CallOverlayProps) {
    const [duration, setDuration] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (call?.state === 'up') {
            const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
            return () => clearInterval(timer);
        }
        setDuration(0);
    }, [call?.state]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {call && (
                <motion.div
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-0 z-[60] bg-[#0f1c2e] text-white flex flex-col items-center justify-between py-12 px-6 safe-area-inset-top safe-area-inset-bottom"
                >
                    {/* Header */}
                    <div className="w-full flex justify-between items-start opacity-80">
                        <button className="p-2 rounded-full active:bg-white/10 transition-colors">
                            <span className="sr-only">Minimize</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-white/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                End-to-end Encrypted
                            </div>
                        </div>
                        <button className="p-2 rounded-full active:bg-white/10 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8 relative">

                        {/* Avatar Pulse */}
                        <div className="relative">
                            {call.state !== 'up' && (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 1.8, 1], opacity: [0.15, 0, 0.15] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        className="absolute inset-0 bg-white/10 rounded-full"
                                    />
                                </>
                            )}
                            <div className="w-32 h-32 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center shadow-2xl relative z-10 border-4 border-[#0f1c2e]">
                                <User className="w-12 h-12 text-white/50" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">{call.destination}</h2>
                            <p className="text-lg text-white/60 font-medium">
                                {call.state === 'up' ? formatDuration(duration) : (
                                    <span className="animate-pulse capitalize">{call.state}...</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="w-full max-w-sm bg-[#1c2a3e] rounded-3xl p-6 shadow-xl border border-white/5">
                        <div className="flex justify-center gap-8 mb-8">
                            <ControlButton
                                icon={isMuted ? MicOff : Mic}
                                label={isMuted ? "Unmute" : "Mute"}
                                active={isMuted}
                                onClick={onToggleMute}
                            />
                            <ControlButton
                                icon={Volume2}
                                label="Speaker"
                                disabled
                            />
                        </div>

                        <div className="flex justify-center items-center">
                            <button
                                onClick={() => onHangup(call.id)}
                                disabled={isHangingUp}
                                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 transition-all shadow-[0_4px_24px_rgba(239,68,68,0.4)] flex items-center justify-center"
                            >
                                <PhoneOff className="w-7 h-7 fill-current" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function ControlButton({ icon: Icon, label, active = false, onClick, disabled = false }: {
    icon: React.ComponentType<any>;
    label?: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex flex-col items-center justify-center gap-2 w-16 h-16 rounded-2xl transition-all",
                active ? "bg-white text-black" : "bg-white/5 text-white hover:bg-white/10",
                disabled && "opacity-30 cursor-not-allowed"
            )}
        >
            <Icon className="w-5 h-5" />
            {label && <span className="text-[10px] font-medium">{label}</span>}
        </button>
    );
}
