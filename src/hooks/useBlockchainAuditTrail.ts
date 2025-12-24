import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BlockchainEntry {
  id: string;
  organization_id: string | null;
  entry_type: string;
  entity_type: string;
  entity_id: string;
  action: string;
  data_hash: string;
  previous_hash: string | null;
  merkle_root: string | null;
  block_number: number | null;
  timestamp: string;
  actor_id: string | null;
  actor_email: string | null;
  metadata: Record<string, unknown> | null;
  is_verified: boolean;
  created_at: string;
}

// Simple hash function for demo purposes
async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useBlockchainAuditTrail() {
  const [entries, setEntries] = useState<BlockchainEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchEntries = useCallback(async (entityType?: string, entityId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('blockchain_audit_entries')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (entityType) query = query.eq('entity_type', entityType);
      if (entityId) query = query.eq('entity_id', entityId);

      const { data, error } = await query;
      if (error) throw error;
      setEntries((data as BlockchainEntry[]) || []);
    } catch (error) {
      console.error('Error fetching blockchain entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (
    entityType: string,
    entityId: string,
    action: string,
    data: Record<string, unknown>,
    entryType: string = 'audit'
  ) => {
    if (!user?.id) return null;

    try {
      // Get the previous entry for chain linking
      const { data: lastEntries } = await supabase
        .from('blockchain_audit_entries')
        .select('data_hash, block_number')
        .order('block_number', { ascending: false })
        .limit(1);

      const previousHash = lastEntries?.[0]?.data_hash || null;
      const blockNumber = (lastEntries?.[0]?.block_number || 0) + 1;

      // Generate hash of current data
      const dataString = JSON.stringify({
        entityType,
        entityId,
        action,
        data,
        timestamp: new Date().toISOString(),
        previousHash
      });
      const dataHash = await generateHash(dataString);

      const insertData = {
        entry_type: entryType,
        entity_type: entityType,
        entity_id: entityId,
        action,
        data_hash: dataHash,
        previous_hash: previousHash,
        actor_id: user.id,
        actor_email: user.email
      };

      const { data: entry, error } = await supabase
        .from('blockchain_audit_entries')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      setEntries(prev => [entry as BlockchainEntry, ...prev]);
      return entry as BlockchainEntry;
    } catch (error) {
      console.error('Error creating blockchain entry:', error);
      return null;
    }
  }, [user]);

  const verifyChain = useCallback(async (): Promise<{ valid: boolean; brokenAt?: number }> => {
    try {
      const { data: allEntries } = await supabase
        .from('blockchain_audit_entries')
        .select('*')
        .order('block_number', { ascending: true });

      if (!allEntries || allEntries.length === 0) {
        return { valid: true };
      }

      for (let i = 1; i < allEntries.length; i++) {
        const current = allEntries[i];
        const previous = allEntries[i - 1];

        if (current.previous_hash !== previous.data_hash) {
          return { valid: false, brokenAt: current.block_number as number };
        }
      }

      return { valid: true };
    } catch (error) {
      console.error('Error verifying chain:', error);
      return { valid: false };
    }
  }, []);

  const getEntryHistory = useCallback(async (entityType: string, entityId: string) => {
    try {
      const { data, error } = await supabase
        .from('blockchain_audit_entries')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return (data as BlockchainEntry[]) || [];
    } catch (error) {
      console.error('Error getting entry history:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return {
    entries,
    loading,
    createEntry,
    verifyChain,
    getEntryHistory,
    fetchEntries
  };
}
