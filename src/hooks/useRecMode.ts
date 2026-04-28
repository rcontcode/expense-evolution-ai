import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'demo-studio-rec-mode';
const EVENT_NAME = 'rec-mode-changed';

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function applyBodyClass(active: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('rec-mode', active);
}

export function useRecMode() {
  const [active, setActive] = useState<boolean>(() => readStored());

  useEffect(() => {
    applyBodyClass(active);
  }, [active]);

  useEffect(() => {
    const handler = () => setActive(readStored());
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
    applyBodyClass(next);
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setMode = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    applyBodyClass(next);
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { active, toggle, setMode };
}
