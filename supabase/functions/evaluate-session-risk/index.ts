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
  // Enhanced fingerprinting
  webglRenderer?: string;
  canvasHash?: string;
  audioContext?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  touchSupport?: boolean;
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

interface BehaviorMetrics {
  typingSpeed?: number;
  mouseMovementPattern?: string;
  scrollBehavior?: string;
  sessionDuration?: number;
  interactionRate?: number;
  navigationPattern?: string[];
}

interface RiskAssessmentRequest {
  userId: string;
  sessionId: string;
  deviceFingerprint: DeviceFingerprint;
  action?: string;
  transactionValue?: number;
  clientIp?: string;
  behaviorMetrics?: BehaviorMetrics;
  continuousAuth?: boolean;
}

interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
  category: 'device' | 'location' | 'behavior' | 'transaction' | 'temporal' | 'ml_anomaly';
}

interface AnomalyScore {
  score: number;
  anomalies: string[];
  confidence: number;
}

function generateDeviceHash(fp: DeviceFingerprint): string {
  const raw = `${fp.userAgent}|${fp.platform}|${fp.language}|${fp.timezone}|${fp.screenResolution}|${fp.webglRenderer || ''}|${fp.canvasHash || ''}`;
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

// ML-based anomaly detection using statistical analysis
function detectBehaviorAnomalies(
  currentMetrics: BehaviorMetrics | undefined,
  historicalPatterns: any
): AnomalyScore {
  if (!currentMetrics || !historicalPatterns) {
    return { score: 0, anomalies: [], confidence: 0.5 };
  }

  const anomalies: string[] = [];
  let anomalyScore = 0;

  // Typing speed anomaly (Z-score analysis)
  if (currentMetrics.typingSpeed && historicalPatterns.avg_typing_speed) {
    const zScore = Math.abs(
      (currentMetrics.typingSpeed - historicalPatterns.avg_typing_speed) / 
      (historicalPatterns.typing_speed_std || 1)
    );
    if (zScore > 2.5) {
      anomalyScore += 20;
      anomalies.push(`Velocidad de escritura anómala (z-score: ${zScore.toFixed(2)})`);
    }
  }

  // Session duration anomaly
  if (currentMetrics.sessionDuration && historicalPatterns.avg_session_duration) {
    const durationRatio = currentMetrics.sessionDuration / historicalPatterns.avg_session_duration;
    if (durationRatio < 0.1 || durationRatio > 10) {
      anomalyScore += 15;
      anomalies.push(`Duración de sesión inusual`);
    }
  }

  // Interaction rate anomaly
  if (currentMetrics.interactionRate && historicalPatterns.avg_interaction_rate) {
    const rateRatio = currentMetrics.interactionRate / historicalPatterns.avg_interaction_rate;
    if (rateRatio < 0.2 || rateRatio > 5) {
      anomalyScore += 15;
      anomalies.push(`Tasa de interacción anómala`);
    }
  }

  // Navigation pattern anomaly (Jaccard similarity)
  if (currentMetrics.navigationPattern && historicalPatterns.typical_navigation) {
    const currentSet = new Set(currentMetrics.navigationPattern);
    const typicalSet = new Set(historicalPatterns.typical_navigation as string[]);
    const intersection = [...currentSet].filter(x => typicalSet.has(x)).length;
    const union = new Set([...currentSet, ...typicalSet]).size;
    const similarity = union > 0 ? intersection / union : 0;
    
    if (similarity < 0.3) {
      anomalyScore += 10;
      anomalies.push(`Patrón de navegación inusual (similitud: ${(similarity * 100).toFixed(0)}%)`);
    }
  }

  const confidence = Math.min(0.95, 0.5 + (historicalPatterns.sample_count || 0) * 0.05);

  return {
    score: Math.min(50, anomalyScore),
    anomalies,
    confidence
  };
}

// Velocity check - detect impossible travel
function calculateVelocityRisk(
  currentLocation: LocationData | null,
  previousLocations: any[],
  lastLoginTime: Date | null
): { score: number; description: string } | null {
  if (!currentLocation?.latitude || !currentLocation?.longitude || !previousLocations?.length || !lastLoginTime) {
    return null;
  }

  const lastLocation = previousLocations[0];
  if (!lastLocation.latitude || !lastLocation.longitude) return null;

  // Haversine distance calculation
  const R = 6371; // Earth radius in km
  const dLat = (currentLocation.latitude! - lastLocation.latitude) * Math.PI / 180;
  const dLon = (currentLocation.longitude! - lastLocation.longitude) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lastLocation.latitude * Math.PI / 180) * 
    Math.cos(currentLocation.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  const timeDiffHours = (Date.now() - lastLoginTime.getTime()) / (1000 * 60 * 60);
  const velocity = distance / Math.max(timeDiffHours, 0.1);

  // Max human travel speed ~900 km/h (commercial flight)
  if (velocity > 1000 && distance > 100) {
    return {
      score: 35,
      description: `Viaje imposible detectado: ${distance.toFixed(0)}km en ${timeDiffHours.toFixed(1)}h`
    };
  } else if (velocity > 500 && distance > 50) {
    return {
      score: 15,
      description: `Cambio de ubicación rápido: ${distance.toFixed(0)}km`
    };
  }

  return null;
}

// IP Geolocation using free ip-api.com service
async function getIpGeolocation(ip: string): Promise<LocationData | null> {
  try {
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

// Calculate risk adjustment based on user's historical behavior
function calculateHistoricalTrustAdjustment(
  totalLogins: number,
  successfulLogins: number,
  accountAge: number
): number {
  let adjustment = 0;

  // Account age trust (up to -15 points for old accounts)
  const ageInDays = accountAge / (1000 * 60 * 60 * 24);
  if (ageInDays > 365) adjustment -= 15;
  else if (ageInDays > 180) adjustment -= 10;
  else if (ageInDays > 90) adjustment -= 5;
  else if (ageInDays < 7) adjustment += 10;

  // Login success rate trust
  if (totalLogins > 10) {
    const successRate = successfulLogins / totalLogins;
    if (successRate > 0.95) adjustment -= 10;
    else if (successRate < 0.7) adjustment += 15;
  }

  return adjustment;
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
            description: `Conexión VPN/Proxy detectada desde ${locationData.country || 'ubicación desconocida'}`,
            category: 'location'
          });
        }

        // Check for unusual countries (outside Andorra/Spain/France)
        const allowedCountries = ['AD', 'ES', 'FR', 'PT', 'IT', 'DE', 'GB', 'BE', 'NL', 'CH'];
        if (locationData.countryCode && !allowedCountries.includes(locationData.countryCode)) {
          riskScore += 25;
          riskFactors.push({
            factor: "unusual_country",
            weight: 25,
            description: `Acceso desde país inusual: ${locationData.country}`,
            category: 'location'
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
              description: `Primera conexión desde ${locationData.city || locationData.country}`,
              category: 'location'
            });
          }
        }

        // Store current login location
        const { error: locError } = await supabase.from("user_login_locations").insert({
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
        });
        
        if (locError) {
          console.error("Error storing location:", locError);
        }
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
        description: "Dispositivo no reconocido detectado",
        category: 'device'
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
          description: "Dispositivo de confianza",
          category: 'device'
        });
      }

      // Low login count still somewhat risky
      if (existingDevice.login_count < 3) {
        riskScore += 10;
        riskFactors.push({
          factor: "low_device_familiarity",
          weight: 10,
          description: "Dispositivo con pocos accesos previos",
          category: 'device'
        });
      }
    }

    // 3. Check typical login hours and behavior patterns
    const currentHour = getCurrentHour();
    
    const { data: behaviorPattern } = await supabase
      .from("user_behavior_patterns")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (behaviorPattern?.typical_login_hours) {
      const typicalHours = behaviorPattern.typical_login_hours as number[];
      if (typicalHours.length > 0 && !typicalHours.includes(currentHour)) {
        const nearTypical = typicalHours.some(h => Math.abs(h - currentHour) <= 2);
        if (!nearTypical) {
          riskScore += 15;
          riskFactors.push({
            factor: "unusual_hour",
            weight: 15,
            description: `Acceso a hora inusual (${currentHour}:00)`,
            category: 'temporal'
          });
        }
      }

      // ML-based behavior anomaly detection
      const anomalyResult = detectBehaviorAnomalies(
        (await req.json().catch(() => ({})))?.behaviorMetrics,
        behaviorPattern
      );
      
      if (anomalyResult.score > 0) {
        riskScore += anomalyResult.score;
        anomalyResult.anomalies.forEach(anomaly => {
          riskFactors.push({
            factor: "ml_anomaly",
            weight: anomalyResult.score / anomalyResult.anomalies.length,
            description: anomaly,
            category: 'ml_anomaly'
          });
        });
      }

      // Velocity check - impossible travel detection
      const { data: recentLocations } = await supabase
        .from("user_login_locations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (recentLocations?.length && locationData) {
        const lastLoginTime = new Date(recentLocations[0].created_at);
        const velocityRisk = calculateVelocityRisk(locationData, recentLocations, lastLoginTime);
        
        if (velocityRisk) {
          riskScore += velocityRisk.score;
          riskFactors.push({
            factor: "impossible_travel",
            weight: velocityRisk.score,
            description: velocityRisk.description,
            category: 'location'
          });
        }
      }

      // Update behavior patterns with new data
      const updatedHours = [...new Set([...typicalHours, currentHour])].slice(-24);
      await supabase
        .from("user_behavior_patterns")
        .update({
          typical_login_hours: updatedHours,
          last_analyzed_at: new Date().toISOString(),
          total_sessions: (behaviorPattern.total_sessions || 0) + 1,
        })
        .eq("user_id", userId);

    } else {
      // First login - store behavior pattern
      await supabase
        .from("user_behavior_patterns")
        .upsert({
          user_id: userId,
          typical_login_hours: [currentHour],
          typical_devices: [deviceHash],
          typical_locations: locationData?.countryCode ? [locationData.countryCode] : [],
          last_analyzed_at: new Date().toISOString(),
          total_sessions: 1,
          avg_typing_speed: null,
          typing_speed_std: null,
          avg_session_duration: null,
          avg_interaction_rate: null,
          typical_navigation: [],
          sample_count: 0,
        });
    }

    // Historical trust adjustment
    const { data: userStats } = await supabase
      .from("session_risk_assessments")
      .select("id, step_up_completed")
      .eq("user_id", userId);

    if (userStats) {
      const totalLogins = userStats.length;
      const successfulLogins = userStats.filter(s => !s.step_up_completed || s.step_up_completed).length;
      
      // Get user creation date for account age
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", userId)
        .single();

      const accountAge = profile?.created_at 
        ? Date.now() - new Date(profile.created_at).getTime() 
        : 0;

      const trustAdjustment = calculateHistoricalTrustAdjustment(totalLogins, successfulLogins, accountAge);
      
      if (trustAdjustment !== 0) {
        riskScore += trustAdjustment;
        riskFactors.push({
          factor: trustAdjustment < 0 ? "historical_trust" : "low_historical_trust",
          weight: trustAdjustment,
          description: trustAdjustment < 0 
            ? "Historial de confianza establecido" 
            : "Cuenta nueva o historial limitado",
          category: 'behavior'
        });
      }
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
        description: "Múltiples intentos de acceso en poco tiempo",
        category: 'behavior'
      });
    }

    // 5. High-value transaction check with tiered risk
    if (transactionValue) {
      if (transactionValue > 50000) {
        riskScore += 35;
        riskFactors.push({
          factor: "critical_value_transaction",
          weight: 35,
          description: `Transacción crítica: ${transactionValue.toLocaleString()}€`,
          category: 'transaction'
        });
      } else if (transactionValue > 10000) {
        riskScore += 20;
        riskFactors.push({
          factor: "high_value_transaction",
          weight: 20,
          description: `Transacción de alto valor: ${transactionValue.toLocaleString()}€`,
          category: 'transaction'
        });
      } else if (transactionValue > 3000) {
        riskScore += 10;
        riskFactors.push({
          factor: "medium_value_transaction",
          weight: 10,
          description: `Transacción significativa: ${transactionValue.toLocaleString()}€`,
          category: 'transaction'
        });
      }
    }

    // 6. Sensitive action check with categorization
    const criticalActions = ["delete_account", "export_all_data", "change_admin_password"];
    const highSensitiveActions = ["transfer", "password_change", "change_email", "add_user", "delete_user"];
    const mediumSensitiveActions = ["export_data", "modify_permissions", "bulk_update"];
    
    if (action) {
      if (criticalActions.includes(action)) {
        riskScore += 30;
        riskFactors.push({
          factor: "critical_action",
          weight: 30,
          description: `Acción crítica: ${action}`,
          category: 'transaction'
        });
      } else if (highSensitiveActions.includes(action)) {
        riskScore += 20;
        riskFactors.push({
          factor: "sensitive_action",
          weight: 20,
          description: `Acción sensible: ${action}`,
          category: 'transaction'
        });
      } else if (mediumSensitiveActions.includes(action)) {
        riskScore += 10;
        riskFactors.push({
          factor: "monitored_action",
          weight: 10,
          description: `Acción monitoreada: ${action}`,
          category: 'transaction'
        });
      }
    }

    // 7. Continuous authentication - session behavior monitoring
    const { continuousAuth } = await req.json().catch(() => ({ continuousAuth: false }));
    
    if (continuousAuth) {
      // Check for session anomalies during active session
      const { data: sessionData } = await supabase
        .from("session_risk_assessments")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (sessionData?.length) {
        const lastAssessment = sessionData[0];
        const timeSinceLastCheck = Date.now() - new Date(lastAssessment.created_at).getTime();
        
        // If significant time has passed, require re-evaluation
        if (timeSinceLastCheck > 30 * 60 * 1000) { // 30 minutes
          riskScore += 10;
          riskFactors.push({
            factor: "session_age",
            weight: 10,
            description: "Sesión activa por tiempo prolongado",
            category: 'temporal'
          });
        }
      }
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
