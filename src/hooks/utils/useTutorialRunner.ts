import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHighlight } from '@/contexts/HighlightContext';
import { useVoiceSynthesis } from '@/hooks/utils/useVoiceSynthesis';

export interface TutorialStep {
  route?: string;        // Navigate to this route first (optional)
  highlight: string;     // Selector of element to highlight (data-highlight value)
  narration: string;     // Text the assistant says
  waitForClick?: boolean; // Wait for user to click before advancing
  delay?: number;        // Custom delay before next step (ms)
}

export interface Tutorial {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  steps: TutorialStep[];
}

interface UseTutorialRunnerOptions {
  language?: 'es' | 'en';
  onStepStart?: (step: TutorialStep, index: number) => void;
  onStepComplete?: (step: TutorialStep, index: number) => void;
  onTutorialComplete?: () => void;
}

export function useTutorialRunner(options: UseTutorialRunnerOptions = {}) {
  const { language = 'es', onStepStart, onStepComplete, onTutorialComplete } = options;
  
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { highlight, clearHighlights } = useHighlight();
  const { speak, isSpeaking, stop: stopSpeaking } = useVoiceSynthesis();
  
  // Check if voice is supported
  const isVoiceSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  
  const stepsRef = useRef<TutorialStep[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const executeStep = useCallback((index: number) => {
    const steps = stepsRef.current;
    
    if (index >= steps.length) {
      // Tutorial complete
      setIsRunning(false);
      setCurrentStepIndex(-1);
      clearHighlights();
      onTutorialComplete?.();
      return;
    }
    
    const step = steps[index];
    setCurrentStepIndex(index);
    onStepStart?.(step, index);
    
    console.log('[Tutorial] Executing step', index, ':', step.narration.substring(0, 50));
    
    // If step requires navigation
    if (step.route && location.pathname !== step.route) {
      navigate(step.route);
      
      // Wait for navigation and page render
      timeoutRef.current = setTimeout(() => {
        performStepActions(step, index);
      }, 1000);
    } else {
      // Already on correct page
      performStepActions(step, index);
    }
  }, [location.pathname, navigate, clearHighlights, onStepStart, onTutorialComplete]);

  const performStepActions = useCallback((step: TutorialStep, index: number) => {
    // Clear previous highlights
    clearHighlights();
    
    // Activate highlight on target element
    setTimeout(() => {
      highlight([{ selector: step.highlight, label: step.narration }]);
    }, 200);
    
    // Speak narration
    if (isVoiceSupported) {
      speak(step.narration);
    }
    
    // Calculate delay based on narration length
    const baseDelay = step.delay || Math.max(4000, step.narration.length * 60);
    
    // If waitForClick, don't auto-advance
    if (!step.waitForClick) {
      timeoutRef.current = setTimeout(() => {
        onStepComplete?.(step, index);
        executeStep(index + 1);
      }, baseDelay);
    }
  }, [clearHighlights, highlight, isVoiceSupported, speak, onStepComplete, executeStep]);

  const runTutorial = useCallback((tutorial: Tutorial) => {
    console.log('[Tutorial] Starting:', tutorial.id);
    
    clearTimeouts();
    stopSpeaking();
    clearHighlights();
    
    setCurrentTutorial(tutorial);
    stepsRef.current = tutorial.steps;
    setIsRunning(true);
    
    // Start first step
    executeStep(0);
  }, [clearTimeouts, stopSpeaking, clearHighlights, executeStep]);

  const runSteps = useCallback((steps: TutorialStep[]) => {
    console.log('[Tutorial] Running', steps.length, 'steps');
    
    clearTimeouts();
    stopSpeaking();
    clearHighlights();
    
    stepsRef.current = steps;
    setIsRunning(true);
    
    executeStep(0);
  }, [clearTimeouts, stopSpeaking, clearHighlights, executeStep]);

  const nextStep = useCallback(() => {
    if (!isRunning) return;
    
    const steps = stepsRef.current;
    const nextIndex = currentStepIndex + 1;
    
    clearTimeouts();
    onStepComplete?.(steps[currentStepIndex], currentStepIndex);
    executeStep(nextIndex);
  }, [isRunning, currentStepIndex, clearTimeouts, onStepComplete, executeStep]);

  const previousStep = useCallback(() => {
    if (!isRunning || currentStepIndex <= 0) return;
    
    clearTimeouts();
    executeStep(currentStepIndex - 1);
  }, [isRunning, currentStepIndex, clearTimeouts, executeStep]);

  const stopTutorial = useCallback(() => {
    console.log('[Tutorial] Stopping');
    
    clearTimeouts();
    stopSpeaking();
    clearHighlights();
    
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setCurrentTutorial(null);
    stepsRef.current = [];
  }, [clearTimeouts, stopSpeaking, clearHighlights]);

  const pauseTutorial = useCallback(() => {
    clearTimeouts();
    stopSpeaking();
  }, [clearTimeouts, stopSpeaking]);

  const resumeTutorial = useCallback(() => {
    if (currentStepIndex >= 0) {
      executeStep(currentStepIndex);
    }
  }, [currentStepIndex, executeStep]);

  return {
    // State
    isRunning,
    currentStepIndex,
    currentTutorial,
    currentStep: stepsRef.current[currentStepIndex] || null,
    totalSteps: stepsRef.current.length,
    isSpeaking,
    
    // Actions
    runTutorial,
    runSteps,
    nextStep,
    previousStep,
    stopTutorial,
    pauseTutorial,
    resumeTutorial,
  };
}
