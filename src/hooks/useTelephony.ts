import { useMutation, useQuery } from "@tanstack/react-query";
import { api, CallSession } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useEffect, useState, useRef, useCallback } from "react";
import { sipClient } from "@/lib/sip";
import { telephonySocket, CallEvent } from "@/lib/telephony-socket";
import { SessionState } from "sip.js";

export type SipState = "disconnected" | "connecting" | "connected" | "registered" | "failed" | "reconnecting";

// Timeout: auto-clear "stuck" calls after this many seconds with no state change
const CALL_TIMEOUT_SECONDS = 90;
// Timeout for initial dialing phase (before RINGING)
// Asterisk needs time to connect to SIP trunk → dial customer → get RINGING signal
const DIAL_TIMEOUT_SECONDS = 45;

export function useTelephony() {
    const { toast } = useToast();
    const [currentCall, setCurrentCall] = useState<CallSession | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [sipState, setSipState] = useState<SipState>(sipClient.getStatus() as SipState);
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

        callTimeoutRef.current = setTimeout(async () => {
            console.warn(`[Telephony] Call timeout during "${phase}" phase (${seconds}s). Auto-cleaning up.`);
            toast(`Call timeout — ${phase} took too long`, "error");

            // Force cleanup — both UI and server-side
            telephonySocket.unsubscribeFromCall();
            if (sipClient.hasActiveSession()) {
                sipClient.hangup().catch(() => { });
            }

            // Also cancel the call on the server side
            setCurrentCall(prev => {
                if (prev?.id) {
                    api.hangupCall(prev.id).catch((e) => {
                        console.warn('[Telephony] Server cancel on timeout failed:', e);
                    });
                }
                return null;
            });

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

        // Remove explicit setSipState("connecting") here so we don't overwrite current active state
        // and respect whatever sipClient currently has:
        setSipState(sipClient.getStatus() as SipState);

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
            clearCallTimeout();
        };

        // SIP session state changes (established, terminated, etc.)
        sipClient.onCallStateChange = (state) => {
            if (state === SessionState.Established) {
                callEstablishedRef.current = true;
                clearCallTimeout();
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

            // Reset timeout tracker on every state change
            lastStateChangeRef.current = Date.now();

            // Handle side effects OUTSIDE of setCurrentCall to avoid setState-during-render
            switch (event.type) {
                case 'RINGING':
                    toast("📞 Customer's phone is ringing...", "info");
                    startCallTimeout(CALL_TIMEOUT_SECONDS, "ringing");
                    break;
                case 'ANSWERED':
                    toast("✅ Customer answered!", "success");
                    clearCallTimeout();
                    break;
                case 'BRIDGED':
                    clearCallTimeout();
                    break;
                case 'ENDED':
                    clearCallTimeout();
                    toast(`Call ended — ${event.data?.duration ? `Duration: ${Math.floor(event.data.duration / 60)}m ${event.data.duration % 60}s` : 'completed'}`, "info");
                    telephonySocket.unsubscribeFromCall();
                    // Auto-clear call UI after a short delay so user sees "Call Ended" briefly
                    setTimeout(() => {
                        setCurrentCall(null);
                        setIsMuted(false);
                        callEstablishedRef.current = false;
                    }, 2000);
                    break;
                case 'BUSY':
                    clearCallTimeout();
                    toast("📵 Number is busy", "error");
                    telephonySocket.unsubscribeFromCall();
                    break;
                case 'NO_ANSWER':
                    clearCallTimeout();
                    toast("⏰ No answer — customer didn't pick up", "error");
                    telephonySocket.unsubscribeFromCall();
                    break;
                case 'FAILED':
                    clearCallTimeout();
                    toast(`❌ Call failed: ${event.data?.reason || 'Unknown error'}`, "error");
                    telephonySocket.unsubscribeFromCall();
                    break;
                case 'CANCELED':
                    clearCallTimeout();
                    toast("Call canceled", "info");
                    telephonySocket.unsubscribeFromCall();
                    break;
            }

            // Now update state (pure state update, no side effects)
            setCurrentCall(prev => {
                if (!prev || prev.id !== event.callId) return prev;

                switch (event.type) {
                    case 'RINGING':
                        return { ...prev, state: 'Ringing' };
                    case 'ANSWERED':
                        return { ...prev, state: 'Answered' };
                    case 'BRIDGED':
                        return { ...prev, state: 'Bridged' };
                    case 'ENDED':
                        return { ...prev, state: 'Ended', duration: event.data?.duration };
                    case 'BUSY':
                    case 'NO_ANSWER':
                    case 'FAILED':
                    case 'CANCELED':
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
            try {
                const response = await api.getTelephonyStatus();
                return response.success ? response.data : null;
            } catch {
                // Silently fail — status is a background check, not critical
                return null;
            }
        },
        refetchInterval: 30000,
        retry: false,  // Don't retry on failure — we poll every 30s anyway
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

            // Pre-flight: check if telephony service is ready
            const statusCheck = await api.getTelephonyStatus();
            if (statusCheck.success && statusCheck.data && !statusCheck.data.ready_to_call) {
                const trunkState = statusCheck.data.trunk_info?.state || 'unknown';
                throw new Error(`Telephony service not ready — trunk is ${trunkState}. Contact admin.`);
            }

            // Step 1: Hit REST API to trigger Asterisk origination
            const response = await api.initiateCall(
                destination,
                agentId || 'agent1',
                { callerId, timeout: 30 }
            );

            if (!response.success) {
                // Handle specific error codes from the server
                const code = (response as any).code;
                const msg = (response as any).message;

                switch (code) {
                    case 'TRUNK_OFFLINE':
                        throw new Error("SIP trunk is offline — outbound calls unavailable. Contact admin.");
                    case 'ARI_DISCONNECTED':
                        throw new Error("Asterisk engine is down — calls unavailable. Contact admin.");
                    case 'ORIGINATE_TIMEOUT':
                        throw new Error("Call timed out — could not reach the number.");
                    default:
                        throw new Error(msg || 'Failed to initiate call');
                }
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
