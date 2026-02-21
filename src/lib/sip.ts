import { UserAgent, Registerer, SessionState, UserAgentOptions, RegistererState, Invitation, Session } from "sip.js";

// SIP Configuration from Env
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_SIP_WS_URL;
const DOMAIN = process.env.NEXT_PUBLIC_SIP_DOMAIN;
const USERNAME = process.env.NEXT_PUBLIC_SIP_USERNAME;
const PASSWORD = process.env.NEXT_PUBLIC_SIP_PASSWORD;

const SIP_LOG_PREFIX = "[SIP]";

class SipClient {
    private ua: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private currentSession: Session | null = null;
    private remoteAudio: HTMLAudioElement | null = null;
    private localStream: MediaStream | null = null;

    // Callbacks
    public onStatusChange: ((status: string) => void) | null = null;
    public onCallStateChange: ((state: SessionState) => void) | null = null;
    public onIncomingCall: ((from: string) => void) | null = null;

    /**
     * Set the audio element used for remote audio playback.
     * Must be called before any call can produce audio.
     */
    setAudioElement(audio: HTMLAudioElement) {
        this.remoteAudio = audio;
    }

    async connect() {
        if (typeof window === 'undefined') return;
        if (this.ua) return;

        console.log(SIP_LOG_PREFIX, "Connecting...", { server: WEBSOCKET_URL, user: USERNAME, domain: DOMAIN, password: PASSWORD ? `${PASSWORD.slice(0, 3)}***${PASSWORD.slice(-3)}` : "EMPTY" });

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
            logLevel: "debug",
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
                    console.log(SIP_LOG_PREFIX, "WebSocket connected");
                    this.onStatusChange?.('connected');
                    this.register();
                },
                onDisconnect: (error: any) => {
                    console.error(SIP_LOG_PREFIX, "WebSocket disconnected", error || "");
                    this.onStatusChange?.('disconnected');
                },
                // Handle incoming call from Asterisk
                // This fires when Asterisk dials back to our extension (101/102)
                // after the customer picks up the outbound call.
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

            this.onStatusChange?.(state.toString());
        });

        try {
            console.log(SIP_LOG_PREFIX, "Sending REGISTER to", `sip:${USERNAME}@${DOMAIN}`, "via", WEBSOCKET_URL);
            await this.registerer.register();
        } catch (err) {
            console.error(SIP_LOG_PREFIX, "Register failed:", err);
        }
    }

    /**
     * Handle incoming call from Asterisk.
     * 
     * Flow:
     * 1. User clicks "Call" in UI → REST API POST /api/v1/call
     * 2. Telephony Service tells Asterisk to originate a call to the customer
     * 3. Customer's phone rings, customer picks up
     * 4. Asterisk dials BACK to our extension (101) via WebRTC
     * 5. THIS METHOD fires — we auto-answer and setup audio
     * 6. Audio bridge established — user & customer can talk
     */
    private handleIncomingCall(invitation: Invitation) {
        // Notify UI about incoming call
        const callerUri = invitation.remoteIdentity?.uri?.toString() || "unknown";
        this.onIncomingCall?.(callerUri);

        // Auto-answer the call (this is expected — Asterisk is bridging us)
        console.log(SIP_LOG_PREFIX, "Auto-answering incoming call...");

        invitation.accept({
            sessionDescriptionHandlerOptions: {
                constraints: { audio: true, video: false }
            }
        });

        // Store session reference
        this.currentSession = invitation;

        // Listen for session state changes
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

        // Grab any tracks already present
        pc.getReceivers().forEach(receiver => {
            if (receiver.track) remoteStream.addTrack(receiver.track);
        });

        // Also listen for tracks that arrive later
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

        // Store local stream reference for mute control
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

        switch (this.currentSession.state) {
            case SessionState.Initial:
            case SessionState.Establishing:
                // For incoming calls (Invitation), reject
                if ('reject' in this.currentSession) {
                    await (this.currentSession as Invitation).reject();
                }
                break;
            case SessionState.Established:
                await this.currentSession.bye();
                break;
        }
    }
}

export const sipClient = new SipClient();
