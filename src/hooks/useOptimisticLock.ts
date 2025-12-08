import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConflictInfo {
  recordId: string;
  table: string;
  currentData: Record<string, unknown>;
  attemptedData: Record<string, unknown>;
  serverVersion: Date;
  localVersion: Date;
}

interface UseOptimisticLockOptions {
  table: string;
  versionField?: string;
  onConflict?: (conflict: ConflictInfo) => void;
}

export function useOptimisticLock({
  table,
  versionField = 'updated_at',
  onConflict,
}: UseOptimisticLockOptions) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const updateWithLock = useCallback(
    async (
      id: string,
      data: Record<string, unknown>,
      currentVersion: string | Date
    ): Promise<{ success: boolean; data?: Record<string, unknown>; conflict?: boolean }> => {
      setIsUpdating(true);
      setConflict(null);

      try {
        // First, check the current version in the database
        const { data: currentRecord, error: fetchError } = await (supabase as any)
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        const record = currentRecord as Record<string, unknown>;
        const serverVersion = new Date(record[versionField] as string);
        const localVersion = new Date(currentVersion);

        // Check if versions match (within 1 second tolerance for network delays)
        const timeDiff = Math.abs(serverVersion.getTime() - localVersion.getTime());
        if (timeDiff > 1000) {
          const conflictInfo: ConflictInfo = {
            recordId: id,
            table,
            currentData: record,
            attemptedData: data,
            serverVersion,
            localVersion,
          };

          setConflict(conflictInfo);
          onConflict?.(conflictInfo);

          toast.error('Conflicte de edició', {
            description: 'Aquest registre ha estat modificat per un altre usuari.',
          });

          return { success: false, conflict: true };
        }

        // Perform the update with new timestamp
        const { data: updatedRecord, error: updateError } = await (supabase as any)
          .from(table)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return { success: true, data: updatedRecord as Record<string, unknown> };
      } catch (error) {
        console.error('[OptimisticLock] Update error:', error);
        toast.error('Error en actualitzar', {
          description: 'No s\'ha pogut guardar els canvis.',
        });
        return { success: false };
      } finally {
        setIsUpdating(false);
      }
    },
    [table, versionField, onConflict]
  );

  const forceUpdate = useCallback(
    async (
      id: string,
      data: Record<string, unknown>
    ): Promise<{ success: boolean; data?: Record<string, unknown> }> => {
      setIsUpdating(true);
      setConflict(null);

      try {
        const { data: updatedRecord, error } = await (supabase as any)
          .from(table)
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();

        if (error) {
          throw error;
        }

        toast.success('Canvis guardats', {
          description: 'S\'han forçat els canvis correctament.',
        });

        return { success: true, data: updatedRecord as Record<string, unknown> };
      } catch (error) {
        console.error('[OptimisticLock] Force update error:', error);
        toast.error('Error en actualitzar');
        return { success: false };
      } finally {
        setIsUpdating(false);
      }
    },
    [table]
  );

  const reloadRecord = useCallback(
    async (id: string): Promise<Record<string, unknown> | null> => {
      try {
        const { data, error } = await (supabase as any)
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        setConflict(null);
        return data as Record<string, unknown>;
      } catch (error) {
        console.error('[OptimisticLock] Reload error:', error);
        return null;
      }
    },
    [table]
  );

  const clearConflict = useCallback(() => {
    setConflict(null);
  }, []);

  return {
    updateWithLock,
    forceUpdate,
    reloadRecord,
    isUpdating,
    conflict,
    clearConflict,
    hasConflict: conflict !== null,
  };
}
