import { UserAgent, Registerer, SessionState, UserAgentOptions, RegistererState, Invitation, Session } from "sip.js";

// SIP Configuration from Env
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_SIP_WS_URL;
const DOMAIN = process.env.NEXT_PUBLIC_SIP_DOMAIN;
const USERNAME = process.env.NEXT_PUBLIC_SIP_USERNAME;
const PASSWORD = process.env.NEXT_PUBLIC_SIP_PASSWORD;

const SIP_LOG_PREFIX = "[SIP]";

// Reconnection config
const RECONNECT_INITIAL_DELAY = 2000;   // 2 seconds
const RECONNECT_MAX_DELAY = 30000;      // 30 seconds
const RECONNECT_MAX_ATTEMPTS = 15;

class SipClient {
    private ua: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private currentSession: Session | null = null;
    private remoteAudio: HTMLAudioElement | null = null;
    private localStream: MediaStream | null = null;

    // Reconnection state
    private reconnectAttempts = 0;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private isIntentionalDisconnect = false;
    private lastStatus: string = 'disconnected';

    // Callbacks
    public onStatusChange: ((status: string) => void) | null = null;
    public onCallStateChange: ((state: SessionState) => void) | null = null;
    public onIncomingCall: ((from: string) => void) | null = null;
    public onReconnecting: ((attempt: number, maxAttempts: number) => void) | null = null;

    /**
     * Set the audio element used for remote audio playback.
     */
    setAudioElement(audio: HTMLAudioElement) {
        this.remoteAudio = audio;
    }

    /**
     * Get the current tracked status of the SIP client
     */
    getStatus(): string {
        return this.lastStatus;
    }

    private updateStatus(status: string) {
        this.lastStatus = status;
        this.onStatusChange?.(status);
    }

    async connect() {
        if (typeof window === 'undefined') return;
        if (this.ua) {
            // Already connected/connecting, just broadcast current status
            this.updateStatus(this.lastStatus);
            return;
        }

        this.isIntentionalDisconnect = false;
        this.reconnectAttempts = 0;

        console.log(SIP_LOG_PREFIX, "Connecting...", { server: WEBSOCKET_URL, user: USERNAME, domain: DOMAIN });

        await this.createUserAgent();
    }

    private async createUserAgent() {
        // Clean up existing UA if any
        if (this.ua) {
            try { await this.ua.stop(); } catch (_) { /* ignore */ }
            this.ua = null;
            this.registerer = null;
        }

        const uri = UserAgent.makeURI(`sip:${USERNAME}@${DOMAIN}`);
        if (!uri) throw new Error("Failed to create URI");

        const options: UserAgentOptions = {
            uri,
            transportOptions: {
                server: WEBSOCKET_URL,
            },
            authorizationUsername: USERNAME,
            authorizationPassword: PASSWORD,
            contactName: USERNAME,
            displayName: USERNAME,
            logLevel: "warn",          // Reduce noise in production
            logBuiltinEnabled: true,
            sessionDescriptionHandlerFactoryOptions: {
                peerConnectionConfiguration: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        {
                            urls: 'turn:103.148.197.182:3478',
                            username: 'telephony',
                            credential: 'TuRn$3rv3r2026!',
                        },
                    ],
                },
            },
            delegate: {
                onConnect: () => {
                    console.log(SIP_LOG_PREFIX, "✅ WebSocket connected");
                    this.reconnectAttempts = 0; // Reset on successful connect
                    this.updateStatus('connected');
                    this.register();
                },
                onDisconnect: (error: any) => {
                    console.error(SIP_LOG_PREFIX, "WebSocket disconnected", error || "");
                    this.updateStatus('disconnected');

                    // Auto-reconnect if not intentional
                    if (!this.isIntentionalDisconnect) {
                        this.scheduleReconnect();
                    }
                },
                onInvite: (invitation: Invitation) => {
                    console.log(SIP_LOG_PREFIX, "📞 Incoming INVITE from Asterisk:", invitation.remoteIdentity?.uri?.toString());
                    this.handleIncomingCall(invitation);
                }
            },
            hackIpInContact: true
        } as any;

        this.ua = new UserAgent(options);
        await this.ua.start();
    }

    /**
     * Schedule a reconnection attempt with exponential backoff.
     */
    private scheduleReconnect() {
        if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
            console.error(SIP_LOG_PREFIX, `❌ Max reconnection attempts (${RECONNECT_MAX_ATTEMPTS}) reached. Giving up.`);
            this.updateStatus('failed');
            return;
        }

        // Exponential backoff: 2s, 4s, 8s, 16s, 30s (capped)
        const delay = Math.min(
            RECONNECT_INITIAL_DELAY * Math.pow(2, this.reconnectAttempts),
            RECONNECT_MAX_DELAY
        );

        this.reconnectAttempts++;
        console.log(SIP_LOG_PREFIX, `🔄 Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${RECONNECT_MAX_ATTEMPTS})...`);
        this.onReconnecting?.(this.reconnectAttempts, RECONNECT_MAX_ATTEMPTS);
        this.updateStatus('reconnecting');

        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.createUserAgent();
            } catch (err) {
                console.error(SIP_LOG_PREFIX, "Reconnect failed:", err);
                // Will trigger onDisconnect → scheduleReconnect again
            }
        }, delay);
    }

    private async register() {
        if (!this.ua) return;
        this.registerer = new Registerer(this.ua);

        this.registerer.stateChange.addListener((state) => {
            console.log(SIP_LOG_PREFIX, "Register state:", state.toString());

            if (state === RegistererState.Registered) {
                console.log(SIP_LOG_PREFIX, "✅ Registration Successful — Ready to receive calls");
            }

            if (state === RegistererState.Unregistered) {
                console.warn(SIP_LOG_PREFIX, "Registration state is Unregistered.");
            }

            this.updateStatus(state.toString());
        });

        try {
            console.log(SIP_LOG_PREFIX, "Sending REGISTER...");
            await this.registerer.register();
        } catch (err) {
            console.error(SIP_LOG_PREFIX, "Register failed:", err);
        }
    }

    /**
     * Handle incoming call from Asterisk (auto-answer).
     */
    private handleIncomingCall(invitation: Invitation) {
        const callerUri = invitation.remoteIdentity?.uri?.toString() || "unknown";
        this.onIncomingCall?.(callerUri);

        console.log(SIP_LOG_PREFIX, "Auto-answering incoming call...");

        invitation.accept({
            sessionDescriptionHandlerOptions: {
                constraints: { audio: true, video: false }
            }
        });

        this.currentSession = invitation;

        invitation.stateChange.addListener((state: SessionState) => {
            console.log(SIP_LOG_PREFIX, "Call state:", state);
            this.onCallStateChange?.(state);

            if (state === SessionState.Established) {
                console.log(SIP_LOG_PREFIX, "🔊 Call connected! Setting up audio bridge...");
                this.setupRemoteAudio();
            }

            if (state === SessionState.Terminated) {
                console.log(SIP_LOG_PREFIX, "📴 Call ended.");
                this.cleanupMedia();
                this.currentSession = null;
            }
        });
    }

    private setupRemoteAudio() {
        if (!this.currentSession?.sessionDescriptionHandler || !this.remoteAudio) {
            console.error(SIP_LOG_PREFIX, "Cannot setup audio — missing session or audio element");
            return;
        }

        const sdh = this.currentSession.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) {
            console.error(SIP_LOG_PREFIX, "No PeerConnection available");
            return;
        }

        const remoteStream = new MediaStream();

        pc.getReceivers().forEach(receiver => {
            if (receiver.track) remoteStream.addTrack(receiver.track);
        });

        pc.ontrack = (event) => {
            console.log(SIP_LOG_PREFIX, "Remote track received:", event.track.kind);
            event.streams[0]?.getTracks().forEach(track => {
                if (!remoteStream.getTrackById(track.id)) {
                    remoteStream.addTrack(track);
                }
            });
        };

        this.remoteAudio.srcObject = remoteStream;
        this.remoteAudio.play().catch(err => console.error(SIP_LOG_PREFIX, "Audio play failed:", err));

        console.log(SIP_LOG_PREFIX, "Audio setup done — remote tracks:", remoteStream.getTracks().length,
            "| local senders:", pc.getSenders().filter(s => s.track?.kind === 'audio').length);

        pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'audio') {
                if (!this.localStream) this.localStream = new MediaStream();
                this.localStream.addTrack(sender.track);
            }
        });
    }

    private cleanupMedia() {
        if (this.remoteAudio) {
            this.remoteAudio.srcObject = null;
        }
        this.localStream = null;
    }

    setMute(muted: boolean) {
        if (!this.currentSession?.sessionDescriptionHandler) return;

        const sdh = this.currentSession.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return;

        pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'audio') {
                sender.track.enabled = !muted;
            }
        });
    }

    isMuted(): boolean {
        if (!this.currentSession?.sessionDescriptionHandler) return false;

        const sdh = this.currentSession.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return false;

        const audioSender = pc.getSenders().find(s => s.track?.kind === 'audio');
        return audioSender ? !audioSender.track!.enabled : false;
    }

    hasActiveSession(): boolean {
        return this.currentSession !== null &&
            this.currentSession.state !== SessionState.Terminated;
    }

    async hangup() {
        if (!this.currentSession) return;

        try {
            switch (this.currentSession.state) {
                case SessionState.Initial:
                case SessionState.Establishing:
                    if ('reject' in this.currentSession) {
                        await (this.currentSession as Invitation).reject();
                    }
                    break;
                case SessionState.Established:
                    await this.currentSession.bye();
                    break;
            }
        } catch (err) {
            console.warn(SIP_LOG_PREFIX, "Hangup error (may already be terminated):", err);
            // Force cleanup even if hangup request fails
            this.cleanupMedia();
            this.currentSession = null;
        }
    }

    /**
     * Disconnect SIP client intentionally (e.g., on page unload).
     */
    async disconnect() {
        this.isIntentionalDisconnect = true;

        // Cancel any pending reconnect
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.currentSession) {
            try { await this.hangup(); } catch (_) { /* ignore */ }
        }

        if (this.registerer) {
            try { await this.registerer.unregister(); } catch (_) { /* ignore */ }
        }

        if (this.ua) {
            try { await this.ua.stop(); } catch (_) { /* ignore */ }
            this.ua = null;
        }
    }
}

export const sipClient = new SipClient();
