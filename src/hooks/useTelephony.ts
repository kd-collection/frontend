import { useMutation, useQuery } from "@tanstack/react-query";
import { api, CallSession } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState, useRef, useCallback } from "react";
import { sipClient } from "@/lib/sip";
import { telephonySocket, CallEvent } from "@/lib/telephony-socket";
import { SessionState } from "sip.js";

export type SipState = "disconnected" | "connecting" | "connected" | "registered" | "failed" | "reconnecting";

// Timeout: auto-clear "stuck" calls after this many seconds with no state change
const CALL_TIMEOUT_SECONDS = 60;
// Timeout for initial dialing phase (before RINGING)
const DIAL_TIMEOUT_SECONDS = 15;

export function useTelephony() {
    const { toast } = useToast();
    const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [sipState, setSipState] = useState<SipState>("disconnected");
    const [socketConnected, setSocketConnected] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const callEstablishedRef = useRef(false);
    const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStateChangeRef = useRef<number>(0);

    /**
     * Clear any pending call timeout watchdog.
     */
    const clearCallTimeout = useCallback(() => {
        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
    }, []);

    /**
     * Start a timeout watchdog for the current call phase.
     * If no state change happens within `seconds`, auto-cleanup the stuck call.
     */
    const startCallTimeout = useCallback((seconds: number, phase: string) => {
        clearCallTimeout();
        lastStateChangeRef.current = Date.now();

        callTimeoutRef.current = setTimeout(() => {
            console.warn(`[Telephony] Call timeout during "${phase}" phase (${seconds}s). Auto-cleaning up.`);
            toast(`Call timeout — ${phase} took too long`, "error");

            // Force cleanup
            telephonySocket.unsubscribeFromCall();
            if (sipClient.hasActiveSession()) {
                sipClient.hangup().catch(() => { });
            }
            setCurrentCall(null);
            setIsMuted(false);
            callEstablishedRef.current = false;
        }, seconds * 1000);
    }, [clearCallTimeout, toast]);

    // Create and append audio element to DOM once
    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audioRef.current = audio;

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
            } else if (status === 'reconnecting') {
                setSipState("reconnecting");
            }
        };

        // SIP reconnection attempts
        sipClient.onReconnecting = (attempt, maxAttempts) => {
            toast(`SIP reconnecting... (${attempt}/${maxAttempts})`, "info");
        };

        // When Asterisk dials back to us (after customer picks up)
        sipClient.onIncomingCall = (from: string) => {
            console.log("[Telephony] Incoming SIP call from Asterisk:", from);
            toast("Customer connected — call bridging...", "info");
            // Clear dialing timeout — we got the callback
            clearCallTimeout();
        };

        // SIP session state changes (established, terminated, etc.)
        sipClient.onCallStateChange = (state) => {
            if (state === SessionState.Established) {
                callEstablishedRef.current = true;
                clearCallTimeout(); // Call is live, no more timeout needed
                toast("🔊 Call connected!", "success");
                setCurrentCall(prev => prev ? { ...prev, state: 'up' } : null);
            }

            if (state === SessionState.Terminated) {
                clearCallTimeout();
                if (callEstablishedRef.current) {
                    toast("Call ended", "info");
                } else {
                    toast("Call failed — could not connect", "error");
                }
                setCurrentCall(null);
                setIsMuted(false);
                callEstablishedRef.current = false;
                telephonySocket.unsubscribeFromCall();
            }
        };

        // === Socket.IO — Real-time call events ===
        telephonySocket.onConnectionChange = (connected) => {
            setSocketConnected(connected);
        };

        telephonySocket.onCallEvent = (event: CallEvent) => {
            console.log("[Telephony] Socket event:", event.type, event.callId);

            setCurrentCall(prev => {
                if (!prev || prev.id !== event.callId) return prev;

                // Reset timeout on every state change
                lastStateChangeRef.current = Date.now();

                switch (event.type) {
                    case 'RINGING':
                        toast("📞 Customer's phone is ringing...", "info");
                        // Extend timeout — customer might take time to answer
                        startCallTimeout(CALL_TIMEOUT_SECONDS, "ringing");
                        return { ...prev, state: 'Ringing' };

                    case 'ANSWERED':
                        toast("✅ Customer answered!", "success");
                        clearCallTimeout();
                        return { ...prev, state: 'Answered' };

                    case 'BRIDGED':
                        clearCallTimeout();
                        return { ...prev, state: 'Bridged' };

                    case 'ENDED':
                        clearCallTimeout();
                        toast(`Call ended — ${event.data?.duration ? `Duration: ${Math.floor(event.data.duration / 60)}m ${event.data.duration % 60}s` : 'completed'}`, "info");
                        telephonySocket.unsubscribeFromCall();
                        return { ...prev, state: 'Ended', duration: event.data?.duration };

                    case 'BUSY':
                        clearCallTimeout();
                        toast("📵 Number is busy", "error");
                        telephonySocket.unsubscribeFromCall();
                        return null;

                    case 'NO_ANSWER':
                        clearCallTimeout();
                        toast("⏰ No answer — customer didn't pick up", "error");
                        telephonySocket.unsubscribeFromCall();
                        return null;

                    case 'FAILED':
                        clearCallTimeout();
                        toast(`❌ Call failed: ${event.data?.reason || 'Unknown error'}`, "error");
                        telephonySocket.unsubscribeFromCall();
                        return null;

                    case 'CANCELED':
                        clearCallTimeout();
                        toast("Call canceled", "info");
                        telephonySocket.unsubscribeFromCall();
                        return null;

                    default:
                        return prev;
                }
            });
        };

        // Auto-connect SIP (register to Asterisk)
        sipClient.connect().catch(() => {
            setSipState("failed");
        });

        // Auto-connect Socket.IO (for real-time events)
        telephonySocket.connect();

        return () => {
            clearCallTimeout();
            if (audio.parentNode) {
                audio.srcObject = null;
                audio.parentNode.removeChild(audio);
            }
            telephonySocket.unsubscribeFromCall();
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
     * 
     * Socket.IO provides real-time status: RINGING → ANSWERED → BRIDGED → ENDED
     */
    const callMutation = useMutation({
        mutationFn: async ({ destination, agentId, callerId }: { destination: string; agentId?: string; callerId?: string }) => {
            // Double-click prevention: don't allow if there's already an active call
            if (currentCall) {
                throw new Error("There's already an active call. Please hang up first.");
            }

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

            // Step 2: Subscribe to real-time events for this call
            if (response.data?.id) {
                telephonySocket.subscribeToCall(response.data.id);
            }

            // Step 3: Start dial timeout watchdog
            startCallTimeout(DIAL_TIMEOUT_SECONDS, "dialing");

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
            clearCallTimeout();
            toast(err.message || "Failed to initiate call", "error");
        }
    });

    /**
     * Hangup — both SIP session and REST API
     */
    const hangupMutation = useMutation({
        mutationFn: async (callId: string) => {
            if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return { success: true };

            clearCallTimeout();

            // Unsubscribe from socket events
            telephonySocket.unsubscribeFromCall();

            // Hangup SIP session (WebRTC side)
            if (sipClient.hasActiveSession()) {
                await sipClient.hangup();
            }

            // Also tell the telephony service to hangup (server side)
            try {
                await api.hangupCall(callId);
            } catch (e) {
                console.warn("[Telephony] Server hangup failed (call may already be ended):", e);
            }

            return { success: true };
        },
        onSuccess: () => {
            setCurrentCall(null);
            setIsMuted(false);
        },
        onError: () => {
            // Force cleanup even on error
            setCurrentCall(null);
            setIsMuted(false);
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
        socketConnected,
        currentCall,
        initiateCall: callMutation.mutate,
        isCalling: callMutation.isPending,
        hangupCall: hangupMutation.mutate,
        isHangingUp: hangupMutation.isPending,
        isMuted,
        toggleMute
    };
}
