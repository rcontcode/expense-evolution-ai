import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 
  // Optimized themes (default)
  | 'evo-light' | 'evo-dark'
  // Classic
  | 'modern' | 'vintage' | 'ocean' | 'forest' | 'sunset' | 'minimal'
  // Seasons
  | 'spring' | 'summer' | 'autumn' | 'winter'
  // Interests
  | 'crypto' | 'gaming' | 'sports' | 'music' | 'coffee' | 'nature'
  // Creative themes
  | 'space' | 'photography' | 'travel' | 'cinema';
export type PremiumTheme = 'theme_midnight' | 'theme_aurora' | 'theme_golden' | 'theme_neon' | null;
export type AnimationSpeed = 'off' | 'slow' | 'normal' | 'fast';
export type AnimationIntensity = 'subtle' | 'normal' | 'vibrant';

interface ThemeContextType {
  mode: ThemeMode;
  style: ThemeStyle;
  premiumTheme: PremiumTheme;
  animationSpeed: AnimationSpeed;
  animationIntensity: AnimationIntensity;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  setAnimationIntensity: (intensity: AnimationIntensity) => void;
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'expense-tracker-theme-mode';
const THEME_STYLE_KEY = 'expense-tracker-theme-style';
const ANIMATION_SPEED_KEY = 'expense-tracker-animation-speed';
const ANIMATION_INTENSITY_KEY = 'expense-tracker-animation-intensity';
const REWARDS_STORAGE_KEY = 'user_rewards';

// Helper to get equipped premium theme from rewards
function getEquippedPremiumTheme(): PremiumTheme {
  try {
    const stored = localStorage.getItem(REWARDS_STORAGE_KEY);
    if (stored) {
      const rewards = JSON.parse(stored);
      for (const key of Object.keys(rewards)) {
        if (key.startsWith('theme_') && rewards[key]?.equipped) {
          return key as PremiumTheme;
        }
      }
    }
  } catch (e) {
    console.error('Error reading premium theme:', e);
  }
  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(THEME_MODE_KEY) as ThemeMode) || 'system';
    }
    return 'system';
  });

  const [style, setStyleState] = useState<ThemeStyle>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STYLE_KEY) as ThemeStyle;
      // Default to optimized themes
      if (!saved) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'evo-dark' : 'evo-light';
      }
      return saved;
    }
    return 'evo-light';
  });

  const [animationSpeed, setAnimationSpeedState] = useState<AnimationSpeed>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(ANIMATION_SPEED_KEY) as AnimationSpeed) || 'normal';
    }
    return 'normal';
  });

  const [animationIntensity, setAnimationIntensityState] = useState<AnimationIntensity>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(ANIMATION_INTENSITY_KEY) as AnimationIntensity) || 'normal';
    }
    return 'normal';
  });

  const [premiumTheme, setPremiumTheme] = useState<PremiumTheme>(() => {
    if (typeof window !== 'undefined') {
      return getEquippedPremiumTheme();
    }
    return null;
  });

  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  // Listen for premium theme changes from rewards system
  useEffect(() => {
    const handleThemeRewardChange = () => {
      setPremiumTheme(getEquippedPremiumTheme());
    };

    window.addEventListener('theme-reward-changed', handleThemeRewardChange);
    window.addEventListener('rewards-updated', handleThemeRewardChange);
    
    return () => {
      window.removeEventListener('theme-reward-changed', handleThemeRewardChange);
      window.removeEventListener('rewards-updated', handleThemeRewardChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Determine resolved mode
    let newResolvedMode: 'light' | 'dark' = 'light';
    if (mode === 'system') {
      newResolvedMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newResolvedMode = mode;
    }
    setResolvedMode(newResolvedMode);

    // Remove all theme classes
    root.classList.remove('light', 'dark');
    root.classList.remove(
      'theme-evo-light', 'theme-evo-dark',
      'theme-modern', 'theme-vintage', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-minimal',
      'theme-spring', 'theme-summer', 'theme-autumn', 'theme-winter',
      'theme-crypto', 'theme-gaming', 'theme-sports', 'theme-music', 'theme-coffee', 'theme-nature',
      'theme-space', 'theme-photography', 'theme-travel', 'theme-cinema',
      'theme-premium-midnight', 'theme-premium-aurora', 'theme-premium-golden', 'theme-premium-neon'
    );

    // Apply new classes
    root.classList.add(newResolvedMode);
    
    // Apply premium theme if equipped, otherwise use regular style
    if (premiumTheme) {
      root.classList.add(`theme-premium-${premiumTheme.replace('theme_', '')}`);
    } else {
      root.classList.add(`theme-${style}`);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        const newMode = mediaQuery.matches ? 'dark' : 'light';
        setResolvedMode(newMode);
        root.classList.remove('light', 'dark');
        root.classList.add(newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, style, premiumTheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  const setStyle = (newStyle: ThemeStyle) => {
    setStyleState(newStyle);
    localStorage.setItem(THEME_STYLE_KEY, newStyle);
  };

  const setAnimationSpeed = (speed: AnimationSpeed) => {
    setAnimationSpeedState(speed);
    localStorage.setItem(ANIMATION_SPEED_KEY, speed);
  };

  const setAnimationIntensity = (intensity: AnimationIntensity) => {
    setAnimationIntensityState(intensity);
    localStorage.setItem(ANIMATION_INTENSITY_KEY, intensity);
  };

  return (
    <ThemeContext.Provider value={{ 
      mode, style, premiumTheme, animationSpeed, animationIntensity,
      setMode, setStyle, setAnimationSpeed, setAnimationIntensity, resolvedMode 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
