import { createContext, useContext, useCallback, useRef, useState, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';

interface UndoRedoEntry {
  id: string;
  descriptionEs: string;
  descriptionEn: string;
  doFn: () => Promise<void>;
  undoFn: () => Promise<void>;
  timestamp: number;
}

interface UndoRedoContextValue {
  pushAction: (entry: Omit<UndoRedoEntry, 'id' | 'timestamp'>) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

const MAX_STACK = 20;
const EXPIRY_MS = 120_000;

let entryCounter = 0;

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [undoStack, setUndoStack] = useState<UndoRedoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoEntry[]>([]);
  const busyRef = useRef(false);

  // Auto-expire old entries
  useEffect(() => {
    if (undoStack.length === 0 && redoStack.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setUndoStack(s => s.filter(e => now - e.timestamp < EXPIRY_MS));
      setRedoStack(s => s.filter(e => now - e.timestamp < EXPIRY_MS));
    }, 10_000);
    return () => clearInterval(interval);
  }, [undoStack.length, redoStack.length]);

  const pushAction = useCallback((entry: Omit<UndoRedoEntry, 'id' | 'timestamp'>) => {
    const newEntry: UndoRedoEntry = {
      ...entry,
      id: `undo-${++entryCounter}`,
      timestamp: Date.now(),
    };
    setUndoStack(s => [newEntry, ...s].slice(0, MAX_STACK));
    setRedoStack([]); // new action clears redo
  }, []);

  const undo = useCallback(async () => {
    if (busyRef.current) return;
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const [action, ...rest] = prev;
      busyRef.current = true;
      action.undoFn().then(() => {
        setRedoStack(rs => [{ ...action, timestamp: Date.now() }, ...rs].slice(0, MAX_STACK));
        toast.success(action.descriptionEs ? `Deshecho` : 'Undone');
      }).catch(() => {
        toast.error('Error al deshacer');
      }).finally(() => { busyRef.current = false; });
      return rest;
    });
  }, []);

  const redo = useCallback(async () => {
    if (busyRef.current) return;
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const [action, ...rest] = prev;
      busyRef.current = true;
      action.doFn().then(() => {
        setUndoStack(us => [{ ...action, timestamp: Date.now() }, ...us].slice(0, MAX_STACK));
        toast.success(action.descriptionEs ? `Rehecho` : 'Redone');
      }).catch(() => {
        toast.error('Error al rehacer');
      }).finally(() => { busyRef.current = false; });
      return rest;
    });
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return (
    <UndoRedoContext.Provider value={{
      pushAction,
      undo,
      redo,
      canUndo: undoStack.length > 0,
      canRedo: redoStack.length > 0,
      undoCount: undoStack.length,
      redoCount: redoStack.length,
    }}>
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const ctx = useContext(UndoRedoContext);
  if (!ctx) throw new Error('useUndoRedo must be used within UndoRedoProvider');
  return ctx;
}
