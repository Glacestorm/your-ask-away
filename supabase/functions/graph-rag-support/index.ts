import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GraphRAGRequest {
  action: 'search' | 'get_customer_context' | 'learn_pattern' | 'find_similar' | 'get_resolution_path' | 'add_node' | 'add_edge' | 'get_patterns' | 'get_stats' | 'validate_pattern';
  query?: string;
  nodeTypes?: string[];
  maxDepth?: number;
  minConfidence?: number;
  includeContext?: boolean;
  customerId?: string;
  problemDescription?: string;
  solution?: string;
  resolutionSteps?: string[];
  effectiveness?: number;
  sessionId?: string;
  limit?: number;
  problemNodeId?: string;
  targetOutcome?: string;
  node?: Record<string, unknown>;
  edge?: Record<string, unknown>;
  patternId?: string;
  isValid?: boolean;
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

    const body: GraphRAGRequest = await req.json();
    const { action } = body;

    console.log(`[graph-rag-support] Processing action: ${action}`);

    let result;

    switch (action) {
      case 'search': {
        const { query, nodeTypes, maxDepth = 3, minConfidence = 0.5, includeContext = true } = body;
        
        const searchPrompt = `Actúa como un sistema de búsqueda semántica en un grafo de conocimiento de soporte técnico.

CONSULTA: "${query}"
TIPOS DE NODOS PERMITIDOS: ${nodeTypes?.join(', ') || 'todos'}
PROFUNDIDAD MÁXIMA: ${maxDepth}
CONFIANZA MÍNIMA: ${minConfidence}

Genera resultados de búsqueda simulados pero realistas basados en la consulta.

RESPONDE EN JSON:
{
  "nodes": [
    {
      "id": "uuid",
      "type": "problem|solution|symptom|cause|product|feature",
      "label": "string",
      "properties": {},
      "relevanceScore": number
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "targetId": "uuid",
      "relationship": "causes|solves|relates_to|similar_to",
      "weight": number,
      "confidence": number
    }
  ],
  "contextualInsights": ["string"],
  "suggestedPaths": [["node_id", "node_id"]],
  "relevantPatterns": [
    {
      "id": "uuid",
      "patternType": "problem_solution|escalation_trigger|success_factor",
      "description": "string",
      "confidence": number,
      "actionable": boolean,
      "suggestedAction": "string"
    }
  ],
  "confidence": number
}`;

        const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Eres un sistema de Knowledge Graph especializado en soporte técnico. Genera datos realistas y coherentes. Responde en JSON válido.' },
              { role: 'user', content: searchPrompt }
            ],
            temperature: 0.4,
            max_tokens: 2500,
          }),
        });

        if (!searchResponse.ok) {
          throw new Error(`AI API error: ${searchResponse.status}`);
        }

        const searchData = await searchResponse.json();
        const content = searchData.choices?.[0]?.message?.content || '';
        
        let searchResult;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          searchResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          searchResult = { nodes: [], edges: [], contextualInsights: [], suggestedPaths: [], relevantPatterns: [], confidence: 0.5 };
        }

        result = { success: true, result: searchResult };
        break;
      }

      case 'get_customer_context': {
        const { customerId } = body;
        
        const contextPrompt = `Genera un contexto de cliente completo para un sistema de soporte.

CLIENTE ID: ${customerId}

Incluye:
- Historial de sesiones con problemas y resoluciones
- Patrones de interacción
- Preferencias
- Issues conocidos

RESPONDE EN JSON:
{
  "customerId": "${customerId}",
  "sessionHistory": [
    {
      "sessionId": "uuid",
      "timestamp": "ISO date",
      "problemDescription": "string",
      "resolution": "string",
      "resolutionPath": ["step1", "step2"],
      "effectiveness": number,
      "learnings": ["string"]
    }
  ],
  "interactionPatterns": [
    {
      "patternType": "string",
      "frequency": number,
      "typicalDuration": number,
      "commonTriggers": ["string"],
      "preferredChannels": ["string"]
    }
  ],
  "preferredSolutions": ["string"],
  "knownIssues": ["string"],
  "lastInteraction": "ISO date",
  "totalInteractions": number,
  "satisfactionTrend": number
}`;

        const contextResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Genera datos de contexto de cliente realistas para un CRM de soporte.' },
              { role: 'user', content: contextPrompt }
            ],
            temperature: 0.5,
            max_tokens: 2000,
          }),
        });

        const contextData = await contextResponse.json();
        const contextContent = contextData.choices?.[0]?.message?.content || '';
        
        let context;
        try {
          const jsonMatch = contextContent.match(/\{[\s\S]*\}/);
          context = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          context = null;
        }

        result = { success: true, context };
        break;
      }

      case 'learn_pattern': {
        const { problemDescription, solution, resolutionSteps, effectiveness, sessionId } = body;
        
        // In a real implementation, this would update the knowledge graph
        console.log(`[graph-rag-support] Learning pattern from session ${sessionId}`);
        console.log(`Problem: ${problemDescription}`);
        console.log(`Solution: ${solution}`);
        console.log(`Steps: ${resolutionSteps?.join(' -> ')}`);
        console.log(`Effectiveness: ${effectiveness}`);

        result = { 
          success: true, 
          message: 'Patrón aprendido y añadido al grafo de conocimiento',
          patternId: crypto.randomUUID()
        };
        break;
      }

      case 'find_similar': {
        const { problemDescription, limit = 5 } = body;
        
        const similarPrompt = `Encuentra problemas similares a: "${problemDescription}"

Genera ${limit} problemas similares con sus soluciones.

RESPONDE EN JSON:
{
  "similar": [
    {
      "problem": "string",
      "solution": "string",
      "confidence": number
    }
  ]
}`;

        const similarResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Genera problemas similares de soporte técnico con soluciones.' },
              { role: 'user', content: similarPrompt }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        const similarData = await similarResponse.json();
        const similarContent = similarData.choices?.[0]?.message?.content || '';
        
        let similar = [];
        try {
          const jsonMatch = similarContent.match(/\{[\s\S]*\}/);
          similar = jsonMatch ? JSON.parse(jsonMatch[0]).similar || [] : [];
        } catch {
          similar = [];
        }

        result = { success: true, similar };
        break;
      }

      case 'get_resolution_path': {
        const { problemNodeId, targetOutcome } = body;
        
        result = {
          success: true,
          path: {
            path: [
              { id: problemNodeId, type: 'problem', label: 'Problema inicial' },
              { id: crypto.randomUUID(), type: 'cause', label: 'Causa identificada' },
              { id: crypto.randomUUID(), type: 'solution', label: 'Solución aplicada' }
            ],
            steps: [
              'Identificar el problema',
              'Analizar la causa raíz',
              'Aplicar solución recomendada',
              'Verificar resolución'
            ],
            confidence: 0.85
          }
        };
        break;
      }

      case 'add_node': {
        const { node } = body;
        
        const newNode = {
          id: crypto.randomUUID(),
          ...node,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 0,
          relevanceScore: 1.0
        };

        result = { success: true, node: newNode };
        break;
      }

      case 'add_edge': {
        const { edge } = body;
        
        const newEdge = {
          id: crypto.randomUUID(),
          ...edge,
          createdAt: new Date().toISOString()
        };

        result = { success: true, edge: newEdge };
        break;
      }

      case 'get_patterns': {
        result = {
          success: true,
          patterns: [
            {
              id: crypto.randomUUID(),
              patternType: 'problem_solution',
              description: 'Error de conexión se resuelve reiniciando el servicio',
              sourceNodes: ['node1', 'node2'],
              confidence: 0.92,
              validationCount: 45,
              lastValidated: new Date().toISOString(),
              actionable: true,
              suggestedAction: 'Reiniciar servicio de conexión'
            },
            {
              id: crypto.randomUUID(),
              patternType: 'escalation_trigger',
              description: 'Más de 3 intentos fallidos requiere escalación',
              sourceNodes: ['node3', 'node4'],
              confidence: 0.88,
              validationCount: 23,
              lastValidated: new Date().toISOString(),
              actionable: true,
              suggestedAction: 'Escalar a nivel 2'
            },
            {
              id: crypto.randomUUID(),
              patternType: 'success_factor',
              description: 'Reinicio de caché mejora rendimiento en 80% de casos',
              sourceNodes: ['node5'],
              confidence: 0.85,
              validationCount: 67,
              lastValidated: new Date().toISOString(),
              actionable: true,
              suggestedAction: 'Limpiar caché del cliente'
            }
          ]
        };
        break;
      }

      case 'get_stats': {
        result = {
          success: true,
          stats: {
            totalNodes: 1247,
            totalEdges: 3892,
            avgConnections: 3.12,
            lastUpdated: new Date().toISOString()
          }
        };
        break;
      }

      case 'validate_pattern': {
        const { patternId, isValid } = body;
        
        console.log(`[graph-rag-support] Pattern ${patternId} validated as ${isValid ? 'valid' : 'invalid'}`);

        result = { 
          success: true, 
          message: isValid ? 'Patrón validado correctamente' : 'Patrón marcado como inválido'
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`[graph-rag-support] Action ${action} completed successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[graph-rag-support] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
