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
    const callEstablishedRef = useRef(false);

    // Create and append audio element to DOM once
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioRef.current = audio;

        // Give the audio element to sipClient so it can attach remote audio
        sipClient.setAudioElement(audio);

        setSipState("connecting");

        // SIP connection status
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

        // When Asterisk dials back to us (after customer picks up)
        sipClient.onIncomingCall = (from: string) => {
            console.log("[Telephony] Incoming SIP call from Asterisk:", from);
            toast("Customer connected — call bridging...", "info");
        };

        // SIP session state changes (established, terminated, etc.)
        sipClient.onCallStateChange = (state) => {
            if (state === SessionState.Established) {
                callEstablishedRef.current = true;
                toast("🔊 Call connected!", "success");
                setCurrentCall(prev => prev ? { ...prev, state: 'up' } : null);
            }

            if (state === SessionState.Terminated) {
                if (callEstablishedRef.current) {
                    toast("Call ended", "info");
                } else {
                    toast("Call failed — could not connect", "error");
                }
                setCurrentCall(null);
                setIsMuted(false);
                callEstablishedRef.current = false;
            }
        };

        // Auto-connect SIP (register to Asterisk)
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

    // Poll telephony service status
    const { data: status } = useQuery({
        queryKey: ["telephony", "status"],
        queryFn: async () => {
            const response = await api.getTelephonyStatus();
            return response.success ? response.data : null;
        },
        refetchInterval: 30000
    });

    /**
     * Initiate Call — the CORRECT click-to-call flow:
     * 
     * 1. Hit REST API: POST /api/v1/call with destination & agentId
     * 2. Telephony Service tells Asterisk to originate call to customer
     * 3. Customer's phone rings → customer picks up
     * 4. Asterisk dials BACK to our SIP extension (101) via WebRTC
     * 5. SipClient auto-answers (onInvite handler in sip.ts)
     * 6. Audio bridge established — we can talk!
     */
    const callMutation = useMutation({
        mutationFn: async ({ destination, agentId, callerId }: { destination: string; agentId?: string; callerId?: string }) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
                return { success: true, data: { id: 'mock', destination, callerId: 'mock', state: 'ringing' } as CallSession };
            }

            if (sipState !== 'registered') {
                throw new Error("SIP not registered — can't receive calls from Asterisk");
            }

            // Step 1: Hit REST API to trigger Asterisk origination
            const response = await api.initiateCall(
                destination,
                agentId || 'agent1',
                { callerId, timeout: 30 }
            );

            if (!response.success) {
                throw new Error((response as any).message || 'Failed to initiate call');
            }

            // Step 2: Call initiated! Asterisk is now dialing the customer.
            // When customer picks up, Asterisk will send us an INVITE via WebRTC
            // which sipClient.onInvite will auto-answer.
            return response;
        },
        onSuccess: (data) => {
            if (data.success && data.data) {
                const session: CallSession = {
                    id: data.data.id,
                    destination: data.data.destination,
                    callerId: data.data.callerId || 'agent1',
                    state: data.data.state || 'Initiated',
                    startedAt: new Date().toISOString()
                };
                setCurrentCall(session);
                callEstablishedRef.current = false;
                toast(`Calling ${session.destination}... waiting for answer`, "info");
            }
        },
        onError: (err) => {
            toast(err.message || "Failed to initiate call", "error");
        }
    });

    /**
     * Hangup — both SIP session and REST API
     */
    const hangupMutation = useMutation({
        mutationFn: async (callId: string) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { success: true };

            // Hangup SIP session (WebRTC side)
            if (sipClient.hasActiveSession()) {
                await sipClient.hangup();
            }

            // Also tell the telephony service to hangup (server side)
            try {
                await api.hangupCall(callId);
            } catch (e) {
                // Server-side hangup may fail if call already ended — that's OK
                console.warn("[Telephony] Server hangup failed (call may already be ended):", e);
            }

            return { success: true };
        },
        onSuccess: () => {
            setCurrentCall(null);
            setIsMuted(false);
        },
        onError: () => {
            // Hangup error — call may already be terminated
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
