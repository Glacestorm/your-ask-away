import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { addDays, differenceInDays, isPast } from 'date-fns';

export interface ModuleTrial {
  id: string;
  organization_id: string | null;
  user_id: string;
  module_key: string;
  started_at: string;
  expires_at: string;
  status: string;
  converted_to_purchase: boolean;
  converted_at: string | null;
  created_at: string;
}

export function useModuleTrials() {
  const [trials, setTrials] = useState<ModuleTrial[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchTrials = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('module_trials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrials((data as ModuleTrial[]) || []);
    } catch (error) {
      console.error('Error fetching trials:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const startTrial = useCallback(async (moduleKey: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para activar un trial');
      return null;
    }

    // Check if trial already exists
    const existingTrial = trials.find(t => t.module_key === moduleKey);
    if (existingTrial) {
      if (existingTrial.status === 'active' && !isPast(new Date(existingTrial.expires_at))) {
        toast.info('Ya tienes un trial activo para este módulo');
        return existingTrial;
      }
      if (existingTrial.status === 'expired') {
        toast.error('Ya usaste el período de prueba para este módulo');
        return null;
      }
    }

    try {
      const expiresAt = addDays(new Date(), 10);
      
      const { data, error } = await supabase
        .from('module_trials')
        .insert({
          user_id: user.id,
          module_key: moduleKey,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      const newTrial = data as ModuleTrial;
      setTrials(prev => [newTrial, ...prev]);
      toast.success(`Trial de 10 días activado para ${moduleKey}`);
      return newTrial;
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Error al activar el trial');
      return null;
    }
  }, [user?.id, trials]);

  const getTrialStatus = useCallback((moduleKey: string) => {
    const trial = trials.find(t => t.module_key === moduleKey);
    if (!trial) return { hasTrial: false, isActive: false, daysRemaining: 0, canStartTrial: true };

    const now = new Date();
    const expiresAt = new Date(trial.expires_at);
    const daysRemaining = Math.max(0, differenceInDays(expiresAt, now));
    const isActive = trial.status === 'active' && !isPast(expiresAt);

    return {
      hasTrial: true,
      isActive,
      daysRemaining,
      canStartTrial: false,
      trial
    };
  }, [trials]);

  const convertTrialToPurchase = useCallback(async (moduleKey: string) => {
    const trial = trials.find(t => t.module_key === moduleKey);
    if (!trial) return false;

    try {
      const { error } = await supabase
        .from('module_trials')
        .update({
          converted_to_purchase: true,
          converted_at: new Date().toISOString(),
          status: 'converted'
        })
        .eq('id', trial.id);

      if (error) throw error;

      setTrials(prev => prev.map(t => 
        t.id === trial.id 
          ? { ...t, converted_to_purchase: true, status: 'converted', converted_at: new Date().toISOString() }
          : t
      ));
      
      return true;
    } catch (error) {
      console.error('Error converting trial:', error);
      return false;
    }
  }, [trials]);

  // Auto-update expired trials
  useEffect(() => {
    const checkExpiredTrials = async () => {
      const expiredTrials = trials.filter(t => 
        t.status === 'active' && isPast(new Date(t.expires_at))
      );

      for (const trial of expiredTrials) {
        await supabase
          .from('module_trials')
          .update({ status: 'expired' })
          .eq('id', trial.id);
      }

      if (expiredTrials.length > 0) {
        fetchTrials();
      }
    };

    if (trials.length > 0) {
      checkExpiredTrials();
    }
  }, [trials, fetchTrials]);

  useEffect(() => {
    fetchTrials();
  }, [fetchTrials]);

  return {
    trials,
    loading,
    startTrial,
    getTrialStatus,
    convertTrialToPurchase,
    fetchTrials
  };
}
