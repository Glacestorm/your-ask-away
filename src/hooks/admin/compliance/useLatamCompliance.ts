import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface MexicoConfig {
  cfdiVersion: '4.0' | '3.3';
  pacProvider: string;
  certificateId: string;
  rfcEmisor: string;
  regimenFiscal: string;
  usoCfdi: string;
  cartaPorteEnabled: boolean;
  addendasEnabled: string[];
}

export interface BrasilConfig {
  nfeEnabled: boolean;
  nfseEnabled: boolean;
  spedEnabled: boolean;
  pixEnabled: boolean;
  cnpj: string;
  inscricaoEstadual: string;
  certificadoA1: string;
}

export interface ArgentinaConfig {
  afipEnabled: boolean;
  cuit: string;
  puntoVenta: string;
  tipoComprobante: string;
  percepciones: boolean;
  retenciones: boolean;
  mercadoPagoEnabled: boolean;
}

export interface ChileConfig {
  siiEnabled: boolean;
  rutEmisor: string;
  resolucion: string;
  boletaEnabled: boolean;
  previredEnabled: boolean;
}

export interface ColombiaConfig {
  dianEnabled: boolean;
  nit: string;
  resolucionFacturacion: string;
  nominaElectronica: boolean;
  pseEnabled: boolean;
}

export interface LatamComplianceConfig {
  mexico?: MexicoConfig;
  brasil?: BrasilConfig;
  argentina?: ArgentinaConfig;
  chile?: ChileConfig;
  colombia?: ColombiaConfig;
}

export interface InvoiceRequest {
  country: 'mexico' | 'brasil' | 'argentina' | 'chile' | 'colombia';
  type: string;
  data: Record<string, unknown>;
}

export interface InvoiceResponse {
  success: boolean;
  invoiceId: string;
  uuid?: string;
  xml?: string;
  pdf?: string;
  status: string;
  errors?: string[];
}

// === HOOK ===
export function useLatamCompliance() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LatamComplianceConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === FETCH CONFIG ===
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('latam-compliance', {
        body: { action: 'get_config' }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        setConfig(data.config);
        return data.config;
      }
      throw new Error(data?.error || 'Error fetching config');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useLatamCompliance] fetchConfig:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (country: string, countryConfig: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('latam-compliance', {
        body: { action: 'update_config', country, config: countryConfig }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Configuración ${country.toUpperCase()} actualizada`);
        await fetchConfig();
        return true;
      }
      throw new Error(data?.error || 'Error updating config');
    } catch (err) {
      console.error('[useLatamCompliance] updateConfig:', err);
      toast.error('Error al actualizar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchConfig]);

  // === GENERATE INVOICE ===
  const generateInvoice = useCallback(async (request: InvoiceRequest): Promise<InvoiceResponse | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('latam-compliance', {
        body: { action: 'generate_invoice', ...request }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Factura generada exitosamente');
        return data.invoice;
      }
      throw new Error(data?.error || 'Error generating invoice');
    } catch (err) {
      console.error('[useLatamCompliance] generateInvoice:', err);
      toast.error('Error al generar factura');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === VALIDATE TAX ID ===
  const validateTaxId = useCallback(async (country: string, taxId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('latam-compliance', {
        body: { action: 'validate_tax_id', country, taxId }
      });

      if (fnError) throw fnError;
      return data?.valid || false;
    } catch (err) {
      console.error('[useLatamCompliance] validateTaxId:', err);
      return false;
    }
  }, []);

  // === GET PAC STATUS ===
  const getPacStatus = useCallback(async (country: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('latam-compliance', {
        body: { action: 'pac_status', country }
      });

      if (fnError) throw fnError;
      return data?.status || null;
    } catch (err) {
      console.error('[useLatamCompliance] getPacStatus:', err);
      return null;
    }
  }, []);

  return {
    isLoading,
    config,
    error,
    fetchConfig,
    updateConfig,
    generateInvoice,
    validateTaxId,
    getPacStatus,
  };
}

export default useLatamCompliance;
