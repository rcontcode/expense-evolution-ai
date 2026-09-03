import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'demo-studio-rec-mode';
const QUIET_KEY = 'demo-studio-quiet-mode';
/**
 * 2-sep-2026: tercer interruptor, «modo captura». REC Mode pinta un borde rojo en toda la
 * ventana, una pastilla «DEMO MODE» arriba a la izquierda y un boton rojo que late abajo a la
 * derecha. Para GRABAR VIDEO eso esta bien —avisa que no estas viendo tus datos de verdad—,
 * pero para una FOTO de pantalla arruina la imagen: la captura termina con un marco rojo y dos
 * etiquetas encima. Con este interruptor la mascara de identidad sigue puesta y el distintivo
 * desaparece. Para poder volver, el boton se sigue viendo dentro del propio Demo Studio.
 */
const CAPTURE_KEY = 'demo-studio-capture-mode';
const EVENT_NAME = 'rec-mode-changed';

function readStored(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function readQuiet(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(QUIET_KEY) === 'true';
}

function readCapture(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CAPTURE_KEY) === 'true';
}

function applyBodyClasses(active: boolean, quiet: boolean, capture = readCapture()) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('rec-mode', active);
  document.body.classList.toggle('quiet-mode', active && quiet);
  document.body.classList.toggle('capture-mode', active && capture);
}

export function useRecMode() {
  const [active, setActive] = useState<boolean>(() => readStored());
  const [quietMode, setQuietState] = useState<boolean>(() => readQuiet());
  const [captureMode, setCaptureState] = useState<boolean>(() => readCapture());

  useEffect(() => {
    applyBodyClasses(active, quietMode, captureMode);
  }, [active, quietMode, captureMode]);

  useEffect(() => {
    const handler = () => {
      setActive(readStored());
      setQuietState(readQuiet());
      setCaptureState(readCapture());
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
    applyBodyClasses(next, readQuiet(), readCapture());
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setMode = useCallback((next: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(next));
    applyBodyClasses(next, readQuiet(), readCapture());
    setActive(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setQuiet = useCallback((next: boolean) => {
    localStorage.setItem(QUIET_KEY, String(next));
    applyBodyClasses(readStored(), next);
    setQuietState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  const setCapture = useCallback((next: boolean) => {
    localStorage.setItem(CAPTURE_KEY, String(next));
    applyBodyClasses(readStored(), readQuiet(), next);
    setCaptureState(next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { active, quietMode, captureMode, toggle, setMode, setQuiet, setCapture };
}
