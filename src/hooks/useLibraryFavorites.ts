import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useLibraryFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load favorites from DB (authenticated) or localStorage (guest)
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('financial-education-favorites');
      if (saved) setFavorites(JSON.parse(saved));
      setLoading(false);
      return;
    }

    const loadFavorites = async () => {
      const { data } = await supabase
        .from('user_library_favorites')
        .select('resource_key')
        .eq('user_id', user.id);

      if (data) {
        setFavorites(data.map(d => d.resource_key));
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user]);

  const toggleFavorite = useCallback(async (resourceKey: string) => {
    const isFav = favorites.includes(resourceKey);
    const newFavorites = isFav 
      ? favorites.filter(f => f !== resourceKey) 
      : [...favorites, resourceKey];
    
    setFavorites(newFavorites);

    if (!user) {
      localStorage.setItem('financial-education-favorites', JSON.stringify(newFavorites));
      return;
    }

    if (isFav) {
      await supabase
        .from('user_library_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_key', resourceKey);
    } else {
      await supabase
        .from('user_library_favorites')
        .insert({ user_id: user.id, resource_key: resourceKey });
    }
  }, [favorites, user]);

  return { favorites, toggleFavorite, loading };
}
