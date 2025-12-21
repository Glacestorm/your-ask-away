import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export interface SectorFeature {
  title: string;
  description: string;
}

export interface SectorStat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export interface SectorAICapability {
  name: string;
  description: string;
}

export interface SectorRegulation {
  code: string;
  name: string;
}

export interface SectorCaseStudy {
  company: string;
  result: string;
  logo_url?: string | null;
}

export interface Sector {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  icon_name: string | null;
  gradient_from: string | null;
  gradient_to: string | null;
  features: SectorFeature[];
  stats: SectorStat[];
  ai_capabilities: SectorAICapability[];
  regulations: SectorRegulation[];
  case_studies: SectorCaseStudy[];
  modules_recommended: string[] | null;
  cnae_codes: string[] | null;
  landing_page_url: string | null;
  demo_video_url: string | null;
  image_url: string | null;
  availability_status: 'available' | 'coming_soon' | 'new' | 'beta';
  target_company_sizes: string[] | null;
  order_position: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type for creating/updating sectors (using Json for JSONB fields)
interface SectorInput {
  name?: string;
  slug?: string;
  description?: string | null;
  short_description?: string | null;
  icon_name?: string | null;
  gradient_from?: string | null;
  gradient_to?: string | null;
  features?: Json;
  stats?: Json;
  ai_capabilities?: Json;
  regulations?: Json;
  case_studies?: Json;
  modules_recommended?: string[] | null;
  cnae_codes?: string[] | null;
  landing_page_url?: string | null;
  demo_video_url?: string | null;
  image_url?: string | null;
  availability_status?: string;
  target_company_sizes?: string[] | null;
  order_position?: number;
  is_featured?: boolean;
  is_active?: boolean;
}

interface UseSectorsOptions {
  featured?: boolean;
  limit?: number;
}

const parseJsonArray = <T,>(json: Json | null | undefined): T[] => {
  if (Array.isArray(json)) {
    return json as unknown as T[];
  }
  return [];
};

export function useSectors(options: UseSectorsOptions = {}) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSectors = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('sectors')
        .select('*')
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Parse JSON fields
      const parsedSectors: Sector[] = (data || []).map(sector => ({
        ...sector,
        features: parseJsonArray<SectorFeature>(sector.features),
        stats: parseJsonArray<SectorStat>(sector.stats),
        ai_capabilities: parseJsonArray<SectorAICapability>(sector.ai_capabilities),
        regulations: parseJsonArray<SectorRegulation>(sector.regulations),
        case_studies: parseJsonArray<SectorCaseStudy>(sector.case_studies),
        availability_status: sector.availability_status as Sector['availability_status'],
      }));

      setSectors(parsedSectors);
      setError(null);
    } catch (err) {
      console.error('Error fetching sectors:', err);
      setError('Error al cargar los sectores');
    } finally {
      setLoading(false);
    }
  };

  const createSector = async (sectorData: Partial<Sector>) => {
    try {
      const { data, error: createError } = await supabase
        .from('sectors')
        .insert([sectorData as never])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Sector creado',
        description: 'El sector se ha creado correctamente',
      });

      await fetchSectors();
      return data;
    } catch (err) {
      console.error('Error creating sector:', err);
      toast({
        title: 'Error',
        description: 'No se pudo crear el sector',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateSector = async (id: string, sectorData: Partial<Sector>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('sectors')
        .update(sectorData as never)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: 'Sector actualizado',
        description: 'El sector se ha actualizado correctamente',
      });

      await fetchSectors();
      return data;
    } catch (err) {
      console.error('Error updating sector:', err);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el sector',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deleteSector = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('sectors')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Sector eliminado',
        description: 'El sector se ha eliminado correctamente',
      });

      await fetchSectors();
    } catch (err) {
      console.error('Error deleting sector:', err);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el sector',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateOrder = async (sectorId: string, newPosition: number) => {
    try {
      const { error: updateError } = await supabase
        .from('sectors')
        .update({ order_position: newPosition })
        .eq('id', sectorId);

      if (updateError) throw updateError;
      await fetchSectors();
    } catch (err) {
      console.error('Error updating sector order:', err);
      throw err;
    }
  };

  const findSectorByCNAE = (cnaeCode: string): Sector | undefined => {
    return sectors.find(sector => 
      sector.cnae_codes?.some(code => 
        cnaeCode.startsWith(code) || code.startsWith(cnaeCode)
      )
    );
  };

  useEffect(() => {
    fetchSectors();
  }, [options.featured, options.limit]);

  return {
    sectors,
    loading,
    error,
    refetch: fetchSectors,
    createSector,
    updateSector,
    deleteSector,
    updateOrder,
    findSectorByCNAE,
  };
}
