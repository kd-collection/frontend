"use client";

class SoundPlayer {
    private dialingAudio: HTMLAudioElement | null = null;
    private ringingAudio: HTMLAudioElement | null = null;

    init() {
        if (typeof window === 'undefined') return;

        // Pre-load audio elements
        // (Make sure to put your mp3 files in frontend/public/sounds/)
        if (!this.dialingAudio) {
            this.dialingAudio = new Audio('/sounds/dialing.mp3');
            this.dialingAudio.loop = true; // Loop continuously until answered
        }

        if (!this.ringingAudio) {
            this.ringingAudio = new Audio('/sounds/ringing.mp3');
            this.ringingAudio.loop = true; // Loop continuously until answered
        }
    }

    playDialing() {
        this.stop();
        this.init();
        if (this.dialingAudio) {
            this.dialingAudio.volume = 0.3; // Default volume
            this.dialingAudio.play().catch(e => {
                console.warn("[Telephony Sounds] Could not play dialing sound. Make sure public/sounds/dialing.mp3 exists.", e);
            });
        }
    }

    playRinging() {
        this.stop();
        this.init();
        if (this.ringingAudio) {
            this.ringingAudio.volume = 0.4; // Default volume
            this.ringingAudio.play().catch(e => {
                console.warn("[Telephony Sounds] Could not play ringing sound. Make sure public/sounds/ringing.mp3 exists.", e);
            });
        }
    }

    stop() {
        // Pause and reset time to 0 for both sounds
        if (this.dialingAudio) {
            this.dialingAudio.pause();
            this.dialingAudio.currentTime = 0;
        }

        if (this.ringingAudio) {
            this.ringingAudio.pause();
            this.ringingAudio.currentTime = 0;
        }
    }
}

export const sounds = new SoundPlayer();
