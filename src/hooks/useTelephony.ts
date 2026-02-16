import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, CallSession } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState, useRef } from "react";
import { sipClient } from "@/lib/sip";
import { SessionState } from "sip.js";

export function useTelephony() {
    const { toast } = useToast();
    const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    // Initialize SIP on mount
    useEffect(() => {
        // Create a hidden audio element for remote stream
        const audio = new Audio();
        audio.autoplay = true;
        setAudioElement(audio);

        sipClient.onStatusChange = (status) => {
            console.log("SIP Status:", status);
        };

        sipClient.onCallStateChange = (state) => {
            if (state === SessionState.Terminated) {
                setCurrentCall(null);
                toast("Call ended", "info");
            } else if (state === SessionState.Established) {
                setCurrentCall(prev => prev ? { ...prev, state: 'up' } : null);
            }
        };

        // Auto-connect
        sipClient.connect().catch(console.error);

        return () => {
            // cleanup if needed
        };
    }, []);

    const { data: status } = useQuery({
        queryKey: ["telephony", "status"],
        queryFn: async () => {
            // Still check API for backend health
            const response = await api.getTelephonyStatus();
            return response.success ? response.data : null;
        },
        refetchInterval: 30000
    });

    const callMutation = useMutation({
        mutationFn: async ({ destination, callerId }: { destination: string; callerId?: string }) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                // Demo logic ...
                return { success: true, data: { id: 'mock', destination, callerId: 'mock', state: 'ringing' } as CallSession };
            }

            // Real WebRTC Call
            try {
                if (!audioElement) throw new Error("Audio system not ready");
                await sipClient.call(destination, audioElement);

                // Construct a session object to satisfy UI
                const session: CallSession = {
                    id: `sip-${Date.now()}`,
                    destination,
                    callerId: callerId || "me",
                    state: 'dialing',
                    startedAt: new Date().toISOString()
                };
                return { success: true, data: session };
            } catch (err: any) {
                throw new Error(err.message || "SIP Call Failed");
            }
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

            try {
                await sipClient.hangup();
                return { success: true };
            } catch (err: any) {
                throw new Error(err.message || "SIP Hangup Failed");
            }
        },
        onSuccess: () => {
            setCurrentCall(null);
            // Toast handled by onCallStateChange usually, but good to have here too
        },
        onError: (err) => {
            // Ignore if already hungup
            console.warn(err);
        }
    });

    return {
        status,
        currentCall,
        initiateCall: callMutation.mutate,
        isCalling: callMutation.isPending,
        hangupCall: hangupMutation.mutate,
        isHangingUp: hangupMutation.isPending
    };
}
