// eIDAS 2.0 and EUDI Wallet Type Definitions

// Decentralized Identifier (DID) types
export interface DID {
  id: string; // did:key:xxx or did:web:xxx
  method: 'key' | 'web' | 'ebsi' | 'ion';
  controller: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
  created: string;
  updated: string;
}

export interface VerificationMethod {
  id: string;
  type: 'JsonWebKey2020' | 'Ed25519VerificationKey2020' | 'EcdsaSecp256k1VerificationKey2019';
  controller: string;
  publicKeyJwk?: JsonWebKey;
  publicKeyMultibase?: string;
}

// Verifiable Credential types (W3C VC Data Model 2.0)
export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | { id: string; name?: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  credentialStatus?: CredentialStatus;
  credentialSchema?: CredentialSchema;
  proof?: Proof;
}

export interface CredentialSubject {
  id: string;
  [key: string]: any;
}

export interface CredentialStatus {
  id: string;
  type: 'StatusList2021Entry' | 'RevocationList2020Status';
  statusPurpose: 'revocation' | 'suspension';
  statusListIndex: string;
  statusListCredential: string;
}

export interface CredentialSchema {
  id: string;
  type: 'JsonSchema' | 'JsonSchemaCredential';
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod' | 'authentication';
  proofValue: string;
  challenge?: string;
  domain?: string;
}

// Verifiable Presentation
export interface VerifiablePresentation {
  '@context': string[];
  id: string;
  type: string[];
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof?: Proof;
}

// EUDI Wallet specific types
export interface EUDIWalletCredentialType {
  type: 'PID' | 'mDL' | 'QEAA' | 'EAA' | 'PuB-EAA';
  name: string;
  description: string;
  assuranceLevel: 'low' | 'substantial' | 'high';
}

export interface PersonIdentificationData {
  familyName: string;
  givenName: string;
  birthDate: string;
  nationality?: string;
  placeOfBirth?: string;
  personalIdentifier: string;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  portraitImage?: string; // base64
}

export interface Address {
  streetAddress: string;
  locality: string;
  region?: string;
  postalCode: string;
  country: string;
}

// Mobile Driving License (mDL) ISO 18013-5
export interface MobileDriverLicense {
  familyName: string;
  givenName: string;
  birthDate: string;
  issueDate: string;
  expiryDate: string;
  issuingCountry: string;
  issuingAuthority: string;
  documentNumber: string;
  portrait: string;
  drivingPrivileges: DrivingPrivilege[];
}

export interface DrivingPrivilege {
  vehicleCategoryCode: string;
  issueDate: string;
  expiryDate: string;
  restrictions?: string[];
}

// Trust Service types (eIDAS Qualified Trust Services)
export interface QualifiedTrustServiceProvider {
  id: string;
  name: string;
  tradeName?: string;
  countryCode: string;
  trustMark: string;
  services: TrustService[];
  status: 'granted' | 'withdrawn' | 'deprecated';
}

export interface TrustService {
  type: TrustServiceType;
  name: string;
  status: 'granted' | 'withdrawn';
  statusStartingTime: string;
  serviceDigitalIdentity: ServiceDigitalIdentity;
}

export type TrustServiceType = 
  | 'QCertESig' // Qualified Certificate for Electronic Signatures
  | 'QCertESeal' // Qualified Certificate for Electronic Seals
  | 'QValQESig' // Qualified Validation Service for QES
  | 'QPresQESig' // Qualified Preservation Service for QES
  | 'QWAC' // Qualified Website Authentication Certificate
  | 'QTimestamp' // Qualified Time Stamp
  | 'QeRDS' // Qualified Electronic Registered Delivery Service
  | 'QRemoteSig'; // Qualified Remote Signature Creation

export interface ServiceDigitalIdentity {
  certificates: string[];
  subjectName: string;
}

// OpenID4VC / OIDC4VP types
export interface AuthorizationRequest {
  responseType: 'vp_token' | 'id_token';
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  nonce: string;
  presentationDefinition?: PresentationDefinition;
  clientMetadata?: ClientMetadata;
}

export interface PresentationDefinition {
  id: string;
  name?: string;
  purpose?: string;
  inputDescriptors: InputDescriptor[];
}

export interface InputDescriptor {
  id: string;
  name?: string;
  purpose?: string;
  constraints: {
    fields: FieldConstraint[];
  };
}

export interface FieldConstraint {
  path: string[];
  filter?: {
    type: string;
    pattern?: string;
    const?: any;
  };
  optional?: boolean;
}

export interface ClientMetadata {
  clientName: string;
  logoUri?: string;
  policyUri?: string;
  tosUri?: string;
  jwks?: { keys: JsonWebKey[] };
}

// Verification result types
export interface VerificationResult {
  verified: boolean;
  credentialId: string;
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  revocationStatus: 'valid' | 'revoked' | 'suspended' | 'unknown';
  signatureValid: boolean;
  schemaValid: boolean;
  trustChainValid: boolean;
  assuranceLevel: 'low' | 'substantial' | 'high';
  errors: string[];
  warnings: string[];
}

// KYC/AML integration types
export interface KYCVerificationRequest {
  requestId: string;
  requiredCredentials: EUDIWalletCredentialType[];
  purpose: string;
  verifierDID: string;
  callbackUrl: string;
  expiresAt: string;
}

export interface KYCVerificationResult {
  requestId: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  verifiedAt?: string;
  credentials: VerificationResult[];
  riskScore?: number;
  amlFlags?: string[];
  pep?: boolean;
  sanctionsHit?: boolean;
}
