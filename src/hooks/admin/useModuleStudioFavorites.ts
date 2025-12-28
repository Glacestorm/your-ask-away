/**
 * useModuleStudioFavorites - Gestión de módulos favoritos y recientes
 */

import { useState, useCallback, useEffect } from 'react';

const FAVORITES_KEY = 'module-studio-favorites';
const RECENT_KEY = 'module-studio-recent';
const MAX_RECENT = 10;

export interface FavoriteModule {
  moduleKey: string;
  moduleName: string;
  addedAt: string;
}

export interface RecentModule {
  moduleKey: string;
  moduleName: string;
  visitedAt: string;
  section?: string;
}

export function useModuleStudioFavorites() {
  const [favorites, setFavorites] = useState<FavoriteModule[]>([]);
  const [recent, setRecent] = useState<RecentModule[]>([]);

  // Load from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem(FAVORITES_KEY);
      const storedRecent = localStorage.getItem(RECENT_KEY);
      
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedRecent) {
        setRecent(JSON.parse(storedRecent));
      }
    } catch (error) {
      console.error('[useModuleStudioFavorites] Error loading from localStorage:', error);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites: FavoriteModule[]) => {
    setFavorites(newFavorites);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  }, []);

  // Save recent to localStorage
  const saveRecent = useCallback((newRecent: RecentModule[]) => {
    setRecent(newRecent);
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent));
  }, []);

  // Add to favorites
  const addFavorite = useCallback((moduleKey: string, moduleName: string) => {
    if (favorites.some(f => f.moduleKey === moduleKey)) return;
    
    const newFavorite: FavoriteModule = {
      moduleKey,
      moduleName,
      addedAt: new Date().toISOString(),
    };
    
    saveFavorites([newFavorite, ...favorites]);
  }, [favorites, saveFavorites]);

  // Remove from favorites
  const removeFavorite = useCallback((moduleKey: string) => {
    saveFavorites(favorites.filter(f => f.moduleKey !== moduleKey));
  }, [favorites, saveFavorites]);

  // Toggle favorite
  const toggleFavorite = useCallback((moduleKey: string, moduleName: string) => {
    if (favorites.some(f => f.moduleKey === moduleKey)) {
      removeFavorite(moduleKey);
      return false;
    } else {
      addFavorite(moduleKey, moduleName);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Check if module is favorite
  const isFavorite = useCallback((moduleKey: string) => {
    return favorites.some(f => f.moduleKey === moduleKey);
  }, [favorites]);

  // Add to recent
  const addRecent = useCallback((moduleKey: string, moduleName: string, section?: string) => {
    const newRecent: RecentModule = {
      moduleKey,
      moduleName,
      visitedAt: new Date().toISOString(),
      section,
    };
    
    // Remove existing entry and add at beginning
    const filtered = recent.filter(r => r.moduleKey !== moduleKey);
    const updated = [newRecent, ...filtered].slice(0, MAX_RECENT);
    
    saveRecent(updated);
  }, [recent, saveRecent]);

  // Clear recent
  const clearRecent = useCallback(() => {
    saveRecent([]);
  }, [saveRecent]);

  // Clear all
  const clearAll = useCallback(() => {
    saveFavorites([]);
    saveRecent([]);
  }, [saveFavorites, saveRecent]);

  return {
    favorites,
    recent,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    addRecent,
    clearRecent,
    clearAll,
  };
}

export default useModuleStudioFavorites;
