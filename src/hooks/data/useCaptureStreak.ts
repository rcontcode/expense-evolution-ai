import { useState, useEffect, useCallback } from 'react';

export interface CaptureStreak {
  currentStreak: number;
  longestStreak: number;
  lastCaptureDate: string | null;
  todayCount: number;
  dailyGoal: number;
}

const STORAGE_KEY = 'capture-streak-data';
const DEFAULT_DAILY_GOAL = 5;

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

export function useCaptureStreak() {
  const [streakData, setStreakData] = useState<CaptureStreak>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        
        // Reset today count if it's a new day
        if (parsed.lastCaptureDate !== today) {
          // Check if streak should continue (captured yesterday) or reset
          if (parsed.lastCaptureDate === yesterday) {
            return { ...parsed, todayCount: 0 };
          } else if (parsed.lastCaptureDate && parsed.lastCaptureDate < yesterday) {
            // Streak broken - reset
            return {
              currentStreak: 0,
              longestStreak: parsed.longestStreak || 0,
              lastCaptureDate: null,
              todayCount: 0,
              dailyGoal: parsed.dailyGoal || DEFAULT_DAILY_GOAL,
            };
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading streak data:', e);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCaptureDate: null,
      todayCount: 0,
      dailyGoal: DEFAULT_DAILY_GOAL,
    };
  });

  // Persist to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
  }, [streakData]);

  const recordCapture = useCallback((count: number = 1) => {
    setStreakData(prev => {
      const today = getTodayDateString();
      const yesterday = getYesterdayDateString();
      const wasFirstCaptureToday = prev.lastCaptureDate !== today;
      
      let newStreak = prev.currentStreak;
      
      if (wasFirstCaptureToday) {
        // First capture of the day
        if (prev.lastCaptureDate === yesterday) {
          // Continue streak
          newStreak = prev.currentStreak + 1;
        } else if (prev.lastCaptureDate === null || prev.lastCaptureDate < yesterday) {
          // Start new streak
          newStreak = 1;
        }
      }
      
      const newLongest = Math.max(prev.longestStreak, newStreak);
      const newTodayCount = wasFirstCaptureToday ? count : prev.todayCount + count;
      
      return {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCaptureDate: today,
        todayCount: newTodayCount,
        dailyGoal: prev.dailyGoal,
      };
    });
  }, []);

  const setDailyGoal = useCallback((goal: number) => {
    setStreakData(prev => ({ ...prev, dailyGoal: goal }));
  }, []);

  const goalProgress = Math.min((streakData.todayCount / streakData.dailyGoal) * 100, 100);
  const goalReached = streakData.todayCount >= streakData.dailyGoal;

  return {
    ...streakData,
    recordCapture,
    setDailyGoal,
    goalProgress,
    goalReached,
  };
}
