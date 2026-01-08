import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DisplayPreferences, 
  DEFAULT_DISPLAY_PREFERENCES, 
  FocusAreaId, 
  ViewMode 
} from '@/lib/constants/focus-areas';

export const useDisplayPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
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

  // Fetch preferences from database
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        setPreferences(DEFAULT_DISPLAY_PREFERENCES);
        lastSavedRef.current = DEFAULT_DISPLAY_PREFERENCES;
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
          };
          setPreferences(merged);
          lastSavedRef.current = merged;
        } else {
          setPreferences(DEFAULT_DISPLAY_PREFERENCES);
          lastSavedRef.current = DEFAULT_DISPLAY_PREFERENCES;
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

  const savePreferences = useCallback((newPreferences: DisplayPreferences) => {
    setPreferences(newPreferences);
    pendingRef.current = newPreferences;
    setIsSaving(true);

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      flushSave();
    }, 450);
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
    setViewMode,
    toggleArea,
    toggleCollapsed,
    activateAllAreas,
    setActiveAreas,
    isAreaActive,
    isAreaCollapsed,
    setShowFocusDialog
  }), [
    preferences,
    isLoading,
    isSaving,
    setViewMode,
    toggleArea,
    toggleCollapsed,
    activateAllAreas,
    setActiveAreas,
    isAreaActive,
    isAreaCollapsed,
    setShowFocusDialog
  ]);
};
