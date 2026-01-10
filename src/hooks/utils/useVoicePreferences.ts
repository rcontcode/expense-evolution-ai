import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceGender = 'female' | 'male' | 'auto';

interface VoicePreferences {
  // Voice experience
  speechSpeed: number; // 0.5 to 2.0
  volume: number; // 0 to 1
  pitch: number; // 0 to 2
  voiceGender: VoiceGender; // Female, male, or auto
  selectedVoiceName: string | null; // Specific voice name selected by user
  enableSoundEffects: boolean;
  confirmDestructiveActions: boolean;
  
  // Personalization
  customShortcuts: VoiceShortcut[];
  frequentActions: ActionFrequency[];
  voiceReminders: VoiceReminder[];
  
  // Persistence
  conversationHistory: ConversationEntry[];
  lastActiveDate: string;
}

interface VoiceShortcut {
  id: string;
  trigger: string[];  // Multiple trigger phrases
  action: 'navigate' | 'query' | 'create' | 'custom';
  route?: string;
  queryType?: string;
  customCommand?: string;
  name: { es: string; en: string };
}

interface ActionFrequency {
  action: string;
  count: number;
  lastUsed: string;
}

interface VoiceReminder {
  id: string;
  message: { es: string; en: string };
  time: string; // HH:MM format
  days: number[]; // 0-6, Sunday = 0
  enabled: boolean;
  lastTriggered?: string;
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  page?: string;
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  speechSpeed: 1.0,
  volume: 1.0,
  pitch: 1.0,
  voiceGender: 'female',
  selectedVoiceName: null,
  enableSoundEffects: true,
  confirmDestructiveActions: true,
  customShortcuts: [],
  frequentActions: [],
  voiceReminders: [],
  conversationHistory: [],
  lastActiveDate: new Date().toISOString().split('T')[0],
};

const STORAGE_KEY = 'evofinz_voice_preferences';

// Sound effects URLs (using Web Audio API for generation)
const SOUND_EFFECTS = {
  success: { frequency: 880, duration: 0.1, type: 'sine' as OscillatorType },
  error: { frequency: 200, duration: 0.3, type: 'sawtooth' as OscillatorType },
  confirm: { frequency: 660, duration: 0.15, type: 'sine' as OscillatorType },
  notification: { frequency: 523, duration: 0.2, type: 'triangle' as OscillatorType },
  listening: { frequency: 440, duration: 0.08, type: 'sine' as OscillatorType },
};

export function useVoicePreferences() {
  const [preferences, setPreferences] = useState<VoicePreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load voice preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const audioInitializedRef = useRef(false);

  // Initialize audio context on first user interaction - more robust approach
  useEffect(() => {
    const initAudio = () => {
      if (audioInitializedRef.current) return;
      
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        
        // Resume context if suspended (required by some browsers)
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            console.log('[Audio] Context resumed successfully');
          }).catch(console.error);
        }
        
        setAudioContext(ctx);
        audioInitializedRef.current = true;
        console.log('[Audio] Context initialized');
      } catch (e) {
        console.error('[Audio] Failed to create AudioContext:', e);
      }
    };

    // Try to initialize on multiple events for better coverage
    const events = ['click', 'keydown', 'touchstart', 'pointerdown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
    };
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save voice preferences:', e);
    }
  }, [preferences]);

  // Play sound effect
  const playSound = useCallback((type: keyof typeof SOUND_EFFECTS) => {
    if (!preferences.enableSoundEffects || !audioContext) return;

    try {
      const sound = SOUND_EFFECTS[type];
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = sound.type;
      oscillator.frequency.value = sound.frequency;
      
      gainNode.gain.setValueAtTime(0.3 * preferences.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + sound.duration);
    } catch (e) {
      console.error('Failed to play sound:', e);
    }
  }, [audioContext, preferences.enableSoundEffects, preferences.volume]);

  // Update speech speed
  const setSpeechSpeed = useCallback((speed: number) => {
    setPreferences(prev => ({ ...prev, speechSpeed: Math.max(0.5, Math.min(2.0, speed)) }));
  }, []);

  // Update volume
  const setVolume = useCallback((volume: number) => {
    setPreferences(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  // Update pitch
  const setPitch = useCallback((pitch: number) => {
    setPreferences(prev => ({ ...prev, pitch: Math.max(0.5, Math.min(2, pitch)) }));
  }, []);

  // Update voice gender
  const setVoiceGender = useCallback((gender: VoiceGender) => {
    setPreferences(prev => ({ ...prev, voiceGender: gender, selectedVoiceName: null }));
  }, []);

  // Set specific voice by name
  const setSelectedVoice = useCallback((voiceName: string | null) => {
    setPreferences(prev => ({ ...prev, selectedVoiceName: voiceName }));
  }, []);

  // Toggle sound effects
  const toggleSoundEffects = useCallback(() => {
    setPreferences(prev => ({ ...prev, enableSoundEffects: !prev.enableSoundEffects }));
  }, []);

  // Toggle destructive action confirmation
  const toggleConfirmDestructive = useCallback(() => {
    setPreferences(prev => ({ ...prev, confirmDestructiveActions: !prev.confirmDestructiveActions }));
  }, []);

  // Add custom shortcut
  const addShortcut = useCallback((shortcut: Omit<VoiceShortcut, 'id'>) => {
    const newShortcut: VoiceShortcut = {
      ...shortcut,
      id: `shortcut_${Date.now()}`,
    };
    setPreferences(prev => ({
      ...prev,
      customShortcuts: [...prev.customShortcuts, newShortcut],
    }));
    return newShortcut.id;
  }, []);

  // Remove custom shortcut
  const removeShortcut = useCallback((id: string) => {
    setPreferences(prev => ({
      ...prev,
      customShortcuts: prev.customShortcuts.filter(s => s.id !== id),
    }));
  }, []);

  // Track action frequency
  const trackAction = useCallback((action: string) => {
    setPreferences(prev => {
      const existing = prev.frequentActions.find(a => a.action === action);
      const now = new Date().toISOString();
      
      if (existing) {
        return {
          ...prev,
          frequentActions: prev.frequentActions.map(a =>
            a.action === action
              ? { ...a, count: a.count + 1, lastUsed: now }
              : a
          ).sort((a, b) => b.count - a.count),
        };
      } else {
        return {
          ...prev,
          frequentActions: [
            ...prev.frequentActions,
            { action, count: 1, lastUsed: now },
          ].sort((a, b) => b.count - a.count),
        };
      }
    });
  }, []);

  // Get top frequent actions
  const getTopActions = useCallback((limit = 5) => {
    return preferences.frequentActions.slice(0, limit);
  }, [preferences.frequentActions]);

  // Add voice reminder
  const addReminder = useCallback((reminder: Omit<VoiceReminder, 'id'>) => {
    const newReminder: VoiceReminder = {
      ...reminder,
      id: `reminder_${Date.now()}`,
    };
    setPreferences(prev => ({
      ...prev,
      voiceReminders: [...prev.voiceReminders, newReminder],
    }));
    return newReminder.id;
  }, []);

  // Remove reminder
  const removeReminder = useCallback((id: string) => {
    setPreferences(prev => ({
      ...prev,
      voiceReminders: prev.voiceReminders.filter(r => r.id !== id),
    }));
  }, []);

  // Toggle reminder
  const toggleReminder = useCallback((id: string) => {
    setPreferences(prev => ({
      ...prev,
      voiceReminders: prev.voiceReminders.map(r =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    }));
  }, []);

  // Check for due reminders
  const checkReminders = useCallback((language: 'es' | 'en'): string[] => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();
    const today = now.toISOString().split('T')[0];

    const dueReminders: string[] = [];

    preferences.voiceReminders.forEach(reminder => {
      if (
        reminder.enabled &&
        reminder.days.includes(currentDay) &&
        reminder.time === currentTime &&
        reminder.lastTriggered !== today
      ) {
        dueReminders.push(reminder.message[language]);
        
        // Mark as triggered
        setPreferences(prev => ({
          ...prev,
          voiceReminders: prev.voiceReminders.map(r =>
            r.id === reminder.id ? { ...r, lastTriggered: today } : r
          ),
        }));
      }
    });

    return dueReminders;
  }, [preferences.voiceReminders]);

  // Add to conversation history (keep last 50 entries)
  const addToHistory = useCallback((entry: Omit<ConversationEntry, 'timestamp'>) => {
    setPreferences(prev => ({
      ...prev,
      conversationHistory: [
        ...prev.conversationHistory.slice(-49),
        { ...entry, timestamp: new Date().toISOString() },
      ],
    }));
  }, []);

  // Get recent conversation context
  const getRecentContext = useCallback((limit = 10) => {
    return preferences.conversationHistory.slice(-limit);
  }, [preferences.conversationHistory]);

  // Clear history
  const clearHistory = useCallback(() => {
    setPreferences(prev => ({ ...prev, conversationHistory: [] }));
  }, []);

  // Check custom shortcuts
  const checkCustomShortcut = useCallback((text: string): VoiceShortcut | null => {
    const normalizedText = text.toLowerCase().trim();
    
    for (const shortcut of preferences.customShortcuts) {
      for (const trigger of shortcut.trigger) {
        if (normalizedText.includes(trigger.toLowerCase())) {
          return shortcut;
        }
      }
    }
    
    return null;
  }, [preferences.customShortcuts]);

  return {
    // Preferences
    preferences,
    speechSpeed: preferences.speechSpeed,
    volume: preferences.volume,
    pitch: preferences.pitch,
    voiceGender: preferences.voiceGender,
    selectedVoiceName: preferences.selectedVoiceName,
    enableSoundEffects: preferences.enableSoundEffects,
    confirmDestructiveActions: preferences.confirmDestructiveActions,
    customShortcuts: preferences.customShortcuts,
    voiceReminders: preferences.voiceReminders,
    
    // Sound effects
    playSound,
    
    // Settings
    setSpeechSpeed,
    setVolume,
    setPitch,
    setVoiceGender,
    setSelectedVoice,
    toggleSoundEffects,
    toggleConfirmDestructive,
    
    // Shortcuts
    addShortcut,
    removeShortcut,
    checkCustomShortcut,
    
    // Action tracking
    trackAction,
    getTopActions,
    
    // Reminders
    addReminder,
    removeReminder,
    toggleReminder,
    checkReminders,
    
    // History
    addToHistory,
    getRecentContext,
    clearHistory,
  };
}
