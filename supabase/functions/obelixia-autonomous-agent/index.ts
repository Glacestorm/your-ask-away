/**
 * ObelixIA Autonomous Agent Edge Function
 * Motor de Contabilidad Autónoma
 * Fase 3: Autonomous Bookkeeping Engine
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRequest {
  action: 
    | 'classify_movements' 
    | 'generate_entries' 
    | 'find_reconciliation_matches'
    | 'execute_reconciliation'
    | 'get_learning_rules'
    | 'create_learning_rule'
    | 'update_learning_rule'
    | 'delete_learning_rule'
    | 'approve_decision'
    | 'reject_decision'
    | 'get_metrics';
  movements?: unknown[];
  classifications?: unknown[];
  entries?: unknown[];
  suggestion?: unknown;
  rule?: unknown;
  ruleId?: string;
  updates?: unknown;
  decisionId?: string;
  reason?: string;
  config?: Record<string, unknown>;
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

    const { action, ...params } = await req.json() as AgentRequest;

    console.log(`[ObelixiaAgent] Processing action: ${action}`);

    let result: Record<string, unknown>;

    switch (action) {
      case 'classify_movements':
        result = await classifyMovements(params.movements || [], params.config, LOVABLE_API_KEY);
        break;

      case 'generate_entries':
        result = await generateEntries(params.classifications || [], params.config, LOVABLE_API_KEY);
        break;

      case 'find_reconciliation_matches':
        result = await findReconciliationMatches(
          params.movements || [], 
          params.entries || [], 
          params.config,
          LOVABLE_API_KEY
        );
        break;

      case 'execute_reconciliation':
        result = await executeReconciliation(params.suggestion);
        break;

      case 'get_learning_rules':
        result = await getLearningRules();
        break;

      case 'create_learning_rule':
        result = await createLearningRule(params.rule);
        break;

      case 'update_learning_rule':
        result = await updateLearningRule(params.ruleId!, params.updates);
        break;

      case 'delete_learning_rule':
        result = await deleteLearningRule(params.ruleId!);
        break;

      case 'approve_decision':
        result = await approveDecision(params.decisionId!, LOVABLE_API_KEY);
        break;

      case 'reject_decision':
        result = await rejectDecision(params.decisionId!, params.reason);
        break;

      case 'get_metrics':
        result = await getMetrics();
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ObelixiaAgent] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// === CLASIFICACIÓN DE MOVIMIENTOS ===

async function classifyMovements(
  movements: unknown[], 
  config: Record<string, unknown> | undefined,
  apiKey: string
): Promise<Record<string, unknown>> {
  if (!movements || movements.length === 0) {
    return { success: true, results: [] };
  }

  const systemPrompt = `Eres un sistema experto en clasificación contable automatizada para empresas españolas.

Tu tarea es analizar movimientos bancarios y clasificarlos según el Plan General Contable (PGC) español.

CAPACIDADES:
1. Identificar el tipo de operación (compra, venta, nómina, impuesto, préstamo, etc.)
2. Asignar cuentas contables según PGC
3. Detectar patrones recurrentes
4. Identificar proveedores/clientes por descripción
5. Calcular nivel de confianza

FORMATO DE RESPUESTA (JSON estricto para cada movimiento):
{
  "results": [
    {
      "movementId": "id del movimiento",
      "suggestedCategory": "categoría (ej: compras, ventas, nóminas, impuestos)",
      "suggestedAccount": "código cuenta PGC (ej: 400, 430, 640)",
      "suggestedCounterpart": "cuenta contrapartida",
      "confidence": 0-100,
      "reasoning": "explicación breve de la clasificación",
      "matchedPatterns": [
        {
          "patternId": "pattern_1",
          "patternName": "nombre del patrón",
          "matchScore": 0-100,
          "matchedFields": ["campo1", "campo2"]
        }
      ],
      "suggestedEntryLines": [
        {
          "accountCode": "código",
          "accountName": "nombre cuenta",
          "debit": 0,
          "credit": 0,
          "description": "concepto"
        }
      ]
    }
  ]
}

REGLAS DE CLASIFICACIÓN:
- Nóminas/Sueldos → 640 (Sueldos y salarios) / 465 (Remuneraciones pendientes)
- Seguridad Social → 642 (SS a cargo empresa) / 476 (OS SS acreedores)
- IVA Soportado → 472 / Proveedor 400
- IVA Repercutido → 477 / Cliente 430
- Alquileres → 621 (Arrendamientos)
- Suministros → 628 (Suministros)
- Servicios bancarios → 626 (Servicios bancarios)
- Intereses → 662/769 (Gastos/Ingresos financieros)`;

  const userPrompt = `Clasifica los siguientes ${movements.length} movimientos bancarios:

${JSON.stringify(movements, null, 2)}

${config?.existingRules ? `
Reglas de aprendizaje activas a considerar:
${JSON.stringify(config.existingRules, null, 2)}
` : ''}

Proporciona la clasificación en formato JSON.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      results: parsed.results || []
    };

  } catch (error) {
    console.error('[classifyMovements] Error:', error);
    throw error;
  }
}

// === GENERACIÓN DE ASIENTOS ===

async function generateEntries(
  classifications: unknown[],
  config: Record<string, unknown> | undefined,
  apiKey: string
): Promise<Record<string, unknown>> {
  if (!classifications || classifications.length === 0) {
    return { success: true, entriesCreated: 0, entriesPending: 0 };
  }

  // Simular creación de asientos (en producción, guardaría en BD)
  const threshold = (config?.requireApprovalBelow as number) || 70;
  const autonomyLevel = config?.autonomyLevel || 'suggestion';

  let entriesCreated = 0;
  let entriesPending = 0;
  const decisions: unknown[] = [];

  for (const classification of classifications as Array<{ confidence: number; movementId: string; suggestedCategory: string; reasoning: string; suggestedEntryLines: unknown[] }>) {
    const isAutoApproved = 
      classification.confidence >= threshold && 
      autonomyLevel !== 'suggestion';

    const decision = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      decisionType: 'entry_creation',
      entityId: classification.movementId,
      entityType: 'bank_movement',
      inputData: classification,
      outputData: { entryLines: classification.suggestedEntryLines },
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      wasAutoExecuted: isAutoApproved,
      rulesApplied: [],
      executionTimeMs: Math.floor(Math.random() * 200) + 50
    };

    decisions.push(decision);

    if (isAutoApproved) {
      entriesCreated++;
    } else {
      entriesPending++;
    }
  }

  return {
    success: true,
    entriesCreated,
    entriesPending,
    decisions
  };
}

// === RECONCILIACIÓN ===

async function findReconciliationMatches(
  movements: unknown[],
  entries: unknown[],
  config: Record<string, unknown> | undefined,
  apiKey: string
): Promise<Record<string, unknown>> {
  if (!movements || movements.length === 0 || !entries || entries.length === 0) {
    return { success: true, suggestions: [] };
  }

  const systemPrompt = `Eres un sistema experto en reconciliación bancaria automática.

Tu tarea es encontrar coincidencias entre movimientos bancarios y asientos contables.

CRITERIOS DE MATCHING:
1. Coincidencia exacta: mismo importe y fecha similar (±3 días)
2. Coincidencia fuzzy: importes cercanos (±1%) y descripción similar
3. Coincidencia parcial: varios movimientos que suman un asiento

FORMATO DE RESPUESTA (JSON):
{
  "suggestions": [
    {
      "bankMovementId": "id",
      "matchedEntryId": "id",
      "matchType": "exact|fuzzy|partial",
      "matchScore": 0-100,
      "differences": [
        {
          "field": "campo",
          "bankValue": "valor banco",
          "entryValue": "valor asiento",
          "significance": "low|medium|high"
        }
      ],
      "suggestedAction": "reconcile|adjust|investigate"
    }
  ]
}`;

  const userPrompt = `Encuentra coincidencias entre estos movimientos bancarios y asientos:

MOVIMIENTOS BANCARIOS:
${JSON.stringify(movements, null, 2)}

ASIENTOS CONTABLES:
${JSON.stringify(entries, null, 2)}

Proporciona sugerencias de reconciliación.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error('No content in AI response');

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      suggestions: parsed.suggestions || []
    };

  } catch (error) {
    console.error('[findReconciliationMatches] Error:', error);
    throw error;
  }
}

async function executeReconciliation(suggestion: unknown): Promise<Record<string, unknown>> {
  // En producción, ejecutaría la reconciliación en la BD
  return {
    success: true,
    message: 'Reconciliación ejecutada correctamente'
  };
}

// === REGLAS DE APRENDIZAJE (simuladas) ===

const inMemoryRules: Map<string, unknown> = new Map();

async function getLearningRules(): Promise<Record<string, unknown>> {
  return {
    success: true,
    rules: Array.from(inMemoryRules.values())
  };
}

async function createLearningRule(rule: unknown): Promise<Record<string, unknown>> {
  const newRule = {
    ...(rule as Record<string, unknown>),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesApplied: 0
  };
  
  inMemoryRules.set(newRule.id as string, newRule);
  
  return {
    success: true,
    rule: newRule
  };
}

async function updateLearningRule(ruleId: string, updates: unknown): Promise<Record<string, unknown>> {
  const existing = inMemoryRules.get(ruleId);
  if (!existing) {
    return { success: false, error: 'Rule not found' };
  }
  
  const updated = {
    ...(existing as Record<string, unknown>),
    ...(updates as Record<string, unknown>),
    updatedAt: new Date().toISOString()
  };
  
  inMemoryRules.set(ruleId, updated);
  
  return { success: true, rule: updated };
}

async function deleteLearningRule(ruleId: string): Promise<Record<string, unknown>> {
  inMemoryRules.delete(ruleId);
  return { success: true };
}

// === DECISIONES ===

async function approveDecision(decisionId: string, apiKey: string): Promise<Record<string, unknown>> {
  // En producción, aprobaría la decisión y potencialmente crearía una regla
  return {
    success: true,
    message: 'Decisión aprobada'
  };
}

async function rejectDecision(decisionId: string, reason?: string): Promise<Record<string, unknown>> {
  return {
    success: true,
    message: 'Decisión rechazada',
    reason
  };
}

// === MÉTRICAS ===

async function getMetrics(): Promise<Record<string, unknown>> {
  // Métricas simuladas
  return {
    success: true,
    metrics: {
      totalDecisions: 156,
      autoApprovedDecisions: 89,
      manualApprovedDecisions: 52,
      rejectedDecisions: 15,
      averageConfidence: 82.5,
      accuracyRate: 94.2,
      timeSavedMinutes: 340,
      activeRules: inMemoryRules.size,
      lastActivityAt: new Date().toISOString(),
      decisionsToday: 12,
      decisionsThisWeek: 45
    }
  };
}
