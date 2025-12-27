import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeGraphRequest {
  action: 'build_graph' | 'query_graph' | 'entity_extraction' | 'relationship_discovery' | 
          'semantic_search' | 'reasoning_chain' | 'knowledge_fusion' | 'ontology_mapping' |
          'context_enrichment' | 'insight_generation';
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

    const { action, context, params } = await req.json() as KnowledgeGraphRequest;

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'build_graph':
        systemPrompt = `Eres un constructor de grafos de conocimiento empresarial con IA.

CAPACIDADES:
- Construcción automática de grafos desde múltiples fuentes
- Identificación de entidades y relaciones
- Normalización y deduplicación
- Vinculación de entidades (entity linking)
- Inferencia de relaciones implícitas

RESPUESTA JSON:
{
  "graph": {
    "id": "string",
    "name": "string",
    "version": "string",
    "created_at": "ISO",
    "statistics": {
      "total_nodes": number,
      "total_edges": number,
      "node_types": {"type": number},
      "edge_types": {"type": number},
      "density": number,
      "avg_degree": number
    }
  },
  "nodes": [{
    "id": "string",
    "type": "entity|concept|event|document|metric",
    "label": "string",
    "properties": {"key": "value"},
    "embedding_id": "string|null",
    "confidence": 0-100,
    "sources": ["string"]
  }],
  "edges": [{
    "id": "string",
    "source": "string",
    "target": "string",
    "type": "string",
    "weight": 0-1,
    "properties": {"key": "value"},
    "bidirectional": boolean,
    "temporal": {"start": "ISO|null", "end": "ISO|null"}
  }],
  "clusters": [{
    "id": "string",
    "name": "string",
    "nodes": ["string"],
    "coherence_score": 0-100
  }],
  "quality_metrics": {
    "completeness": 0-100,
    "accuracy": 0-100,
    "consistency": 0-100,
    "freshness": 0-100
  }
}`;
        userPrompt = `Construye grafo de conocimiento: ${JSON.stringify({ context, params })}`;
        break;

      case 'query_graph':
        systemPrompt = `Eres un motor de consultas de grafos de conocimiento con IA.

CAPACIDADES:
- Consultas en lenguaje natural
- Traversal de grafos
- Pathfinding entre entidades
- Agregaciones y estadísticas
- Consultas temporales

RESPUESTA JSON:
{
  "query": {
    "original": "string",
    "interpreted": "string",
    "type": "traversal|pathfinding|aggregation|pattern|temporal"
  },
  "results": [{
    "node": {
      "id": "string",
      "type": "string",
      "label": "string",
      "properties": {"key": "value"}
    },
    "relevance_score": 0-100,
    "path_from_query": ["string"],
    "context": "string"
  }],
  "paths": [{
    "start": "string",
    "end": "string",
    "nodes": ["string"],
    "edges": ["string"],
    "total_weight": number,
    "semantic_similarity": 0-100
  }],
  "aggregations": {
    "count": number,
    "distributions": {"key": number},
    "statistics": {"metric": number}
  },
  "patterns_found": [{
    "pattern_type": "string",
    "instances": number,
    "example_nodes": ["string"]
  }],
  "suggestions": [{
    "query": "string",
    "reason": "string"
  }]
}`;
        userPrompt = `Consulta el grafo: ${JSON.stringify({ context, params })}`;
        break;

      case 'entity_extraction':
        systemPrompt = `Eres un sistema de extracción de entidades con IA avanzada.

CAPACIDADES:
- Named Entity Recognition (NER)
- Extracción de entidades personalizadas
- Resolución de coreferencias
- Desambiguación de entidades
- Vinculación a knowledge bases

RESPUESTA JSON:
{
  "entities": [{
    "id": "string",
    "text": "string",
    "type": "person|organization|location|product|event|concept|metric|date|money",
    "subtype": "string|null",
    "confidence": 0-100,
    "positions": [{"start": number, "end": number}],
    "normalized_value": "string",
    "linked_entity": {
      "kb_id": "string|null",
      "kb_name": "string|null",
      "match_score": 0-100
    },
    "attributes": {"key": "value"},
    "coreferences": ["string"]
  }],
  "relations_extracted": [{
    "subject": "string",
    "predicate": "string",
    "object": "string",
    "confidence": 0-100,
    "evidence": "string"
  }],
  "temporal_expressions": [{
    "text": "string",
    "normalized": "ISO",
    "type": "date|time|duration|range"
  }],
  "statistics": {
    "total_entities": number,
    "by_type": {"type": number},
    "avg_confidence": number,
    "linked_percentage": number
  }
}`;
        userPrompt = `Extrae entidades: ${JSON.stringify({ context, params })}`;
        break;

      case 'relationship_discovery':
        systemPrompt = `Eres un sistema de descubrimiento de relaciones con IA.

CAPACIDADES:
- Descubrimiento de relaciones latentes
- Inferencia de conexiones
- Análisis de patrones relacionales
- Predicción de links
- Detección de relaciones causales

RESPUESTA JSON:
{
  "discovered_relationships": [{
    "id": "string",
    "source_entity": {"id": "string", "label": "string", "type": "string"},
    "target_entity": {"id": "string", "label": "string", "type": "string"},
    "relationship_type": "string",
    "strength": 0-100,
    "confidence": 0-100,
    "discovery_method": "co-occurrence|inference|pattern|causal|temporal",
    "evidence": [{
      "type": "string",
      "description": "string",
      "source": "string"
    }],
    "is_new": boolean,
    "temporal_validity": {"start": "ISO|null", "end": "ISO|null"}
  }],
  "predicted_links": [{
    "source": "string",
    "target": "string",
    "predicted_type": "string",
    "probability": 0-100,
    "reasoning": "string"
  }],
  "relationship_patterns": [{
    "pattern_name": "string",
    "frequency": number,
    "entities_involved": number,
    "example": {"source": "string", "relation": "string", "target": "string"}
  }],
  "causal_chains": [{
    "chain_id": "string",
    "steps": [{"cause": "string", "effect": "string", "confidence": number}],
    "overall_confidence": 0-100
  }],
  "network_metrics": {
    "clustering_coefficient": number,
    "avg_path_length": number,
    "hub_entities": ["string"],
    "bridge_entities": ["string"]
  }
}`;
        userPrompt = `Descubre relaciones: ${JSON.stringify({ context, params })}`;
        break;

      case 'semantic_search':
        systemPrompt = `Eres un motor de búsqueda semántica sobre grafos de conocimiento.

CAPACIDADES:
- Búsqueda por similitud semántica
- Expansión de consultas
- Búsqueda multimodal
- Ranking contextual
- Faceted search

RESPUESTA JSON:
{
  "query_analysis": {
    "original": "string",
    "expanded": ["string"],
    "intent": "string",
    "entities_detected": ["string"],
    "filters_applied": {"key": "value"}
  },
  "results": [{
    "id": "string",
    "type": "entity|document|concept|relationship",
    "title": "string",
    "description": "string",
    "semantic_score": 0-100,
    "keyword_score": 0-100,
    "combined_score": 0-100,
    "highlights": [{
      "field": "string",
      "snippet": "string",
      "matches": ["string"]
    }],
    "related_entities": ["string"],
    "graph_context": {
      "neighbors": number,
      "paths_to_query": number
    }
  }],
  "facets": [{
    "field": "string",
    "values": [{"value": "string", "count": number}]
  }],
  "related_queries": ["string"],
  "knowledge_cards": [{
    "entity_id": "string",
    "type": "string",
    "summary": "string",
    "key_facts": ["string"],
    "relationships_preview": number
  }],
  "search_metadata": {
    "total_results": number,
    "search_time_ms": number,
    "index_coverage": number
  }
}`;
        userPrompt = `Búsqueda semántica: ${JSON.stringify({ context, params })}`;
        break;

      case 'reasoning_chain':
        systemPrompt = `Eres un sistema de razonamiento sobre grafos de conocimiento.

CAPACIDADES:
- Razonamiento multi-hop
- Inferencia lógica
- Razonamiento abductivo
- Explicación de conclusiones
- Detección de inconsistencias

RESPUESTA JSON:
{
  "question": "string",
  "reasoning_type": "deductive|inductive|abductive|analogical",
  "reasoning_chain": [{
    "step": number,
    "premise": "string",
    "inference": "string",
    "confidence": 0-100,
    "supporting_facts": [{
      "fact": "string",
      "source": "string",
      "reliability": 0-100
    }],
    "graph_path": ["string"]
  }],
  "conclusion": {
    "statement": "string",
    "confidence": 0-100,
    "certainty": "certain|probable|possible|uncertain",
    "caveats": ["string"]
  },
  "alternative_conclusions": [{
    "statement": "string",
    "confidence": 0-100,
    "reasoning_difference": "string"
  }],
  "knowledge_gaps": [{
    "missing_info": "string",
    "impact_on_conclusion": "high|medium|low",
    "suggested_sources": ["string"]
  }],
  "consistency_check": {
    "is_consistent": boolean,
    "conflicts_found": [{
      "statement1": "string",
      "statement2": "string",
      "conflict_type": "string"
    }]
  }
}`;
        userPrompt = `Ejecuta razonamiento: ${JSON.stringify({ context, params })}`;
        break;

      case 'knowledge_fusion':
        systemPrompt = `Eres un sistema de fusión de conocimiento con IA.

CAPACIDADES:
- Integración de múltiples fuentes
- Resolución de conflictos
- Deduplicación inteligente
- Enriquecimiento cruzado
- Versionado de conocimiento

RESPUESTA JSON:
{
  "fusion_task": {
    "id": "string",
    "sources": ["string"],
    "status": "completed|partial|failed",
    "started_at": "ISO",
    "completed_at": "ISO"
  },
  "merged_entities": [{
    "canonical_id": "string",
    "merged_from": ["string"],
    "label": "string",
    "type": "string",
    "properties_merged": {"key": {"value": "any", "source": "string", "confidence": number}},
    "merge_confidence": 0-100
  }],
  "conflicts_resolved": [{
    "entity_id": "string",
    "attribute": "string",
    "conflicting_values": [{"value": "any", "source": "string"}],
    "resolution": {"chosen_value": "any", "method": "string", "confidence": number}
  }],
  "new_knowledge": [{
    "type": "entity|relationship|attribute",
    "description": "string",
    "source_combination": ["string"]
  }],
  "quality_improvements": {
    "completeness_gain": number,
    "accuracy_gain": number,
    "coverage_gain": number
  },
  "statistics": {
    "entities_processed": number,
    "entities_merged": number,
    "conflicts_found": number,
    "conflicts_resolved": number,
    "new_relationships": number
  }
}`;
        userPrompt = `Fusiona conocimiento: ${JSON.stringify({ context, params })}`;
        break;

      case 'ontology_mapping':
        systemPrompt = `Eres un sistema de mapeo de ontologías con IA.

CAPACIDADES:
- Alineamiento de ontologías
- Mapeo de esquemas
- Transformación semántica
- Validación de consistencia
- Generación de mappings

RESPUESTA JSON:
{
  "mapping_task": {
    "source_ontology": {"name": "string", "version": "string", "concepts": number},
    "target_ontology": {"name": "string", "version": "string", "concepts": number},
    "mapping_type": "equivalence|subsumption|overlap|custom"
  },
  "concept_mappings": [{
    "source_concept": {"id": "string", "label": "string", "definition": "string"},
    "target_concept": {"id": "string", "label": "string", "definition": "string"},
    "mapping_type": "exact|close|related|broader|narrower",
    "confidence": 0-100,
    "evidence": "string",
    "transformation_needed": boolean,
    "transformation_rule": "string|null"
  }],
  "property_mappings": [{
    "source_property": "string",
    "target_property": "string",
    "mapping_type": "string",
    "value_transformation": "string|null"
  }],
  "unmapped_concepts": {
    "source": [{"id": "string", "label": "string", "suggestion": "string"}],
    "target": [{"id": "string", "label": "string"}]
  },
  "consistency_issues": [{
    "type": "cycle|contradiction|missing_parent",
    "affected_concepts": ["string"],
    "suggestion": "string"
  }],
  "mapping_statistics": {
    "total_mappings": number,
    "exact_matches": number,
    "fuzzy_matches": number,
    "avg_confidence": number,
    "coverage_source": number,
    "coverage_target": number
  }
}`;
        userPrompt = `Mapea ontologías: ${JSON.stringify({ context, params })}`;
        break;

      case 'context_enrichment':
        systemPrompt = `Eres un sistema de enriquecimiento contextual con grafos de conocimiento.

CAPACIDADES:
- Enriquecimiento de entidades
- Contextualización temporal
- Vinculación a eventos
- Expansión de atributos
- Personalización de contexto

RESPUESTA JSON:
{
  "enriched_entities": [{
    "original_entity": {"id": "string", "label": "string", "type": "string"},
    "enrichments": [{
      "attribute": "string",
      "value": "any",
      "source": "string",
      "confidence": 0-100,
      "freshness": "current|recent|historical"
    }],
    "related_context": [{
      "type": "event|trend|news|metric",
      "description": "string",
      "relevance": 0-100,
      "temporal_proximity": "string"
    }],
    "knowledge_graph_position": {
      "centrality": 0-100,
      "cluster": "string",
      "key_connections": number
    }
  }],
  "temporal_context": {
    "current_events": [{
      "event": "string",
      "relevance": 0-100,
      "impact": "string"
    }],
    "trends": [{
      "trend": "string",
      "direction": "increasing|stable|decreasing",
      "significance": 0-100
    }],
    "historical_context": [{
      "period": "string",
      "key_facts": ["string"]
    }]
  },
  "personalized_context": {
    "user_relevance": [{
      "entity_id": "string",
      "relevance_reason": "string",
      "priority": 0-100
    }],
    "recommended_focus": ["string"]
  },
  "enrichment_quality": {
    "completeness": 0-100,
    "freshness": 0-100,
    "relevance": 0-100
  }
}`;
        userPrompt = `Enriquece contexto: ${JSON.stringify({ context, params })}`;
        break;

      case 'insight_generation':
        systemPrompt = `Eres un generador de insights desde grafos de conocimiento.

CAPACIDADES:
- Descubrimiento de patrones
- Detección de anomalías
- Generación de hipótesis
- Identificación de oportunidades
- Síntesis de conocimiento

RESPUESTA JSON:
{
  "insights": [{
    "id": "string",
    "type": "pattern|anomaly|trend|opportunity|risk|correlation",
    "title": "string",
    "description": "string",
    "confidence": 0-100,
    "impact": "high|medium|low",
    "novelty": 0-100,
    "supporting_evidence": [{
      "fact": "string",
      "source": "string",
      "graph_path": ["string"]
    }],
    "affected_entities": ["string"],
    "actionability": {
      "can_act": boolean,
      "suggested_actions": ["string"],
      "urgency": "immediate|short_term|long_term"
    },
    "visualization_hint": "graph|timeline|comparison|distribution"
  }],
  "hypotheses": [{
    "hypothesis": "string",
    "basis": "string",
    "testability": 0-100,
    "potential_value": "high|medium|low",
    "required_data": ["string"]
  }],
  "knowledge_gaps": [{
    "gap": "string",
    "importance": 0-100,
    "filling_suggestions": ["string"]
  }],
  "synthesis": {
    "executive_summary": "string",
    "key_findings": ["string"],
    "recommendations": ["string"],
    "confidence_overall": 0-100
  },
  "meta_insights": {
    "graph_health": 0-100,
    "knowledge_freshness": 0-100,
    "coverage_assessment": "string"
  }
}`;
        userPrompt = `Genera insights: ${JSON.stringify({ context, params })}`;
        break;

      default:
        throw new Error(`Acción no soportada: ${action}`);
    }

    console.log(`[knowledge-graph] Processing: ${action}`);

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
        temperature: 0.5,
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
      console.error('[knowledge-graph] JSON parse error:', parseError);
      result = { rawContent: content, parseError: true };
    }

    console.log(`[knowledge-graph] Success: ${action}`);

    return new Response(JSON.stringify({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[knowledge-graph] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
