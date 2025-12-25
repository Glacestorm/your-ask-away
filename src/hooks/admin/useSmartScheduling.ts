import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ScheduleSuggestion {
  id: string;
  type: 'meeting' | 'task' | 'reminder' | 'follow_up';
  title: string;
  description: string;
  suggested_date: string;
  suggested_time: string;
  duration_minutes: number;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
  participants?: string[];
  related_entity_id?: string;
  related_entity_type?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  score: number;
  conflicts?: string[];
}

export interface ScheduleOptimization {
  original_schedule: ScheduleSuggestion[];
  optimized_schedule: ScheduleSuggestion[];
  time_saved_minutes: number;
  conflicts_resolved: number;
  recommendations: string[];
}

// === HOOK ===
export function useSmartScheduling() {
  const [suggestions, setSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === GET SUGGESTIONS ===
  const fetchSuggestions = useCallback(async (context?: Record<string, unknown>): Promise<ScheduleSuggestion[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-scheduling', {
        body: { action: 'get_suggestions', context }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.suggestions) {
        setSuggestions(data.suggestions);
        return data.suggestions;
      }

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching suggestions';
      setError(message);
      console.error('[useSmartScheduling] fetchSuggestions error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FIND OPTIMAL TIME ===
  const findOptimalTime = useCallback(async (
    duration: number,
    participants: string[],
    dateRange: { start: string; end: string }
  ): Promise<TimeSlot[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-scheduling', {
        body: { action: 'find_optimal_time', duration, participants, dateRange }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.slots) {
        setTimeSlots(data.slots);
        return data.slots;
      }

      return [];
    } catch (err) {
      console.error('[useSmartScheduling] findOptimalTime error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === OPTIMIZE SCHEDULE ===
  const optimizeSchedule = useCallback(async (
    schedule: ScheduleSuggestion[],
    constraints?: Record<string, unknown>
  ): Promise<ScheduleOptimization | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-scheduling', {
        body: { action: 'optimize_schedule', schedule, constraints }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.optimization) {
        return data.optimization;
      }

      return null;
    } catch (err) {
      console.error('[useSmartScheduling] optimizeSchedule error:', err);
      toast.error('Error al optimizar agenda');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ACCEPT SUGGESTION ===
  const acceptSuggestion = useCallback(async (suggestion: ScheduleSuggestion): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-scheduling', {
        body: { action: 'accept_suggestion', suggestion }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
        toast.success('Evento programado');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useSmartScheduling] acceptSuggestion error:', err);
      toast.error('Error al programar evento');
      return false;
    }
  }, []);

  // === DISMISS SUGGESTION ===
  const dismissSuggestion = useCallback(async (suggestionId: string, reason?: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('smart-scheduling', {
        body: { action: 'dismiss_suggestion', suggestionId, reason }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useSmartScheduling] dismissSuggestion error:', err);
      return false;
    }
  }, []);

  // === GET PRIORITY COLOR ===
  const getPriorityColor = useCallback((priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  }, []);

  return {
    suggestions,
    timeSlots,
    isLoading,
    error,
    fetchSuggestions,
    findOptimalTime,
    optimizeSchedule,
    acceptSuggestion,
    dismissSuggestion,
    getPriorityColor,
  };
}

export default useSmartScheduling;
