import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceFingerprint {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: boolean;
}

interface LocationData {
  ip: string;
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isVpn?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  isp?: string;
  org?: string;
}

interface RiskAssessmentRequest {
  userId: string;
  sessionId: string;
  deviceFingerprint: DeviceFingerprint;
  action?: string;
  transactionValue?: number;
  clientIp?: string;
}

interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
}

function generateDeviceHash(fp: DeviceFingerprint): string {
  const raw = `${fp.userAgent}|${fp.platform}|${fp.language}|${fp.timezone}|${fp.screenResolution}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getCurrentHour(): number {
  return new Date().getHours();
}

// IP Geolocation using free ip-api.com service
async function getIpGeolocation(ip: string): Promise<LocationData | null> {
  try {
    // Skip private/local IPs
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.') || ip === '::1') {
      return null;
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,isp,org,proxy,hosting`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.status !== 'success') return null;

    return {
      ip,
      country: data.country,
      countryCode: data.countryCode,
      city: data.city,
      region: data.region,
      latitude: data.lat,
      longitude: data.lon,
      isVpn: data.proxy || data.hosting,
      isProxy: data.proxy,
      isTor: false,
      isp: data.isp,
      org: data.org,
    };
  } catch (error) {
    console.error("IP geolocation error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, sessionId, deviceFingerprint, action, transactionValue, clientIp } = 
      await req.json() as RiskAssessmentRequest;

    if (!userId || !sessionId || !deviceFingerprint) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    // Get client IP from header or request body
    const ipAddress = clientIp || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 'unknown';

    // 1. IP Geolocation and VPN Detection
    let locationData: LocationData | null = null;
    if (ipAddress && ipAddress !== 'unknown') {
      locationData = await getIpGeolocation(ipAddress);
      
      if (locationData) {
        // Check for VPN/Proxy usage
        if (locationData.isVpn || locationData.isProxy) {
          riskScore += 30;
          riskFactors.push({
            factor: "vpn_detected",
            weight: 30,
            description: `Conexión VPN/Proxy detectada desde ${locationData.country || 'ubicación desconocida'}`
          });
        }

        // Check for unusual countries (outside Andorra/Spain/France)
        const allowedCountries = ['AD', 'ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'BE', 'NL', 'CH'];
        if (locationData.countryCode && !allowedCountries.includes(locationData.countryCode)) {
          riskScore += 25;
          riskFactors.push({
            factor: "unusual_country",
            weight: 25,
            description: `Acceso desde país inusual: ${locationData.country}`
          });
        }

        // Store location for comparison with previous logins
        const { data: previousLocations } = await supabase
          .from("user_login_locations")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (previousLocations && previousLocations.length > 0 && locationData.countryCode) {
          const knownCountries = [...new Set(previousLocations.map(l => l.country_code))];
          if (!knownCountries.includes(locationData.countryCode)) {
            riskScore += 15;
            riskFactors.push({
              factor: "new_location",
              weight: 15,
              description: `Primera conexión desde ${locationData.city || locationData.country}`
            });
          }
        }

        // Store current login location
        await supabase.from("user_login_locations").insert({
          user_id: userId,
          ip_address: ipAddress,
          country: locationData.country,
          country_code: locationData.countryCode,
          city: locationData.city,
          region: locationData.region,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          is_vpn: locationData.isVpn,
          is_proxy: locationData.isProxy,
          isp: locationData.isp,
        }).catch(err => console.error("Error storing location:", err));
      }
    }

    // 2. Generate device hash and check if device is known
    const deviceHash = generateDeviceHash(deviceFingerprint);
    
    const { data: existingDevice, error: deviceError } = await supabase
      .from("user_device_fingerprints")
      .select("*")
      .eq("user_id", userId)
      .eq("device_hash", deviceHash)
      .maybeSingle();

    if (deviceError) {
      console.error("Error checking device:", deviceError);
    }

    let deviceFingerprintId: string | null = null;

    if (!existingDevice) {
      // New device - higher risk
      riskScore += 25;
      riskFactors.push({
        factor: "new_device",
        weight: 25,
        description: "Dispositivo no reconocido detectado"
      });

      // Register new device
      const { data: newDevice, error: insertError } = await supabase
        .from("user_device_fingerprints")
        .insert({
          user_id: userId,
          device_hash: deviceHash,
          browser_info: { userAgent: deviceFingerprint.userAgent },
          os_info: { platform: deviceFingerprint.platform },
          screen_resolution: deviceFingerprint.screenResolution,
          timezone: deviceFingerprint.timezone,
          language: deviceFingerprint.language,
          is_trusted: false,
          login_count: 1,
          last_ip: ipAddress,
          last_location: locationData ? `${locationData.city}, ${locationData.country}` : null,
        })
        .select()
        .single();

      if (!insertError && newDevice) {
        deviceFingerprintId = newDevice.id;
      }
    } else {
      deviceFingerprintId = existingDevice.id;
      
      // Update last seen
      await supabase
        .from("user_device_fingerprints")
        .update({ 
          last_seen_at: new Date().toISOString(),
          login_count: (existingDevice.login_count || 0) + 1,
          last_ip: ipAddress,
          last_location: locationData ? `${locationData.city}, ${locationData.country}` : null,
        })
        .eq("id", existingDevice.id);

      // Check if device is trusted
      if (existingDevice.is_trusted) {
        riskScore -= 10;
        riskFactors.push({
          factor: "trusted_device",
          weight: -10,
          description: "Dispositivo de confianza"
        });
      }

      // Low login count still somewhat risky
      if (existingDevice.login_count < 3) {
        riskScore += 10;
        riskFactors.push({
          factor: "low_device_familiarity",
          weight: 10,
          description: "Dispositivo con pocos accesos previos"
        });
      }
    }

    // 3. Check typical login hours
    const currentHour = getCurrentHour();
    
    const { data: behaviorPattern } = await supabase
      .from("user_behavior_patterns")
      .select("typical_login_hours")
      .eq("user_id", userId)
      .maybeSingle();

    if (behaviorPattern?.typical_login_hours) {
      const typicalHours = behaviorPattern.typical_login_hours as number[];
      if (typicalHours.length > 0 && !typicalHours.includes(currentHour)) {
        // Check if within 2 hours of typical
        const nearTypical = typicalHours.some(h => Math.abs(h - currentHour) <= 2);
        if (!nearTypical) {
          riskScore += 15;
          riskFactors.push({
            factor: "unusual_hour",
            weight: 15,
            description: `Acceso a hora inusual (${currentHour}:00)`
          });
        }
      }
    } else {
      // First login - store behavior pattern
      await supabase
        .from("user_behavior_patterns")
        .upsert({
          user_id: userId,
          typical_login_hours: [currentHour],
          typical_devices: [deviceHash],
          typical_locations: locationData?.countryCode ? [locationData.countryCode] : [],
          last_analyzed_at: new Date().toISOString()
        });
    }

    // 4. Check for rapid successive logins (potential credential stuffing)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: recentAssessments, error: recentError } = await supabase
      .from("session_risk_assessments")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", fiveMinutesAgo);

    if (!recentError && recentAssessments && recentAssessments.length >= 3) {
      riskScore += 20;
      riskFactors.push({
        factor: "rapid_logins",
        weight: 20,
        description: "Múltiples intentos de acceso en poco tiempo"
      });
    }

    // 5. High-value transaction check
    if (transactionValue && transactionValue > 10000) {
      riskScore += 20;
      riskFactors.push({
        factor: "high_value_transaction",
        weight: 20,
        description: `Transacción de alto valor: ${transactionValue}€`
      });
    }

    // 6. Sensitive action check
    const sensitiveActions = ["transfer", "password_change", "export_data", "delete_account", "change_email", "add_user", "delete_user"];
    if (action && sensitiveActions.includes(action)) {
      riskScore += 15;
      riskFactors.push({
        factor: "sensitive_action",
        weight: 15,
        description: `Acción sensible: ${action}`
      });
    }

    // Determine risk level
    let riskLevel: "low" | "medium" | "high" | "critical";
    let requiresStepUp = false;

    if (riskScore >= 60) {
      riskLevel = "critical";
      requiresStepUp = true;
    } else if (riskScore >= 40) {
      riskLevel = "high";
      requiresStepUp = true;
    } else if (riskScore >= 20) {
      riskLevel = "medium";
      requiresStepUp = transactionValue !== undefined && transactionValue > 5000;
    } else {
      riskLevel = "low";
    }

    // Ensure score is not negative
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Store risk assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("session_risk_assessments")
      .insert({
        user_id: userId,
        session_id: sessionId,
        risk_level: riskLevel,
        risk_score: riskScore,
        risk_factors: riskFactors,
        device_fingerprint_id: deviceFingerprintId,
        requires_step_up: requiresStepUp,
        step_up_completed: false,
        ip_address: ipAddress,
        location_data: locationData,
      })
      .select()
      .single();

    if (assessmentError) {
      console.error("Error storing assessment:", assessmentError);
      throw assessmentError;
    }

    // Generate step-up challenge if needed
    let challenge = null;
    if (requiresStepUp) {
      // Generate OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

      const { data: challengeData, error: challengeError } = await supabase
        .from("auth_challenges")
        .insert({
          user_id: userId,
          session_id: sessionId,
          challenge_type: "otp_email",
          challenge_code: otpCode,
          expires_at: expiresAt
        })
        .select()
        .single();

      if (!challengeError && challengeData) {
        challenge = {
          id: challengeData.id,
          type: challengeData.challenge_type,
          expiresAt: challengeData.expires_at
        };

        // Send OTP via email using edge function
        try {
          await supabase.functions.invoke('send-step-up-otp', {
            body: {
              userId,
              challengeId: challengeData.id,
              otpCode,
              riskLevel,
              riskFactors: riskFactors.map(f => f.description),
            }
          });
        } catch (emailError) {
          console.error("Failed to send OTP email:", emailError);
          // Still continue - user might use backup method
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      assessment: {
        id: assessment.id,
        riskLevel,
        riskScore,
        riskFactors,
        requiresStepUp,
        stepUpCompleted: false,
        location: locationData ? {
          country: locationData.country,
          city: locationData.city,
          isVpn: locationData.isVpn,
        } : null,
      },
      challenge,
      recommendations: requiresStepUp 
        ? ["Verificación adicional requerida por seguridad"]
        : ["Sesión verificada correctamente"]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("evaluate-session-risk error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Error desconocido"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
