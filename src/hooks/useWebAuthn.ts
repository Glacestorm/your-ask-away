import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WebAuthnCredential {
  id: string;
  rawId: ArrayBuffer;
  type: string;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
  };
}

interface UseWebAuthnReturn {
  isSupported: boolean;
  isRegistering: boolean;
  isAuthenticating: boolean;
  registerPasskey: (userId: string, userEmail: string, userName: string) => Promise<boolean>;
  authenticateWithPasskey: (userEmail: string) => Promise<boolean>;
  listPasskeys: (userId: string) => Promise<any[]>;
  removePasskey: (credentialId: string) => Promise<boolean>;
}

// Convert ArrayBuffer to Base64URL
function bufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Convert Base64URL to ArrayBuffer
function base64URLToBuffer(base64URL: string): ArrayBuffer {
  const base64 = base64URL.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate random bytes
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function useWebAuthn(): UseWebAuthnReturn {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Check if WebAuthn is supported
  const isSupported = typeof window !== 'undefined' && 
    !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === 'function';

  const registerPasskey = useCallback(async (
    userId: string,
    userEmail: string,
    userName: string
  ): Promise<boolean> => {
    if (!isSupported) {
      toast.error('WebAuthn no és compatible amb aquest navegador');
      return false;
    }

    setIsRegistering(true);

    try {
      // Generate challenge
      const challenge = generateRandomBytes(32);
      
      // Create PublicKeyCredentialCreationOptions
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'Creand Banking CRM',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userName || userEmail,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
          requireResidentKey: false,
        },
        timeout: 60000,
        attestation: 'direct',
      };

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('No s\'ha pogut crear la credencial');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Store credential in database
      const { error } = await supabase.from('user_passkeys').insert({
        user_id: userId,
        credential_id: bufferToBase64URL(credential.rawId),
        public_key: bufferToBase64URL(response.getPublicKey()!),
        counter: 0,
        device_name: navigator.userAgent.includes('Mobile') ? 'Dispositiu mòbil' : 'Ordinador',
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error storing passkey:', error);
        toast.error('Error al guardar la passkey');
        return false;
      }

      toast.success('Passkey registrada correctament!');
      return true;
    } catch (error: any) {
      console.error('WebAuthn registration error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Registre cancel·lat per l\'usuari');
      } else if (error.name === 'InvalidStateError') {
        toast.error('Ja existeix una passkey per a aquest dispositiu');
      } else {
        toast.error('Error durant el registre de passkey');
      }
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported]);

  const authenticateWithPasskey = useCallback(async (userEmail: string): Promise<boolean> => {
    if (!isSupported) {
      toast.error('WebAuthn no és compatible amb aquest navegador');
      return false;
    }

    setIsAuthenticating(true);

    try {
      // Get user's passkeys from database
      const { data: passkeys, error: fetchError } = await supabase
        .from('user_passkeys')
        .select('credential_id, user_id')
        .eq('active', true);

      if (fetchError || !passkeys?.length) {
        toast.error('No hi ha passkeys registrades');
        return false;
      }

      // Generate challenge
      const challenge = generateRandomBytes(32);

      // Create PublicKeyCredentialRequestOptions
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        timeout: 60000,
        userVerification: 'preferred',
        allowCredentials: passkeys.map(pk => ({
          id: base64URLToBuffer(pk.credential_id),
          type: 'public-key' as const,
          transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
        })),
      };

      // Get assertion
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!assertion) {
        throw new Error('No s\'ha pogut obtenir l\'assertion');
      }

      const response = assertion.response as AuthenticatorAssertionResponse;

      // Verify the credential
      const credentialId = bufferToBase64URL(assertion.rawId);
      const matchingPasskey = passkeys.find(pk => pk.credential_id === credentialId);

      if (!matchingPasskey) {
        toast.error('Credencial no reconeguda');
        return false;
      }

      // Update counter and last used
      await supabase
        .from('user_passkeys')
        .update({ 
          last_used_at: new Date().toISOString(),
          counter: response.getPublicKey ? 1 : 1 // Increment counter
        })
        .eq('credential_id', credentialId);

      // Sign in with custom token via edge function
      const { data: authData, error: authError } = await supabase.functions.invoke('webauthn-verify', {
        body: {
          credentialId,
          userId: matchingPasskey.user_id,
          clientDataJSON: bufferToBase64URL(response.clientDataJSON),
          authenticatorData: bufferToBase64URL(response.authenticatorData),
          signature: bufferToBase64URL(response.signature),
        },
      });

      if (authError || !authData?.success) {
        toast.error('Error d\'autenticació');
        return false;
      }

      // Set session if token provided
      if (authData.access_token) {
        await supabase.auth.setSession({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
        });
      }

      toast.success('Autenticació amb passkey correcta!');
      return true;
    } catch (error: any) {
      console.error('WebAuthn authentication error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Autenticació cancel·lada per l\'usuari');
      } else {
        toast.error('Error durant l\'autenticació');
      }
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [isSupported]);

  const listPasskeys = useCallback(async (userId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('user_passkeys')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching passkeys:', error);
      return [];
    }

    return data || [];
  }, []);

  const removePasskey = useCallback(async (credentialId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('user_passkeys')
      .update({ active: false })
      .eq('credential_id', credentialId);

    if (error) {
      console.error('Error removing passkey:', error);
      toast.error('Error al eliminar la passkey');
      return false;
    }

    toast.success('Passkey eliminada correctament');
    return true;
  }, []);

  return {
    isSupported,
    isRegistering,
    isAuthenticating,
    registerPasskey,
    authenticateWithPasskey,
    listPasskeys,
    removePasskey,
  };
}
