import { useCallback, useRef } from 'react';

export function useCelebrationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback((frequency: number, startTime: number, duration: number, volume: number = 0.3) => {
    const ctx = getAudioContext();
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }, [getAudioContext]);

  const playSuccessSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Simple ascending success melody (C-E-G chord arpeggio)
      playNote(523.25, now, 0.15, 0.2);        // C5
      playNote(659.25, now + 0.1, 0.15, 0.2);  // E5
      playNote(783.99, now + 0.2, 0.25, 0.25); // G5
    } catch (e) {
      console.warn('Could not play success sound:', e);
    }
  }, [getAudioContext, playNote]);

  const playCelebrationSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Celebratory fanfare melody
      const notes = [
        { freq: 523.25, time: 0, dur: 0.12 },     // C5
        { freq: 659.25, time: 0.1, dur: 0.12 },   // E5
        { freq: 783.99, time: 0.2, dur: 0.12 },   // G5
        { freq: 1046.50, time: 0.3, dur: 0.2 },   // C6
        { freq: 783.99, time: 0.45, dur: 0.1 },   // G5
        { freq: 1046.50, time: 0.55, dur: 0.35 }, // C6 (sustained)
      ];
      
      notes.forEach(note => {
        playNote(note.freq, now + note.time, note.dur, 0.2);
      });
    } catch (e) {
      console.warn('Could not play celebration sound:', e);
    }
  }, [getAudioContext, playNote]);

  const playFullCelebration = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Epic celebration with harmonics
      const melody = [
        // Opening fanfare
        { freq: 392.00, time: 0, dur: 0.1 },       // G4
        { freq: 523.25, time: 0.08, dur: 0.1 },    // C5
        { freq: 659.25, time: 0.16, dur: 0.1 },    // E5
        { freq: 783.99, time: 0.24, dur: 0.15 },   // G5
        // Triumphant chord
        { freq: 1046.50, time: 0.4, dur: 0.3 },    // C6
        { freq: 783.99, time: 0.4, dur: 0.3 },     // G5 (harmony)
        { freq: 659.25, time: 0.4, dur: 0.3 },     // E5 (harmony)
        // Final flourish
        { freq: 1174.66, time: 0.75, dur: 0.1 },   // D6
        { freq: 1318.51, time: 0.85, dur: 0.4 },   // E6
        { freq: 1046.50, time: 0.85, dur: 0.4 },   // C6 (harmony)
      ];
      
      melody.forEach(note => {
        playNote(note.freq, now + note.time, note.dur, 0.15);
      });
    } catch (e) {
      console.warn('Could not play full celebration sound:', e);
    }
  }, [getAudioContext, playNote]);

  return {
    playSuccessSound,
    playCelebrationSound,
    playFullCelebration,
  };
}
