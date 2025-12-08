// eIDAS 2.0 and EUDI Wallet React Hook
// Provides complete identity verification capabilities

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  DID,
  VerifiableCredential,
  VerifiablePresentation,
  KYCVerificationRequest,
  KYCVerificationResult,
  PersonIdentificationData,
  QualifiedTrustServiceProvider,
  VerificationResult
} from '@/lib/eidas/types';
import {
  generateDIDKey,
  resolveDID,
  storeDID,
  getStoredDIDs,
  getPrimaryDID,
  deleteDID,
  formatDID
} from '@/lib/eidas/didManager';
import {
  createVerifiableCredential,
  signCredential,
  verifyCredential,
  createVerifiablePresentation,
  signPresentation,
  verifyPresentation,
  storeCredential,
  getStoredCredentials,
  deleteCredential,
  isCredentialExpired
} from '@/lib/eidas/verifiableCredentials';
import {
  fetchEUTrustedList,
  getProvidersByCountry,
  verifyQTSPStatus,
  requestQualifiedTimestamp
} from '@/lib/eidas/trustServices';
import {
  createAuthorizationRequest,
  createKYCPresentationDefinition,
  generateWalletQRData,
  generateMobileDeepLink,
  processPresentationResponse,
  checkWalletAvailability,
  createKYCRequest,
  storeKYCResult,
  getStoredKYCResults,
  calculateAMLRiskScore,
  SUPPORTED_CREDENTIAL_TYPES
} from '@/lib/eidas/eudiWallet';

export interface EIDASState {
  primaryDID: DID | null;
  credentials: VerifiableCredential[];
  pendingKYCRequest: KYCVerificationRequest | null;
  lastKYCResult: KYCVerificationResult | null;
  walletAvailable: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseEIDASReturn {
  state: EIDASState;
  
  // DID Management
  createDID: () => Promise<DID | null>;
  getDIDs: () => DID[];
  resolveDID: (didUri: string) => Promise<DID | null>;
  removeDID: (didId: string) => boolean;
  
  // Credential Management
  getCredentials: () => VerifiableCredential[];
  verifyCredential: (credential: VerifiableCredential) => Promise<VerificationResult>;
  removeCredential: (credentialId: string) => boolean;
  isExpired: (credential: VerifiableCredential) => boolean;
  
  // EUDI Wallet Integration
  initiateKYCVerification: (purpose?: string) => Promise<{
    qrData: string;
    deepLink: string;
    request: KYCVerificationRequest;
  } | null>;
  processWalletResponse: (vpToken: string) => Promise<KYCVerificationResult | null>;
  checkWallet: () => Promise<boolean>;
  
  // Trust Services
  getTrustProviders: (countryCode?: string) => Promise<QualifiedTrustServiceProvider[]>;
  verifyIssuer: (issuerName: string) => Promise<boolean>;
  getTimestamp: (documentHash: string) => Promise<{ timestamp: string; token: string } | null>;
  
  // KYC Results
  getKYCHistory: () => KYCVerificationResult[];
  
  // Utilities
  formatDIDDisplay: (did: string) => string;
  getSupportedCredentialTypes: () => typeof SUPPORTED_CREDENTIAL_TYPES;
  clearError: () => void;
}

export function useEIDAS(): UseEIDASReturn {
  const { user } = useAuth();
  
  const [state, setState] = useState<EIDASState>({
    primaryDID: null,
    credentials: [],
    pendingKYCRequest: null,
    lastKYCResult: null,
    walletAvailable: false,
    isLoading: false,
    error: null
  });

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Load stored DIDs and credentials
        const primaryDID = getPrimaryDID();
        const credentials = getStoredCredentials();
        
        // Check wallet availability
        const walletCheck = await checkWalletAvailability();
        
        setState(prev => ({
          ...prev,
          primaryDID,
          credentials,
          walletAvailable: walletCheck.available,
          isLoading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize eIDAS'
        }));
      }
    };

    initialize();
  }, []);

  // Create a new DID
  const createDID = useCallback(async (): Promise<DID | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { did } = await generateDIDKey();
      storeDID(did);
      
      setState(prev => ({
        ...prev,
        primaryDID: prev.primaryDID || did,
        isLoading: false
      }));
      
      return did;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to create DID'
      }));
      return null;
    }
  }, []);

  // Get all DIDs
  const getDIDs = useCallback((): DID[] => {
    return getStoredDIDs();
  }, []);

  // Resolve a DID
  const resolveDIDCallback = useCallback(async (didUri: string): Promise<DID | null> => {
    return resolveDID(didUri);
  }, []);

  // Remove a DID
  const removeDID = useCallback((didId: string): boolean => {
    const success = deleteDID(didId);
    if (success) {
      setState(prev => ({
        ...prev,
        primaryDID: prev.primaryDID?.id === didId ? getPrimaryDID() : prev.primaryDID
      }));
    }
    return success;
  }, []);

  // Get all credentials
  const getCredentials = useCallback((): VerifiableCredential[] => {
    return getStoredCredentials();
  }, []);

  // Verify a credential
  const verifyCredentialCallback = useCallback(async (
    credential: VerifiableCredential
  ): Promise<VerificationResult> => {
    return verifyCredential(credential);
  }, []);

  // Remove a credential
  const removeCredential = useCallback((credentialId: string): boolean => {
    const success = deleteCredential(credentialId);
    if (success) {
      setState(prev => ({
        ...prev,
        credentials: prev.credentials.filter(c => c.id !== credentialId)
      }));
    }
    return success;
  }, []);

  // Check if credential is expired
  const isExpired = useCallback((credential: VerifiableCredential): boolean => {
    return isCredentialExpired(credential);
  }, []);

  // Initiate KYC verification with EUDI Wallet
  const initiateKYCVerification = useCallback(async (
    purpose: string = 'KYC/AML Identity Verification for Banking Services'
  ): Promise<{
    qrData: string;
    deepLink: string;
    request: KYCVerificationRequest;
  } | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Ensure we have a DID
      let verifierDID = state.primaryDID?.id;
      if (!verifierDID) {
        const newDID = await createDID();
        if (!newDID) throw new Error('Could not create verifier DID');
        verifierDID = newDID.id;
      }

      // Create KYC request
      const callbackUrl = `${window.location.origin}/kyc/callback`;
      const kycRequest = createKYCRequest(verifierDID, callbackUrl, purpose);
      
      // Create presentation definition
      const presentationDef = createKYCPresentationDefinition();
      
      // Create authorization request
      const authRequest = createAuthorizationRequest(
        verifierDID,
        callbackUrl,
        presentationDef,
        'Creand Banking Platform'
      );

      // Generate QR and deep link
      const qrData = generateWalletQRData(authRequest);
      const deepLink = generateMobileDeepLink(authRequest);

      setState(prev => ({
        ...prev,
        pendingKYCRequest: kycRequest,
        isLoading: false
      }));

      return { qrData, deepLink, request: kycRequest };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to initiate KYC verification'
      }));
      return null;
    }
  }, [state.primaryDID, createDID]);

  // Process wallet response
  const processWalletResponse = useCallback(async (
    vpToken: string
  ): Promise<KYCVerificationResult | null> => {
    if (!state.pendingKYCRequest) {
      setState(prev => ({ ...prev, error: 'No pending KYC request' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await processPresentationResponse(
        vpToken,
        state.pendingKYCRequest.requestId,
        crypto.randomUUID()
      );

      if (!result.valid) {
        throw new Error(result.errors.join(', '));
      }

      // Calculate AML risk
      const amlResult = result.extractedData 
        ? calculateAMLRiskScore(result.extractedData)
        : { score: 0, flags: [], pepCheck: false };

      // Create verification result
      const kycResult: KYCVerificationResult = {
        requestId: state.pendingKYCRequest.requestId,
        status: 'completed',
        verifiedAt: new Date().toISOString(),
        credentials: [], // Would contain actual verification results
        riskScore: amlResult.score,
        amlFlags: amlResult.flags,
        pep: amlResult.pepCheck,
        sanctionsHit: false
      };

      // Store result
      storeKYCResult(kycResult);

      setState(prev => ({
        ...prev,
        lastKYCResult: kycResult,
        pendingKYCRequest: null,
        isLoading: false
      }));

      return kycResult;
    } catch (error) {
      const failedResult: KYCVerificationResult = {
        requestId: state.pendingKYCRequest.requestId,
        status: 'failed',
        credentials: []
      };

      setState(prev => ({
        ...prev,
        lastKYCResult: failedResult,
        pendingKYCRequest: null,
        isLoading: false,
        error: `KYC verification failed: ${error}`
      }));

      return failedResult;
    }
  }, [state.pendingKYCRequest]);

  // Check wallet availability
  const checkWallet = useCallback(async (): Promise<boolean> => {
    const result = await checkWalletAvailability();
    setState(prev => ({ ...prev, walletAvailable: result.available }));
    return result.available;
  }, []);

  // Get trust providers
  const getTrustProviders = useCallback(async (
    countryCode?: string
  ): Promise<QualifiedTrustServiceProvider[]> => {
    if (countryCode) {
      return getProvidersByCountry(countryCode);
    }
    return fetchEUTrustedList();
  }, []);

  // Verify if issuer is QTSP
  const verifyIssuer = useCallback(async (issuerName: string): Promise<boolean> => {
    const result = await verifyQTSPStatus(issuerName);
    return result.isQTSP;
  }, []);

  // Get qualified timestamp
  const getTimestamp = useCallback(async (
    documentHash: string
  ): Promise<{ timestamp: string; token: string } | null> => {
    try {
      const result = await requestQualifiedTimestamp(documentHash);
      return { timestamp: result.timestamp, token: result.token };
    } catch {
      return null;
    }
  }, []);

  // Get KYC history
  const getKYCHistory = useCallback((): KYCVerificationResult[] => {
    return getStoredKYCResults();
  }, []);

  // Format DID for display
  const formatDIDDisplay = useCallback((did: string): string => {
    return formatDID(did);
  }, []);

  // Get supported credential types
  const getSupportedCredentialTypes = useCallback(() => {
    return SUPPORTED_CREDENTIAL_TYPES;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    state,
    createDID,
    getDIDs,
    resolveDID: resolveDIDCallback,
    removeDID,
    getCredentials,
    verifyCredential: verifyCredentialCallback,
    removeCredential,
    isExpired,
    initiateKYCVerification,
    processWalletResponse,
    checkWallet,
    getTrustProviders,
    verifyIssuer,
    getTimestamp,
    getKYCHistory,
    formatDIDDisplay,
    getSupportedCredentialTypes,
    clearError
  };
}
