import { UserAgent, Registerer, Inviter, SessionState, UserAgentOptions } from "sip.js";

// SIP Configuration from Env
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_SIP_WS_URL || "ws://localhost:8088/ws";
const DOMAIN = process.env.NEXT_PUBLIC_SIP_DOMAIN || "localhost";
const USERNAME = process.env.NEXT_PUBLIC_SIP_USERNAME || "101";
const PASSWORD = process.env.NEXT_PUBLIC_SIP_PASSWORD || "password123";

class SipClient {
    private ua: UserAgent | null = null;
    private registerer: Registerer | null = null;
    private session: Inviter | null = null;

    // Callbacks
    public onStatusChange: ((status: string) => void) | null = null;
    public onCallStateChange: ((state: SessionState) => void) | null = null;

    private audioContext: AudioContext | null = null;

    constructor() {
        // AudioContext will be initialized on connect/call
    }

    async connect() {
        if (typeof window === 'undefined') return;
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.ua) return;

        const uri = UserAgent.makeURI(`sip:${USERNAME}@${DOMAIN}`);
        if (!uri) throw new Error("Failed to create URI");

        const options: UserAgentOptions = {
            uri,
            transportOptions: {
                server: WEBSOCKET_URL,
            },
            authorizationUsername: USERNAME,
            authorizationPassword: PASSWORD,
            delegate: {
                onConnect: () => {
                    this.onStatusChange?.('connected');
                    this.register();
                },
                onDisconnect: (error) => {
                    this.onStatusChange?.('disconnected');
                    if (error) console.error("SIP Disconnected:", error);
                }
            }
        };

        this.ua = new UserAgent(options);
        await this.ua.start();
    }

    private async register() {
        if (!this.ua) return;
        this.registerer = new Registerer(this.ua);
        this.registerer.stateChange.addListener((state) => {
            this.onStatusChange?.(state.toString());
        });
        await this.registerer.register();
    }

    async call(destination: string, remoteVideoElement?: HTMLMediaElement) {
        if (!this.ua) await this.connect();
        if (!this.ua) throw new Error("SIP UA not initialized");

        const target = UserAgent.makeURI(`sip:${destination}@${DOMAIN}`);
        if (!target) throw new Error("Invalid target URI");

        this.session = new Inviter(this.ua, target, {
            sessionDescriptionHandlerOptions: {
                constraints: { audio: true, video: false }
            }
        });

        // Handle Session State Changes
        this.session.stateChange.addListener((state) => {
            console.log("Session State:", state);
            this.onCallStateChange?.(state);

            if (state === SessionState.Terminated) {
                this.session = null;
            }
        });

        // Handle Media
        if (remoteVideoElement) {
            // In sip.js v0.20+, managing media streams is often done via the SessionDescriptionHandler
            // But simpler way is to hook into the track event if using default SDH
            // Note: pure sip.js requires some manual track handling usually, 
            // but let's try standard approach:
            //  (this.session as any).delegate = {
            //      onPeerConnection: (pc: RTCPeerConnection) => {
            //          pc.ontrack = (event) => {
            //              if (event.track.kind === 'audio') {
            //                  remoteVideoElement.srcObject = event.streams[0];
            //                  remoteVideoElement.play();
            //              }
            //          }
            //      }
            //  }
        }

        // Send Invite
        return this.session.invite({
            requestDelegate: {
                onAccept: (response) => {
                    // Handle remote stream setup here for v0.21.x if needed
                    // Usually the default Web.SessionDescriptionHandler takes care of attaching to an element
                    // provided in options, but simpler to attach manually.

                    if (remoteVideoElement && this.session?.sessionDescriptionHandler) {
                        const sdh = this.session.sessionDescriptionHandler as any;
                        const pc = sdh.peerConnection as RTCPeerConnection;
                        const remoteStream = new MediaStream();
                        pc.getReceivers().forEach(receiver => {
                            if (receiver.track) remoteStream.addTrack(receiver.track);
                        });
                        remoteVideoElement.srcObject = remoteStream;
                        remoteVideoElement.play().catch(console.error);
                    }
                }
            }
        });
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
