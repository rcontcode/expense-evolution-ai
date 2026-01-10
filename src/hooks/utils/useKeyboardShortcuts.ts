import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: { es: string; en: string };
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts across the app
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      if (ctrlMatch && altMatch && shiftMatch && keyMatch) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Default voice assistant keyboard shortcuts
 */
export function useVoiceKeyboardShortcuts({
  onToggleMic,
  onToggleContinuous,
  onStopSpeaking,
  onOpenChat,
  enabled = true,
}: {
  onToggleMic: () => void;
  onToggleContinuous: () => void;
  onStopSpeaking: () => void;
  onOpenChat: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'm',
      ctrl: true,
      action: onToggleMic,
      description: { es: 'Activar/desactivar micrófono', en: 'Toggle microphone' },
    },
    {
      key: 'j',
      ctrl: true,
      action: onToggleContinuous,
      description: { es: 'Modo continuo', en: 'Continuous mode' },
    },
    {
      key: 'Escape',
      action: onStopSpeaking,
      description: { es: 'Detener habla', en: 'Stop speaking' },
    },
    {
      key: '/',
      ctrl: true,
      action: onOpenChat,
      description: { es: 'Abrir asistente', en: 'Open assistant' },
    },
  ];

  useKeyboardShortcuts({ shortcuts, enabled });

  return shortcuts;
}

export type { KeyboardShortcut };
