 import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DisplayPreferences, 
  DEFAULT_DISPLAY_PREFERENCES, 
  FocusAreaId, 
  ViewMode,
  UiMode,
} from '@/lib/constants/focus-areas';

const DISPLAY_PREFERENCES_EVENT = 'display-preferences:update';
const UI_MODE_STORAGE_KEY = 'evofinz-ui-mode';

const getStoredUiMode = (): UiMode | null => {
  if (typeof window === 'undefined') return null;
  const stored = window.localStorage.getItem(UI_MODE_STORAGE_KEY);
  return stored === 'simple' || stored === 'advanced' ? stored : null;
};

export const applyUiModeImmediately = (mode: 'simple' | 'advanced') => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UI_MODE_STORAGE_KEY, mode);
  window.dispatchEvent(new CustomEvent(DISPLAY_PREFERENCES_EVENT, {
    detail: { ...DEFAULT_DISPLAY_PREFERENCES, ui_mode: mode },
  }));
};

export const openDashboardAfterUiModeChange = () => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.pathname = '/dashboard';
  url.hash = '';
  window.location.assign(url.toString());
};

export const useDisplayPreferences = () => {
  const { user } = useAuth();
  // Initialize synchronously from localStorage to avoid first-render flash
  // (e.g. brief flash of Advanced UI before Simple loads from server)
  const [preferences, setPreferences] = useState<DisplayPreferences>(() => {
    const storedMode = getStoredUiMode();
    return storedMode
      ? { ...DEFAULT_DISPLAY_PREFERENCES, ui_mode: storedMode }
      : DEFAULT_DISPLAY_PREFERENCES;
  });
  // If we already have a stored UI mode, we can render immediately without waiting for the network
  const [isLoading, setIsLoading] = useState(() => getStoredUiMode() === null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs to avoid stale closures and prevent re-renders
  const preferencesRef = useRef<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);
  const saveTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<DisplayPreferences | null>(null);
  const inflightRef = useRef(false);
  const lastSavedRef = useRef<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);
  const userIdRef = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    const syncPreferences = (event: Event) => {
      const next = (event as CustomEvent<DisplayPreferences>).detail;
      if (!next) return;
      preferencesRef.current = next;
      setPreferences(next);
    };

    window.addEventListener(DISPLAY_PREFERENCES_EVENT, syncPreferences as EventListener);
    return () => window.removeEventListener(DISPLAY_PREFERENCES_EVENT, syncPreferences as EventListener);
  }, []);

  // Fetch preferences from database
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        const fallback = { ...DEFAULT_DISPLAY_PREFERENCES, ...(getStoredUiMode() ? { ui_mode: getStoredUiMode()! } : {}) };
        setPreferences(fallback);
        lastSavedRef.current = fallback;
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_preferences')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching display preferences:', error);
          setPreferences(DEFAULT_DISPLAY_PREFERENCES);
          lastSavedRef.current = DEFAULT_DISPLAY_PREFERENCES;
        } else if (data?.display_preferences) {
          const merged = {
            ...DEFAULT_DISPLAY_PREFERENCES,
            ...(data.display_preferences as Partial<DisplayPreferences>),
            ...(getStoredUiMode() ? { ui_mode: getStoredUiMode()! } : {}),
          };
          setPreferences(merged);
          lastSavedRef.current = merged;
        } else {
          const fallback = { ...DEFAULT_DISPLAY_PREFERENCES, ...(getStoredUiMode() ? { ui_mode: getStoredUiMode()! } : {}) };
          setPreferences(fallback);
          lastSavedRef.current = fallback;
        }
      } catch (error) {
        console.error('Error fetching display preferences:', error);
        setPreferences(DEFAULT_DISPLAY_PREFERENCES);
        lastSavedRef.current = DEFAULT_DISPLAY_PREFERENCES;
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  const flushSave = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) {
      pendingRef.current = null;
      setIsSaving(false);
      return;
    }

    if (inflightRef.current) return;
    if (!pendingRef.current) {
      setIsSaving(false);
      return;
    }

    inflightRef.current = true;
    const toSave = pendingRef.current;
    pendingRef.current = null;

    try {
      const savePromise = supabase
        .from('profiles')
        .update({ display_preferences: toSave as any })
        .eq('id', userId);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('save_timeout')), 8000)
      );

      const { error } = await Promise.race([savePromise, timeoutPromise]);
      if (error) throw error;

      lastSavedRef.current = toSave;
    } catch (error) {
      setPreferences(lastSavedRef.current);
      console.error('Error saving display preferences:', error);
    } finally {
      inflightRef.current = false;
      if (pendingRef.current) {
        flushSave();
      } else {
        setIsSaving(false);
      }
    }
  }, []);

  const savePreferences = useCallback((newPreferences: DisplayPreferences, options?: { immediate?: boolean }) => {
    if (newPreferences.ui_mode === 'simple' || newPreferences.ui_mode === 'advanced') {
      window.localStorage.setItem(UI_MODE_STORAGE_KEY, newPreferences.ui_mode);
    }

    setPreferences(newPreferences);
    preferencesRef.current = newPreferences;
    pendingRef.current = newPreferences;
    setIsSaving(true);

    window.dispatchEvent(new CustomEvent(DISPLAY_PREFERENCES_EVENT, { detail: newPreferences }));

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    if (options?.immediate) {
      void flushSave();
      return;
    }

    saveTimerRef.current = window.setTimeout(() => {
      flushSave();
    }, 450);
  }, [flushSave]);

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (pendingRef.current) {
        void flushSave();
      }
    };
  }, [flushSave]);

  // Stable callbacks that don't depend on `preferences` state directly
  const setViewMode = useCallback((mode: ViewMode) => {
    const newPreferences = { ...preferencesRef.current, view_mode: mode };
    savePreferences(newPreferences);
  }, [savePreferences]);

  const toggleArea = useCallback((areaId: FocusAreaId) => {
    const current = preferencesRef.current;
    const isActive = current.active_areas.includes(areaId);
    const newActiveAreas = isActive
      ? current.active_areas.filter(id => id !== areaId)
      : [...current.active_areas, areaId];
    
    const newPreferences = { ...current, active_areas: newActiveAreas };
    savePreferences(newPreferences);
  }, [savePreferences]);

  const toggleCollapsed = useCallback((areaId: FocusAreaId) => {
    const current = preferencesRef.current;
    const isCollapsed = current.collapsed_areas.includes(areaId);
    const newCollapsedAreas = isCollapsed
      ? current.collapsed_areas.filter(id => id !== areaId)
      : [...current.collapsed_areas, areaId];
    
    const newPreferences = { ...current, collapsed_areas: newCollapsedAreas };
    savePreferences(newPreferences);
  }, [savePreferences]);

  const activateAllAreas = useCallback(() => {
    const allAreas: FocusAreaId[] = ['negocio', 'familia', 'diadia', 'crecimiento', 'impuestos'];
    const newPreferences = { ...preferencesRef.current, active_areas: allAreas };
    savePreferences(newPreferences);
  }, [savePreferences]);

  const setActiveAreas = useCallback((areas: FocusAreaId[]) => {
    const newPreferences = { ...preferencesRef.current, active_areas: areas };
    savePreferences(newPreferences);
  }, [savePreferences]);

 const setShowFocusDialog = useCallback((show: boolean) => {
     const newPreferences = { ...preferencesRef.current, show_focus_dialog: show };
     savePreferences(newPreferences);
   }, [savePreferences]);

   const setUiMode = useCallback((mode: UiMode) => {
     if (mode === 'simple' || mode === 'advanced') applyUiModeImmediately(mode);
     const newPreferences = { ...preferencesRef.current, ui_mode: mode };
     savePreferences(newPreferences, { immediate: true });
   }, [savePreferences]);
 
   const setAreaOrder = useCallback((order: FocusAreaId[]) => {
     const newPreferences = { ...preferencesRef.current, area_order: order };
     savePreferences(newPreferences);
   }, [savePreferences]);

  // Derived checks using useMemo to avoid new functions on each render
  const isAreaActive = useCallback((areaId: FocusAreaId) => {
    return preferences.active_areas.includes(areaId);
  }, [preferences.active_areas]);

  const isAreaCollapsed = useCallback((areaId: FocusAreaId) => {
    return preferences.collapsed_areas.includes(areaId);
  }, [preferences.collapsed_areas]);

 return useMemo(() => ({
     preferences,
     isLoading,
     isSaving,
     viewMode: preferences.view_mode,
     activeAreas: preferences.active_areas,
     collapsedAreas: preferences.collapsed_areas,
     showFocusDialog: preferences.show_focus_dialog,
     areaOrder: (preferences as any).area_order as FocusAreaId[] | undefined,
     uiMode: (preferences.ui_mode ?? 'unset') as UiMode,
     setViewMode,
     toggleArea,
     toggleCollapsed,
     activateAllAreas,
     setActiveAreas,
     setAreaOrder,
     isAreaActive,
     isAreaCollapsed,
     setShowFocusDialog,
     setUiMode,
   }), [
     preferences,
     isLoading,
     isSaving,
     setViewMode,
     toggleArea,
     toggleCollapsed,
     activateAllAreas,
     setActiveAreas,
     setAreaOrder,
     isAreaActive,
     isAreaCollapsed,
     setShowFocusDialog,
     setUiMode,
   ]);
};
