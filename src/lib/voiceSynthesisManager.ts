/**
 * VoiceSynthesisManager - Global singleton for voice synthesis v2
 * 
 * Prevents duplicate speech across components by using a single point of control.
 * Implements mutex pattern to ensure only one utterance plays at a time.
 * Enhanced with priority queue, interruption handling, and smart caching.
 */

type SpeakPriority = 'low' | 'normal' | 'high' | 'critical';

interface SynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  voiceGender?: 'male' | 'female' | 'auto';
  priority?: SpeakPriority;
  interruptible?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  onWord?: (charIndex: number, word: string) => void;
}

interface QueuedUtterance {
  id: string;
  text: string;
  options?: SynthesisOptions;
  priority: SpeakPriority;
  timestamp: number;
}

const PRIORITY_VALUES: Record<SpeakPriority, number> = {
  low: 0,
  normal: 1,
  high: 2,
  critical: 3,
};

class VoiceSynthesisManager {
  private static instance: VoiceSynthesisManager | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentOptions: SynthesisOptions | null = null;
  private queue: QueuedUtterance[] = [];
  private isProcessingQueue = false;
  private lastSpokeText = '';
  private lastSpokeTime = 0;
  private debounceMs = 300;
  private utteranceIdCounter = 0;
  private voiceCache: Map<string, SpeechSynthesisVoice> = new Map();

  private constructor() {
    // Load voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  private loadVoices(): void {
    const voices = window.speechSynthesis.getVoices();
    this.voiceCache.clear();
    
    // Pre-cache best voices for common locales
    const locales = ['es-CL', 'es-MX', 'es-ES', 'en-CA', 'en-US', 'en-GB'];
    locales.forEach(locale => {
      const voice = voices.find(v => v.lang === locale && v.localService);
      if (voice) {
        this.voiceCache.set(locale, voice);
      }
    });
  }

  public static getInstance(): VoiceSynthesisManager {
    if (!VoiceSynthesisManager.instance) {
      VoiceSynthesisManager.instance = new VoiceSynthesisManager();
    }
    return VoiceSynthesisManager.instance;
  }

  /**
   * Clean text for speech synthesis
   */
  private cleanText(text: string): string {
    return text
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/gu, '') // Emojis
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^[\s]*[-•◦▪▸►]\s*/gm, '')
      .replace(/^\s*\d+\.\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get best voice for language (with caching)
   */
  private getBestVoice(lang: string, gender: 'male' | 'female' | 'auto', voiceName?: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // User selected specific voice
    if (voiceName) {
      const selected = voices.find(v => v.name === voiceName);
      if (selected) return selected;
    }

    // Check cache first
    const cacheKey = `${lang}-${gender}`;
    if (this.voiceCache.has(cacheKey)) {
      return this.voiceCache.get(cacheKey)!;
    }

    const isSpanish = lang.startsWith('es');
    const localePreference = isSpanish
      ? ['es-CL', 'es-MX', 'es-419', 'es-ES', 'es-US', 'es']
      : ['en-CA', 'en-US', 'en-GB', 'en-AU', 'en'];

    let langVoices: SpeechSynthesisVoice[] = [];
    for (const locale of localePreference) {
      const matching = voices.filter(v =>
        locale.includes('-') ? v.lang === locale : v.lang.startsWith(locale)
      );
      if (matching.length > 0) {
        langVoices = matching;
        break;
      }
    }

    if (langVoices.length === 0) {
      const baseLang = isSpanish ? 'es' : 'en';
      langVoices = voices.filter(v => v.lang.startsWith(baseLang));
    }

    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (gender !== 'auto' && langVoices.length > 0) {
      const femalePatterns = /female|mujer|femenin|samantha|victoria|karen|monica|paulina|helena|zira|hazel|susan|alice|fiona|moira|tessa|ava|allison|kate|francisca|catalina|ximena|carmen|valentina|amelie|chloe|marie|nathalie|sylvie|angelica|ines|consuelo|esperanza|lucia|rosa/i;
      const malePatterns = /male|hombre|masculin|alex|jorge|daniel|david|diego|enrique|carlos|mark|thomas|oliver|james|fred|lee|rishi|aaron|andres|pablo|rodrigo|mateo|sebastian|nicolas|felipe|ivan|pedro|antonio|luis|miguel|juan|manuel|jean|pierre|jacques|claude|benoit|francois/i;

      const targetPattern = gender === 'female' ? femalePatterns : malePatterns;
      selectedVoice = langVoices.find(v => v.localService && targetPattern.test(v.name)) || 
                      langVoices.find(v => targetPattern.test(v.name)) ||
                      langVoices.find(v => v.localService) ||
                      langVoices[0];
    } else {
      selectedVoice = langVoices.find(v => v.localService) || langVoices[0] || null;
    }

    // Cache the result
    if (selectedVoice) {
      this.voiceCache.set(cacheKey, selectedVoice);
    }

    return selectedVoice;
  }

  /**
   * Add to queue and process
   */
  public speak(text: string, options?: SynthesisOptions): string {
    if (!text?.trim()) return '';
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[VoiceSynthesisManager] Speech synthesis not available');
      return '';
    }

    const cleaned = this.cleanText(text);
    if (!cleaned) return '';

    // Deduplication: Don't repeat the same text within debounceMs
    const now = Date.now();
    if (cleaned === this.lastSpokeText && now - this.lastSpokeTime < this.debounceMs) {
      console.log('[VoiceSynthesisManager] Deduplicating:', cleaned.substring(0, 50));
      return '';
    }

    this.lastSpokeText = cleaned;
    this.lastSpokeTime = now;

    const priority = options?.priority || 'normal';
    const id = `utterance-${++this.utteranceIdCounter}`;

    // For critical priority, interrupt current speech
    if (priority === 'critical' && this.isSpeaking) {
      this.stop();
    }

    // Add to queue with priority
    const queueItem: QueuedUtterance = {
      id,
      text: cleaned,
      options,
      priority,
      timestamp: now,
    };

    // Insert based on priority
    const insertIndex = this.queue.findIndex(
      q => PRIORITY_VALUES[q.priority] < PRIORITY_VALUES[priority]
    );
    
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    // Process queue
    this.processQueue();

    return id;
  }

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (this.isProcessingQueue || this.isSpeaking || this.queue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    const next = this.queue.shift();

    if (next) {
      this.speakImmediate(next.text, next.options);
    }

    this.isProcessingQueue = false;
  }

  private speakImmediate(text: string, options?: SynthesisOptions): void {
    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = options?.lang || 'es-ES';
    utterance.rate = (options?.rate ?? 1.0) * 0.95;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    const voice = this.getBestVoice(
      utterance.lang,
      options?.voiceGender ?? 'female',
      options?.voiceName
    );
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.isPaused = false;
      this.currentOptions = options || null;
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.currentOptions = null;
      options?.onEnd?.();
      
      // Process next in queue
      setTimeout(() => this.processQueue(), 50);
    };

    utterance.onerror = (event) => {
      if (event.error !== 'interrupted') {
        console.error('[VoiceSynthesisManager] Error:', event);
        options?.onError?.(new Error(event.error || 'Speech synthesis error'));
      }
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.currentOptions = null;
      
      // Continue with queue even on error
      setTimeout(() => this.processQueue(), 50);
    };

    // Word boundary events for karaoke-style highlighting
    utterance.onboundary = (event) => {
      if (event.name === 'word' && options?.onWord) {
        const word = text.substring(event.charIndex, event.charIndex + (event.charLength || 10));
        options.onWord(event.charIndex, word);
      }
    };

    this.currentUtterance = utterance;
    
    // Small delay to ensure previous cancel took effect
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }

  /**
   * Interrupt with new speech (for high priority)
   */
  public interrupt(text: string, options?: SynthesisOptions): string {
    return this.speak(text, { ...options, priority: 'critical' });
  }

  /**
   * Stop all speech and clear queue
   */
  public stop(): void {
    window.speechSynthesis?.cancel();
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.currentOptions = null;
    this.queue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Stop current but keep queue
   */
  public skip(): void {
    window.speechSynthesis?.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
    // Don't clear queue - process next
    setTimeout(() => this.processQueue(), 50);
  }

  /**
   * Pause speech
   */
  public pause(): void {
    if (this.isSpeaking && !this.isPaused) {
      window.speechSynthesis?.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speech
   */
  public resume(): void {
    if (this.isPaused) {
      window.speechSynthesis?.resume();
      this.isPaused = false;
    }
  }

  /**
   * Clear the queue without stopping current speech
   */
  public clearQueue(): void {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if speaking
   */
  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Check if paused
   */
  public getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Get available voices for a language
   */
  public getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
    const voices = window.speechSynthesis?.getVoices() || [];
    return voices.filter(v => v.lang.startsWith(lang));
  }
}

// Export singleton instance
export const voiceSynthesisManager = VoiceSynthesisManager.getInstance();
