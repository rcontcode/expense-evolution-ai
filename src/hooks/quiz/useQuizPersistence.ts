import { useState, useEffect, useCallback } from 'react';
import type { QuizData } from '@/pages/FinancialQuiz';

const STORAGE_KEY = 'evofinz_quiz_progress';
const EXPIRY_HOURS = 24;

interface PersistedQuizState {
  step: number;
  formData: QuizData;
  comments: string;
  savedAt: number;
}

export const useQuizPersistence = () => {
  const [hasPersistedData, setHasPersistedData] = useState(false);

  // Check for existing data on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed: PersistedQuizState = JSON.parse(stored);
        const hoursSinceSave = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
        
        // Only consider valid if saved within expiry window and has meaningful progress
        if (hoursSinceSave < EXPIRY_HOURS && parsed.step > 1) {
          setHasPersistedData(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save progress
  const saveProgress = useCallback((step: number, formData: QuizData, comments: string) => {
    const state: PersistedQuizState = {
      step,
      formData,
      comments,
      savedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  // Load persisted data
  const loadProgress = useCallback((): PersistedQuizState | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    try {
      const parsed: PersistedQuizState = JSON.parse(stored);
      const hoursSinceSave = (Date.now() - parsed.savedAt) / (1000 * 60 * 60);
      
      if (hoursSinceSave < EXPIRY_HOURS) {
        return parsed;
      }
    } catch {
      // Ignore errors
    }
    
    return null;
  }, []);

  // Clear persisted data
  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasPersistedData(false);
  }, []);

  return {
    hasPersistedData,
    saveProgress,
    loadProgress,
    clearProgress
  };
};
