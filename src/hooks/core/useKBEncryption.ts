/**
 * KB 4.5 - Encryption Hook (Phase 18)
 * Client-side encryption with key management
 */

import { useState, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type EncryptionAlgorithm = 'AES-GCM' | 'AES-CBC' | 'RSA-OAEP';
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';
export type KeyDerivationFunction = 'PBKDF2' | 'HKDF';

export interface EncryptionConfig {
  algorithm?: EncryptionAlgorithm;
  keyLength?: 128 | 192 | 256;
  hashAlgorithm?: HashAlgorithm;
  iterations?: number; // for PBKDF2
  saltLength?: number;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt?: string;
  algorithm: EncryptionAlgorithm;
  timestamp: number;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface KeyMetadata {
  id: string;
  algorithm: string;
  created: number;
  expires?: number;
  purpose: 'encryption' | 'signing' | 'key-exchange';
}

export interface EncryptionStats {
  encryptionCount: number;
  decryptionCount: number;
  keyGenerations: number;
  averageEncryptionTime: number;
  averageDecryptionTime: number;
}

// ============================================================================
// UTILITIES
// ============================================================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useKBEncryption(config: EncryptionConfig = {}): {
  // Symmetric Encryption
  encrypt: (plaintext: string, key: CryptoKey) => Promise<EncryptedData>;
  decrypt: (data: EncryptedData, key: CryptoKey) => Promise<string>;
  encryptWithPassword: (plaintext: string, password: string) => Promise<EncryptedData>;
  decryptWithPassword: (data: EncryptedData, password: string) => Promise<string>;
  
  // Key Management
  generateKey: () => Promise<CryptoKey>;
  generateKeyPair: () => Promise<KeyPair>;
  deriveKey: (password: string, salt: Uint8Array) => Promise<CryptoKey>;
  exportKey: (key: CryptoKey) => Promise<string>;
  importKey: (keyData: string) => Promise<CryptoKey>;
  
  // Hashing
  hash: (data: string) => Promise<string>;
  verifyHash: (data: string, expectedHash: string) => Promise<boolean>;
  
  // Signing
  sign: (data: string, privateKey: CryptoKey) => Promise<string>;
  verify: (data: string, signature: string, publicKey: CryptoKey) => Promise<boolean>;
  
  // Utilities
  generateSalt: () => string;
  generateIV: () => string;
  
  // Stats
  stats: EncryptionStats;
} {
  const configRef = useRef({
    algorithm: config.algorithm ?? 'AES-GCM',
    keyLength: config.keyLength ?? 256,
    hashAlgorithm: config.hashAlgorithm ?? 'SHA-256',
    iterations: config.iterations ?? 100000,
    saltLength: config.saltLength ?? 16,
  });

  const statsRef = useRef<EncryptionStats>({
    encryptionCount: 0,
    decryptionCount: 0,
    keyGenerations: 0,
    averageEncryptionTime: 0,
    averageDecryptionTime: 0,
  });

  // Generate symmetric key
  const generateKey = useCallback(async (): Promise<CryptoKey> => {
    const { algorithm, keyLength } = configRef.current;
    
    const key = await crypto.subtle.generateKey(
      { name: algorithm, length: keyLength },
      true,
      ['encrypt', 'decrypt']
    );
    
    statsRef.current.keyGenerations++;
    return key;
  }, []);

  // Generate asymmetric key pair
  const generateKeyPair = useCallback(async (): Promise<KeyPair> => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: configRef.current.hashAlgorithm,
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    statsRef.current.keyGenerations++;
    return keyPair;
  }, []);

  // Derive key from password
  const deriveKey = useCallback(async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
    const { keyLength, iterations, hashAlgorithm } = configRef.current;
    
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const baseKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations,
        hash: hashAlgorithm,
      },
      baseKey,
      { name: 'AES-GCM', length: keyLength },
      true,
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  }, []);

  // Encrypt with key
  const encrypt = useCallback(async (plaintext: string, key: CryptoKey): Promise<EncryptedData> => {
    const startTime = performance.now();
    const { algorithm } = configRef.current;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = generateRandomBytes(12);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: algorithm, iv: iv.buffer as ArrayBuffer },
      key,
      data
    );
    
    const elapsed = performance.now() - startTime;
    statsRef.current.encryptionCount++;
    statsRef.current.averageEncryptionTime = 
      (statsRef.current.averageEncryptionTime * (statsRef.current.encryptionCount - 1) + elapsed) /
      statsRef.current.encryptionCount;
    
    return {
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
      algorithm,
      timestamp: Date.now(),
    };
  }, []);

  // Decrypt with key
  const decrypt = useCallback(async (data: EncryptedData, key: CryptoKey): Promise<string> => {
    const startTime = performance.now();
    
    const ciphertext = base64ToArrayBuffer(data.ciphertext);
    const iv = base64ToArrayBuffer(data.iv);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: data.algorithm, iv },
      key,
      ciphertext
    );
    
    const elapsed = performance.now() - startTime;
    statsRef.current.decryptionCount++;
    statsRef.current.averageDecryptionTime = 
      (statsRef.current.averageDecryptionTime * (statsRef.current.decryptionCount - 1) + elapsed) /
      statsRef.current.decryptionCount;
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }, []);

  // Encrypt with password
  const encryptWithPassword = useCallback(async (plaintext: string, password: string): Promise<EncryptedData> => {
    const salt = generateRandomBytes(configRef.current.saltLength);
    const key = await deriveKey(password, salt);
    const encrypted = await encrypt(plaintext, key);
    
    return {
      ...encrypted,
      salt: arrayBufferToBase64(salt),
    };
  }, [deriveKey, encrypt]);

  // Decrypt with password
  const decryptWithPassword = useCallback(async (data: EncryptedData, password: string): Promise<string> => {
    if (!data.salt) throw new Error('Salt is required for password decryption');
    
    const salt = new Uint8Array(base64ToArrayBuffer(data.salt));
    const key = await deriveKey(password, salt);
    
    return decrypt(data, key);
  }, [deriveKey, decrypt]);

  // Export key to base64
  const exportKey = useCallback(async (key: CryptoKey): Promise<string> => {
    const exported = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exported);
  }, []);

  // Import key from base64
  const importKey = useCallback(async (keyData: string): Promise<CryptoKey> => {
    const { algorithm, keyLength } = configRef.current;
    const keyBuffer = base64ToArrayBuffer(keyData);
    
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: algorithm, length: keyLength },
      true,
      ['encrypt', 'decrypt']
    );
  }, []);

  // Hash data
  const hash = useCallback(async (data: string): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest(
      configRef.current.hashAlgorithm,
      dataBuffer
    );
    
    return arrayBufferToBase64(hashBuffer);
  }, []);

  // Verify hash
  const verifyHash = useCallback(async (data: string, expectedHash: string): Promise<boolean> => {
    const actualHash = await hash(data);
    return actualHash === expectedHash;
  }, [hash]);

  // Sign data
  const sign = useCallback(async (data: string, privateKey: CryptoKey): Promise<string> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const signature = await crypto.subtle.sign(
      { name: 'RSA-PSS', saltLength: 32 },
      privateKey,
      dataBuffer
    );
    
    return arrayBufferToBase64(signature);
  }, []);

  // Verify signature
  const verify = useCallback(async (
    data: string,
    signature: string,
    publicKey: CryptoKey
  ): Promise<boolean> => {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const signatureBuffer = base64ToArrayBuffer(signature);
    
    return crypto.subtle.verify(
      { name: 'RSA-PSS', saltLength: 32 },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  }, []);

  // Generate salt
  const generateSalt = useCallback((): string => {
    const salt = generateRandomBytes(configRef.current.saltLength);
    return arrayBufferToBase64(salt.buffer as ArrayBuffer);
  }, []);

  // Generate IV
  const generateIV = useCallback((): string => {
    const iv = generateRandomBytes(12);
    return arrayBufferToBase64(iv.buffer as ArrayBuffer);
  }, []);

  return {
    encrypt,
    decrypt,
    encryptWithPassword,
    decryptWithPassword,
    generateKey,
    generateKeyPair,
    deriveKey,
    exportKey,
    importKey,
    hash,
    verifyHash,
    sign,
    verify,
    generateSalt,
    generateIV,
    stats: { ...statsRef.current },
  };
}

// ============================================================================
// ENCRYPTED STORAGE HOOK
// ============================================================================

export function useKBEncryptedStorage(storageKey: string, password: string): {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  keys: () => string[];
} {
  const encryption = useKBEncryption();
  const cacheRef = useRef<Map<string, unknown>>(new Map());

  const getStorageData = useCallback((): Record<string, EncryptedData> => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, [storageKey]);

  const saveStorageData = useCallback((data: Record<string, EncryptedData>) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [storageKey]);

  const get = useCallback(async <T>(key: string): Promise<T | null> => {
    // Check cache first
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key) as T;
    }

    const data = getStorageData();
    const encrypted = data[key];
    
    if (!encrypted) return null;
    
    try {
      const decrypted = await encryption.decryptWithPassword(encrypted, password);
      const value = JSON.parse(decrypted) as T;
      cacheRef.current.set(key, value);
      return value;
    } catch {
      return null;
    }
  }, [encryption, password, getStorageData]);

  const set = useCallback(async <T>(key: string, value: T): Promise<void> => {
    const encrypted = await encryption.encryptWithPassword(
      JSON.stringify(value),
      password
    );
    
    const data = getStorageData();
    data[key] = encrypted;
    saveStorageData(data);
    
    cacheRef.current.set(key, value);
  }, [encryption, password, getStorageData, saveStorageData]);

  const remove = useCallback(async (key: string): Promise<void> => {
    const data = getStorageData();
    delete data[key];
    saveStorageData(data);
    cacheRef.current.delete(key);
  }, [getStorageData, saveStorageData]);

  const clear = useCallback(async (): Promise<void> => {
    localStorage.removeItem(storageKey);
    cacheRef.current.clear();
  }, [storageKey]);

  const keys = useCallback((): string[] => {
    return Object.keys(getStorageData());
  }, [getStorageData]);

  return { get, set, remove, clear, keys };
}

// ============================================================================
// FIELD-LEVEL ENCRYPTION HOOK
// ============================================================================

export function useKBFieldEncryption<T extends Record<string, unknown>>(
  encryptedFields: (keyof T)[],
  password: string
): {
  encryptFields: (data: T) => Promise<T>;
  decryptFields: (data: T) => Promise<T>;
} {
  const encryption = useKBEncryption();

  const encryptFields = useCallback(async (data: T): Promise<T> => {
    const result = { ...data };
    
    for (const field of encryptedFields) {
      const value = result[field];
      if (value !== undefined && value !== null) {
        const encrypted = await encryption.encryptWithPassword(
          JSON.stringify(value),
          password
        );
        (result as Record<string, unknown>)[field as string] = encrypted;
      }
    }
    
    return result;
  }, [encryption, encryptedFields, password]);

  const decryptFields = useCallback(async (data: T): Promise<T> => {
    const result = { ...data };
    
    for (const field of encryptedFields) {
      const encrypted = result[field] as unknown as EncryptedData;
      if (encrypted && encrypted.ciphertext) {
        try {
          const decrypted = await encryption.decryptWithPassword(encrypted, password);
          (result as Record<string, unknown>)[field as string] = JSON.parse(decrypted);
        } catch {
          // Leave encrypted if decryption fails
        }
      }
    }
    
    return result;
  }, [encryption, encryptedFields, password]);

  return { encryptFields, decryptFields };
}

export default useKBEncryption;
