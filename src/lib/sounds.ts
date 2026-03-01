"use client";

class SoundPlayer {
    private ctx: AudioContext | null = null;
    private oscillator1: OscillatorNode | null = null;
    private oscillator2: OscillatorNode | null = null;
    private gainNode: GainNode | null = null;
    private isPlaying = false;
    private interval: ReturnType<typeof setInterval> | null = null;

    init() {
        if (typeof window === 'undefined') return;
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playDialing() {
        this.stop();
        this.init();
        if (!this.ctx) return;

        this.isPlaying = true;

        try {
            this.oscillator1 = this.ctx.createOscillator();
            this.oscillator2 = this.ctx.createOscillator();
            this.gainNode = this.ctx.createGain();

            // US Dial Tone: 350Hz + 440Hz continuous
            this.oscillator1.frequency.value = 350;
            this.oscillator2.frequency.value = 440;

            this.oscillator1.connect(this.gainNode);
            this.oscillator2.connect(this.gainNode);
            this.gainNode.connect(this.ctx.destination);

            this.gainNode.gain.value = 0.15; // Set volume

            this.oscillator1.start();
            this.oscillator2.start();
        } catch (e) {
            console.warn("Could not play dialing sound", e);
        }
    }

    playRinging() {
        this.stop();
        this.init();
        if (!this.ctx) return;

        this.isPlaying = true;

        const playRing = () => {
            if (!this.isPlaying || !this.ctx) return;

            try {
                this.oscillator1 = this.ctx.createOscillator();
                this.oscillator2 = this.ctx.createOscillator();
                this.gainNode = this.ctx.createGain();

                // Standard Ringback Tone: 440Hz + 480Hz
                this.oscillator1.frequency.value = 440;
                this.oscillator2.frequency.value = 480;

                this.oscillator1.connect(this.gainNode);
                this.oscillator2.connect(this.gainNode);
                this.gainNode.connect(this.ctx.destination);

                // Ramp volume to avoid clicks
                this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
                this.gainNode.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
                this.gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime + 1.95); // 2s on
                this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2.0);

                this.oscillator1.start(this.ctx.currentTime);
                this.oscillator2.start(this.ctx.currentTime);

                this.oscillator1.stop(this.ctx.currentTime + 2.05);
                this.oscillator2.stop(this.ctx.currentTime + 2.05);
            } catch (e) {
                console.warn("Could not play ringing sound", e);
            }
        };

        // Play immediately, then loop every 6 seconds (2s on, 4s off)
        playRing();
        this.interval = setInterval(() => {
            if (this.isPlaying) playRing();
        }, 6000);
    }

    stop() {
        this.isPlaying = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Capture references to OLD oscillators/gain so the setTimeout cleans up
        // the correct nodes — not any NEW ones created by a subsequent play call.
        const osc1 = this.oscillator1;
        const osc2 = this.oscillator2;
        const gain = this.gainNode;

        // Clear instance references immediately so new sounds can safely use them
        this.oscillator1 = null;
        this.oscillator2 = null;
        this.gainNode = null;

        try {
            if (gain && this.ctx) {
                // Fade out to prevent popping
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
            }

            setTimeout(() => {
                try {
                    if (osc1) { osc1.stop(); osc1.disconnect(); }
                    if (osc2) { osc2.stop(); osc2.disconnect(); }
                    if (gain) { gain.disconnect(); }
                } catch (_) { /* oscillators may already be stopped */ }
            }, 100);
        } catch (e) {
            // Ignore clean up errors
        }
    }
}

export const sounds = new SoundPlayer();
