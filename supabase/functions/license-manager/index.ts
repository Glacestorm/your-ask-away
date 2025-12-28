import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ed25519 key pair generation using Web Crypto API
async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "Ed25519",
    },
    true,
    ["sign", "verify"]
  ) as CryptoKeyPair;

  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))),
  };
}

// Sign data with Ed25519 private key
async function signData(data: string, privateKeyBase64: string): Promise<string> {
  const privateKeyBytes = Uint8Array.from(atob(privateKeyBase64), c => c.charCodeAt(0));
  
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);
  
  const signature = await crypto.subtle.sign(
    { name: "Ed25519" },
    privateKey,
    dataBytes
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// Verify signature with Ed25519 public key
async function verifySignature(data: string, signature: string, publicKeyBase64: string): Promise<boolean> {
  try {
    const publicKeyBytes = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    const publicKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    
    return await crypto.subtle.verify(
      { name: "Ed25519" },
      publicKey,
      signatureBytes,
      dataBytes
    );
  } catch (error) {
    console.error('[license-manager] Signature verification error:', error);
    return false;
  }
}

// Generate human-readable license key
function generateLicenseKey(planCode: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const generateSegment = (length: number) => 
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  
  const prefix = 'OBELX';
  const planPrefix = planCode.toUpperCase().substring(0, 3);
  
  return `${prefix}-${planPrefix}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
}

// Hash license key for storage
async function hashLicenseKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// Hash device fingerprint
async function hashFingerprint(fingerprint: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

interface GenerateLicenseParams {
  planId?: string;
  planCode?: string;
  licenseeEmail: string;
  licenseeName?: string;
  licenseeCompany?: string;
  licenseType?: string;
  maxUsers?: number;
  maxDevices?: number;
  maxApiCallsMonth?: number;
  validDays?: number;
  features?: Record<string, boolean | number>;
  metadata?: Record<string, unknown>;
}

interface ValidateLicenseParams {
  licenseKey: string;
  deviceFingerprint?: string;
  deviceInfo?: {
    deviceName?: string;
    deviceType?: string;
    cpuHash?: string;
    gpuHash?: string;
    screenHash?: string;
    timezone?: string;
    locale?: string;
    userAgent?: string;
  };
}

interface ActivateDeviceParams {
  licenseKey: string;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType?: string;
  hardwareInfo?: Record<string, unknown>;
}

interface RevokeLicenseParams {
  licenseId: string;
  reason: string;
}

interface LicenseRequest {
  action: 'generate' | 'validate' | 'activate_device' | 'deactivate_device' | 
          'revoke' | 'get_entitlements' | 'check_feature' | 'log_usage' |
          'get_plans' | 'get_license_info' | 'heartbeat';
  params?: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const supabaseClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id || null;
    }

    const { action, params } = await req.json() as LicenseRequest;
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log(`[license-manager] Action: ${action}, IP: ${clientIp}`);

    let result: unknown;

    switch (action) {
      // ============================================
      // GET PLANS
      // ============================================
      case 'get_plans': {
        const { data: plans, error } = await supabaseAdmin
          .from('license_plans')
          .select('*')
          .eq('is_active', true)
          .order('display_order');

        if (error) throw error;
        result = { plans };
        break;
      }

      // ============================================
      // GENERATE LICENSE
      // ============================================
      case 'generate': {
        const p = (params || {}) as unknown as GenerateLicenseParams;
        
        if (!p.licenseeEmail) {
          throw new Error('licenseeEmail is required');
        }

        // Get plan
        let planData: Record<string, unknown> | null = null;
        if (p.planId) {
          const { data } = await supabaseAdmin
            .from('license_plans')
            .select('*')
            .eq('id', p.planId)
            .single();
          planData = data;
        } else if (p.planCode) {
          const { data } = await supabaseAdmin
            .from('license_plans')
            .select('*')
            .eq('code', p.planCode)
            .single();
          planData = data;
        }

        // Generate cryptographic keys
        const { publicKey, privateKey } = await generateKeyPair();
        
        // Generate license key
        const licenseKey = generateLicenseKey(p.planCode || 'STD');
        const licenseKeyHash = await hashLicenseKey(licenseKey);

        // Calculate expiration
        const validDays = p.validDays || (planData?.trial_days as number) || 365;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validDays);

        // Build signed data
        const signedData = {
          iss: 'obelixia.app',
          sub: p.licenseeEmail,
          email: p.licenseeEmail,
          name: p.licenseeName,
          company: p.licenseeCompany,
          plan: p.planCode || (planData?.code as string) || 'custom',
          type: p.licenseType || 'subscription',
          features: p.features || (planData?.features as Record<string, unknown>) || {},
          maxUsers: p.maxUsers || (planData?.max_users_default as number) || 5,
          maxDevices: p.maxDevices || (planData?.max_devices_default as number) || 3,
          maxApiCalls: p.maxApiCallsMonth || (planData?.max_api_calls_month as number),
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(expiresAt.getTime() / 1000),
          jti: crypto.randomUUID(),
        };

        // Sign the data
        const signedDataJson = JSON.stringify(signedData);
        const signature = await signData(signedDataJson, privateKey);

        // Insert license
        const { data: license, error: insertError } = await supabaseAdmin
          .from('licenses')
          .insert({
            license_key: licenseKey,
            license_key_hash: licenseKeyHash,
            license_type: p.licenseType || 'subscription',
            plan_id: planData?.id as string || null,
            licensee_email: p.licenseeEmail,
            licensee_name: p.licenseeName,
            licensee_company: p.licenseeCompany,
            signed_data: signedData,
            signature,
            public_key: publicKey,
            max_users: signedData.maxUsers,
            max_devices: signedData.maxDevices,
            max_api_calls_month: signedData.maxApiCalls,
            expires_at: expiresAt.toISOString(),
            status: 'active',
            metadata: p.metadata || {},
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Create entitlements from features
        const features = signedData.features as Record<string, boolean | number>;
        const entitlements = Object.entries(features).map(([key, value]) => ({
          license_id: license.id,
          feature_key: key,
          feature_name: key.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          is_enabled: typeof value === 'boolean' ? value : true,
          usage_limit: typeof value === 'number' && value > 0 ? value : null,
        }));

        if (entitlements.length > 0) {
          await supabaseAdmin.from('license_entitlements').insert(entitlements);
        }

        console.log(`[license-manager] Generated license: ${licenseKey} for ${p.licenseeEmail}`);

        result = {
          license: {
            id: license.id,
            licenseKey, // Return plain key ONLY on generation
            type: license.license_type,
            status: license.status,
            expiresAt: license.expires_at,
            maxUsers: license.max_users,
            maxDevices: license.max_devices,
          },
          publicKey, // For offline verification
        };
        break;
      }

      // ============================================
      // VALIDATE LICENSE
      // ============================================
      case 'validate': {
        const p = (params || {}) as unknown as ValidateLicenseParams;
        
        if (!p.licenseKey) {
          throw new Error('licenseKey is required');
        }

        const licenseKeyHash = await hashLicenseKey(p.licenseKey);
        const deviceFingerprintHash = p.deviceFingerprint 
          ? await hashFingerprint(p.deviceFingerprint)
          : null;

        // Fetch license
        const { data: license, error: fetchError } = await supabaseAdmin
          .from('licenses')
          .select(`
            *,
            plan:license_plans(*),
            entitlements:license_entitlements(*),
            devices:device_activations(*)
          `)
          .eq('license_key_hash', licenseKeyHash)
          .single();

        let validationResult = 'success';
        const validationDetails: Record<string, unknown> = {};

        if (fetchError || !license) {
          validationResult = 'invalid_key';
          validationDetails.error = 'License key not found';
        } else {
          // Verify signature
          const signedDataJson = JSON.stringify(license.signed_data);
          const isValid = await verifySignature(signedDataJson, license.signature, license.public_key);
          
          if (!isValid) {
            validationResult = 'invalid_signature';
            validationDetails.error = 'Signature verification failed';
          } else if (license.status === 'revoked') {
            validationResult = 'revoked';
            validationDetails.reason = license.revocation_reason;
          } else if (license.status === 'suspended') {
            validationResult = 'suspended';
          } else if (license.status === 'expired' || 
                     (license.expires_at && new Date(license.expires_at) < new Date())) {
            validationResult = 'expired';
          } else if (deviceFingerprintHash) {
            // Check device limit
            const activeDevices = (license.devices as Array<{is_active: boolean}>)
              .filter((d: {is_active: boolean}) => d.is_active).length;
            const deviceExists = (license.devices as Array<{device_fingerprint_hash: string; is_active: boolean}>)
              .some((d) => d.device_fingerprint_hash === deviceFingerprintHash && d.is_active);
            
            if (!deviceExists && activeDevices >= license.max_devices) {
              validationResult = 'device_limit_exceeded';
              validationDetails.activeDevices = activeDevices;
              validationDetails.maxDevices = license.max_devices;
            }
          }
        }

        // Log validation
        await supabaseAdmin.from('license_validations').insert({
          license_id: license?.id,
          license_key_hash: licenseKeyHash,
          device_fingerprint_hash: deviceFingerprintHash,
          ip_address: clientIp,
          user_agent: userAgent,
          validation_result: validationResult,
          validation_details: validationDetails,
          validation_duration_ms: Date.now() - startTime,
        });

        // Update last validated
        if (license && validationResult === 'success') {
          await supabaseAdmin
            .from('licenses')
            .update({ last_validated_at: new Date().toISOString() })
            .eq('id', license.id);
        }

        result = {
          valid: validationResult === 'success',
          result: validationResult,
          details: validationDetails,
          license: validationResult === 'success' ? {
            id: license.id,
            type: license.license_type,
            status: license.status,
            expiresAt: license.expires_at,
            maxUsers: license.max_users,
            maxDevices: license.max_devices,
            features: license.signed_data?.features || {},
            entitlements: license.entitlements,
          } : null,
          publicKey: license?.public_key, // For offline caching
        };
        break;
      }

      // ============================================
      // ACTIVATE DEVICE
      // ============================================
      case 'activate_device': {
        const p = (params || {}) as unknown as ActivateDeviceParams;
        
        if (!p.licenseKey || !p.deviceFingerprint) {
          throw new Error('licenseKey and deviceFingerprint are required');
        }

        const licenseKeyHash = await hashLicenseKey(p.licenseKey);
        const deviceFingerprintHash = await hashFingerprint(p.deviceFingerprint);

        // Get license
        const { data: license, error: licenseError } = await supabaseAdmin
          .from('licenses')
          .select('*, devices:device_activations(*)')
          .eq('license_key_hash', licenseKeyHash)
          .single();

        if (licenseError || !license) {
          throw new Error('License not found');
        }

        if (license.status !== 'active') {
          throw new Error(`License is ${license.status}`);
        }

        // Check if device already activated
        const existingDevice = (license.devices as Array<{device_fingerprint_hash: string; is_active: boolean; id: string}>)
          .find((d) => d.device_fingerprint_hash === deviceFingerprintHash);

        if (existingDevice) {
          if (existingDevice.is_active) {
            // Update last seen
            const currentCount = (existingDevice as unknown as { session_count?: number }).session_count || 0;
            await supabaseAdmin
              .from('device_activations')
              .update({ 
                last_seen_at: new Date().toISOString(),
                session_count: currentCount + 1
              })
              .eq('id', existingDevice.id);
            
            result = { success: true, message: 'Device already activated', deviceId: existingDevice.id };
          } else {
            // Reactivate
            await supabaseAdmin
              .from('device_activations')
              .update({ 
                is_active: true, 
                last_seen_at: new Date().toISOString(),
                deactivated_at: null,
                deactivation_reason: null
              })
              .eq('id', existingDevice.id);
            
            result = { success: true, message: 'Device reactivated', deviceId: existingDevice.id };
          }
        } else {
          // Check device limit
          const activeDevices = (license.devices as Array<{is_active: boolean}>).filter((d) => d.is_active).length;
          if (activeDevices >= license.max_devices) {
            throw new Error(`Device limit reached (${license.max_devices})`);
          }

          // Create new activation
          const { data: newDevice, error: insertError } = await supabaseAdmin
            .from('device_activations')
            .insert({
              license_id: license.id,
              device_fingerprint: p.deviceFingerprint,
              device_fingerprint_hash: deviceFingerprintHash,
              device_name: p.deviceName,
              device_type: p.deviceType || 'web',
              hardware_info: p.hardwareInfo || {},
              ip_address: clientIp,
              user_agent: userAgent,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          result = { success: true, message: 'Device activated', deviceId: newDevice.id };
        }
        break;
      }

      // ============================================
      // DEACTIVATE DEVICE
      // ============================================
      case 'deactivate_device': {
        const { licenseKey, deviceFingerprint, deviceId, reason } = params as {
          licenseKey?: string;
          deviceFingerprint?: string;
          deviceId?: string;
          reason?: string;
        };

        if (!deviceId && (!licenseKey || !deviceFingerprint)) {
          throw new Error('Either deviceId or (licenseKey + deviceFingerprint) required');
        }

        if (deviceId) {
          const { error } = await supabaseAdmin
            .from('device_activations')
            .update({
              is_active: false,
              deactivated_at: new Date().toISOString(),
              deactivation_reason: reason || 'user_request',
            })
            .eq('id', deviceId);
          
          if (error) throw error;
        } else {
          const licenseKeyHash = await hashLicenseKey(licenseKey!);
          const deviceFingerprintHash = await hashFingerprint(deviceFingerprint!);

          const { error } = await supabaseAdmin
            .from('device_activations')
            .update({
              is_active: false,
              deactivated_at: new Date().toISOString(),
              deactivation_reason: reason || 'user_request',
            })
            .eq('device_fingerprint_hash', deviceFingerprintHash)
            .eq('license_id', (
              await supabaseAdmin
                .from('licenses')
                .select('id')
                .eq('license_key_hash', licenseKeyHash)
                .single()
            ).data?.id);

          if (error) throw error;
        }

        result = { success: true, message: 'Device deactivated' };
        break;
      }

      // ============================================
      // REVOKE LICENSE
      // ============================================
      case 'revoke': {
        const p = (params || {}) as unknown as RevokeLicenseParams;
        
        if (!p.licenseId || !p.reason) {
          throw new Error('licenseId and reason are required');
        }

        const { error } = await supabaseAdmin
          .from('licenses')
          .update({
            status: 'revoked',
            revocation_reason: p.reason,
            revoked_at: new Date().toISOString(),
            revoked_by: userId,
          })
          .eq('id', p.licenseId);

        if (error) throw error;

        // Deactivate all devices
        await supabaseAdmin
          .from('device_activations')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: 'license_revoked',
          })
          .eq('license_id', p.licenseId);

        console.log(`[license-manager] Revoked license: ${p.licenseId}, reason: ${p.reason}`);

        result = { success: true, message: 'License revoked' };
        break;
      }

      // ============================================
      // GET ENTITLEMENTS
      // ============================================
      case 'get_entitlements': {
        const { licenseId, licenseKey } = params as { licenseId?: string; licenseKey?: string };

        let targetLicenseId = licenseId;

        if (!targetLicenseId && licenseKey) {
          const licenseKeyHash = await hashLicenseKey(licenseKey);
          const { data } = await supabaseAdmin
            .from('licenses')
            .select('id')
            .eq('license_key_hash', licenseKeyHash)
            .single();
          targetLicenseId = data?.id;
        }

        if (!targetLicenseId) {
          throw new Error('License not found');
        }

        const { data: entitlements, error } = await supabaseAdmin
          .from('license_entitlements')
          .select('*')
          .eq('license_id', targetLicenseId);

        if (error) throw error;

        result = { entitlements };
        break;
      }

      // ============================================
      // CHECK FEATURE
      // ============================================
      case 'check_feature': {
        const { licenseKey, featureKey } = params as { licenseKey: string; featureKey: string };

        if (!licenseKey || !featureKey) {
          throw new Error('licenseKey and featureKey are required');
        }

        const licenseKeyHash = await hashLicenseKey(licenseKey);

        const { data: license } = await supabaseAdmin
          .from('licenses')
          .select('id, status, expires_at')
          .eq('license_key_hash', licenseKeyHash)
          .single();

        if (!license || license.status !== 'active') {
          result = { allowed: false, reason: 'invalid_license' };
          break;
        }

        if (license.expires_at && new Date(license.expires_at) < new Date()) {
          result = { allowed: false, reason: 'expired' };
          break;
        }

        const { data: entitlement } = await supabaseAdmin
          .from('license_entitlements')
          .select('*')
          .eq('license_id', license.id)
          .eq('feature_key', featureKey)
          .single();

        if (!entitlement) {
          result = { allowed: false, reason: 'feature_not_found' };
        } else if (!entitlement.is_enabled) {
          result = { allowed: false, reason: 'feature_disabled' };
        } else if (entitlement.valid_until && new Date(entitlement.valid_until) < new Date()) {
          result = { allowed: false, reason: 'feature_expired' };
        } else if (entitlement.usage_limit && entitlement.usage_current >= entitlement.usage_limit) {
          result = { allowed: false, reason: 'usage_limit_exceeded', limit: entitlement.usage_limit };
        } else {
          result = { 
            allowed: true, 
            remaining: entitlement.usage_limit ? entitlement.usage_limit - entitlement.usage_current : null 
          };
        }
        break;
      }

      // ============================================
      // LOG USAGE
      // ============================================
      case 'log_usage': {
        const { licenseKey, featureKey, action, quantity = 1, metadata } = params as {
          licenseKey: string;
          featureKey: string;
          action: string;
          quantity?: number;
          metadata?: Record<string, unknown>;
        };

        const licenseKeyHash = await hashLicenseKey(licenseKey);

        const { data: license } = await supabaseAdmin
          .from('licenses')
          .select('id')
          .eq('license_key_hash', licenseKeyHash)
          .single();

        if (!license) {
          throw new Error('License not found');
        }

        // Get entitlement
        const { data: entitlement } = await supabaseAdmin
          .from('license_entitlements')
          .select('id, usage_current')
          .eq('license_id', license.id)
          .eq('feature_key', featureKey)
          .single();

        // Log usage
        await supabaseAdmin.from('license_usage_logs').insert({
          license_id: license.id,
          entitlement_id: entitlement?.id,
          feature_key: featureKey,
          action,
          quantity,
          ip_address: clientIp,
          user_id: userId,
          metadata: metadata || {},
        });

        // Update usage count
        if (entitlement) {
          await supabaseAdmin
            .from('license_entitlements')
            .update({ usage_current: (entitlement.usage_current || 0) + quantity })
            .eq('id', entitlement.id);
        }

        result = { success: true };
        break;
      }

      // ============================================
      // GET LICENSE INFO
      // ============================================
      case 'get_license_info': {
        const { licenseId, licenseKey } = params as { licenseId?: string; licenseKey?: string };

        let query = supabaseAdmin
          .from('licenses')
          .select(`
            id, license_type, plan_id, licensee_email, licensee_name, licensee_company,
            max_users, max_devices, max_api_calls_month, max_concurrent_sessions,
            issued_at, valid_from, expires_at, last_validated_at, status,
            metadata, created_at, updated_at,
            plan:license_plans(*),
            entitlements:license_entitlements(*),
            devices:device_activations(*)
          `);

        if (licenseId) {
          query = query.eq('id', licenseId);
        } else if (licenseKey) {
          const licenseKeyHash = await hashLicenseKey(licenseKey);
          query = query.eq('license_key_hash', licenseKeyHash);
        } else {
          throw new Error('licenseId or licenseKey required');
        }

        const { data: license, error } = await query.single();

        if (error) throw error;

        result = { license };
        break;
      }

      // ============================================
      // HEARTBEAT
      // ============================================
      case 'heartbeat': {
        const { licenseKey, deviceFingerprint } = params as { licenseKey: string; deviceFingerprint?: string };

        if (!licenseKey) {
          throw new Error('licenseKey is required');
        }

        const licenseKeyHash = await hashLicenseKey(licenseKey);

        // Update license heartbeat
        const { data: license, error } = await supabaseAdmin
          .from('licenses')
          .update({ last_heartbeat_at: new Date().toISOString() })
          .eq('license_key_hash', licenseKeyHash)
          .select('id, status, expires_at')
          .single();

        if (error || !license) {
          result = { valid: false, reason: 'license_not_found' };
          break;
        }

        // Update device last seen
        if (deviceFingerprint) {
          const deviceFingerprintHash = await hashFingerprint(deviceFingerprint);
          await supabaseAdmin
            .from('device_activations')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('license_id', license.id)
            .eq('device_fingerprint_hash', deviceFingerprintHash);
        }

        const isExpired = license.expires_at && new Date(license.expires_at) < new Date();

        result = {
          valid: license.status === 'active' && !isExpired,
          status: license.status,
          expiresAt: license.expires_at,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[license-manager] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
