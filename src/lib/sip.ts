import { UserAgent, Registerer, Inviter, SessionState, UserAgentOptions, LogLevel, RegistererState } from "sip.js";

// SIP Configuration from Env
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_SIP_WS_URL;
const DOMAIN = process.env.NEXT_PUBLIC_SIP_DOMAIN;
const USERNAME = process.env.NEXT_PUBLIC_SIP_USERNAME;
const PASSWORD = process.env.NEXT_PUBLIC_SIP_PASSWORD;

const SIP_LOG_PREFIX = "[SIP]";

class SipClient {
    private ua: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private session: Inviter | null = null;
    private remoteAudio: HTMLAudioElement | null = null;
    private localStream: MediaStream | null = null;

    // Callbacks
    public onStatusChange: ((status: string) => void) | null = null;
    public onCallStateChange: ((state: SessionState) => void) | null = null;

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
            contactName: USERNAME,  // Help Asterisk identify the user
            displayName: USERNAME,
            logLevel: "debug",      // Enable verbose logs for debugging
            logBuiltinEnabled: true, // Enable sip.js built-in console logs
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
                }
            },
            // Legacy option that might be needed for NAT traversal in some setups
            hackIpInContact: true
        } as any;

        this.ua = new UserAgent(options);
        await this.ua.start();
    }

    private async register() {
        if (!this.ua) return;
        this.registerer = new Registerer(this.ua);

        // Setup explicit state change listener for debugging
        this.registerer.stateChange.addListener((state) => {
            console.log(SIP_LOG_PREFIX, "Register state:", state.toString());

            if (state === RegistererState.Registered) {
                console.log(SIP_LOG_PREFIX, "✅ Registration Successful");
            }

            if (state === RegistererState.Unregistered) {
                // Note: This can happen on init, or if registration fails/expires
                console.warn(SIP_LOG_PREFIX, "Registration state is Unregistered. (This allows retrying)");
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

    async call(destination: string, audioElement: HTMLAudioElement) {
        if (!this.ua) await this.connect();
        if (!this.ua) throw new Error("SIP UA not initialized");

        console.log(SIP_LOG_PREFIX, "Calling", destination);
        this.remoteAudio = audioElement;

        const target = UserAgent.makeURI(`sip:${destination}@${DOMAIN}`);
        if (!target) throw new Error("Invalid target URI");

        this.session = new Inviter(this.ua, target, {
            sessionDescriptionHandlerOptions: {
                constraints: { audio: true, video: false }
            }
        });

        // Handle Session State Changes
        this.session.stateChange.addListener((state) => {
            console.log(SIP_LOG_PREFIX, "Call state:", state);
            this.onCallStateChange?.(state);

            if (state === SessionState.Established) {
                console.log(SIP_LOG_PREFIX, "Call answered - setting up audio");
                this.setupRemoteAudio();
            }

            if (state === SessionState.Terminated) {
                console.log(SIP_LOG_PREFIX, "Call ended");
                // @ts-ignore - Accessing internal details for debugging
                const terminationReason = (this.session as any).byeRequest ? "Remote Hungup (BYE)" :
                    // @ts-ignore
                    (this.session as any).cancelRequest ? "Cancelled" :
                        // @ts-ignore
                        (this.session as any).rejectRequest ? `Rejected: ${(this.session as any).rejectRequest.message.statusCode} ${(this.session as any).rejectRequest.message.reasonPhrase}` :
                            "Unknown / Network Error";

                console.error(SIP_LOG_PREFIX, "Termination Reason Detail:", terminationReason);
                this.cleanupMedia();
                this.session = null;
            }
        });

        // Send Invite
        return this.session.invite();
    }

    private setupRemoteAudio() {
        if (!this.session?.sessionDescriptionHandler || !this.remoteAudio) return;

        const sdh = this.session.sessionDescriptionHandler as any;
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

        console.log(SIP_LOG_PREFIX, "Audio setup done - remote tracks:", remoteStream.getTracks().length,
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
        if (!this.session?.sessionDescriptionHandler) return;

        const sdh = this.session.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return;

        pc.getSenders().forEach(sender => {
            if (sender.track?.kind === 'audio') {
                sender.track.enabled = !muted;
            }
        });
    }

    isMuted(): boolean {
        if (!this.session?.sessionDescriptionHandler) return false;

        const sdh = this.session.sessionDescriptionHandler as any;
        const pc = sdh.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return false;

        const audioSender = pc.getSenders().find(s => s.track?.kind === 'audio');
        return audioSender ? !audioSender.track!.enabled : false;
    }

    async hangup() {
        if (!this.session) return;

        switch (this.session.state) {
            case SessionState.Initial:
            case SessionState.Establishing:
                if (this.session instanceof Inviter) {
                    await this.session.cancel();
                }
                break;
            case SessionState.Established:
                await this.session.bye();
                break;
        }
    }
}

export const sipClient = new SipClient();
