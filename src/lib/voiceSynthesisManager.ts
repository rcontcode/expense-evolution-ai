/**
 * VoiceSynthesisManager - Global singleton for voice synthesis
 * 
 * Prevents duplicate speech across components by using a single point of control.
 * Implements mutex pattern to ensure only one utterance plays at a time.
 */

type SpeakCallback = (text: string) => void;
type EndCallback = () => void;

interface SynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  voiceGender?: 'male' | 'female' | 'auto';
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class VoiceSynthesisManager {
  private static instance: VoiceSynthesisManager | null = null;
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private queue: Array<{ text: string; options?: SynthesisOptions }> = [];
  private isProcessingQueue = false;
  private lastSpokeText = '';
  private lastSpokeTime = 0;
  private debounceMs = 300;

  private constructor() {
    // Load voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
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
   * Get best voice for language
   */
  private getBestVoice(lang: string, gender: 'male' | 'female' | 'auto', voiceName?: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // User selected specific voice
    if (voiceName) {
      const selected = voices.find(v => v.name === voiceName);
      if (selected) return selected;
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

    if (gender !== 'auto' && langVoices.length > 0) {
      const femalePatterns = /female|mujer|femenin|samantha|victoria|karen|monica|paulina|helena|zira|hazel|susan|alice|fiona|moira|tessa|ava|allison|kate|francisca|catalina|ximena|carmen|valentina|amelie|chloe|marie|nathalie|sylvie|angelica|ines|consuelo|esperanza|lucia|rosa/i;
      const malePatterns = /male|hombre|masculin|alex|jorge|daniel|david|diego|enrique|carlos|mark|thomas|oliver|james|fred|lee|rishi|aaron|andres|pablo|rodrigo|mateo|sebastian|nicolas|felipe|ivan|pedro|antonio|luis|miguel|juan|manuel|jean|pierre|jacques|claude|benoit|francois/i;

      const targetPattern = gender === 'female' ? femalePatterns : malePatterns;
      let voice = langVoices.find(v => v.localService && targetPattern.test(v.name));
      if (!voice) voice = langVoices.find(v => targetPattern.test(v.name));
      if (!voice) voice = langVoices.find(v => v.localService);
      if (!voice) voice = langVoices[0];
      return voice;
    }

    return langVoices.find(v => v.localService) || langVoices[0] || null;
  }

  /**
   * Speak text (with deduplication and queue management)
   */
  public speak(text: string, options?: SynthesisOptions): void {
    if (!text?.trim()) return;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[VoiceSynthesisManager] Speech synthesis not available');
      return;
    }

    const cleaned = this.cleanText(text);
    if (!cleaned) return;

    // Deduplication: Don't repeat the same text within debounceMs
    const now = Date.now();
    if (cleaned === this.lastSpokeText && now - this.lastSpokeTime < this.debounceMs) {
      console.log('[VoiceSynthesisManager] Deduplicating:', cleaned.substring(0, 50));
      return;
    }

    this.lastSpokeText = cleaned;
    this.lastSpokeTime = now;

    // Cancel any ongoing speech
    this.stop();

    // Speak immediately
    this.speakImmediate(cleaned, options);
  }

  private speakImmediate(text: string, options?: SynthesisOptions): void {
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
      options?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('[VoiceSynthesisManager] Error:', event);
      this.isSpeaking = false;
      this.currentUtterance = null;
      options?.onError?.(new Error(event.error || 'Speech synthesis error'));
    };

    this.currentUtterance = utterance;
    
    // Small delay to ensure previous cancel took effect
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }

  /**
   * Stop all speech
   */
  public stop(): void {
    window.speechSynthesis?.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.queue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Pause speech
   */
  public pause(): void {
    window.speechSynthesis?.pause();
  }

  /**
   * Resume speech
   */
  public resume(): void {
    window.speechSynthesis?.resume();
  }

  /**
   * Check if speaking
   */
  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

// Export singleton instance
export const voiceSynthesisManager = VoiceSynthesisManager.getInstance();
