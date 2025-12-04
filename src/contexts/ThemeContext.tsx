import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeStyle = 'modern' | 'vintage' | 'ocean' | 'forest' | 'sunset' | 'minimal';

interface ThemeContextType {
  mode: ThemeMode;
  style: ThemeStyle;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  resolvedMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_MODE_KEY = 'expense-tracker-theme-mode';
const THEME_STYLE_KEY = 'expense-tracker-theme-style';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(THEME_MODE_KEY) as ThemeMode) || 'system';
    }
    return 'system';
  });

  const [style, setStyleState] = useState<ThemeStyle>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(THEME_STYLE_KEY) as ThemeStyle) || 'modern';
    }
    return 'modern';
  });

  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

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
    root.classList.remove('theme-modern', 'theme-vintage', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-minimal');

    // Apply new classes
    root.classList.add(newResolvedMode);
    root.classList.add(`theme-${style}`);

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
  }, [mode, style]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  const setStyle = (newStyle: ThemeStyle) => {
    setStyleState(newStyle);
    localStorage.setItem(THEME_STYLE_KEY, newStyle);
  };

  return (
    <ThemeContext.Provider value={{ mode, style, setMode, setStyle, resolvedMode }}>
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
