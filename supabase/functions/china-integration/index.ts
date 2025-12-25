import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChinaRequest {
  action: string;
  platform?: string;
  config?: Record<string, unknown>;
  redirectUri?: string;
  amount?: number;
  description?: string;
  subject?: string;
  orderId?: string;
  invoiceData?: Record<string, unknown>;
  userId?: string;
  message?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as ChinaRequest;
    const { action } = requestData;

    console.log(`[china-integration] Action: ${action}`);

    switch (action) {
      case 'get_config': {
        const defaultConfig = {
          wechat: {
            appId: '',
            appSecret: '',
            miniProgramEnabled: false,
            officialAccountEnabled: false,
            payEnabled: false,
            merchantId: '',
          },
          alipay: {
            appId: '',
            privateKey: '',
            publicKey: '',
            miniProgramEnabled: false,
            payEnabled: false,
          },
          goldenTax: {
            taxNumber: '',
            certificateId: '',
            fapiaoEnabled: false,
            vatInvoiceEnabled: false,
            redInvoiceEnabled: false,
          },
          icp: {
            licenseNumber: '',
            hostingProvider: '',
            region: '',
            verified: false,
          },
          dingtalk: {
            corpId: '',
            appKey: '',
            appSecret: '',
            agentId: '',
            enabled: false,
          },
          feishu: {
            appId: '',
            appSecret: '',
            encryptKey: '',
            verificationToken: '',
            enabled: false,
          },
        };

        return new Response(JSON.stringify({
          success: true,
          config: defaultConfig,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_config': {
        const { platform, config } = requestData;
        if (!platform || !config) {
          throw new Error('Platform and config are required');
        }

        console.log(`[china-integration] Updating ${platform} config:`, config);

        return new Response(JSON.stringify({
          success: true,
          message: `Configuración ${platform} actualizada`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'wechat_auth_url': {
        const { redirectUri } = requestData;
        if (!redirectUri) {
          throw new Error('Redirect URI is required');
        }

        // Generate WeChat OAuth URL
        const appId = 'MOCK_APP_ID'; // Would come from config
        const state = crypto.randomUUID();
        const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;

        return new Response(JSON.stringify({
          success: true,
          authUrl,
          state,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'wechat_payment': {
        const { amount, description, orderId } = requestData;
        if (!amount || !orderId) {
          throw new Error('Amount and orderId are required');
        }

        // Generate mock WeChat payment data
        const nonceStr = crypto.randomUUID().replace(/-/g, '');
        const timeStamp = Math.floor(Date.now() / 1000).toString();
        const prepayId = `wx${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

        return new Response(JSON.stringify({
          success: true,
          paymentData: {
            appId: 'MOCK_APP_ID',
            timeStamp,
            nonceStr,
            package: `prepay_id=${prepayId}`,
            signType: 'RSA',
            paySign: 'MOCK_PAY_SIGN',
            orderId,
            amount: amount * 100, // Convert to fen
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'alipay_payment': {
        const { amount, subject, orderId } = requestData;
        if (!amount || !orderId) {
          throw new Error('Amount and orderId are required');
        }

        // Generate mock Alipay payment URL
        const paymentUrl = `https://openapi.alipay.com/gateway.do?out_trade_no=${orderId}&total_amount=${amount}&subject=${encodeURIComponent(subject || 'Payment')}&product_code=FAST_INSTANT_TRADE_PAY`;

        return new Response(JSON.stringify({
          success: true,
          paymentUrl,
          orderId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_fapiao': {
        const { invoiceData } = requestData;
        if (!invoiceData) {
          throw new Error('Invoice data is required');
        }

        // Generate mock Fapiao
        const fapiao = {
          id: `FP${Date.now()}`,
          fapiaoCode: Math.random().toString().slice(2, 14),
          fapiaoNumber: Math.random().toString().slice(2, 10),
          checkCode: Math.random().toString().slice(2, 22),
          invoiceDate: new Date().toISOString().split('T')[0],
          buyerName: invoiceData.buyerName || '购买方',
          buyerTaxNumber: invoiceData.buyerTaxNumber || '',
          sellerName: invoiceData.sellerName || '销售方',
          sellerTaxNumber: invoiceData.sellerTaxNumber || '',
          totalAmount: invoiceData.amount || 0,
          taxAmount: (invoiceData.amount as number || 0) * 0.13, // 13% VAT
          status: 'issued',
          qrCode: `https://inv-veri.chinatax.gov.cn/?fp=${Date.now()}`,
        };

        return new Response(JSON.stringify({
          success: true,
          fapiao,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'dingtalk_message': {
        const { userId, message } = requestData;
        if (!userId || !message) {
          throw new Error('UserId and message are required');
        }

        // Mock DingTalk message sending
        console.log(`[china-integration] Sending DingTalk message to ${userId}: ${message}`);

        return new Response(JSON.stringify({
          success: true,
          messageId: `msg_${Date.now()}`,
          sentAt: new Date().toISOString(),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'feishu_message': {
        const { userId, message } = requestData;
        if (!userId || !message) {
          throw new Error('UserId and message are required');
        }

        // Mock Feishu message sending
        console.log(`[china-integration] Sending Feishu message to ${userId}: ${message}`);

        return new Response(JSON.stringify({
          success: true,
          messageId: `lark_${Date.now()}`,
          sentAt: new Date().toISOString(),
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify_icp': {
        // Mock ICP verification
        return new Response(JSON.stringify({
          success: true,
          verified: true,
          licenseInfo: {
            number: '京ICP备XXXXXXXX号',
            domain: 'example.cn',
            registrant: 'Company Name',
            validUntil: '2026-01-01',
            status: 'active',
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[china-integration] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
