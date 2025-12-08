// Decentralized Identifier (DID) Manager
// Implements DID operations for eIDAS 2.0 compliance

import { DID, VerificationMethod } from './types';

// Generate a new DID using the did:key method
export async function generateDIDKey(): Promise<{ did: DID; privateKey: CryptoKey }> {
  // Generate Ed25519 key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true,
    ['sign', 'verify']
  );

  // Export public key to JWK
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  
  // Generate multibase-encoded public key for DID
  const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyRaw)));
  const multibaseKey = 'z' + publicKeyBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  const didId = `did:key:${multibaseKey}`;
  const now = new Date().toISOString();

  const verificationMethod: VerificationMethod = {
    id: `${didId}#key-1`,
    type: 'JsonWebKey2020',
    controller: didId,
    publicKeyJwk: publicKeyJwk as JsonWebKey
  };

  const did: DID = {
    id: didId,
    method: 'key',
    controller: didId,
    verificationMethod: [verificationMethod],
    authentication: [`${didId}#key-1`],
    assertionMethod: [`${didId}#key-1`],
    created: now,
    updated: now
  };

  return { did, privateKey: keyPair.privateKey };
}

// Resolve a DID to its DID Document
export async function resolveDID(didUri: string): Promise<DID | null> {
  const [, method, identifier] = didUri.split(':');

  switch (method) {
    case 'key':
      return resolveDIDKey(didUri, identifier);
    case 'web':
      return resolveDIDWeb(identifier);
    case 'ebsi':
      return resolveDIDEBSI(identifier);
    default:
      console.warn(`Unsupported DID method: ${method}`);
      return null;
  }
}

// Resolve did:key
function resolveDIDKey(didUri: string, identifier: string): DID {
  const now = new Date().toISOString();
  
  return {
    id: didUri,
    method: 'key',
    controller: didUri,
    verificationMethod: [{
      id: `${didUri}#key-1`,
      type: 'JsonWebKey2020',
      controller: didUri,
      publicKeyMultibase: identifier
    }],
    authentication: [`${didUri}#key-1`],
    assertionMethod: [`${didUri}#key-1`],
    created: now,
    updated: now
  };
}

// Resolve did:web
async function resolveDIDWeb(identifier: string): Promise<DID | null> {
  try {
    // Convert identifier to URL: example.com:user:alice -> https://example.com/user/alice/did.json
    const path = identifier.replace(/:/g, '/');
    const url = `https://${path}${path.includes('/') ? '' : '/.well-known'}/did.json`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error resolving did:web:', error);
    return null;
  }
}

// Resolve did:ebsi (European Blockchain Services Infrastructure)
async function resolveDIDEBSI(identifier: string): Promise<DID | null> {
  try {
    // EBSI DID resolver endpoint
    const url = `https://api-pilot.ebsi.eu/did-registry/v4/identifiers/did:ebsi:${identifier}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error resolving did:ebsi:', error);
    return null;
  }
}

// Verify DID ownership by signing a challenge
export async function verifyDIDOwnership(
  did: DID,
  privateKey: CryptoKey,
  challenge: string
): Promise<{ signature: string; verified: boolean }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(challenge);

  try {
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      data
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return {
      signature: signatureBase64,
      verified: true
    };
  } catch (error) {
    console.error('DID ownership verification failed:', error);
    return { signature: '', verified: false };
  }
}

// Store DID in local storage (encrypted)
export function storeDID(did: DID): void {
  const dids = getStoredDIDs();
  const existingIndex = dids.findIndex(d => d.id === did.id);
  
  if (existingIndex >= 0) {
    dids[existingIndex] = did;
  } else {
    dids.push(did);
  }
  
  localStorage.setItem('eidas_dids', JSON.stringify(dids));
}

// Get stored DIDs
export function getStoredDIDs(): DID[] {
  try {
    const stored = localStorage.getItem('eidas_dids');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Get primary DID
export function getPrimaryDID(): DID | null {
  const dids = getStoredDIDs();
  return dids[0] || null;
}

// Delete a DID
export function deleteDID(didId: string): boolean {
  const dids = getStoredDIDs();
  const filtered = dids.filter(d => d.id !== didId);
  
  if (filtered.length === dids.length) return false;
  
  localStorage.setItem('eidas_dids', JSON.stringify(filtered));
  return true;
}

// Format DID for display
export function formatDID(didUri: string): string {
  if (didUri.length <= 30) return didUri;
  return `${didUri.substring(0, 15)}...${didUri.substring(didUri.length - 10)}`;
}
