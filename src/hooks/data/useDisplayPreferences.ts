import { useState, useEffect, useCallback } from 'react';
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

  // Fetch preferences from database
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        // No user, use defaults and stop loading
        setPreferences(DEFAULT_DISPLAY_PREFERENCES);
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
          // Use defaults on error
          setPreferences(DEFAULT_DISPLAY_PREFERENCES);
        } else if (data?.display_preferences) {
          setPreferences({
            ...DEFAULT_DISPLAY_PREFERENCES,
            ...(data.display_preferences as Partial<DisplayPreferences>)
          });
        } else {
          // No preferences saved yet, use defaults
          setPreferences(DEFAULT_DISPLAY_PREFERENCES);
        }
      } catch (error) {
        console.error('Error fetching display preferences:', error);
        setPreferences(DEFAULT_DISPLAY_PREFERENCES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

  // Save preferences to database
  const savePreferences = useCallback(async (newPreferences: DisplayPreferences) => {
    // Optimistic update so UI responds instantly
    const prev = preferences;
    setPreferences(newPreferences);

    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Cast to any to avoid JSONB type issues
      const { error } = await supabase
        .from('profiles')
        .update({ display_preferences: newPreferences as any })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      // Revert on failure
      setPreferences(prev);
      console.error('Error saving display preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, preferences]);

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
