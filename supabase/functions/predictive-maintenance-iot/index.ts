import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictiveMaintenanceRequest {
  action: 'get_devices' | 'get_telemetry' | 'detect_anomalies' | 'predict_failures' | 'create_proactive_session' | 'update_proactive_session' | 'get_health_report' | 'get_patterns' | 'resolve_anomaly';
  customerId?: string;
  deviceId?: string;
  timeRange?: 'hour' | 'day' | 'week';
  triggerId?: string;
  triggerType?: string;
  description?: string;
  proposedActions?: string[];
  sessionId?: string;
  updates?: Record<string, unknown>;
  deviceType?: string;
  anomalyId?: string;
  resolution?: string;
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

    const body: PredictiveMaintenanceRequest = await req.json();
    const { action } = body;

    console.log(`[predictive-maintenance-iot] Processing action: ${action}`);

    let result;

    switch (action) {
      case 'get_devices': {
        const { customerId } = body;
        
        // Generate mock IoT devices
        const deviceTypes = ['router', 'sensor', 'gateway', 'controller', 'display'];
        const statuses = ['online', 'online', 'online', 'warning', 'offline'];
        
        const devices = Array.from({ length: 8 }, (_, i) => ({
          id: crypto.randomUUID(),
          deviceType: deviceTypes[i % deviceTypes.length],
          name: `Device-${String(i + 1).padStart(3, '0')}`,
          customerId: customerId || `customer-${i % 3 + 1}`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          lastSeen: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          firmwareVersion: `2.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
          healthScore: 60 + Math.floor(Math.random() * 40),
          location: ['Planta 1', 'Planta 2', 'Oficina Central', 'Almacén'][Math.floor(Math.random() * 4)],
          metadata: { serialNumber: `SN${Math.random().toString(36).substring(7).toUpperCase()}` }
        }));

        result = { success: true, devices };
        break;
      }

      case 'get_telemetry': {
        const { deviceId, timeRange } = body;
        
        const dataPoints = timeRange === 'hour' ? 60 : timeRange === 'day' ? 24 : 7;
        const intervalMs = timeRange === 'hour' ? 60000 : timeRange === 'day' ? 3600000 : 86400000;
        
        const metrics = Array.from({ length: dataPoints }, (_, i) => ({
          cpu: 20 + Math.random() * 60,
          memory: 30 + Math.random() * 50,
          temperature: 35 + Math.random() * 25,
          networkLatency: 10 + Math.random() * 90,
          errorRate: Math.random() * 5,
          responseTime: 50 + Math.random() * 200
        }));

        const events = [
          { id: crypto.randomUUID(), type: 'info', code: 'SYS001', message: 'Sistema iniciado', timestamp: new Date().toISOString() },
          { id: crypto.randomUUID(), type: 'warning', code: 'NET002', message: 'Latencia alta detectada', timestamp: new Date(Date.now() - 1800000).toISOString() }
        ];

        result = {
          success: true,
          telemetry: {
            deviceId,
            timestamp: new Date().toISOString(),
            metrics: metrics[0],
            events
          }
        };
        break;
      }

      case 'detect_anomalies': {
        const { deviceId } = body;
        
        // Generate realistic anomalies
        const anomalyTypes = [
          { type: 'cpu_spike', description: 'Pico de CPU inusual', severity: 'medium' },
          { type: 'memory_leak', description: 'Posible fuga de memoria', severity: 'high' },
          { type: 'network_latency', description: 'Latencia de red anormal', severity: 'low' },
          { type: 'temperature_high', description: 'Temperatura elevada', severity: 'critical' }
        ];

        const anomalies = Math.random() > 0.3 ? [
          {
            id: crypto.randomUUID(),
            deviceId: deviceId || crypto.randomUUID(),
            ...anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
            detectedAt: new Date().toISOString(),
            metrics: { cpu: 92, memory: 78, temperature: 72 },
            expectedRange: { min: 20, max: 70 },
            actualValue: 92,
            confidence: 0.85 + Math.random() * 0.15,
            resolved: false
          }
        ] : [];

        result = { success: true, anomalies };
        break;
      }

      case 'predict_failures': {
        const { deviceId } = body;
        
        // Use AI to generate failure predictions
        const predictionPrompt = `Genera predicciones de fallos para dispositivos IoT.
        
GENERA 2-3 predicciones realistas en JSON:
{
  "predictions": [
    {
      "id": "uuid",
      "deviceId": "${deviceId || 'device-001'}",
      "componentPredicted": "string (ej: disco, memoria, ventilador, sensor)",
      "failureProbability": number (0-1),
      "estimatedTimeToFailure": number (horas),
      "confidenceInterval": { "low": number, "high": number },
      "contributingFactors": ["string"],
      "recommendedActions": ["string"],
      "impactLevel": "low|medium|high|critical",
      "createdAt": "ISO date"
    }
  ]
}`;

        const predResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un sistema de mantenimiento predictivo IoT. Genera predicciones realistas.' },
              { role: 'user', content: predictionPrompt }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        const predData = await predResponse.json();
        const predContent = predData.choices?.[0]?.message?.content || '';
        
        let predictions = [];
        try {
          const jsonMatch = predContent.match(/\{[\s\S]*\}/);
          predictions = jsonMatch ? JSON.parse(jsonMatch[0]).predictions || [] : [];
        } catch {
          predictions = [{
            id: crypto.randomUUID(),
            deviceId: deviceId || 'device-001',
            componentPredicted: 'Ventilador',
            failureProbability: 0.65,
            estimatedTimeToFailure: 72,
            confidenceInterval: { low: 48, high: 96 },
            contributingFactors: ['Temperatura elevada', 'Uso intensivo'],
            recommendedActions: ['Programar mantenimiento', 'Revisar sistema de enfriamiento'],
            impactLevel: 'medium',
            createdAt: new Date().toISOString()
          }];
        }

        result = { success: true, predictions };
        break;
      }

      case 'create_proactive_session': {
        const { deviceId, customerId, triggerType, triggerId, description, proposedActions } = body;
        
        const session = {
          id: crypto.randomUUID(),
          deviceId,
          customerId,
          triggerType,
          triggerId,
          status: 'pending',
          priority: triggerType === 'prediction' ? 2 : 1,
          description,
          proposedActions,
          createdAt: new Date().toISOString()
        };

        result = { success: true, session };
        break;
      }

      case 'update_proactive_session': {
        const { sessionId, updates } = body;
        
        result = { 
          success: true, 
          message: `Session ${sessionId} updated`,
          updates 
        };
        break;
      }

      case 'get_health_report': {
        const { deviceId } = body;
        
        result = {
          success: true,
          report: {
            deviceId,
            overallHealth: 78,
            components: [
              { name: 'CPU', health: 85, trend: 'stable', concerns: [] },
              { name: 'Memoria', health: 72, trend: 'declining', concerns: ['Uso alto sostenido'] },
              { name: 'Disco', health: 90, trend: 'stable', concerns: [] },
              { name: 'Red', health: 65, trend: 'improving', concerns: ['Latencia ocasional'] }
            ],
            recentAnomalies: [],
            predictions: [],
            maintenanceHistory: [
              { date: new Date(Date.now() - 30 * 86400000).toISOString(), type: 'Preventivo', outcome: 'Exitoso' },
              { date: new Date(Date.now() - 90 * 86400000).toISOString(), type: 'Correctivo', outcome: 'Exitoso' }
            ],
            recommendations: [
              'Programar limpieza de memoria',
              'Revisar configuración de red',
              'Actualizar firmware a versión 2.5.0'
            ]
          }
        };
        break;
      }

      case 'get_patterns': {
        const { deviceType } = body;
        
        result = {
          success: true,
          patterns: [
            {
              id: crypto.randomUUID(),
              deviceType: deviceType || 'router',
              patternName: 'Degradación gradual de memoria',
              symptoms: ['Uso de memoria creciente', 'Tiempos de respuesta lentos'],
              typicalProgression: ['Uso normal', 'Uso elevado', 'Fuga detectada', 'Fallo'],
              preventiveActions: ['Reinicio programado', 'Limpieza de caché'],
              avgTimeToFailure: 720,
              occurrences: 45,
              lastSeen: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: crypto.randomUUID(),
              deviceType: deviceType || 'sensor',
              patternName: 'Fallo de sensor por temperatura',
              symptoms: ['Lecturas erráticas', 'Temperatura alta'],
              typicalProgression: ['Normal', 'Lecturas inestables', 'Desconexiones', 'Fallo total'],
              preventiveActions: ['Mejorar ventilación', 'Reemplazo preventivo'],
              avgTimeToFailure: 168,
              occurrences: 23,
              lastSeen: new Date(Date.now() - 172800000).toISOString()
            }
          ]
        };
        break;
      }

      case 'resolve_anomaly': {
        const { anomalyId, resolution } = body;
        
        console.log(`[predictive-maintenance-iot] Resolving anomaly ${anomalyId}: ${resolution}`);

        result = { 
          success: true, 
          message: 'Anomalía resuelta correctamente',
          anomalyId,
          resolvedAt: new Date().toISOString()
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[predictive-maintenance-iot] Action ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[predictive-maintenance-iot] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
