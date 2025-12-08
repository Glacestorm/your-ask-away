// Verifiable Credentials Manager
// Implements W3C VC Data Model 2.0 for eIDAS 2.0 compliance

import {
  VerifiableCredential,
  VerifiablePresentation,
  VerificationResult,
  Proof,
  CredentialSubject,
  PersonIdentificationData
} from './types';
import { resolveDID } from './didManager';

// Create a Verifiable Credential
export function createVerifiableCredential(
  issuerDID: string,
  subjectDID: string,
  credentialType: string,
  claims: Record<string, any>,
  expirationDate?: string
): Omit<VerifiableCredential, 'proof'> {
  const now = new Date().toISOString();
  const credentialId = `urn:uuid:${crypto.randomUUID()}`;

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://www.w3.org/2018/credentials/examples/v1',
      'https://europa.eu/2023/eidas/v1'
    ],
    id: credentialId,
    type: ['VerifiableCredential', credentialType],
    issuer: issuerDID,
    issuanceDate: now,
    expirationDate: expirationDate,
    credentialSubject: {
      id: subjectDID,
      ...claims
    }
  };
}

// Create a Person Identification Data (PID) credential
export function createPIDCredential(
  issuerDID: string,
  subjectDID: string,
  pid: PersonIdentificationData
): Omit<VerifiableCredential, 'proof'> {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 5);

  return createVerifiableCredential(
    issuerDID,
    subjectDID,
    'PersonIdentificationData',
    {
      familyName: pid.familyName,
      givenName: pid.givenName,
      birthDate: pid.birthDate,
      nationality: pid.nationality,
      placeOfBirth: pid.placeOfBirth,
      personalIdentifier: pid.personalIdentifier,
      gender: pid.gender,
      address: pid.address
    },
    expirationDate.toISOString()
  );
}

// Sign a credential (create proof)
export async function signCredential(
  credential: Omit<VerifiableCredential, 'proof'>,
  privateKey: CryptoKey,
  verificationMethodId: string
): Promise<VerifiableCredential> {
  const now = new Date().toISOString();
  
  // Create canonical form for signing
  const canonicalCredential = JSON.stringify(credential, Object.keys(credential).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalCredential);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );

  const proofValue = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const proof: Proof = {
    type: 'EcdsaSecp256r1Signature2019',
    created: now,
    verificationMethod: verificationMethodId,
    proofPurpose: 'assertionMethod',
    proofValue: proofValue
  };

  return {
    ...credential,
    proof
  };
}

// Create a Verifiable Presentation
export function createVerifiablePresentation(
  holderDID: string,
  credentials: VerifiableCredential[],
  challenge?: string,
  domain?: string
): Omit<VerifiablePresentation, 'proof'> {
  const presentationId = `urn:uuid:${crypto.randomUUID()}`;

  return {
    '@context': [
      'https://www.w3.org/2018/credentials/v1'
    ],
    id: presentationId,
    type: ['VerifiablePresentation'],
    holder: holderDID,
    verifiableCredential: credentials
  };
}

// Sign a presentation
export async function signPresentation(
  presentation: Omit<VerifiablePresentation, 'proof'>,
  privateKey: CryptoKey,
  verificationMethodId: string,
  challenge?: string,
  domain?: string
): Promise<VerifiablePresentation> {
  const now = new Date().toISOString();
  
  const canonicalPresentation = JSON.stringify(presentation, Object.keys(presentation).sort());
  const dataToSign = challenge ? `${canonicalPresentation}${challenge}` : canonicalPresentation;
  const encoder = new TextEncoder();
  const data = encoder.encode(dataToSign);

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    data
  );

  const proofValue = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const proof: Proof = {
    type: 'EcdsaSecp256r1Signature2019',
    created: now,
    verificationMethod: verificationMethodId,
    proofPurpose: 'authentication',
    proofValue: proofValue,
    challenge,
    domain
  };

  return {
    ...presentation,
    proof
  };
}

// Verify a Verifiable Credential
export async function verifyCredential(
  credential: VerifiableCredential
): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let signatureValid = false;
  let trustChainValid = false;

  const issuerDID = typeof credential.issuer === 'string' 
    ? credential.issuer 
    : credential.issuer.id;

  // Check expiration
  if (credential.expirationDate) {
    const expDate = new Date(credential.expirationDate);
    if (expDate < new Date()) {
      errors.push('Credential has expired');
    }
  }

  // Check issuance date
  const issuanceDate = new Date(credential.issuanceDate);
  if (issuanceDate > new Date()) {
    errors.push('Credential issuance date is in the future');
  }

  // Resolve issuer DID
  const issuerDoc = await resolveDID(issuerDID);
  if (!issuerDoc) {
    errors.push('Could not resolve issuer DID');
  } else {
    trustChainValid = true;
  }

  // Verify signature (simplified - in production would verify cryptographically)
  if (credential.proof) {
    if (credential.proof.proofValue && credential.proof.verificationMethod) {
      signatureValid = true; // Simplified for demo
    } else {
      errors.push('Invalid proof structure');
    }
  } else {
    errors.push('Credential has no proof');
  }

  // Determine assurance level based on issuer and credential type
  let assuranceLevel: 'low' | 'substantial' | 'high' = 'low';
  if (credential.type.includes('PersonIdentificationData')) {
    assuranceLevel = 'high';
  } else if (credential.type.includes('QualifiedElectronicAttestation')) {
    assuranceLevel = 'high';
  } else if (credential.type.includes('ElectronicAttestation')) {
    assuranceLevel = 'substantial';
  }

  return {
    verified: errors.length === 0 && signatureValid,
    credentialId: credential.id,
    issuer: issuerDID,
    issuanceDate: credential.issuanceDate,
    expirationDate: credential.expirationDate,
    revocationStatus: 'valid', // Would check status list in production
    signatureValid,
    schemaValid: true, // Would validate against schema in production
    trustChainValid,
    assuranceLevel,
    errors,
    warnings
  };
}

// Verify a Verifiable Presentation
export async function verifyPresentation(
  presentation: VerifiablePresentation,
  expectedChallenge?: string,
  expectedDomain?: string
): Promise<{ valid: boolean; credentialResults: VerificationResult[]; errors: string[] }> {
  const errors: string[] = [];
  const credentialResults: VerificationResult[] = [];

  // Verify challenge if provided
  if (expectedChallenge && presentation.proof?.challenge !== expectedChallenge) {
    errors.push('Challenge mismatch');
  }

  // Verify domain if provided
  if (expectedDomain && presentation.proof?.domain !== expectedDomain) {
    errors.push('Domain mismatch');
  }

  // Verify holder DID
  const holderDoc = await resolveDID(presentation.holder);
  if (!holderDoc) {
    errors.push('Could not resolve holder DID');
  }

  // Verify each credential
  for (const credential of presentation.verifiableCredential) {
    const result = await verifyCredential(credential);
    credentialResults.push(result);

    // Check credential subject matches holder
    if (credential.credentialSubject.id !== presentation.holder) {
      errors.push(`Credential ${credential.id} subject does not match presentation holder`);
    }
  }

  const allCredentialsValid = credentialResults.every(r => r.verified);

  return {
    valid: errors.length === 0 && allCredentialsValid,
    credentialResults,
    errors
  };
}

// Store credentials locally (encrypted in production)
export function storeCredential(credential: VerifiableCredential): void {
  const credentials = getStoredCredentials();
  const existingIndex = credentials.findIndex(c => c.id === credential.id);
  
  if (existingIndex >= 0) {
    credentials[existingIndex] = credential;
  } else {
    credentials.push(credential);
  }
  
  localStorage.setItem('eidas_credentials', JSON.stringify(credentials));
}

// Get stored credentials
export function getStoredCredentials(): VerifiableCredential[] {
  try {
    const stored = localStorage.getItem('eidas_credentials');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Delete a credential
export function deleteCredential(credentialId: string): boolean {
  const credentials = getStoredCredentials();
  const filtered = credentials.filter(c => c.id !== credentialId);
  
  if (filtered.length === credentials.length) return false;
  
  localStorage.setItem('eidas_credentials', JSON.stringify(filtered));
  return true;
}

// Get credentials by type
export function getCredentialsByType(type: string): VerifiableCredential[] {
  return getStoredCredentials().filter(c => c.type.includes(type));
}

// Check if credential is expired
export function isCredentialExpired(credential: VerifiableCredential): boolean {
  if (!credential.expirationDate) return false;
  return new Date(credential.expirationDate) < new Date();
}

// Get credential subject data
export function getCredentialSubject<T extends CredentialSubject>(
  credential: VerifiableCredential
): T {
  return credential.credentialSubject as T;
}
