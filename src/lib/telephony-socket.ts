import { io, Socket } from 'socket.io-client';

const TELEPHONY_URL = process.env.NEXT_PUBLIC_TELEPHONY_URL || 'https://api.telephony.kodedata.com';
const API_KEY = process.env.NEXT_PUBLIC_TELEPHONY_KEY || '';

const SOCKET_LOG_PREFIX = '[Socket.IO]';

/**
 * Call event from the Telephony Service via Socket.IO
 * 
 * Events: INITIATED, RINGING, ANSWERED, BRIDGED, ENDED, BUSY, NO_ANSWER, FAILED, CANCELED
 */
export interface CallEvent {
    type: 'INITIATED' | 'RINGING' | 'ANSWERED' | 'BRIDGED' | 'ENDED' | 'BUSY' | 'NO_ANSWER' | 'FAILED' | 'CANCELED';
    callId: string;
    destination: string;
    timestamp: string;
    data?: {
        duration?: number;
        reason?: string;
    };
}

class TelephonySocket {
    private socket: Socket | null = null;
    private subscribedCallId: string | null = null;

    // Callback for call events
    public onCallEvent: ((event: CallEvent) => void) | null = null;
    public onConnectionChange: ((connected: boolean) => void) | null = null;

    /**
     * Connect to the Telephony Service Socket.IO server
     */
    connect() {
        if (typeof window === 'undefined') return;
        if (this.socket?.connected) return;

        console.log(SOCKET_LOG_PREFIX, 'Connecting to', TELEPHONY_URL);

        this.socket = io(TELEPHONY_URL, {
            auth: { token: API_KEY },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        this.socket.on('connect', () => {
            console.log(SOCKET_LOG_PREFIX, '✅ Connected — socket id:', this.socket?.id);
            this.onConnectionChange?.(true);

            // Re-subscribe if we had a subscription before reconnect
            if (this.subscribedCallId) {
                this.subscribeToCall(this.subscribedCallId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.warn(SOCKET_LOG_PREFIX, '❌ Disconnected:', reason);
            this.onConnectionChange?.(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error(SOCKET_LOG_PREFIX, 'Connection error:', error.message);
        });

        // Listen for call events
        this.socket.on('call:event', (event: CallEvent) => {
            console.log(SOCKET_LOG_PREFIX, '📞 Call event:', event.type, '| callId:', event.callId);
            this.onCallEvent?.(event);
        });
    }

    /**
     * Subscribe to events for a specific call
     */
    subscribeToCall(callId: string) {
        if (!this.socket?.connected) {
            console.warn(SOCKET_LOG_PREFIX, 'Cannot subscribe — not connected. Will retry on reconnect.');
            this.subscribedCallId = callId;
            return;
        }

        console.log(SOCKET_LOG_PREFIX, 'Subscribing to call:', callId);
        this.subscribedCallId = callId;
        this.socket.emit('subscribe', callId);
    }

    /**
     * Unsubscribe from call events (e.g., after call ends)
     */
    unsubscribeFromCall() {
        if (this.subscribedCallId && this.socket?.connected) {
            console.log(SOCKET_LOG_PREFIX, 'Unsubscribing from call:', this.subscribedCallId);
            this.socket.emit('unsubscribe', this.subscribedCallId);
        }
        this.subscribedCallId = null;
    }

    /**
     * Disconnect from Socket.IO server
     */
    disconnect() {
        this.subscribedCallId = null;
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export const telephonySocket = new TelephonySocket();
