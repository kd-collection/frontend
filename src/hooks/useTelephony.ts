import { useMutation, useQuery } from "@tanstack/react-query";
import { api, CallSession } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState, useRef, useCallback } from "react";
import { sipClient } from "@/lib/sip";
import { SessionState } from "sip.js";

export type SipState = "disconnected" | "connecting" | "connected" | "registered" | "failed";

export function useTelephony() {
    const { toast } = useToast();
    const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [sipState, setSipState] = useState<SipState>("disconnected");
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const callStartedRef = useRef(false);

    // Create and append audio element to DOM once
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioRef.current = audio;

        setSipState("connecting");

        sipClient.onStatusChange = (status) => {
            if (status === 'connected') {
                setSipState("connected");
            } else if (status === 'disconnected') {
                setSipState("disconnected");
            } else if (status === 'Registered') {
                setSipState("registered");
            } else if (status === 'Unregistered') {
                setSipState("failed");
            }
        };

        sipClient.onCallStateChange = (state) => {
            if (state === SessionState.Terminated) {
                // Only show "Call ended" if call was actually established
                if (callStartedRef.current) {
                    toast("Call ended", "info");
                } else {
                    toast("Call failed — SIP registration error", "error");
                }
                setCurrentCall(null);
                setIsMuted(false);
                callStartedRef.current = false;
            } else if (state === SessionState.Established) {
                callStartedRef.current = true;
                setCurrentCall(prev => prev ? { ...prev, state: 'up' } : null);
            }
        };

        // Auto-connect
        sipClient.connect().catch(() => {
            setSipState("failed");
        });

        return () => {
            if (audio.parentNode) {
                audio.srcObject = null;
                audio.parentNode.removeChild(audio);
            }
        };
    }, []);

    const { data: status } = useQuery({
        queryKey: ["telephony", "status"],
        queryFn: async () => {
            const response = await api.getTelephonyStatus();
            return response.success ? response.data : null;
        },
        refetchInterval: 30000
    });

    const callMutation = useMutation({
        mutationFn: async ({ destination, callerId }: { destination: string; callerId?: string }) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                return { success: true, data: { id: 'mock', destination, callerId: 'mock', state: 'ringing' } as CallSession };
            }

            if (sipState !== 'registered') {
                throw new Error("SIP not registered — check extension credentials");
            }

            if (!audioRef.current) throw new Error("Audio system not ready");
            await sipClient.call(destination, audioRef.current);

            callStartedRef.current = false;
            const session: CallSession = {
                id: `sip-${Date.now()}`,
                destination,
                callerId: callerId || "me",
                state: 'dialing',
                startedAt: new Date().toISOString()
            };
            return { success: true, data: session };
        },
        onSuccess: (data) => {
            if (data.success && data.data) {
                setCurrentCall(data.data);
                toast("Calling " + data.data.destination + "...", "info");
            }
        },
        onError: (err) => {
            toast(err.message || "Failed to call", "error");
        }
    });

    const hangupMutation = useMutation({
        mutationFn: async (channelId: string) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { success: true };
            await sipClient.hangup();
            return { success: true };
        },
        onSuccess: () => {
            setCurrentCall(null);
            setIsMuted(false);
        },
        onError: () => {
            // Hangup error ignored - call may already be terminated
        }
    });

    const toggleMute = useCallback(() => {
        const newMuted = !isMuted;
        sipClient.setMute(newMuted);
        setIsMuted(newMuted);
    }, [isMuted]);

    return {
        status,
        sipState,
        currentCall,
        initiateCall: callMutation.mutate,
        isCalling: callMutation.isPending,
        hangupCall: hangupMutation.mutate,
        isHangingUp: hangupMutation.isPending,
        isMuted,
        toggleMute
    };
}
