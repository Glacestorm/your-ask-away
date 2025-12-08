// Trust Services API Integration
// Implements eIDAS 2.0 Qualified Trust Service Provider interactions

import {
  QualifiedTrustServiceProvider,
  TrustService,
  TrustServiceType
} from './types';

// EU Trusted List browser API endpoint
const EU_TRUSTED_LIST_API = 'https://eidas.ec.europa.eu/efda/tl-browser/api/v1';

// Cache for trusted list
let trustedListCache: QualifiedTrustServiceProvider[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 3600000; // 1 hour

// Fetch EU Trusted List
export async function fetchEUTrustedList(): Promise<QualifiedTrustServiceProvider[]> {
  // Return cached if valid
  if (trustedListCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return trustedListCache;
  }

  try {
    // In production, would call actual EU Trusted List API
    // For now, return mock data representing actual QTSP structure
    const mockProviders: QualifiedTrustServiceProvider[] = [
      {
        id: 'QTSP-ES-001',
        name: 'AC Camerfirma S.A.',
        tradeName: 'Camerfirma',
        countryCode: 'ES',
        trustMark: 'https://eidas.ec.europa.eu/efda/tl-browser/trustmark/ES/001',
        services: [
          {
            type: 'QCertESig',
            name: 'Certificados cualificados para firma electrónica',
            status: 'granted',
            statusStartingTime: '2016-07-01T00:00:00Z',
            serviceDigitalIdentity: {
              certificates: ['MIIG...'],
              subjectName: 'CN=AC Camerfirma,O=AC Camerfirma S.A.,C=ES'
            }
          },
          {
            type: 'QTimestamp',
            name: 'Servicio de sellado de tiempo cualificado',
            status: 'granted',
            statusStartingTime: '2016-07-01T00:00:00Z',
            serviceDigitalIdentity: {
              certificates: ['MIIF...'],
              subjectName: 'CN=TSA Camerfirma,O=AC Camerfirma S.A.,C=ES'
            }
          }
        ],
        status: 'granted'
      },
      {
        id: 'QTSP-AD-001',
        name: 'Andorra Telecom SAU',
        tradeName: 'Andorra Telecom',
        countryCode: 'AD',
        trustMark: 'https://eidas.ec.europa.eu/efda/tl-browser/trustmark/AD/001',
        services: [
          {
            type: 'QCertESig',
            name: 'Certificats qualificats per a signatura electrònica',
            status: 'granted',
            statusStartingTime: '2018-01-01T00:00:00Z',
            serviceDigitalIdentity: {
              certificates: ['MIIG...'],
              subjectName: 'CN=CA Andorra Telecom,O=Andorra Telecom SAU,C=AD'
            }
          }
        ],
        status: 'granted'
      },
      {
        id: 'QTSP-FR-001',
        name: 'Docusign France',
        tradeName: 'Docusign',
        countryCode: 'FR',
        trustMark: 'https://eidas.ec.europa.eu/efda/tl-browser/trustmark/FR/001',
        services: [
          {
            type: 'QCertESig',
            name: 'Certificats qualifiés pour signature électronique',
            status: 'granted',
            statusStartingTime: '2019-06-01T00:00:00Z',
            serviceDigitalIdentity: {
              certificates: ['MIIG...'],
              subjectName: 'CN=Docusign EU,O=Docusign France,C=FR'
            }
          },
          {
            type: 'QRemoteSig',
            name: 'Service de création de signature à distance qualifié',
            status: 'granted',
            statusStartingTime: '2019-06-01T00:00:00Z',
            serviceDigitalIdentity: {
              certificates: ['MIIF...'],
              subjectName: 'CN=Docusign RSC,O=Docusign France,C=FR'
            }
          }
        ],
        status: 'granted'
      }
    ];

    trustedListCache = mockProviders;
    cacheTimestamp = Date.now();
    return mockProviders;
  } catch (error) {
    console.error('Error fetching EU Trusted List:', error);
    return trustedListCache || [];
  }
}

// Get providers by country
export async function getProvidersByCountry(
  countryCode: string
): Promise<QualifiedTrustServiceProvider[]> {
  const providers = await fetchEUTrustedList();
  return providers.filter(p => p.countryCode === countryCode);
}

// Get providers by service type
export async function getProvidersByServiceType(
  serviceType: TrustServiceType
): Promise<QualifiedTrustServiceProvider[]> {
  const providers = await fetchEUTrustedList();
  return providers.filter(p => 
    p.services.some(s => s.type === serviceType && s.status === 'granted')
  );
}

// Verify if an issuer is a QTSP
export async function verifyQTSPStatus(
  issuerName: string,
  countryCode?: string
): Promise<{ isQTSP: boolean; provider?: QualifiedTrustServiceProvider; service?: TrustService }> {
  const providers = await fetchEUTrustedList();
  
  for (const provider of providers) {
    if (countryCode && provider.countryCode !== countryCode) continue;
    
    if (
      provider.name.toLowerCase().includes(issuerName.toLowerCase()) ||
      provider.tradeName?.toLowerCase().includes(issuerName.toLowerCase())
    ) {
      const activeService = provider.services.find(s => s.status === 'granted');
      return {
        isQTSP: provider.status === 'granted',
        provider,
        service: activeService
      };
    }
  }

  return { isQTSP: false };
}

// Request qualified timestamp
export async function requestQualifiedTimestamp(
  documentHash: string,
  tsaProvider?: string
): Promise<{ timestamp: string; token: string; provider: string }> {
  // In production, would call actual TSA service
  const now = new Date().toISOString();
  const token = btoa(`${documentHash}:${now}:${crypto.randomUUID()}`);

  return {
    timestamp: now,
    token,
    provider: tsaProvider || 'Camerfirma TSA'
  };
}

// Validate a qualified timestamp token
export async function validateTimestampToken(
  token: string,
  originalHash: string
): Promise<{ valid: boolean; timestamp?: string; provider?: string; error?: string }> {
  try {
    const decoded = atob(token);
    const [hash, timestamp] = decoded.split(':');
    
    if (hash !== originalHash) {
      return { valid: false, error: 'Hash mismatch' };
    }

    return {
      valid: true,
      timestamp,
      provider: 'Camerfirma TSA'
    };
  } catch {
    return { valid: false, error: 'Invalid token format' };
  }
}

// Get service type display name
export function getServiceTypeName(type: TrustServiceType): string {
  const names: Record<TrustServiceType, string> = {
    'QCertESig': 'Certificat Qualificat per a Signatura Electrònica',
    'QCertESeal': 'Certificat Qualificat per a Segell Electrònic',
    'QValQESig': 'Servei de Validació Qualificat per a QES',
    'QPresQESig': 'Servei de Preservació Qualificat per a QES',
    'QWAC': 'Certificat Qualificat d\'Autenticació Web',
    'QTimestamp': 'Servei de Segellat de Temps Qualificat',
    'QeRDS': 'Servei d\'Entrega Electrònica Registrada Qualificat',
    'QRemoteSig': 'Servei de Creació de Signatura Remota Qualificat'
  };
  return names[type] || type;
}

// Check if country is EU/EEA member
export function isEUEEACountry(countryCode: string): boolean {
  const euEeaCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', // EU
    'IS', 'LI', 'NO', // EEA
    'AD' // Andorra (special agreements)
  ];
  return euEeaCountries.includes(countryCode.toUpperCase());
}
