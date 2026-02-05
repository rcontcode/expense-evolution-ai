 import { useCallback, useRef, useMemo } from 'react';
 
 // Sound style types
 export type SoundStyle = 'phoenix' | 'minimal' | 'arcade';
 
 // Sound category types
 export type SoundCategory = 'actions' | 'celebrations' | 'navigation' | 'feedback';
 
 // Sound preferences interface
 export interface SoundPreferences {
   enabled: boolean;
   volume: number; // 0 to 1
   style: SoundStyle;
   categories: {
     actions: boolean;
     celebrations: boolean;
     navigation: boolean;
     feedback: boolean;
   };
   hapticEnabled: boolean;
 }
 
 const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
   enabled: true,
   volume: 0.5,
   style: 'phoenix',
   categories: {
     actions: true,
     celebrations: true,
     navigation: false,
     feedback: true,
   },
   hapticEnabled: true,
 };
 
 const STORAGE_KEY = 'evofinz_sound_preferences';
 
 // Load preferences from localStorage
 function loadPreferences(): SoundPreferences {
   try {
     const stored = localStorage.getItem(STORAGE_KEY);
     if (stored) {
       return { ...DEFAULT_SOUND_PREFERENCES, ...JSON.parse(stored) };
     }
   } catch (e) {
     console.error('Failed to load sound preferences:', e);
   }
   return DEFAULT_SOUND_PREFERENCES;
 }
 
 // Save preferences to localStorage
 function savePreferences(prefs: SoundPreferences): void {
   try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
   } catch (e) {
     console.error('Failed to save sound preferences:', e);
   }
 }
 
 // ============= PHOENIX STYLE MELODIES =============
 // Themed around fire, rebirth, and ascension
 
 interface MelodyNote {
   freq: number;
   time: number;
   dur: number;
   vol?: number;
   type?: OscillatorType;
 }
 
 type MelodyArray = MelodyNote[];
 
 const PHOENIX_MELODIES: Record<string, MelodyArray> = {
   // === ACTIONS ===
   create: [ // Phoenix Birth - Ascending with shimmer
     { freq: 523.25, time: 0, dur: 0.1, type: 'sine' as OscillatorType },      // C5
     { freq: 659.25, time: 0.08, dur: 0.1, type: 'sine' as OscillatorType },   // E5
     { freq: 783.99, time: 0.16, dur: 0.12, type: 'sine' as OscillatorType },  // G5
     { freq: 1046.50, time: 0.24, dur: 0.18, vol: 0.25, type: 'triangle' as OscillatorType }, // C6 shimmer
   ],
   update: [ // Flame flicker - Quick rise and settle
     { freq: 587.33, time: 0, dur: 0.08, type: 'sine' as OscillatorType },     // D5
     { freq: 698.46, time: 0.06, dur: 0.08, type: 'sine' as OscillatorType },  // F5
     { freq: 659.25, time: 0.12, dur: 0.12, type: 'sine' as OscillatorType },  // E5 settle
   ],
   delete: [ // Ashes Fall - Gentle descent
     { freq: 783.99, time: 0, dur: 0.1, type: 'sine' as OscillatorType },      // G5
     { freq: 659.25, time: 0.08, dur: 0.1, type: 'sine' as OscillatorType },   // E5
     { freq: 523.25, time: 0.16, dur: 0.15, vol: 0.15, type: 'sine' as OscillatorType }, // C5 fade
   ],
   save: [ // Ember glow - Warm confirmation
     { freq: 440.00, time: 0, dur: 0.06, type: 'triangle' as OscillatorType }, // A4
     { freq: 554.37, time: 0.05, dur: 0.08, type: 'triangle' as OscillatorType }, // C#5
     { freq: 659.25, time: 0.11, dur: 0.1, type: 'sine' as OscillatorType },   // E5
   ],
 
   // === CELEBRATIONS ===
   goalReached: [ // Phoenix Rising - Triumphant arpeggio
     { freq: 392.00, time: 0, dur: 0.1 },        // G4
     { freq: 493.88, time: 0.08, dur: 0.1 },     // B4
     { freq: 587.33, time: 0.16, dur: 0.1 },     // D5
     { freq: 783.99, time: 0.24, dur: 0.15 },    // G5
     { freq: 987.77, time: 0.36, dur: 0.25 },    // B5 sustained
   ],
   levelUp: [ // Epic Fanfare - Full Phoenix celebration
     { freq: 392.00, time: 0, dur: 0.1 },        // G4
     { freq: 523.25, time: 0.08, dur: 0.1 },     // C5
     { freq: 659.25, time: 0.16, dur: 0.1 },     // E5
     { freq: 783.99, time: 0.24, dur: 0.15 },    // G5
     // Triumph chord
     { freq: 1046.50, time: 0.4, dur: 0.3, vol: 0.25 },  // C6
     { freq: 783.99, time: 0.4, dur: 0.3, vol: 0.2 },    // G5
     { freq: 659.25, time: 0.4, dur: 0.3, vol: 0.15 },   // E5
     // Final flourish
     { freq: 1174.66, time: 0.75, dur: 0.1 },    // D6
     { freq: 1318.51, time: 0.85, dur: 0.4, vol: 0.2 },  // E6
     { freq: 1046.50, time: 0.85, dur: 0.4, vol: 0.15 }, // C6 harmony
   ],
   achievement: [ // Badge unlock - Sparkling
     { freq: 698.46, time: 0, dur: 0.08, type: 'triangle' as OscillatorType },
     { freq: 880.00, time: 0.06, dur: 0.08, type: 'triangle' as OscillatorType },
     { freq: 1046.50, time: 0.12, dur: 0.1, type: 'sine' as OscillatorType },
     { freq: 1318.51, time: 0.2, dur: 0.2, vol: 0.25, type: 'triangle' as OscillatorType },
   ],
   streakMilestone: [ // Fire streak - Accelerating
     { freq: 440.00, time: 0, dur: 0.06 },
     { freq: 523.25, time: 0.05, dur: 0.06 },
     { freq: 659.25, time: 0.1, dur: 0.06 },
     { freq: 783.99, time: 0.14, dur: 0.08 },
     { freq: 1046.50, time: 0.2, dur: 0.15, vol: 0.3 },
   ],
 
   // === NAVIGATION ===
   pageTransition: [ // Soft whoosh
     { freq: 300, time: 0, dur: 0.08, vol: 0.1, type: 'sine' as OscillatorType },
     { freq: 400, time: 0.04, dur: 0.08, vol: 0.08, type: 'sine' as OscillatorType },
   ],
   tabSwitch: [ // Quick tick
     { freq: 800, time: 0, dur: 0.04, vol: 0.1, type: 'sine' as OscillatorType },
   ],
   menuOpen: [ // Pop open
     { freq: 400, time: 0, dur: 0.05, vol: 0.12, type: 'triangle' as OscillatorType },
     { freq: 600, time: 0.03, dur: 0.06, vol: 0.1, type: 'triangle' as OscillatorType },
   ],
 
   // === FEEDBACK ===
   success: [ // Quick positive chime
     { freq: 523.25, time: 0, dur: 0.1, vol: 0.2 },      // C5
     { freq: 659.25, time: 0.08, dur: 0.1, vol: 0.2 },   // E5
     { freq: 783.99, time: 0.16, dur: 0.15, vol: 0.25 }, // G5
   ],
   error: [ // Minor descending - Not harsh
     { freq: 392.00, time: 0, dur: 0.12, type: 'sine' as OscillatorType },     // G4
     { freq: 311.13, time: 0.1, dur: 0.2, vol: 0.2, type: 'sine' as OscillatorType },  // Eb4 (minor)
   ],
   warning: [ // Attention ping
     { freq: 659.25, time: 0, dur: 0.1, type: 'triangle' as OscillatorType },
     { freq: 554.37, time: 0.12, dur: 0.1, type: 'triangle' as OscillatorType },
     { freq: 659.25, time: 0.24, dur: 0.08, type: 'triangle' as OscillatorType },
   ],
   notification: [ // Friendly bell
     { freq: 880.00, time: 0, dur: 0.12, vol: 0.15, type: 'triangle' as OscillatorType },
     { freq: 1108.73, time: 0.1, dur: 0.15, vol: 0.12, type: 'triangle' as OscillatorType },
   ],
 };
 
 // ============= MINIMAL STYLE =============
 const MINIMAL_MELODIES: Record<string, MelodyArray> = {
   create: [{ freq: 880, time: 0, dur: 0.08, vol: 0.15, type: 'sine' }],
   update: [{ freq: 660, time: 0, dur: 0.06, vol: 0.12, type: 'sine' }],
   delete: [{ freq: 440, time: 0, dur: 0.1, vol: 0.1, type: 'sine' }],
   save: [{ freq: 520, time: 0, dur: 0.08, vol: 0.12, type: 'sine' }],
   goalReached: [
     { freq: 660, time: 0, dur: 0.1, vol: 0.15 },
     { freq: 880, time: 0.1, dur: 0.15, vol: 0.18 },
   ],
   levelUp: [
     { freq: 523, time: 0, dur: 0.1, vol: 0.15 },
     { freq: 659, time: 0.1, dur: 0.1, vol: 0.15 },
     { freq: 784, time: 0.2, dur: 0.2, vol: 0.2 },
   ],
   achievement: [{ freq: 1046, time: 0, dur: 0.15, vol: 0.15, type: 'triangle' }],
   streakMilestone: [
     { freq: 660, time: 0, dur: 0.08, vol: 0.12 },
     { freq: 880, time: 0.08, dur: 0.12, vol: 0.15 },
   ],
   pageTransition: [{ freq: 400, time: 0, dur: 0.04, vol: 0.06, type: 'sine' }],
   tabSwitch: [{ freq: 600, time: 0, dur: 0.03, vol: 0.06, type: 'sine' }],
   menuOpen: [{ freq: 500, time: 0, dur: 0.04, vol: 0.08, type: 'sine' }],
   success: [{ freq: 784, time: 0, dur: 0.1, vol: 0.15, type: 'sine' }],
   error: [{ freq: 311, time: 0, dur: 0.15, vol: 0.12, type: 'sine' }],
   warning: [{ freq: 554, time: 0, dur: 0.1, vol: 0.1, type: 'triangle' }],
   notification: [{ freq: 880, time: 0, dur: 0.1, vol: 0.1, type: 'triangle' }],
 };
 
 // ============= ARCADE STYLE (8-bit) =============
 const ARCADE_MELODIES: Record<string, MelodyArray> = {
   create: [
     { freq: 262, time: 0, dur: 0.05, type: 'square' as OscillatorType },
     { freq: 330, time: 0.05, dur: 0.05, type: 'square' as OscillatorType },
     { freq: 392, time: 0.1, dur: 0.08, type: 'square' as OscillatorType },
   ],
   update: [
     { freq: 392, time: 0, dur: 0.04, type: 'square' as OscillatorType },
     { freq: 523, time: 0.04, dur: 0.06, type: 'square' as OscillatorType },
   ],
   delete: [
     { freq: 392, time: 0, dur: 0.06, type: 'square' as OscillatorType },
     { freq: 262, time: 0.06, dur: 0.1, type: 'square' as OscillatorType },
   ],
   save: [
     { freq: 523, time: 0, dur: 0.04, type: 'square' as OscillatorType },
     { freq: 659, time: 0.04, dur: 0.06, type: 'square' as OscillatorType },
   ],
   goalReached: [
     { freq: 262, time: 0, dur: 0.06, type: 'square' as OscillatorType },
     { freq: 330, time: 0.06, dur: 0.06, type: 'square' as OscillatorType },
     { freq: 392, time: 0.12, dur: 0.06, type: 'square' as OscillatorType },
     { freq: 523, time: 0.18, dur: 0.1, type: 'square' as OscillatorType },
     { freq: 659, time: 0.28, dur: 0.15, type: 'square' as OscillatorType },
   ],
   levelUp: [
     { freq: 262, time: 0, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 330, time: 0.08, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 392, time: 0.16, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 523, time: 0.24, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 659, time: 0.32, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 784, time: 0.4, dur: 0.2, type: 'square' as OscillatorType },
     { freq: 1046, time: 0.6, dur: 0.3, type: 'square' as OscillatorType },
   ],
   achievement: [
     { freq: 523, time: 0, dur: 0.05, type: 'square' as OscillatorType },
     { freq: 784, time: 0.05, dur: 0.05, type: 'square' as OscillatorType },
     { freq: 1046, time: 0.1, dur: 0.1, type: 'square' as OscillatorType },
   ],
   streakMilestone: [
     { freq: 392, time: 0, dur: 0.04, type: 'square' as OscillatorType },
     { freq: 523, time: 0.04, dur: 0.04, type: 'square' as OscillatorType },
     { freq: 659, time: 0.08, dur: 0.04, type: 'square' as OscillatorType },
     { freq: 784, time: 0.12, dur: 0.1, type: 'square' as OscillatorType },
   ],
   pageTransition: [{ freq: 200, time: 0, dur: 0.03, vol: 0.08, type: 'square' as OscillatorType }],
   tabSwitch: [{ freq: 400, time: 0, dur: 0.02, vol: 0.08, type: 'square' as OscillatorType }],
   menuOpen: [{ freq: 300, time: 0, dur: 0.04, vol: 0.1, type: 'square' as OscillatorType }],
   success: [
     { freq: 523, time: 0, dur: 0.06, type: 'square' as OscillatorType },
     { freq: 784, time: 0.06, dur: 0.1, type: 'square' as OscillatorType },
   ],
   error: [
     { freq: 200, time: 0, dur: 0.1, type: 'square' as OscillatorType },
     { freq: 150, time: 0.1, dur: 0.15, type: 'square' as OscillatorType },
   ],
   warning: [
     { freq: 400, time: 0, dur: 0.08, type: 'square' as OscillatorType },
     { freq: 300, time: 0.1, dur: 0.08, type: 'square' as OscillatorType },
   ],
   notification: [
     { freq: 800, time: 0, dur: 0.05, type: 'square' as OscillatorType },
     { freq: 1000, time: 0.05, dur: 0.08, type: 'square' as OscillatorType },
   ],
 };
 
 const STYLE_MELODIES = {
   phoenix: PHOENIX_MELODIES,
   minimal: MINIMAL_MELODIES,
   arcade: ARCADE_MELODIES,
 };
 
 // Sound name to category mapping
 const SOUND_CATEGORIES: Record<keyof typeof PHOENIX_MELODIES, SoundCategory> = {
   create: 'actions',
   update: 'actions',
   delete: 'actions',
   save: 'actions',
   goalReached: 'celebrations',
   levelUp: 'celebrations',
   achievement: 'celebrations',
   streakMilestone: 'celebrations',
   pageTransition: 'navigation',
   tabSwitch: 'navigation',
   menuOpen: 'navigation',
   success: 'feedback',
   error: 'feedback',
   warning: 'feedback',
   notification: 'feedback',
 };
 
 export type SoundName = keyof typeof PHOENIX_MELODIES;
 
 export function useAppSounds() {
   const audioContextRef = useRef<AudioContext | null>(null);
   const preferencesRef = useRef<SoundPreferences>(loadPreferences());
 
   const getAudioContext = useCallback(() => {
     if (!audioContextRef.current) {
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
     }
     if (audioContextRef.current.state === 'suspended') {
       audioContextRef.current.resume();
     }
     return audioContextRef.current;
   }, []);
 
   const playNote = useCallback((
     frequency: number, 
     startTime: number, 
     duration: number, 
     volume: number = 0.2,
     type: OscillatorType = 'sine'
   ) => {
     const ctx = getAudioContext();
     
     const oscillator = ctx.createOscillator();
     const gainNode = ctx.createGain();
     
     oscillator.connect(gainNode);
     gainNode.connect(ctx.destination);
     
     oscillator.frequency.value = frequency;
     oscillator.type = type;
     
     const adjustedVolume = volume * preferencesRef.current.volume;
     
     gainNode.gain.setValueAtTime(0, startTime);
     gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + 0.015);
     gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
     
     oscillator.start(startTime);
     oscillator.stop(startTime + duration + 0.01);
   }, [getAudioContext]);
 
   const playMelody = useCallback((notes: MelodyNote[]) => {
     try {
       const ctx = getAudioContext();
       const now = ctx.currentTime;
       
       notes.forEach(note => {
         playNote(
           note.freq, 
           now + note.time, 
           note.dur, 
           note.vol ?? 0.2,
           note.type ?? 'sine'
         );
       });
     } catch (e) {
       console.warn('Could not play melody:', e);
     }
   }, [getAudioContext, playNote]);
 
   // Main play function - checks preferences before playing
   const play = useCallback((soundName: SoundName) => {
     const prefs = preferencesRef.current;
     
     // Check if sounds are enabled globally
     if (!prefs.enabled) return;
     
     // Check if category is enabled
     const category = SOUND_CATEGORIES[soundName];
     if (!prefs.categories[category]) return;
     
     // Get melody for current style
     const melodies = STYLE_MELODIES[prefs.style];
     const melody = melodies[soundName];
     
     if (melody) {
       playMelody(melody);
     }
   }, [playMelody]);
 
   // Preferences management
   const getPreferences = useCallback(() => {
     return { ...preferencesRef.current };
   }, []);
 
   const updatePreferences = useCallback((updates: Partial<SoundPreferences>) => {
     preferencesRef.current = { ...preferencesRef.current, ...updates };
     savePreferences(preferencesRef.current);
   }, []);
 
   const setEnabled = useCallback((enabled: boolean) => {
     updatePreferences({ enabled });
   }, [updatePreferences]);
 
   const setVolume = useCallback((volume: number) => {
     updatePreferences({ volume: Math.max(0, Math.min(1, volume)) });
   }, [updatePreferences]);
 
   const setStyle = useCallback((style: SoundStyle) => {
     updatePreferences({ style });
   }, [updatePreferences]);
 
   const setCategoryEnabled = useCallback((category: SoundCategory, enabled: boolean) => {
     const prefs = preferencesRef.current;
     updatePreferences({
       categories: { ...prefs.categories, [category]: enabled }
     });
   }, [updatePreferences]);
 
   const setHapticEnabled = useCallback((enabled: boolean) => {
     updatePreferences({ hapticEnabled: enabled });
   }, [updatePreferences]);
 
   // Preview a sound (bypasses category checks for testing)
   const preview = useCallback((soundName: SoundName, style?: SoundStyle) => {
     const prefs = preferencesRef.current;
     const melodies = STYLE_MELODIES[style ?? prefs.style];
     const melody = melodies[soundName];
     
     if (melody) {
       playMelody(melody);
     }
   }, [playMelody]);
 
   // Convenience methods for common sounds
   const playCreate = useCallback(() => play('create'), [play]);
   const playUpdate = useCallback(() => play('update'), [play]);
   const playDelete = useCallback(() => play('delete'), [play]);
   const playSave = useCallback(() => play('save'), [play]);
   const playSuccess = useCallback(() => play('success'), [play]);
   const playError = useCallback(() => play('error'), [play]);
   const playWarning = useCallback(() => play('warning'), [play]);
   const playNotification = useCallback(() => play('notification'), [play]);
   const playLevelUp = useCallback(() => play('levelUp'), [play]);
   const playAchievement = useCallback(() => play('achievement'), [play]);
   const playGoalReached = useCallback(() => play('goalReached'), [play]);
   const playStreakMilestone = useCallback(() => play('streakMilestone'), [play]);
 
   return {
     // Main play function
     play,
     preview,
     
     // Convenience methods
     playCreate,
     playUpdate,
     playDelete,
     playSave,
     playSuccess,
     playError,
     playWarning,
     playNotification,
     playLevelUp,
     playAchievement,
     playGoalReached,
     playStreakMilestone,
     
     // Preferences
     getPreferences,
     updatePreferences,
     setEnabled,
     setVolume,
     setStyle,
     setCategoryEnabled,
     setHapticEnabled,
   };
 }