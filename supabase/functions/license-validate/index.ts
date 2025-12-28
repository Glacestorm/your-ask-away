import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateLicenseRequest {
  action: 'validate' | 'activate' | 'deactivate' | 'heartbeat' | 'check_feature' | 'log_usage';
  licenseKey?: string;
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
  featureKey?: string;
  quantity?: number;
}

// Simple hash function for license key
async function hashLicenseKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate license signature (simplified - in production use proper crypto)
function validateSignature(signedData: Record<string, unknown>, signature: string, publicKey: string): boolean {
  // In production, implement proper Ed25519/RSA signature verification
  // For now, we do a basic check that signature exists and matches format
  return Boolean(signature && signature.length > 0 && publicKey && publicKey.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = ReturnType<typeof createClient<any>>;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ValidateLicenseRequest = await req.json();
    const { action } = body;

    console.log(`[license-validate] Processing action: ${action}`);

    // Get client IP for geo-blocking
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';

    switch (action) {
      case 'validate':
      case 'activate': {
        const { licenseKey, deviceFingerprint, deviceInfo } = body;

        if (!licenseKey) {
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'invalid_key',
            details: { message: 'License key is required' }
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const keyHash = await hashLicenseKey(licenseKey);

        // Find license by hash
        const { data: license, error: licenseError } = await supabase
          .from('licenses')
          .select(`
            *,
            plan:license_plans(*),
            entitlements:license_entitlements(*),
            devices:device_activations(*)
          `)
          .eq('license_key_hash', keyHash)
          .single();

        if (licenseError || !license) {
          // Log failed validation
          await supabase.from('license_validations').insert({
            license_key_hash: keyHash,
            ip_address: clientIP,
            user_agent: deviceInfo?.userAgent,
            validation_result: 'invalid_key',
            validation_details: { error: 'License not found' }
          });

          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'invalid_key',
            details: { message: 'Invalid license key' }
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check license status
        if (license.status === 'revoked') {
          await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'revoked');
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'revoked',
            details: { message: 'License has been revoked', reason: license.revocation_reason }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (license.status === 'suspended') {
          await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'suspended');
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'suspended',
            details: { message: 'License is suspended' }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check expiration
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
          await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'expired');
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'expired',
            details: { message: 'License has expired', expiredAt: license.expires_at }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check geo restrictions
        if (license.allowed_countries && license.allowed_countries.length > 0) {
          const geoCountry = req.headers.get('cf-ipcountry') || 'unknown';
          if (!license.allowed_countries.includes(geoCountry)) {
            await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'geo_blocked');
            return new Response(JSON.stringify({
              success: false,
              valid: false,
              result: 'geo_blocked',
              details: { message: 'License not valid in your region' }
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // Check IP blocks
        if (license.blocked_ips && license.blocked_ips.includes(clientIP)) {
          await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'ip_blocked');
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'ip_blocked',
            details: { message: 'Access denied from this IP' }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Validate signature
        if (!validateSignature(license.signed_data, license.signature, license.public_key)) {
          await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'invalid_signature');
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            result: 'invalid_signature',
            details: { message: 'License signature validation failed' }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Handle device activation for 'activate' action
        if (action === 'activate' && deviceFingerprint) {
          const deviceHash = await hashLicenseKey(deviceFingerprint);
          
          // Check if device already activated
          const existingDevice = license.devices?.find(
            (d: { device_fingerprint_hash: string }) => d.device_fingerprint_hash === deviceHash
          );

          if (existingDevice) {
            // Update last seen
            await supabase
              .from('device_activations')
              .update({ 
                last_seen_at: new Date().toISOString(),
                last_ip_address: clientIP,
                session_count: (existingDevice.session_count || 0) + 1
              })
              .eq('id', existingDevice.id);
          } else {
            // Check device limit
            const activeDevices = license.devices?.filter((d: { is_active: boolean }) => d.is_active) || [];
            if (activeDevices.length >= license.max_devices) {
              await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'device_limit_exceeded');
              return new Response(JSON.stringify({
                success: false,
                valid: false,
                result: 'device_limit_exceeded',
                details: { 
                  message: 'Maximum device limit reached',
                  maxDevices: license.max_devices,
                  activeDevices: activeDevices.length
                }
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }

            // Register new device
            await supabase.from('device_activations').insert({
              license_id: license.id,
              device_fingerprint: deviceFingerprint,
              device_fingerprint_hash: deviceHash,
              device_name: deviceInfo?.deviceName,
              device_type: deviceInfo?.deviceType || 'web',
              hardware_info: deviceInfo || {},
              cpu_hash: deviceInfo?.cpuHash,
              gpu_hash: deviceInfo?.gpuHash,
              screen_hash: deviceInfo?.screenHash,
              timezone: deviceInfo?.timezone,
              locale: deviceInfo?.locale,
              ip_address: clientIP,
              last_ip_address: clientIP,
              user_agent: deviceInfo?.userAgent,
              is_active: true,
              session_count: 1
            });
          }
        }

        // Update license last validated
        await supabase
          .from('licenses')
          .update({ 
            last_validated_at: new Date().toISOString(),
            status: license.status === 'pending' ? 'active' : license.status
          })
          .eq('id', license.id);

        await logValidation(supabase, license.id, keyHash, clientIP, deviceInfo, 'success');

        // Build response with license info
        const features = license.plan?.features || license.signed_data?.features || {};
        
        return new Response(JSON.stringify({
          success: true,
          valid: true,
          result: 'success',
          details: {
            message: 'License validated successfully'
          },
          license: {
            id: license.id,
            type: license.license_type,
            status: license.status,
            licenseeEmail: license.licensee_email,
            licenseeName: license.licensee_name,
            licenseeCompany: license.licensee_company,
            maxUsers: license.max_users,
            maxDevices: license.max_devices,
            maxApiCallsMonth: license.max_api_calls_month,
            issuedAt: license.issued_at,
            validFrom: license.valid_from,
            expiresAt: license.expires_at,
            features,
            plan: license.plan ? {
              code: license.plan.code,
              name: license.plan.name,
              description: license.plan.description
            } : null
          },
          publicKey: license.public_key
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'deactivate': {
        const { licenseKey, deviceFingerprint } = body;

        if (!licenseKey || !deviceFingerprint) {
          return new Response(JSON.stringify({
            success: false,
            message: 'License key and device fingerprint required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const keyHash = await hashLicenseKey(licenseKey);
        const deviceHash = await hashLicenseKey(deviceFingerprint);

        const { error } = await supabase
          .from('device_activations')
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: 'user_request'
          })
          .eq('device_fingerprint_hash', deviceHash)
          .eq('license_id', (
            await supabase.from('licenses').select('id').eq('license_key_hash', keyHash).single()
          ).data?.id);

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to deactivate device'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Device deactivated successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'heartbeat': {
        const { licenseKey, deviceFingerprint } = body;

        if (!licenseKey) {
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            status: 'invalid_key'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const keyHash = await hashLicenseKey(licenseKey);

        const { data: license } = await supabase
          .from('licenses')
          .select('id, status, expires_at')
          .eq('license_key_hash', keyHash)
          .single();

        if (!license) {
          return new Response(JSON.stringify({
            success: false,
            valid: false,
            status: 'invalid_key'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update heartbeat
        await supabase
          .from('licenses')
          .update({ last_heartbeat_at: new Date().toISOString() })
          .eq('id', license.id);

        // Update device last seen if provided
        if (deviceFingerprint) {
          const deviceHash = await hashLicenseKey(deviceFingerprint);
          await supabase
            .from('device_activations')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('device_fingerprint_hash', deviceHash)
            .eq('license_id', license.id);
        }

        const isExpired = license.expires_at && new Date(license.expires_at) < new Date();

        return new Response(JSON.stringify({
          success: true,
          valid: !isExpired && license.status === 'active',
          status: license.status,
          expiresAt: license.expires_at
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'check_feature': {
        const { licenseKey, featureKey } = body;

        if (!licenseKey || !featureKey) {
          return new Response(JSON.stringify({
            success: false,
            allowed: false,
            reason: 'License key and feature key required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const keyHash = await hashLicenseKey(licenseKey);

        const { data: license } = await supabase
          .from('licenses')
          .select(`
            id, status, expires_at, signed_data,
            plan:license_plans(features),
            entitlements:license_entitlements(*)
          `)
          .eq('license_key_hash', keyHash)
          .single();

        if (!license || license.status !== 'active') {
          return new Response(JSON.stringify({
            success: false,
            allowed: false,
            reason: 'Invalid or inactive license'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check expiration
        if (license.expires_at && new Date(license.expires_at) < new Date()) {
          return new Response(JSON.stringify({
            success: false,
            allowed: false,
            reason: 'License expired'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check entitlements first
        const entitlement = license.entitlements?.find(
          (e: { feature_key: string; is_enabled: boolean }) => e.feature_key === featureKey && e.is_enabled
        );

        if (entitlement) {
          // Check usage limits
          if (entitlement.usage_limit !== null) {
            const remaining = entitlement.usage_limit - (entitlement.usage_current || 0);
            if (remaining <= 0) {
              return new Response(JSON.stringify({
                success: true,
                allowed: false,
                reason: 'Usage limit exceeded',
                remaining: 0,
                limit: entitlement.usage_limit
              }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
            return new Response(JSON.stringify({
              success: true,
              allowed: true,
              remaining,
              limit: entitlement.usage_limit
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          return new Response(JSON.stringify({
            success: true,
            allowed: true
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check plan features
        const planData = license.plan as { features?: Record<string, unknown> } | null;
        const planFeatures = planData?.features || {};
        const signedData = license.signed_data as { features?: Record<string, unknown> } | null;
        const signedFeatures = signedData?.features || {};
        const features = { ...planFeatures, ...signedFeatures };

        const featureValue = features[featureKey];
        if (featureValue === true || (typeof featureValue === 'number' && featureValue > 0)) {
          return new Response(JSON.stringify({
            success: true,
            allowed: true,
            limit: typeof featureValue === 'number' ? featureValue : undefined
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          allowed: false,
          reason: 'Feature not included in license'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'log_usage': {
        const { licenseKey, featureKey, quantity = 1 } = body;

        if (!licenseKey || !featureKey) {
          return new Response(JSON.stringify({
            success: false,
            message: 'License key and feature key required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const keyHash = await hashLicenseKey(licenseKey);
        const deviceHash = body.deviceFingerprint ? await hashLicenseKey(body.deviceFingerprint) : null;

        const { data: license } = await supabase
          .from('licenses')
          .select('id')
          .eq('license_key_hash', keyHash)
          .single();

        if (!license) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Invalid license'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Log usage
        await supabase.from('license_usage_logs').insert({
          license_id: license.id,
          feature_key: featureKey,
          action: 'usage',
          quantity,
          device_fingerprint_hash: deviceHash,
          ip_address: clientIP
        });

        // Update entitlement usage if exists
        await supabase
          .from('license_entitlements')
          .update({ 
            usage_current: supabase.rpc('increment_usage', { amount: quantity })
          })
          .eq('license_id', license.id)
          .eq('feature_key', featureKey);

        return new Response(JSON.stringify({
          success: true,
          message: 'Usage logged'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({
          success: false,
          message: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('[license-validate] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to log validations
async function logValidation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  licenseId: string,
  keyHash: string,
  clientIP: string,
  deviceInfo: ValidateLicenseRequest['deviceInfo'],
  result: string
) {
  try {
    await supabase.from('license_validations').insert({
      license_id: licenseId,
      license_key_hash: keyHash,
      ip_address: clientIP,
      user_agent: deviceInfo?.userAgent,
      validation_result: result,
      validation_details: { deviceInfo }
    });
  } catch (err) {
    console.error('[license-validate] Failed to log validation:', err);
  }
}
