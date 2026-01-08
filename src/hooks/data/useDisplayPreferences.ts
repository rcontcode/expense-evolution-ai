import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Persisting is debounced + coalesced to avoid UI feeling “pesado”
  const saveTimerRef = useRef<number | null>(null);
  const pendingRef = useRef<DisplayPreferences | null>(null);
  const inflightRef = useRef(false);
  const lastSavedRef = useRef<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);

  // Fetch preferences from database
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        // No user, use defaults and stop loading
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
    if (!user?.id) {
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
      // Timeout guard so UI never “queda esperando” indefinidamente
      const savePromise = supabase
        .from('profiles')
        .update({ display_preferences: toSave as any })
        .eq('id', user.id);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('save_timeout')), 8000)
      );

      const { error } = await Promise.race([savePromise, timeoutPromise]);
      if (error) throw error;

      lastSavedRef.current = toSave;
    } catch (error) {
      // Revert to last known-good saved state
      setPreferences(lastSavedRef.current);
      console.error('Error saving display preferences:', error);
    } finally {
      inflightRef.current = false;
      if (pendingRef.current) {
        // If user changed preferences while saving, flush again
        flushSave();
      } else {
        setIsSaving(false);
      }
    }
  }, [user?.id]);

  const savePreferences = useCallback((newPreferences: DisplayPreferences) => {
    // Optimistic update so UI responds instantly
    setPreferences(newPreferences);
    pendingRef.current = newPreferences;
    setIsSaving(true);

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      flushSave();
    }, 450);
  }, [flushSave]);

  // Set view mode
  const setViewMode = useCallback((mode: ViewMode) => {
    const newPreferences = { ...preferences, view_mode: mode };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Toggle area active state
  const toggleArea = useCallback((areaId: FocusAreaId) => {
    const isActive = preferences.active_areas.includes(areaId);
    const newActiveAreas = isActive
      ? preferences.active_areas.filter(id => id !== areaId)
      : [...preferences.active_areas, areaId];
    
    const newPreferences = { ...preferences, active_areas: newActiveAreas };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Toggle area collapsed state
  const toggleCollapsed = useCallback((areaId: FocusAreaId) => {
    const isCollapsed = preferences.collapsed_areas.includes(areaId);
    const newCollapsedAreas = isCollapsed
      ? preferences.collapsed_areas.filter(id => id !== areaId)
      : [...preferences.collapsed_areas, areaId];
    
    const newPreferences = { ...preferences, collapsed_areas: newCollapsedAreas };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Set all areas active
  const activateAllAreas = useCallback(() => {
    const allAreas: FocusAreaId[] = ['negocio', 'familia', 'diadia', 'crecimiento', 'impuestos'];
    const newPreferences = { ...preferences, active_areas: allAreas };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Set specific areas active
  const setActiveAreas = useCallback((areas: FocusAreaId[]) => {
    const newPreferences = { ...preferences, active_areas: areas };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  // Check if area is active
  const isAreaActive = useCallback((areaId: FocusAreaId) => {
    return preferences.active_areas.includes(areaId);
  }, [preferences.active_areas]);

  // Check if area is collapsed
  const isAreaCollapsed = useCallback((areaId: FocusAreaId) => {
    return preferences.collapsed_areas.includes(areaId);
  }, [preferences.collapsed_areas]);

  // Toggle focus dialog setting
  const setShowFocusDialog = useCallback((show: boolean) => {
    const newPreferences = { ...preferences, show_focus_dialog: show };
    savePreferences(newPreferences);
  }, [preferences, savePreferences]);

  return {
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
  };
};
