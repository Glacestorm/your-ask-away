import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityRequest {
  action: 'threat_detection' | 'vulnerability_scan' | 'incident_response' | 'access_analysis' | 
          'compliance_check' | 'behavioral_analytics' | 'threat_hunting' | 'forensic_analysis' |
          'security_posture' | 'zero_trust_evaluation';
  context?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { action, context, params } = await req.json() as SecurityRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'threat_detection':
        systemPrompt = `Eres un sistema avanzado de detección de amenazas de seguridad.

CAPACIDADES:
- Análisis de patrones de ataque en tiempo real
- Detección de anomalías en comportamiento de red
- Identificación de malware y código malicioso
- Correlación de eventos de seguridad
- Detección de amenazas persistentes avanzadas (APT)

RESPUESTA JSON:
{
  "threats": [{
    "id": "string",
    "type": "malware|intrusion|data_exfiltration|dos|insider_threat|apt|ransomware|phishing",
    "severity": "critical|high|medium|low|info",
    "confidence": 0-100,
    "source": {"ip": "string", "geo": "string", "reputation": "string"},
    "target": {"asset": "string", "data": "string"},
    "indicators": ["string"],
    "mitre_attack": {"tactic": "string", "technique": "string", "id": "string"},
    "timeline": [{"timestamp": "ISO", "event": "string"}],
    "recommended_actions": ["string"]
  }],
  "risk_score": 0-100,
  "active_attacks": number,
  "blocked_attempts": number,
  "summary": "string"
}`;
        userPrompt = `Analiza amenazas de seguridad: ${JSON.stringify({ context, params })}`;
        break;

      case 'vulnerability_scan':
        systemPrompt = `Eres un escáner de vulnerabilidades empresarial con IA.

CAPACIDADES:
- Escaneo de vulnerabilidades en aplicaciones y sistemas
- Análisis de configuraciones inseguras
- Detección de CVEs conocidas
- Evaluación de parches pendientes
- Análisis de dependencias vulnerables

RESPUESTA JSON:
{
  "vulnerabilities": [{
    "id": "string",
    "cve_id": "string|null",
    "cvss_score": 0-10,
    "severity": "critical|high|medium|low",
    "type": "code|config|dependency|infrastructure|api",
    "affected_asset": "string",
    "description": "string",
    "exploitation_difficulty": "trivial|low|medium|high",
    "exploit_available": boolean,
    "remediation": {
      "priority": "immediate|short_term|medium_term",
      "steps": ["string"],
      "estimated_effort": "string",
      "patch_available": boolean
    },
    "references": ["string"]
  }],
  "scan_coverage": 0-100,
  "critical_count": number,
  "high_count": number,
  "medium_count": number,
  "low_count": number,
  "risk_score": 0-100,
  "next_scan_recommended": "ISO date"
}`;
        userPrompt = `Escanea vulnerabilidades: ${JSON.stringify({ context, params })}`;
        break;

      case 'incident_response':
        systemPrompt = `Eres un sistema de respuesta automática a incidentes de seguridad.

CAPACIDADES:
- Clasificación automática de incidentes
- Contención inmediata de amenazas
- Orquestación de respuesta
- Playbooks automáticos
- Comunicación de crisis

RESPUESTA JSON:
{
  "incident": {
    "id": "string",
    "classification": "security_breach|data_leak|malware|unauthorized_access|dos|insider",
    "severity": "critical|high|medium|low",
    "status": "detected|analyzing|containing|eradicating|recovering|closed",
    "timeline": [{"timestamp": "ISO", "action": "string", "result": "string"}]
  },
  "containment_actions": [{
    "action": "string",
    "target": "string",
    "status": "pending|executing|completed|failed",
    "automated": boolean,
    "reversible": boolean
  }],
  "affected_assets": ["string"],
  "affected_users": number,
  "data_at_risk": {"type": "string", "sensitivity": "string", "records": number},
  "playbook_executed": "string",
  "escalation": {
    "required": boolean,
    "level": "L1|L2|L3|executive",
    "notified": ["string"]
  },
  "recovery_plan": {
    "steps": ["string"],
    "estimated_time": "string",
    "rollback_available": boolean
  },
  "post_incident": {
    "lessons_learned": ["string"],
    "improvements": ["string"]
  }
}`;
        userPrompt = `Gestiona incidente de seguridad: ${JSON.stringify({ context, params })}`;
        break;

      case 'access_analysis':
        systemPrompt = `Eres un analizador de accesos y privilegios con IA.

CAPACIDADES:
- Análisis de patrones de acceso
- Detección de accesos anómalos
- Revisión de privilegios excesivos
- Análisis de segregación de funciones
- Detección de cuentas comprometidas

RESPUESTA JSON:
{
  "access_patterns": [{
    "user_id": "string",
    "risk_level": "critical|high|medium|low",
    "anomalies": [{
      "type": "unusual_time|unusual_location|privilege_escalation|lateral_movement",
      "description": "string",
      "confidence": 0-100
    }],
    "privileged_access": boolean,
    "last_activity": "ISO date",
    "session_risk": 0-100
  }],
  "privilege_issues": [{
    "user_id": "string",
    "issue": "excessive_privileges|unused_privileges|role_conflict|orphaned_account",
    "recommendation": "string",
    "risk_impact": "string"
  }],
  "compromised_indicators": [{
    "user_id": "string",
    "indicators": ["string"],
    "confidence": 0-100,
    "recommended_action": "string"
  }],
  "statistics": {
    "total_users": number,
    "active_sessions": number,
    "high_risk_sessions": number,
    "privileged_users": number
  },
  "recommendations": ["string"]
}`;
        userPrompt = `Analiza accesos y privilegios: ${JSON.stringify({ context, params })}`;
        break;

      case 'compliance_check':
        systemPrompt = `Eres un auditor de cumplimiento de seguridad con IA.

FRAMEWORKS SOPORTADOS:
- ISO 27001, SOC 2, GDPR, HIPAA
- PCI-DSS, NIST, CIS Controls
- CCPA, LGPD, DORA

RESPUESTA JSON:
{
  "compliance_status": {
    "framework": "string",
    "version": "string",
    "overall_score": 0-100,
    "status": "compliant|partially_compliant|non_compliant"
  },
  "controls": [{
    "control_id": "string",
    "category": "string",
    "status": "implemented|partial|not_implemented|not_applicable",
    "evidence": ["string"],
    "gaps": ["string"],
    "remediation_priority": "critical|high|medium|low",
    "remediation_steps": ["string"]
  }],
  "audit_findings": [{
    "finding_id": "string",
    "severity": "major|minor|observation",
    "description": "string",
    "affected_controls": ["string"],
    "recommendation": "string",
    "due_date": "ISO date"
  }],
  "documentation_gaps": ["string"],
  "next_audit_date": "ISO date",
  "certification_status": {
    "certified": boolean,
    "expiration": "ISO date|null",
    "renewal_required": boolean
  }
}`;
        userPrompt = `Verifica cumplimiento de seguridad: ${JSON.stringify({ context, params })}`;
        break;

      case 'behavioral_analytics':
        systemPrompt = `Eres un sistema de análisis de comportamiento de usuarios (UEBA).

CAPACIDADES:
- Baseline de comportamiento normal
- Detección de anomalías de comportamiento
- Análisis de riesgo de insider
- Machine learning para patrones
- Correlación temporal de eventos

RESPUESTA JSON:
{
  "user_profiles": [{
    "user_id": "string",
    "risk_score": 0-100,
    "risk_trend": "increasing|stable|decreasing",
    "behavioral_baseline": {
      "typical_hours": "string",
      "typical_locations": ["string"],
      "typical_resources": ["string"],
      "data_volume_normal": "string"
    },
    "current_deviations": [{
      "type": "string",
      "deviation_score": 0-100,
      "description": "string",
      "timestamp": "ISO"
    }],
    "insider_threat_indicators": {
      "score": 0-100,
      "factors": ["string"]
    }
  }],
  "entity_analytics": [{
    "entity_type": "device|application|network_segment",
    "entity_id": "string",
    "anomaly_score": 0-100,
    "anomalies": ["string"]
  }],
  "peer_group_analysis": {
    "outliers": ["string"],
    "common_patterns": ["string"]
  },
  "alerts": [{
    "priority": "critical|high|medium|low",
    "type": "string",
    "description": "string",
    "affected_entities": ["string"]
  }]
}`;
        userPrompt = `Analiza comportamiento: ${JSON.stringify({ context, params })}`;
        break;

      case 'threat_hunting':
        systemPrompt = `Eres un sistema proactivo de threat hunting con IA.

CAPACIDADES:
- Búsqueda proactiva de amenazas
- Análisis de indicadores de compromiso (IOC)
- Hipótesis de caza automatizadas
- Correlación de inteligencia de amenazas
- Investigación guiada por IA

RESPUESTA JSON:
{
  "hunting_campaign": {
    "id": "string",
    "hypothesis": "string",
    "status": "active|completed|findings_detected",
    "started_at": "ISO",
    "scope": ["string"]
  },
  "findings": [{
    "id": "string",
    "severity": "critical|high|medium|low",
    "type": "ioc_match|behavioral_anomaly|lateral_movement|persistence_mechanism|exfiltration",
    "description": "string",
    "evidence": [{
      "type": "log|network|file|registry|memory",
      "data": "string",
      "timestamp": "ISO"
    }],
    "affected_assets": ["string"],
    "kill_chain_phase": "reconnaissance|weaponization|delivery|exploitation|installation|c2|actions",
    "attribution": {
      "threat_actor": "string|null",
      "confidence": 0-100,
      "campaign": "string|null"
    }
  }],
  "iocs_detected": [{
    "type": "ip|domain|hash|email|url",
    "value": "string",
    "threat_intel_source": "string",
    "last_seen": "ISO"
  }],
  "recommended_hunts": [{
    "hypothesis": "string",
    "priority": "high|medium|low",
    "data_sources_needed": ["string"]
  }],
  "statistics": {
    "events_analyzed": number,
    "assets_scanned": number,
    "time_range": "string"
  }
}`;
        userPrompt = `Ejecuta threat hunting: ${JSON.stringify({ context, params })}`;
        break;

      case 'forensic_analysis':
        systemPrompt = `Eres un sistema de análisis forense digital con IA.

CAPACIDADES:
- Análisis de evidencia digital
- Reconstrucción de timeline de eventos
- Análisis de malware
- Recuperación de datos
- Cadena de custodia digital

RESPUESTA JSON:
{
  "investigation": {
    "case_id": "string",
    "status": "in_progress|completed|requires_escalation",
    "type": "breach|malware|insider|fraud|data_theft",
    "started_at": "ISO",
    "analyst_notes": "string"
  },
  "evidence_collected": [{
    "id": "string",
    "type": "disk_image|memory_dump|network_capture|logs|registry",
    "source": "string",
    "hash": {"md5": "string", "sha256": "string"},
    "chain_of_custody": [{
      "action": "string",
      "by": "string",
      "timestamp": "ISO"
    }],
    "analysis_status": "pending|analyzing|completed"
  }],
  "timeline": [{
    "timestamp": "ISO",
    "event_type": "string",
    "description": "string",
    "source": "string",
    "significance": "critical|important|informational",
    "related_iocs": ["string"]
  }],
  "malware_analysis": {
    "detected": boolean,
    "samples": [{
      "hash": "string",
      "family": "string",
      "capabilities": ["string"],
      "c2_servers": ["string"],
      "persistence_mechanisms": ["string"]
    }]
  },
  "attack_narrative": "string",
  "root_cause": "string",
  "recommendations": ["string"],
  "legal_hold_required": boolean
}`;
        userPrompt = `Ejecuta análisis forense: ${JSON.stringify({ context, params })}`;
        break;

      case 'security_posture':
        systemPrompt = `Eres un evaluador de postura de seguridad empresarial con IA.

CAPACIDADES:
- Evaluación holística de seguridad
- Benchmarking contra mejores prácticas
- Análisis de madurez de seguridad
- Identificación de gaps críticos
- Roadmap de mejora

RESPUESTA JSON:
{
  "overall_posture": {
    "score": 0-100,
    "grade": "A|B|C|D|F",
    "trend": "improving|stable|declining",
    "maturity_level": "initial|developing|defined|managed|optimizing"
  },
  "domains": [{
    "domain": "identity|network|endpoint|data|cloud|application",
    "score": 0-100,
    "strengths": ["string"],
    "weaknesses": ["string"],
    "priority_improvements": ["string"]
  }],
  "risk_exposure": {
    "overall_risk": "critical|high|medium|low",
    "top_risks": [{
      "risk": "string",
      "likelihood": "high|medium|low",
      "impact": "severe|significant|moderate|minor",
      "mitigation_status": "string"
    }]
  },
  "security_investments": {
    "current_spend": number,
    "recommended_spend": number,
    "roi_opportunities": ["string"]
  },
  "benchmark_comparison": {
    "industry_average": number,
    "percentile": number,
    "gap_to_leader": number
  },
  "improvement_roadmap": [{
    "phase": "immediate|short_term|medium_term|long_term",
    "initiatives": [{
      "title": "string",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "cost_estimate": "string"
    }]
  }]
}`;
        userPrompt = `Evalúa postura de seguridad: ${JSON.stringify({ context, params })}`;
        break;

      case 'zero_trust_evaluation':
        systemPrompt = `Eres un evaluador de arquitectura Zero Trust con IA.

PRINCIPIOS ZERO TRUST:
- Never trust, always verify
- Least privilege access
- Assume breach
- Microsegmentation
- Continuous validation

RESPUESTA JSON:
{
  "zero_trust_score": 0-100,
  "maturity_level": "traditional|hybrid|advanced|optimal",
  "pillars": [{
    "pillar": "identity|devices|network|applications|data|infrastructure|visibility",
    "score": 0-100,
    "current_state": "string",
    "target_state": "string",
    "gap_analysis": ["string"],
    "implementation_status": "not_started|in_progress|partial|complete"
  }],
  "policy_evaluation": {
    "least_privilege_compliance": 0-100,
    "mfa_coverage": 0-100,
    "microsegmentation_coverage": 0-100,
    "encryption_coverage": 0-100,
    "continuous_monitoring": 0-100
  },
  "architecture_recommendations": [{
    "area": "string",
    "current_gap": "string",
    "recommendation": "string",
    "priority": "critical|high|medium|low",
    "technologies": ["string"],
    "estimated_implementation": "string"
  }],
  "quick_wins": ["string"],
  "transformation_roadmap": {
    "phases": [{
      "phase": number,
      "focus_areas": ["string"],
      "key_milestones": ["string"],
      "timeline": "string"
    }],
    "total_timeline": "string",
    "investment_required": "string"
  }
}`;
        userPrompt = `Evalúa arquitectura Zero Trust: ${JSON.stringify({ context, params })}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[security-intelligence] Processing: ${action}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded', 
          message: 'Demasiadas solicitudes. Intenta más tarde.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Payment required', 
          message: 'Créditos de IA insuficientes.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('[security-intelligence] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[security-intelligence] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[security-intelligence] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
