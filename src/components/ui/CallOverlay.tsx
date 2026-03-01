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
    localAudioLevel?: number;
    remoteAudioLevel?: number;
    onMinimize?: () => void;
}

export default function CallOverlay({ call, onHangup, isHangingUp, isMuted, onToggleMute, localAudioLevel = 0, remoteAudioLevel = 0, onMinimize }: CallOverlayProps) {
    const [duration, setDuration] = useState(0);
    const [mounted, setMounted] = useState(false);

    const isConnected = call?.state && ['up', 'Up', 'Answered', 'Bridged'].includes(call.state);

    // Speaking thresholds — tweak if too sensitive
    const isRemoteSpeaking = remoteAudioLevel > 0.04;
    const isLocalSpeaking = !isMuted && localAudioLevel > 0.04;

    useEffect(() => {
        setMounted(true);
        if (isConnected && call?.startedAt) {
            // Calculate actual duration based on startedAt so it doesn't reset on unmount
            const startTime = new Date(call.startedAt).getTime();
            const timer = setInterval(() => {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
        setDuration(0);
    }, [isConnected, call?.startedAt]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getCallStateLabel = (state: string): string => {
        switch (state.toLowerCase()) {
            case 'initiated':
            case 'dialing':
                return 'Dialing...';
            case 'ringing':
                return 'Ringing...';
            case 'answered':
            case 'up':
            case 'bridged':
                return formatDuration(duration);
            case 'ended':
                return 'Call Ended';
            case 'busy':
                return 'Busy';
            case 'no_answer':
                return 'No Answer';
            case 'failed':
                return 'Failed';
            case 'canceled':
                return 'Canceled';
            default:
                return `${state}...`;
        }
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
                        <button
                            onClick={onMinimize}
                            title="Minimize Call Window"
                            className="p-2 rounded-full active:bg-white/10 hover:bg-white/5 transition-colors"
                        >
                            <span className="sr-only">Minimize</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-white/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                End-to-end Encrypted
                            </div>
                        </div>
                        <button className="p-2 rounded-full active:bg-white/10 opacity-0 cursor-default">
                            {/* Hidden spacer to keep middle title centered */}
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8 relative">

                        {/* Remote party avatar with speaking ring */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative flex items-center justify-center">
                                {/* Idle pulse when not yet connected */}
                                {!isConnected && (
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

                                {/* Speaking ring — remote party */}
                                {isConnected && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-full border-2 border-emerald-400"
                                        animate={isRemoteSpeaking
                                            ? { opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }
                                            : { opacity: 0, scale: 1 }
                                        }
                                        transition={{ duration: 0.4, repeat: isRemoteSpeaking ? Infinity : 0 }}
                                    />
                                )}

                                <div className="w-32 h-32 rounded-full bg-gradient-to-b from-slate-700 to-slate-800 flex items-center justify-center shadow-2xl relative z-10 border-4 border-[#0f1c2e]">
                                    <User className="w-12 h-12 text-white/50" />
                                </div>
                            </div>

                            {/* Speaking label */}
                            {isConnected && (
                                <div className="h-5 flex items-center justify-center">
                                    <AnimatePresence mode="wait">
                                        {isRemoteSpeaking ? (
                                            <motion.div
                                                key="remote-speaking"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400"
                                            >
                                                <AudioBars active />
                                                Customer is speaking
                                            </motion.div>
                                        ) : isLocalSpeaking ? (
                                            <motion.div
                                                key="local-speaking"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                className="flex items-center gap-1.5 text-xs font-medium text-sky-400"
                                            >
                                                <AudioBars active color="sky" />
                                                You are speaking
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">{call.destination}</h2>
                            <p className="text-lg text-white/60 font-medium">
                                {isConnected ? formatDuration(duration) : (
                                    <span className="animate-pulse">{getCallStateLabel(call.state)}</span>
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
                                speaking={isLocalSpeaking}
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

/** Animated audio bars (like Discord speaking indicator) */
function AudioBars({ active, color = "emerald" }: { active: boolean; color?: "emerald" | "sky" }) {
    const barColor = color === "sky" ? "bg-sky-400" : "bg-emerald-400";
    return (
        <span className="flex items-end gap-[2px] h-3">
            {[0.6, 1, 0.7].map((delay, i) => (
                <motion.span
                    key={i}
                    className={cn("w-[3px] rounded-full", barColor)}
                    animate={active
                        ? { height: ["4px", "12px", "4px"] }
                        : { height: "4px" }
                    }
                    transition={{ duration: 0.5, repeat: active ? Infinity : 0, delay: i * 0.15 * delay }}
                />
            ))}
        </span>
    );
}

function ControlButton({ icon: Icon, label, active = false, onClick, disabled = false, speaking = false }: {
    icon: React.ComponentType<any>;
    label?: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
    speaking?: boolean;
}) {
    return (
        <div className="relative flex flex-col items-center gap-2">
            {/* Speaking ring on mic button */}
            {speaking && (
                <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-sky-400"
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.08, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                />
            )}
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
        </div>
    );
}
