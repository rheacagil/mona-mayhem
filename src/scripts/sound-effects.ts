type Waveform = OscillatorType;

let audioContext: AudioContext | undefined;
let masterGain: GainNode | undefined;
let soundEnabled = true;

function getAudioContext(): AudioContext | undefined {
	if (typeof window === 'undefined') return undefined;
	if (audioContext) return audioContext;

	const AudioContextConstructor = window.AudioContext;
	if (!AudioContextConstructor) return undefined;

	audioContext = new AudioContextConstructor();
	masterGain = audioContext.createGain();
	masterGain.gain.value = soundEnabled ? 0.18 : 0;
	masterGain.connect(audioContext.destination);
	return audioContext;
}

function resumeAudio(): AudioContext | undefined {
	const context = getAudioContext();
	if (context?.state === 'suspended') {
		void context.resume().catch((error: unknown) => {
			console.warn('Unable to resume arcade sound effects', error);
		});
	}
	return context;
}

function playTone(
	frequency: number,
	startOffset: number,
	duration: number,
	waveform: Waveform = 'square',
	volume = 0.45,
	frequencyEnd = frequency,
): void {
	if (!soundEnabled) return;

	const context = resumeAudio();
	if (!context || !masterGain) return;

	const startTime = context.currentTime + startOffset;
	const oscillator = context.createOscillator();
	const envelope = context.createGain();

	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, startTime);
	if (frequencyEnd !== frequency) {
		oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, frequencyEnd), startTime + duration);
	}

	envelope.gain.setValueAtTime(0.0001, startTime);
	envelope.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.012, duration / 3));
	envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
	oscillator.connect(envelope);
	envelope.connect(masterGain);
	oscillator.start(startTime);
	oscillator.stop(startTime + duration + 0.01);
}

export function setSoundEnabled(enabled: boolean): void {
	soundEnabled = enabled;
	const context = getAudioContext();
	if (context?.state === 'suspended' && enabled) {
		void context.resume().catch((error: unknown) => {
			console.warn('Unable to resume arcade sound effects', error);
		});
	}

	if (context && masterGain) {
		const now = context.currentTime;
		masterGain.gain.cancelScheduledValues(now);
		masterGain.gain.setTargetAtTime(enabled ? 0.18 : 0, now, 0.025);
	}
}

export function isSoundEnabled(): boolean {
	return soundEnabled;
}

export function playButtonClick(): void {
	playTone(880, 0, 0.055, 'square', 0.35);
	playTone(1320, 0.045, 0.075, 'square', 0.3);
}

export function playPowerUp(): void {
	const notes = [392, 494, 587, 784, 988, 1175];
	notes.forEach((frequency, index) => {
		playTone(frequency, index * 0.11, 0.16, 'triangle', 0.32);
	});
}

export function playStatHit(): void {
	playTone(190, 0, 0.11, 'square', 0.5, 72);
	playTone(740, 0.015, 0.055, 'square', 0.16, 280);
}

export function playVictoryFanfare(knockout: boolean): void {
	if (knockout) {
		playTone(110, 0, 0.48, 'sawtooth', 0.55, 42);
		playTone(165, 0.04, 0.34, 'square', 0.28, 55);
	}

	const notes = knockout ? [523, 659, 784, 1047] : [659, 784, 988, 1319];
	notes.forEach((frequency, index) => {
		playTone(frequency, (knockout ? 0.38 : 0) + index * 0.14, 0.19, 'square', 0.34);
	});
	playTone(notes[notes.length - 1] / 2, (knockout ? 0.98 : 0.62), 0.48, 'triangle', 0.28);
}
