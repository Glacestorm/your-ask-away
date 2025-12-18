import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles: string[];
  targetOffices: string[];
  metadata: Record<string, any>;
}

export function useFeatureFlag(flagKey: string) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flag, setFlag] = useState<FeatureFlag | null>(null);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (flagKey) {
      checkFlag();
    }
  }, [flagKey, userRole]);

  const checkFlag = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cms_feature_flags')
        .select('*')
        .eq('flag_key', flagKey)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        setEnabled(false);
        setFlag(null);
        return;
      }

      const flagData: FeatureFlag = {
        key: data.flag_key,
        enabled: data.is_enabled,
        rolloutPercentage: data.rollout_percentage || 100,
        targetRoles: data.target_roles || [],
        targetOffices: data.target_offices || [],
        metadata: data.metadata || {}
      };

      setFlag(flagData);

      // Check if flag is enabled
      if (!flagData.enabled) {
        setEnabled(false);
        return;
      }

      // Check date range
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        setEnabled(false);
        return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        setEnabled(false);
        return;
      }

      // Check role targeting
      if (flagData.targetRoles.length > 0 && userRole) {
        if (!flagData.targetRoles.includes(userRole)) {
          setEnabled(false);
          return;
        }
      }

      // Check office targeting - skip for now since we don't have office in useAuth
      // This would need to be fetched from profile table

      // Check rollout percentage (deterministic based on user id)
      if (flagData.rolloutPercentage < 100 && user?.id) {
        const hash = simpleHash(user.id + flagKey);
        const userPercentile = hash % 100;
        if (userPercentile >= flagData.rolloutPercentage) {
          setEnabled(false);
          return;
        }
      }

      setEnabled(true);
    } catch (err) {
      console.error('Error checking feature flag:', err);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  return { enabled, loading, flag };
}

// Simple deterministic hash for consistent rollout
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function useFeatureFlags(flagKeys: string[]) {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, [flagKeys.join(',')]);

  const loadFlags = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('cms_feature_flags')
        .select('flag_key, is_enabled')
        .in('flag_key', flagKeys);

      if (error) throw error;

      const flagMap: Record<string, boolean> = {};
      for (const key of flagKeys) {
        const found = data?.find((f: any) => f.flag_key === key);
        flagMap[key] = found?.is_enabled || false;
      }

      setFlags(flagMap);
    } catch (err) {
      console.error('Error loading feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  return { flags, loading };
}
