/**
 * AES-256-GCM Encryption utility for sensitive fields
 * ISO 27001 Control A.8.24 - Use of Cryptography
 */

/**
 * Encrypt sensitive data using SubtleCrypto
 */
export async function encryptData(
  plaintext: string,
  secret: string
): Promise<{ encrypted: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);

  return {
    encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 */
export async function decryptData(
  encryptedData: string,
  ivBase64: string,
  saltBase64: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(data: string, visibleStart = 4, visibleEnd = 4): string {
  if (data.length <= visibleStart + visibleEnd) return '*'.repeat(data.length);
  return data.slice(0, visibleStart) + '*'.repeat(data.length - visibleStart - visibleEnd) + data.slice(-visibleEnd);
}
