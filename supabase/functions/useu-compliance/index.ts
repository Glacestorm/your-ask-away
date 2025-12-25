import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceRequest {
  action: string;
  region?: 'us' | 'eu';
  regulation?: string;
  config?: Record<string, unknown>;
  regulations?: string[];
  requestType?: 'access' | 'erasure' | 'rectification' | 'portability';
  userId?: string;
  format?: 'pdf' | 'excel';
  state?: string;
  amount?: number;
  productType?: string;
  description?: string;
}

// US State tax rates (simplified)
const stateTaxRates: Record<string, number> = {
  'CA': 0.0725, 'TX': 0.0625, 'NY': 0.08, 'FL': 0.06, 'WA': 0.065,
  'PA': 0.06, 'IL': 0.0625, 'OH': 0.0575, 'GA': 0.04, 'NC': 0.0475,
  'NJ': 0.06625, 'VA': 0.053, 'MI': 0.06, 'AZ': 0.056, 'MA': 0.0625,
  'TN': 0.07, 'IN': 0.07, 'MO': 0.04225, 'MD': 0.06, 'WI': 0.05,
  'CO': 0.029, 'MN': 0.06875, 'SC': 0.06, 'AL': 0.04, 'LA': 0.0445,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json() as ComplianceRequest;
    const { action } = requestData;

    console.log(`[useu-compliance] Action: ${action}`);

    switch (action) {
      case 'get_config': {
        const defaultConfig = {
          us: {
            soc2: {
              enabled: false,
              lastAuditDate: '',
              nextAuditDate: '',
              trustServiceCriteria: ['security', 'availability', 'confidentiality'],
              controlsImplemented: 0,
              controlsTotal: 100,
              auditorName: '',
            },
            hipaa: {
              enabled: false,
              coveredEntity: false,
              businessAssociate: false,
              privacyOfficer: '',
              securityOfficer: '',
              riskAssessmentDate: '',
              baaTemplateEnabled: false,
            },
            sox: {
              enabled: false,
              fiscalYearEnd: '',
              controlsDocumented: 0,
              controlsTested: 0,
              materialWeaknesses: 0,
              significantDeficiencies: 0,
            },
            stateTax: {
              enabled: false,
              nexusStates: [],
              taxRates: stateTaxRates,
              autoCalculation: true,
              filingFrequency: {},
            },
          },
          eu: {
            gdpr: {
              enabled: true,
              dpoName: '',
              dpoEmail: '',
              dataProcessingAgreements: 0,
              consentManagement: true,
              dsarAutomation: true,
              cookieConsent: true,
              dataRetentionDays: 365,
            },
            dora: {
              enabled: false,
              ictRiskManagement: false,
              incidentReporting: false,
              digitalResilienceTesting: false,
              thirdPartyRiskManagement: false,
              informationSharing: false,
            },
            psd3: {
              enabled: false,
              strongCustomerAuth: false,
              openBankingApi: false,
              fraudDetection: false,
              transactionMonitoring: false,
            },
            aiAct: {
              enabled: false,
              riskClassification: 'limited',
              humanOversight: false,
              transparencyMeasures: false,
              technicalDocumentation: false,
              conformityAssessment: false,
            },
            sepa: {
              enabled: false,
              iban: '',
              bic: '',
              directDebitEnabled: false,
              instantPaymentsEnabled: false,
              mandateManagement: false,
            },
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
        const { region, regulation, config } = requestData;
        if (!region || !regulation || !config) {
          throw new Error('Region, regulation and config are required');
        }

        console.log(`[useu-compliance] Updating ${region}/${regulation} config:`, config);

        return new Response(JSON.stringify({
          success: true,
          message: `Configuración ${regulation.toUpperCase()} actualizada`,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'run_checks': {
        const { regulations } = requestData;
        const allRegulations = regulations || ['soc2', 'hipaa', 'gdpr', 'dora', 'aiAct'];

        // Generate compliance checks
        const checks = allRegulations.map(reg => {
          const statuses = ['compliant', 'non_compliant', 'partial'] as const;
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          return {
            id: crypto.randomUUID(),
            regulation: reg.toUpperCase(),
            category: reg.includes('gdpr') || reg.includes('dora') ? 'EU' : 'US',
            status: randomStatus,
            lastChecked: new Date().toISOString(),
            details: `Verificación de cumplimiento ${reg.toUpperCase()}`,
            remediation: randomStatus !== 'compliant' ? `Acción requerida para ${reg}` : undefined,
            score: Math.floor(Math.random() * 40) + 60,
          };
        });

        return new Response(JSON.stringify({
          success: true,
          checks,
          summary: {
            total: checks.length,
            compliant: checks.filter(c => c.status === 'compliant').length,
            nonCompliant: checks.filter(c => c.status === 'non_compliant').length,
            partial: checks.filter(c => c.status === 'partial').length,
            overallScore: Math.floor(checks.reduce((sum, c) => sum + (c.score || 0), 0) / checks.length),
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_dsar': {
        const { requestType, userId } = requestData;
        if (!requestType || !userId) {
          throw new Error('Request type and userId are required');
        }

        // Mock DSAR processing
        const dsarResult = {
          requestId: `DSAR-${Date.now()}`,
          type: requestType,
          userId,
          status: 'processing',
          submittedAt: new Date().toISOString(),
          estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        switch (requestType) {
          case 'access':
            dsarResult.status = 'data_collected';
            break;
          case 'erasure':
            dsarResult.status = 'pending_verification';
            break;
          case 'rectification':
            dsarResult.status = 'review_required';
            break;
          case 'portability':
            dsarResult.status = 'export_ready';
            break;
        }

        return new Response(JSON.stringify({
          success: true,
          result: dsarResult,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'generate_report': {
        const { regulations, format } = requestData;
        if (!regulations || !format) {
          throw new Error('Regulations and format are required');
        }

        // Mock report generation
        const reportId = `RPT-${Date.now()}`;

        return new Response(JSON.stringify({
          success: true,
          reportUrl: `https://storage.example.com/reports/${reportId}.${format}`,
          reportId,
          generatedAt: new Date().toISOString(),
          regulations,
          format,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'calculate_state_tax': {
        const { state, amount, productType } = requestData;
        if (!state || amount === undefined) {
          throw new Error('State and amount are required');
        }

        const taxRate = stateTaxRates[state.toUpperCase()] || 0;
        const taxAmount = amount * taxRate;

        // Check for exemptions
        let exemption = null;
        if (productType === 'food' && ['CA', 'NY', 'TX'].includes(state.toUpperCase())) {
          exemption = 'Food items exempt';
        }

        return new Response(JSON.stringify({
          success: true,
          tax: {
            state: state.toUpperCase(),
            rate: taxRate,
            amount: taxAmount,
            total: amount + taxAmount,
            exemption,
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'ai_act_assessment': {
        const { description } = requestData;
        if (!description) {
          throw new Error('AI system description is required');
        }

        // Mock AI Act risk assessment
        const keywords = description.toLowerCase();
        let riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable' = 'limited';
        let requirements: string[] = [];

        if (keywords.includes('biometric') || keywords.includes('social scoring')) {
          riskLevel = 'unacceptable';
          requirements = ['System prohibited under AI Act'];
        } else if (keywords.includes('hiring') || keywords.includes('credit') || keywords.includes('healthcare')) {
          riskLevel = 'high';
          requirements = [
            'Risk management system required',
            'High-quality training data',
            'Logging and traceability',
            'Human oversight measures',
            'Accuracy and robustness',
            'Cybersecurity measures',
            'Conformity assessment',
            'Registration in EU database',
          ];
        } else if (keywords.includes('chatbot') || keywords.includes('emotion')) {
          riskLevel = 'limited';
          requirements = [
            'Transparency requirements',
            'User notification of AI interaction',
          ];
        } else {
          riskLevel = 'minimal';
          requirements = ['No specific requirements'];
        }

        return new Response(JSON.stringify({
          success: true,
          assessment: {
            riskClassification: riskLevel,
            requirements,
            complianceScore: riskLevel === 'minimal' ? 100 : riskLevel === 'limited' ? 80 : riskLevel === 'high' ? 40 : 0,
            nextSteps: riskLevel === 'high' ? [
              'Conduct full conformity assessment',
              'Document training data sources',
              'Implement human oversight mechanisms',
              'Register system in EU database',
            ] : [],
            assessmentDate: new Date().toISOString(),
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sepa_mandate': {
        // Generate SEPA Direct Debit mandate
        const mandateId = `SEPA-${Date.now()}`;

        return new Response(JSON.stringify({
          success: true,
          mandate: {
            mandateId,
            mandateReference: `MNDT-${mandateId}`,
            sequenceType: 'RCUR',
            signatureDate: new Date().toISOString().split('T')[0],
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
    console.error('[useu-compliance] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
