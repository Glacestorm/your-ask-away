import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: 'get_config' | 'update_config' | 'generate_invoice' | 'validate_tax_id' | 'pac_status';
  country?: 'mexico' | 'brasil' | 'argentina' | 'chile' | 'colombia';
  config?: Record<string, unknown>;
  type?: string;
  data?: Record<string, unknown>;
  taxId?: string;
}

// Tax ID validation patterns
const taxIdPatterns: Record<string, RegExp> = {
  mexico: /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/, // RFC
  brasil: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, // CNPJ
  argentina: /^\d{2}-\d{8}-\d{1}$/, // CUIT
  chile: /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/, // RUT
  colombia: /^\d{9,10}-\d{1}$/, // NIT
};

// Invoice types by country
const invoiceTypes: Record<string, string[]> = {
  mexico: ['factura', 'nota_credito', 'nota_debito', 'recibo_pago', 'carta_porte'],
  brasil: ['nfe', 'nfse', 'nfce', 'cte'],
  argentina: ['factura_a', 'factura_b', 'factura_c', 'nota_credito', 'nota_debito'],
  chile: ['factura_electronica', 'boleta_electronica', 'nota_credito', 'guia_despacho'],
  colombia: ['factura_electronica', 'nota_credito', 'nota_debito', 'documento_soporte'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, country, config, type, data, taxId } = await req.json() as ComplianceRequest;

    console.log(`[latam-compliance] Action: ${action}, Country: ${country}`);

    switch (action) {
      case 'get_config': {
        // Return mock configuration for demo
        const defaultConfig = {
          mexico: {
            cfdiVersion: '4.0',
            pacProvider: 'Finkok',
            certificateId: '',
            rfcEmisor: '',
            regimenFiscal: '601',
            usoCfdi: 'G03',
            cartaPorteEnabled: false,
            addendasEnabled: [],
          },
          brasil: {
            nfeEnabled: true,
            nfseEnabled: false,
            spedEnabled: true,
            pixEnabled: true,
            cnpj: '',
            inscricaoEstadual: '',
            certificadoA1: '',
          },
          argentina: {
            afipEnabled: true,
            cuit: '',
            puntoVenta: '00001',
            tipoComprobante: '001',
            percepciones: true,
            retenciones: true,
            mercadoPagoEnabled: true,
          },
          chile: {
            siiEnabled: true,
            rutEmisor: '',
            resolucion: '',
            boletaEnabled: true,
            previredEnabled: false,
          },
          colombia: {
            dianEnabled: true,
            nit: '',
            resolucionFacturacion: '',
            nominaElectronica: false,
            pseEnabled: true,
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
        if (!country || !config) {
          throw new Error('Country and config are required');
        }

        // In production, save to database
        console.log(`[latam-compliance] Updating ${country} config:`, config);

        return new Response(JSON.stringify({
          success: true,
          message: `Configuración ${country} actualizada`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_invoice': {
        if (!country || !type || !data) {
          throw new Error('Country, type and data are required');
        }

        // Validate invoice type
        const validTypes = invoiceTypes[country] || [];
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid invoice type for ${country}: ${type}`);
        }

        // Generate mock invoice
        const invoiceId = `INV-${country.toUpperCase()}-${Date.now()}`;
        const uuid = crypto.randomUUID();

        // Simulate country-specific invoice generation
        let invoiceData: Record<string, unknown> = {
          success: true,
          invoice: {
            invoiceId,
            uuid,
            status: 'generated',
            country,
            type,
            createdAt: new Date().toISOString(),
          },
        };

        switch (country) {
          case 'mexico':
            invoiceData.invoice = {
              ...invoiceData.invoice as object,
              cfdiVersion: '4.0',
              timbreFiscal: {
                uuid,
                fechaTimbrado: new Date().toISOString(),
                selloCFD: 'MOCK_SELLO_CFD...',
                selloSAT: 'MOCK_SELLO_SAT...',
                noCertificadoSAT: '00001000000000000000',
              },
            };
            break;
          case 'brasil':
            invoiceData.invoice = {
              ...invoiceData.invoice as object,
              chaveAcesso: `35${Date.now()}`,
              protocoloAutorizacao: `135${Date.now()}`,
              dataAutorizacao: new Date().toISOString(),
            };
            break;
          case 'argentina':
            invoiceData.invoice = {
              ...invoiceData.invoice as object,
              cae: Math.random().toString().slice(2, 16),
              caeVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
            break;
          case 'chile':
            invoiceData.invoice = {
              ...invoiceData.invoice as object,
              folioSII: Math.floor(Math.random() * 1000000),
              trackId: `T${Date.now()}`,
            };
            break;
          case 'colombia':
            invoiceData.invoice = {
              ...invoiceData.invoice as object,
              cufe: crypto.randomUUID().replace(/-/g, ''),
              qrCode: `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${uuid}`,
            };
            break;
        }

        return new Response(JSON.stringify(invoiceData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate_tax_id': {
        if (!country || !taxId) {
          throw new Error('Country and taxId are required');
        }

        const pattern = taxIdPatterns[country];
        if (!pattern) {
          throw new Error(`Unknown country: ${country}`);
        }

        // Clean the tax ID for validation
        const cleanedTaxId = taxId.trim().toUpperCase();
        const isValid = pattern.test(cleanedTaxId);

        // Additional validation rules
        let validationDetails: Record<string, unknown> = {
          format: isValid,
          checkDigit: true, // Would calculate actual check digit in production
        };

        if (country === 'mexico') {
          validationDetails = {
            ...validationDetails,
            personaFisica: cleanedTaxId.length === 13,
            personaMoral: cleanedTaxId.length === 12,
          };
        }

        return new Response(JSON.stringify({
          success: true,
          valid: isValid,
          details: validationDetails,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'pac_status': {
        if (!country) {
          throw new Error('Country is required');
        }

        // Return mock PAC/certification provider status
        const providers: Record<string, object> = {
          mexico: {
            provider: 'Finkok',
            status: 'operational',
            lastCheck: new Date().toISOString(),
            responseTime: 234,
            certExpiry: '2025-12-31',
          },
          brasil: {
            provider: 'SEFAZ',
            status: 'operational',
            lastCheck: new Date().toISOString(),
            responseTime: 156,
            environment: 'production',
          },
          argentina: {
            provider: 'AFIP',
            status: 'operational',
            lastCheck: new Date().toISOString(),
            responseTime: 312,
            wsfeStatus: 'online',
          },
          chile: {
            provider: 'SII',
            status: 'operational',
            lastCheck: new Date().toISOString(),
            responseTime: 189,
            foliosDisponibles: 5000,
          },
          colombia: {
            provider: 'DIAN',
            status: 'operational',
            lastCheck: new Date().toISOString(),
            responseTime: 276,
            habilitacionStatus: 'active',
          },
        };

        return new Response(JSON.stringify({
          success: true,
          status: providers[country] || { status: 'unknown' },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[latam-compliance] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
