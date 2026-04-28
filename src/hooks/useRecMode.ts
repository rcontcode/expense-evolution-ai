import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'demo-studio-rec-mode';
const QUIET_KEY = 'demo-studio-quiet-mode';
const EVENT_NAME = 'rec-mode-changed';

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function readQuiet(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(QUIET_KEY) === 'true';
}

function applyBodyClasses(active: boolean, quiet: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('rec-mode', active);
  document.body.classList.toggle('quiet-mode', active && quiet);
}

export function useRecMode() {
  const [active, setActive] = useState<boolean>(() => readStored());
  const [quietMode, setQuietState] = useState<boolean>(() => readQuiet());

  useEffect(() => {
    applyBodyClasses(active, quietMode);
  }, [active, quietMode]);

  useEffect(() => {
    const handler = () => {
      setActive(readStored());
      setQuietState(readQuiet());
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !readStored();
    localStorage.setItem(STORAGE_KEY, String(next));
    applyBodyClasses(next, readQuiet());
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setMode = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    applyBodyClasses(next, readQuiet());
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setQuiet = useCallback((next: boolean) => {
    localStorage.setItem(QUIET_KEY, String(next));
    applyBodyClasses(readStored(), next);
    setQuietState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { active, quietMode, toggle, setMode, setQuiet };
}
