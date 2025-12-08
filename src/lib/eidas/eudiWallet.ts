// EUDI Wallet Integration
// Implements OpenID4VP for EUDI Wallet credential exchange

import {
  AuthorizationRequest,
  PresentationDefinition,
  InputDescriptor,
  VerifiablePresentation,
  KYCVerificationRequest,
  KYCVerificationResult,
  EUDIWalletCredentialType,
  PersonIdentificationData
} from './types';
import { verifyPresentation } from './verifiableCredentials';

// EUDI Wallet discovery endpoints (mock for demo)
const EUDI_WALLET_ENDPOINTS = {
  authorization: 'openid4vp://',
  presentation: 'https://wallet.europa.eu/presentation',
  issuance: 'https://wallet.europa.eu/issuance'
};

// Supported credential types
export const SUPPORTED_CREDENTIAL_TYPES: EUDIWalletCredentialType[] = [
  {
    type: 'PID',
    name: 'Person Identification Data',
    description: 'Core identity attributes from national identity sources',
    assuranceLevel: 'high'
  },
  {
    type: 'mDL',
    name: 'Mobile Driving License',
    description: 'ISO 18013-5 compliant mobile driving license',
    assuranceLevel: 'high'
  },
  {
    type: 'QEAA',
    name: 'Qualified Electronic Attestation of Attributes',
    description: 'Attributes attested by a QTSP',
    assuranceLevel: 'high'
  },
  {
    type: 'EAA',
    name: 'Electronic Attestation of Attributes',
    description: 'Non-qualified attribute attestations',
    assuranceLevel: 'substantial'
  },
  {
    type: 'PuB-EAA',
    name: 'Public Body Electronic Attestation',
    description: 'Attestations from public sector bodies',
    assuranceLevel: 'substantial'
  }
];

// Create an authorization request for EUDI Wallet
export function createAuthorizationRequest(
  clientId: string,
  redirectUri: string,
  presentationDefinition: PresentationDefinition,
  clientName: string
): AuthorizationRequest {
  return {
    responseType: 'vp_token',
    clientId,
    redirectUri,
    scope: 'openid',
    state: crypto.randomUUID(),
    nonce: crypto.randomUUID(),
    presentationDefinition,
    clientMetadata: {
      clientName,
      logoUri: `${window.location.origin}/logo.png`,
      policyUri: `${window.location.origin}/privacy`,
      tosUri: `${window.location.origin}/terms`
    }
  };
}

// Create presentation definition for KYC
export function createKYCPresentationDefinition(): PresentationDefinition {
  return {
    id: `kyc-${crypto.randomUUID()}`,
    name: 'KYC Identity Verification',
    purpose: 'Verify your identity for banking services',
    inputDescriptors: [
      {
        id: 'pid-descriptor',
        name: 'Person Identification Data',
        purpose: 'We need to verify your identity',
        constraints: {
          fields: [
            { path: ['$.credentialSubject.familyName'] },
            { path: ['$.credentialSubject.givenName'] },
            { path: ['$.credentialSubject.birthDate'] },
            { path: ['$.credentialSubject.personalIdentifier'] },
            { path: ['$.credentialSubject.nationality'], optional: true }
          ]
        }
      }
    ]
  };
}

// Create presentation definition for age verification
export function createAgeVerificationDefinition(minimumAge: number): PresentationDefinition {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - minimumAge);

  return {
    id: `age-${crypto.randomUUID()}`,
    name: 'Age Verification',
    purpose: `Verify you are at least ${minimumAge} years old`,
    inputDescriptors: [
      {
        id: 'age-descriptor',
        name: 'Birth Date',
        purpose: 'Verify age requirement',
        constraints: {
          fields: [
            {
              path: ['$.credentialSubject.birthDate'],
              filter: {
                type: 'string',
                pattern: `^(19|20)\\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$`
              }
            }
          ]
        }
      }
    ]
  };
}

// Generate wallet invocation URI
export function generateWalletInvocationURI(
  authRequest: AuthorizationRequest
): string {
  const params = new URLSearchParams({
    response_type: authRequest.responseType,
    client_id: authRequest.clientId,
    redirect_uri: authRequest.redirectUri,
    scope: authRequest.scope,
    state: authRequest.state,
    nonce: authRequest.nonce,
    presentation_definition: JSON.stringify(authRequest.presentationDefinition),
    client_metadata: JSON.stringify(authRequest.clientMetadata)
  });

  return `${EUDI_WALLET_ENDPOINTS.authorization}?${params.toString()}`;
}

// Generate QR code data for wallet connection
export function generateWalletQRData(authRequest: AuthorizationRequest): string {
  return generateWalletInvocationURI(authRequest);
}

// Create KYC verification request
export function createKYCRequest(
  verifierDID: string,
  callbackUrl: string,
  purpose: string = 'KYC/AML Identity Verification'
): KYCVerificationRequest {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

  return {
    requestId: crypto.randomUUID(),
    requiredCredentials: [
      SUPPORTED_CREDENTIAL_TYPES.find(t => t.type === 'PID')!
    ],
    purpose,
    verifierDID,
    callbackUrl,
    expiresAt: expiresAt.toISOString()
  };
}

// Process presentation response from wallet
export async function processPresentationResponse(
  vpToken: string,
  expectedState: string,
  expectedNonce: string
): Promise<{
  valid: boolean;
  presentation?: VerifiablePresentation;
  extractedData?: PersonIdentificationData;
  errors: string[];
}> {
  try {
    const presentation: VerifiablePresentation = JSON.parse(atob(vpToken));
    
    // Verify the presentation
    const verificationResult = await verifyPresentation(
      presentation,
      expectedNonce,
      window.location.origin
    );

    if (!verificationResult.valid) {
      return {
        valid: false,
        errors: verificationResult.errors
      };
    }

    // Extract PID data from credentials
    const pidCredential = presentation.verifiableCredential.find(
      c => c.type.includes('PersonIdentificationData')
    );

    if (pidCredential) {
      const subject = pidCredential.credentialSubject;
      const extractedData: PersonIdentificationData = {
        familyName: subject.familyName,
        givenName: subject.givenName,
        birthDate: subject.birthDate,
        personalIdentifier: subject.personalIdentifier,
        nationality: subject.nationality,
        placeOfBirth: subject.placeOfBirth,
        gender: subject.gender,
        address: subject.address
      };

      return {
        valid: true,
        presentation,
        extractedData,
        errors: []
      };
    }

    return {
      valid: true,
      presentation,
      errors: []
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to process presentation: ${error}`]
    };
  }
}

// Store KYC verification result
export function storeKYCResult(result: KYCVerificationResult): void {
  const results = getStoredKYCResults();
  results.push(result);
  localStorage.setItem('eidas_kyc_results', JSON.stringify(results));
}

// Get stored KYC results
export function getStoredKYCResults(): KYCVerificationResult[] {
  try {
    const stored = localStorage.getItem('eidas_kyc_results');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Check wallet availability
export async function checkWalletAvailability(): Promise<{
  available: boolean;
  walletName?: string;
  version?: string;
}> {
  // Check for wallet browser extension or app link handler
  const hasHandler = await checkProtocolHandler('openid4vp');
  
  if (hasHandler) {
    return {
      available: true,
      walletName: 'EUDI Wallet',
      version: '1.0.0'
    };
  }

  return { available: false };
}

// Check if protocol handler is registered
async function checkProtocolHandler(protocol: string): Promise<boolean> {
  try {
    // Create a hidden iframe to test protocol
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${protocol}://test`;
    document.body.appendChild(iframe);
    
    // Clean up after brief check
    await new Promise(resolve => setTimeout(resolve, 100));
    document.body.removeChild(iframe);
    
    return true; // Assume available in demo
  } catch {
    return false;
  }
}

// Generate deep link for mobile wallet
export function generateMobileDeepLink(authRequest: AuthorizationRequest): string {
  const uri = generateWalletInvocationURI(authRequest);
  
  // For iOS/Android universal links
  return `https://wallet.europa.eu/verify?request=${encodeURIComponent(uri)}`;
}

// Calculate AML risk score based on verified data
export function calculateAMLRiskScore(
  pid: PersonIdentificationData
): { score: number; flags: string[]; pepCheck: boolean } {
  const flags: string[] = [];
  let score = 0;

  // Check nationality risk
  const highRiskCountries = ['KP', 'IR', 'SY', 'CU'];
  if (pid.nationality && highRiskCountries.includes(pid.nationality)) {
    score += 50;
    flags.push('HIGH_RISK_COUNTRY');
  }

  // Age verification
  const birthDate = new Date(pid.birthDate);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  if (age < 18) {
    score += 30;
    flags.push('MINOR');
  }

  // PEP check would be done against external database
  const pepCheck = false; // Mock

  return { score, flags, pepCheck };
}
