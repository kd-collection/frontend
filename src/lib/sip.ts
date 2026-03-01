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

    // Audio level monitoring
    private audioCtx: AudioContext | null = null;
    private localAnalyser: AnalyserNode | null = null;
    private remoteAnalyser: AnalyserNode | null = null;

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
    public onIceStateChange: ((state: RTCIceConnectionState) => void) | null = null;

    /**
     * Set the audio element used for remote audio playback.
     */
    setAudioElement(audio: HTMLAudioElement) {
        this.remoteAudio = audio;
    }

    /**
     * Initialize AudioContext — must be called within a user gesture to avoid autoplay block.
     * Also enables the audio analysers used for speaking detection.
     */
    initAudioContext() {
        if (typeof window === 'undefined') return;
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.resume().catch(() => {});
            return;
        }
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        this.audioCtx = new Ctx();
    }

    /**
     * Connect local mic and remote stream to AnalyserNodes for audio level detection.
     */
    private setupAudioAnalysers(remoteStream: MediaStream, pc: RTCPeerConnection) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') return;

        // Remote analyser
        try {
            const remoteSource = this.audioCtx.createMediaStreamSource(remoteStream);
            this.remoteAnalyser = this.audioCtx.createAnalyser();
            this.remoteAnalyser.fftSize = 256;
            remoteSource.connect(this.remoteAnalyser);
        } catch (e) {
            console.warn(SIP_LOG_PREFIX, "Remote analyser setup failed:", e);
        }

        // Local analyser — get mic track from the RTC sender
        try {
            const audioSender = pc.getSenders().find(s => s.track?.kind === 'audio');
            if (audioSender?.track) {
                const localStream = new MediaStream([audioSender.track]);
                const localSource = this.audioCtx.createMediaStreamSource(localStream);
                this.localAnalyser = this.audioCtx.createAnalyser();
                this.localAnalyser.fftSize = 256;
                localSource.connect(this.localAnalyser);
            }
        } catch (e) {
            console.warn(SIP_LOG_PREFIX, "Local analyser setup failed:", e);
        }
    }

    /**
     * Get current audio level (0–1) for local mic or remote audio.
     * Creates a fresh Uint8Array each call to avoid shared-buffer type issues.
     * Returns 0 if analyser is not set up.
     */
    getAudioLevel(type: 'local' | 'remote'): number {
        const analyser = type === 'local' ? this.localAnalyser : this.remoteAnalyser;
        if (!analyser) return 0;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        return sum / (data.length * 255);
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

        this.currentSession = invitation;

        // Register listener BEFORE accept() to avoid missing early state transitions
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

        console.log(SIP_LOG_PREFIX, "Auto-answering incoming call...");

        invitation.accept({
            sessionDescriptionHandlerOptions: {
                constraints: { audio: true, video: false }
            }
        }).then(() => {
            // After accept succeeds, monitor ICE connection state for media connectivity
            this.monitorIceState();
        }).catch((err) => {
            console.error(SIP_LOG_PREFIX, "Failed to accept call (getUserMedia may have failed):", err);
            this.onCallStateChange?.(SessionState.Terminated);
            this.cleanupMedia();
            this.currentSession = null;
        });
    }

    /**
     * Monitor ICE connection state on the RTCPeerConnection.
     * ICE "connected"/"completed" = media can flow.
     * ICE "failed" = media CANNOT flow (TURN/STUN issue, NAT traversal failed).
     */
    private monitorIceState() {
        if (!this.currentSession?.sessionDescriptionHandler) return;

        const sdh = this.currentSession.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return;

        const logIce = (state: RTCIceConnectionState) => {
            switch (state) {
                case 'checking':
                    console.log(SIP_LOG_PREFIX, "🔍 ICE checking — finding media path...");
                    break;
                case 'connected':
                    console.log(SIP_LOG_PREFIX, "✅ ICE connected — media CAN flow!");
                    break;
                case 'completed':
                    console.log(SIP_LOG_PREFIX, "✅ ICE completed — optimal media path found");
                    break;
                case 'failed':
                    console.error(SIP_LOG_PREFIX, "❌ ICE FAILED — media CANNOT flow! Check TURN/STUN server.");
                    break;
                case 'disconnected':
                    console.warn(SIP_LOG_PREFIX, "⚠️ ICE disconnected — media temporarily interrupted");
                    break;
                case 'closed':
                    console.log(SIP_LOG_PREFIX, "ICE closed");
                    break;
            }
            this.onIceStateChange?.(state);
        };

        // Log current state
        logIce(pc.iceConnectionState);

        // Monitor changes
        pc.addEventListener('iceconnectionstatechange', () => {
            logIce(pc.iceConnectionState);
        });

        // Log ICE candidates for debugging connectivity
        pc.addEventListener('icecandidate', (event) => {
            if (event.candidate) {
                console.log(SIP_LOG_PREFIX, "ICE candidate:", event.candidate.type, event.candidate.protocol, event.candidate.address);
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

        // Log ICE state at audio setup time
        console.log(SIP_LOG_PREFIX, "ICE state at audio setup:", pc.iceConnectionState);
        console.log(SIP_LOG_PREFIX, "Connection state:", pc.connectionState);

        const remoteStream = new MediaStream();

        // Add tracks already received during ICE negotiation (before Established fires)
        pc.getReceivers().forEach(receiver => {
            if (receiver.track) {
                console.log(SIP_LOG_PREFIX, "Receiver track:", receiver.track.kind,
                    "| enabled:", receiver.track.enabled,
                    "| muted:", receiver.track.muted,
                    "| readyState:", receiver.track.readyState);
                remoteStream.addTrack(receiver.track);
            }
        });

        // Log local sender tracks (our microphone → Asterisk)
        pc.getSenders().forEach(sender => {
            if (sender.track) {
                console.log(SIP_LOG_PREFIX, "Sender track:", sender.track.kind,
                    "| enabled:", sender.track.enabled,
                    "| muted:", sender.track.muted,
                    "| readyState:", sender.track.readyState);
            }
        });

        // Listen for any late-arriving tracks using addEventListener (not ontrack assignment)
        // Also use event.track directly — event.streams[0] can be undefined in some browsers
        pc.addEventListener('track', (event) => {
            console.log(SIP_LOG_PREFIX, "Remote track received:", event.track.kind,
                "| enabled:", event.track.enabled, "| readyState:", event.track.readyState);
            if (!remoteStream.getTrackById(event.track.id)) {
                remoteStream.addTrack(event.track);
            }
            // Re-assign srcObject when new tracks arrive to ensure audio element picks them up
            if (this.remoteAudio && this.remoteAudio.srcObject !== remoteStream) {
                this.remoteAudio.srcObject = remoteStream;
            }
        });

        this.remoteAudio.srcObject = remoteStream;

        // Ensure volume is up
        this.remoteAudio.volume = 1.0;
        this.remoteAudio.muted = false;

        this.remoteAudio.play().then(() => {
            console.log(SIP_LOG_PREFIX, "Audio element playing ✅ | tracks in stream:", remoteStream.getTracks().length);
        }).catch(err => {
            console.error(SIP_LOG_PREFIX, "Audio play FAILED (autoplay policy?):", err);
            // Fallback: try to use existing audioCtx to resume
            if (this.audioCtx) {
                this.audioCtx.resume().then(() => {
                    this.remoteAudio?.play().catch(e =>
                        console.error(SIP_LOG_PREFIX, "Audio play still failed after context resume:", e));
                });
            }
        });

        console.log(SIP_LOG_PREFIX, "Audio setup done — remote tracks:", remoteStream.getTracks().length,
            "| local senders:", pc.getSenders().filter(s => s.track?.kind === 'audio').length,
            "| ICE:", pc.iceConnectionState);

        // Hook up audio level analysers for speaking detection
        this.setupAudioAnalysers(remoteStream, pc);
    }

    private cleanupMedia() {
        if (this.remoteAudio) {
            this.remoteAudio.srcObject = null;
        }
        this.localAnalyser = null;
        this.remoteAnalyser = null;
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
