import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface WeChatConfig {
  appId: string;
  appSecret: string;
  miniProgramEnabled: boolean;
  officialAccountEnabled: boolean;
  payEnabled: boolean;
  merchantId: string;
}

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  publicKey: string;
  miniProgramEnabled: boolean;
  payEnabled: boolean;
}

export interface GoldenTaxConfig {
  taxNumber: string;
  certificateId: string;
  fapiaoEnabled: boolean;
  vatInvoiceEnabled: boolean;
  redInvoiceEnabled: boolean;
}

export interface ICPConfig {
  licenseNumber: string;
  hostingProvider: string;
  region: string;
  verified: boolean;
}

export interface DingTalkConfig {
  corpId: string;
  appKey: string;
  appSecret: string;
  agentId: string;
  enabled: boolean;
}

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  encryptKey: string;
  verificationToken: string;
  enabled: boolean;
}

export interface ChinaIntegrationConfig {
  wechat?: WeChatConfig;
  alipay?: AlipayConfig;
  goldenTax?: GoldenTaxConfig;
  icp?: ICPConfig;
  dingtalk?: DingTalkConfig;
  feishu?: FeishuConfig;
}

// === HOOK ===
export function useChinaIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ChinaIntegrationConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  // === FETCH CONFIG ===
  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
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
      console.error('[useChinaIntegration] fetchConfig:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === UPDATE CONFIG ===
  const updateConfig = useCallback(async (platform: string, platformConfig: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'update_config', platform, config: platformConfig }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success(`Configuración ${platform} actualizada`);
        await fetchConfig();
        return true;
      }
      throw new Error(data?.error || 'Error updating config');
    } catch (err) {
      console.error('[useChinaIntegration] updateConfig:', err);
      toast.error('Error al actualizar configuración');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchConfig]);

  // === WECHAT AUTH ===
  const getWeChatAuthUrl = useCallback(async (redirectUri: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'wechat_auth_url', redirectUri }
      });

      if (fnError) throw fnError;
      return data?.authUrl || null;
    } catch (err) {
      console.error('[useChinaIntegration] getWeChatAuthUrl:', err);
      return null;
    }
  }, []);

  // === WECHAT PAY ===
  const createWeChatPayment = useCallback(async (amount: number, description: string, orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'wechat_payment', amount, description, orderId }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        return data.paymentData;
      }
      throw new Error(data?.error || 'Error creating payment');
    } catch (err) {
      console.error('[useChinaIntegration] createWeChatPayment:', err);
      toast.error('Error al crear pago WeChat');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ALIPAY ===
  const createAlipayPayment = useCallback(async (amount: number, subject: string, orderId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'alipay_payment', amount, subject, orderId }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        return data.paymentUrl;
      }
      throw new Error(data?.error || 'Error creating payment');
    } catch (err) {
      console.error('[useChinaIntegration] createAlipayPayment:', err);
      toast.error('Error al crear pago Alipay');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FAPIAO ===
  const generateFapiao = useCallback(async (invoiceData: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'generate_fapiao', invoiceData }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Fapiao generado exitosamente');
        return data.fapiao;
      }
      throw new Error(data?.error || 'Error generating fapiao');
    } catch (err) {
      console.error('[useChinaIntegration] generateFapiao:', err);
      toast.error('Error al generar Fapiao');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DINGTALK MESSAGE ===
  const sendDingTalkMessage = useCallback(async (userId: string, message: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('china-integration', {
        body: { action: 'dingtalk_message', userId, message }
      });

      if (fnError) throw fnError;
      return data?.success || false;
    } catch (err) {
      console.error('[useChinaIntegration] sendDingTalkMessage:', err);
      return false;
    }
  }, []);

  return {
    isLoading,
    config,
    error,
    fetchConfig,
    updateConfig,
    getWeChatAuthUrl,
    createWeChatPayment,
    createAlipayPayment,
    generateFapiao,
    sendDingTalkMessage,
  };
}

export default useChinaIntegration;
