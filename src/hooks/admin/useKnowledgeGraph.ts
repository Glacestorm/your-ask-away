import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === GRAPH STRUCTURE ===
export interface GraphNode {
  id: string;
  type: 'entity' | 'concept' | 'event' | 'document' | 'metric';
  label: string;
  properties: Record<string, unknown>;
  embedding_id: string | null;
  confidence: number;
  sources: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, unknown>;
  bidirectional: boolean;
  temporal: { start: string | null; end: string | null };
}

export interface GraphCluster {
  id: string;
  name: string;
  nodes: string[];
  coherence_score: number;
}

export interface KnowledgeGraphResult {
  graph: {
    id: string;
    name: string;
    version: string;
    created_at: string;
    statistics: {
      total_nodes: number;
      total_edges: number;
      node_types: Record<string, number>;
      edge_types: Record<string, number>;
      density: number;
      avg_degree: number;
    };
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: GraphCluster[];
  quality_metrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
    freshness: number;
  };
}

// === QUERY RESULTS ===
export interface QueryResult {
  node: {
    id: string;
    type: string;
    label: string;
    properties: Record<string, unknown>;
  };
  relevance_score: number;
  path_from_query: string[];
  context: string;
}

export interface GraphPath {
  start: string;
  end: string;
  nodes: string[];
  edges: string[];
  total_weight: number;
  semantic_similarity: number;
}

export interface GraphQueryResult {
  query: {
    original: string;
    interpreted: string;
    type: 'traversal' | 'pathfinding' | 'aggregation' | 'pattern' | 'temporal';
  };
  results: QueryResult[];
  paths: GraphPath[];
  aggregations: {
    count: number;
    distributions: Record<string, number>;
    statistics: Record<string, number>;
  };
  patterns_found: Array<{
    pattern_type: string;
    instances: number;
    example_nodes: string[];
  }>;
  suggestions: Array<{ query: string; reason: string }>;
}

// === ENTITY EXTRACTION ===
export interface ExtractedEntity {
  id: string;
  text: string;
  type: 'person' | 'organization' | 'location' | 'product' | 'event' | 'concept' | 'metric' | 'date' | 'money';
  subtype: string | null;
  confidence: number;
  positions: Array<{ start: number; end: number }>;
  normalized_value: string;
  linked_entity: {
    kb_id: string | null;
    kb_name: string | null;
    match_score: number;
  };
  attributes: Record<string, unknown>;
  coreferences: string[];
}

export interface EntityExtractionResult {
  entities: ExtractedEntity[];
  relations_extracted: Array<{
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
    evidence: string;
  }>;
  temporal_expressions: Array<{
    text: string;
    normalized: string;
    type: 'date' | 'time' | 'duration' | 'range';
  }>;
  statistics: {
    total_entities: number;
    by_type: Record<string, number>;
    avg_confidence: number;
    linked_percentage: number;
  };
}

// === RELATIONSHIP DISCOVERY ===
export interface DiscoveredRelationship {
  id: string;
  source_entity: { id: string; label: string; type: string };
  target_entity: { id: string; label: string; type: string };
  relationship_type: string;
  strength: number;
  confidence: number;
  discovery_method: 'co-occurrence' | 'inference' | 'pattern' | 'causal' | 'temporal';
  evidence: Array<{ type: string; description: string; source: string }>;
  is_new: boolean;
  temporal_validity: { start: string | null; end: string | null };
}

export interface RelationshipDiscoveryResult {
  discovered_relationships: DiscoveredRelationship[];
  predicted_links: Array<{
    source: string;
    target: string;
    predicted_type: string;
    probability: number;
    reasoning: string;
  }>;
  relationship_patterns: Array<{
    pattern_name: string;
    frequency: number;
    entities_involved: number;
    example: { source: string; relation: string; target: string };
  }>;
  causal_chains: Array<{
    chain_id: string;
    steps: Array<{ cause: string; effect: string; confidence: number }>;
    overall_confidence: number;
  }>;
  network_metrics: {
    clustering_coefficient: number;
    avg_path_length: number;
    hub_entities: string[];
    bridge_entities: string[];
  };
}

// === SEMANTIC SEARCH ===
export interface SemanticSearchResult {
  id: string;
  type: 'entity' | 'document' | 'concept' | 'relationship';
  title: string;
  description: string;
  semantic_score: number;
  keyword_score: number;
  combined_score: number;
  highlights: Array<{ field: string; snippet: string; matches: string[] }>;
  related_entities: string[];
  graph_context: { neighbors: number; paths_to_query: number };
}

export interface SemanticSearchResponse {
  query_analysis: {
    original: string;
    expanded: string[];
    intent: string;
    entities_detected: string[];
    filters_applied: Record<string, unknown>;
  };
  results: SemanticSearchResult[];
  facets: Array<{ field: string; values: Array<{ value: string; count: number }> }>;
  related_queries: string[];
  knowledge_cards: Array<{
    entity_id: string;
    type: string;
    summary: string;
    key_facts: string[];
    relationships_preview: number;
  }>;
  search_metadata: {
    total_results: number;
    search_time_ms: number;
    index_coverage: number;
  };
}

// === REASONING CHAIN ===
export interface ReasoningStep {
  step: number;
  premise: string;
  inference: string;
  confidence: number;
  supporting_facts: Array<{ fact: string; source: string; reliability: number }>;
  graph_path: string[];
}

export interface ReasoningChainResult {
  question: string;
  reasoning_type: 'deductive' | 'inductive' | 'abductive' | 'analogical';
  reasoning_chain: ReasoningStep[];
  conclusion: {
    statement: string;
    confidence: number;
    certainty: 'certain' | 'probable' | 'possible' | 'uncertain';
    caveats: string[];
  };
  alternative_conclusions: Array<{
    statement: string;
    confidence: number;
    reasoning_difference: string;
  }>;
  knowledge_gaps: Array<{
    missing_info: string;
    impact_on_conclusion: 'high' | 'medium' | 'low';
    suggested_sources: string[];
  }>;
  consistency_check: {
    is_consistent: boolean;
    conflicts_found: Array<{
      statement1: string;
      statement2: string;
      conflict_type: string;
    }>;
  };
}

// === KNOWLEDGE FUSION ===
export interface MergedEntity {
  canonical_id: string;
  merged_from: string[];
  label: string;
  type: string;
  properties_merged: Record<string, { value: unknown; source: string; confidence: number }>;
  merge_confidence: number;
}

export interface KnowledgeFusionResult {
  fusion_task: {
    id: string;
    sources: string[];
    status: 'completed' | 'partial' | 'failed';
    started_at: string;
    completed_at: string;
  };
  merged_entities: MergedEntity[];
  conflicts_resolved: Array<{
    entity_id: string;
    attribute: string;
    conflicting_values: Array<{ value: unknown; source: string }>;
    resolution: { chosen_value: unknown; method: string; confidence: number };
  }>;
  new_knowledge: Array<{
    type: 'entity' | 'relationship' | 'attribute';
    description: string;
    source_combination: string[];
  }>;
  quality_improvements: {
    completeness_gain: number;
    accuracy_gain: number;
    coverage_gain: number;
  };
  statistics: {
    entities_processed: number;
    entities_merged: number;
    conflicts_found: number;
    conflicts_resolved: number;
    new_relationships: number;
  };
}

// === ONTOLOGY MAPPING ===
export interface ConceptMapping {
  source_concept: { id: string; label: string; definition: string };
  target_concept: { id: string; label: string; definition: string };
  mapping_type: 'exact' | 'close' | 'related' | 'broader' | 'narrower';
  confidence: number;
  evidence: string;
  transformation_needed: boolean;
  transformation_rule: string | null;
}

export interface OntologyMappingResult {
  mapping_task: {
    source_ontology: { name: string; version: string; concepts: number };
    target_ontology: { name: string; version: string; concepts: number };
    mapping_type: 'equivalence' | 'subsumption' | 'overlap' | 'custom';
  };
  concept_mappings: ConceptMapping[];
  property_mappings: Array<{
    source_property: string;
    target_property: string;
    mapping_type: string;
    value_transformation: string | null;
  }>;
  unmapped_concepts: {
    source: Array<{ id: string; label: string; suggestion: string }>;
    target: Array<{ id: string; label: string }>;
  };
  consistency_issues: Array<{
    type: 'cycle' | 'contradiction' | 'missing_parent';
    affected_concepts: string[];
    suggestion: string;
  }>;
  mapping_statistics: {
    total_mappings: number;
    exact_matches: number;
    fuzzy_matches: number;
    avg_confidence: number;
    coverage_source: number;
    coverage_target: number;
  };
}

// === CONTEXT ENRICHMENT ===
export interface EnrichedEntity {
  original_entity: { id: string; label: string; type: string };
  enrichments: Array<{
    attribute: string;
    value: unknown;
    source: string;
    confidence: number;
    freshness: 'current' | 'recent' | 'historical';
  }>;
  related_context: Array<{
    type: 'event' | 'trend' | 'news' | 'metric';
    description: string;
    relevance: number;
    temporal_proximity: string;
  }>;
  knowledge_graph_position: {
    centrality: number;
    cluster: string;
    key_connections: number;
  };
}

export interface ContextEnrichmentResult {
  enriched_entities: EnrichedEntity[];
  temporal_context: {
    current_events: Array<{ event: string; relevance: number; impact: string }>;
    trends: Array<{ trend: string; direction: string; significance: number }>;
    historical_context: Array<{ period: string; key_facts: string[] }>;
  };
  personalized_context: {
    user_relevance: Array<{ entity_id: string; relevance_reason: string; priority: number }>;
    recommended_focus: string[];
  };
  enrichment_quality: {
    completeness: number;
    freshness: number;
    relevance: number;
  };
}

// === INSIGHT GENERATION ===
export interface GeneratedInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'opportunity' | 'risk' | 'correlation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  novelty: number;
  supporting_evidence: Array<{ fact: string; source: string; graph_path: string[] }>;
  affected_entities: string[];
  actionability: {
    can_act: boolean;
    suggested_actions: string[];
    urgency: 'immediate' | 'short_term' | 'long_term';
  };
  visualization_hint: 'graph' | 'timeline' | 'comparison' | 'distribution';
}

export interface InsightGenerationResult {
  insights: GeneratedInsight[];
  hypotheses: Array<{
    hypothesis: string;
    basis: string;
    testability: number;
    potential_value: 'high' | 'medium' | 'low';
    required_data: string[];
  }>;
  knowledge_gaps: Array<{
    gap: string;
    importance: number;
    filling_suggestions: string[];
  }>;
  synthesis: {
    executive_summary: string;
    key_findings: string[];
    recommendations: string[];
    confidence_overall: number;
  };
  meta_insights: {
    graph_health: number;
    knowledge_freshness: number;
    coverage_assessment: string;
  };
}

// === CONTEXT ===
export interface KnowledgeGraphContext {
  graphId?: string;
  domain?: string;
  sources?: string[];
  timeRange?: { start: string; end: string };
  entities?: string[];
  depth?: number;
}

// === HOOK ===
export function useKnowledgeGraph() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Results cache
  const [graphData, setGraphData] = useState<KnowledgeGraphResult | null>(null);
  const [queryResults, setQueryResults] = useState<GraphQueryResult | null>(null);
  const [extractedEntities, setExtractedEntities] = useState<EntityExtractionResult | null>(null);
  const [discoveredRelations, setDiscoveredRelations] = useState<RelationshipDiscoveryResult | null>(null);
  const [searchResults, setSearchResults] = useState<SemanticSearchResponse | null>(null);
  const [reasoningResult, setReasoningResult] = useState<ReasoningChainResult | null>(null);
  const [fusionResult, setFusionResult] = useState<KnowledgeFusionResult | null>(null);
  const [ontologyMapping, setOntologyMapping] = useState<OntologyMappingResult | null>(null);
  const [enrichedContext, setEnrichedContext] = useState<ContextEnrichmentResult | null>(null);
  const [insights, setInsights] = useState<InsightGenerationResult | null>(null);

  // Auto-refresh
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === GENERIC INVOKE ===
  const invokeGraphAction = useCallback(async <T>(
    action: string,
    context?: KnowledgeGraphContext,
    params?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('knowledge-graph', {
        body: { action, context, params }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLastRefresh(new Date());
        return data.data as T;
      }

      throw new Error(data?.error || 'Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error(`[useKnowledgeGraph] ${action} error:`, err);
      toast.error(`Error en ${action}: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === BUILD GRAPH ===
  const buildGraph = useCallback(async (
    context?: KnowledgeGraphContext,
    params?: { sources?: string[]; includeEmbeddings?: boolean }
  ) => {
    const result = await invokeGraphAction<KnowledgeGraphResult>('build_graph', context, params);
    if (result) {
      setGraphData(result);
      toast.success(`Grafo construido: ${result.graph.statistics.total_nodes} nodos, ${result.graph.statistics.total_edges} aristas`);
    }
    return result;
  }, [invokeGraphAction]);

  // === QUERY GRAPH ===
  const queryGraph = useCallback(async (
    query: string,
    context?: KnowledgeGraphContext,
    params?: { type?: string; limit?: number }
  ) => {
    const result = await invokeGraphAction<GraphQueryResult>('query_graph', context, { ...params, query });
    if (result) {
      setQueryResults(result);
    }
    return result;
  }, [invokeGraphAction]);

  // === ENTITY EXTRACTION ===
  const extractEntities = useCallback(async (
    text: string,
    context?: KnowledgeGraphContext,
    params?: { types?: string[]; linkToKB?: boolean }
  ) => {
    const result = await invokeGraphAction<EntityExtractionResult>('entity_extraction', context, { ...params, text });
    if (result) {
      setExtractedEntities(result);
      toast.success(`${result.statistics.total_entities} entidades extraídas`);
    }
    return result;
  }, [invokeGraphAction]);

  // === RELATIONSHIP DISCOVERY ===
  const discoverRelationships = useCallback(async (
    context?: KnowledgeGraphContext,
    params?: { entities?: string[]; methods?: string[] }
  ) => {
    const result = await invokeGraphAction<RelationshipDiscoveryResult>('relationship_discovery', context, params);
    if (result) {
      setDiscoveredRelations(result);
      toast.success(`${result.discovered_relationships.length} relaciones descubiertas`);
    }
    return result;
  }, [invokeGraphAction]);

  // === SEMANTIC SEARCH ===
  const semanticSearch = useCallback(async (
    query: string,
    context?: KnowledgeGraphContext,
    params?: { filters?: Record<string, unknown>; limit?: number }
  ) => {
    const result = await invokeGraphAction<SemanticSearchResponse>('semantic_search', context, { ...params, query });
    if (result) {
      setSearchResults(result);
    }
    return result;
  }, [invokeGraphAction]);

  // === REASONING CHAIN ===
  const executeReasoning = useCallback(async (
    question: string,
    context?: KnowledgeGraphContext,
    params?: { reasoningType?: string; maxHops?: number }
  ) => {
    const result = await invokeGraphAction<ReasoningChainResult>('reasoning_chain', context, { ...params, question });
    if (result) {
      setReasoningResult(result);
      toast.info(`Razonamiento ${result.reasoning_type}: ${result.conclusion.certainty}`);
    }
    return result;
  }, [invokeGraphAction]);

  // === KNOWLEDGE FUSION ===
  const fuseKnowledge = useCallback(async (
    sources: string[],
    context?: KnowledgeGraphContext,
    params?: { resolveConflicts?: boolean }
  ) => {
    const result = await invokeGraphAction<KnowledgeFusionResult>('knowledge_fusion', context, { ...params, sources });
    if (result) {
      setFusionResult(result);
      toast.success(`Fusión completada: ${result.statistics.entities_merged} entidades fusionadas`);
    }
    return result;
  }, [invokeGraphAction]);

  // === ONTOLOGY MAPPING ===
  const mapOntologies = useCallback(async (
    sourceOntology: string,
    targetOntology: string,
    context?: KnowledgeGraphContext
  ) => {
    const result = await invokeGraphAction<OntologyMappingResult>('ontology_mapping', context, { sourceOntology, targetOntology });
    if (result) {
      setOntologyMapping(result);
      toast.success(`Mapeo: ${result.mapping_statistics.total_mappings} conceptos mapeados`);
    }
    return result;
  }, [invokeGraphAction]);

  // === CONTEXT ENRICHMENT ===
  const enrichContext = useCallback(async (
    entityIds: string[],
    context?: KnowledgeGraphContext,
    params?: { includeTemporal?: boolean; personalize?: boolean }
  ) => {
    const result = await invokeGraphAction<ContextEnrichmentResult>('context_enrichment', context, { ...params, entityIds });
    if (result) {
      setEnrichedContext(result);
    }
    return result;
  }, [invokeGraphAction]);

  // === INSIGHT GENERATION ===
  const generateInsights = useCallback(async (
    context?: KnowledgeGraphContext,
    params?: { types?: string[]; minConfidence?: number }
  ) => {
    const result = await invokeGraphAction<InsightGenerationResult>('insight_generation', context, params);
    if (result) {
      setInsights(result);
      const highImpact = result.insights.filter(i => i.impact === 'high').length;
      if (highImpact > 0) {
        toast.warning(`${highImpact} insights de alto impacto encontrados`);
      } else {
        toast.success(`${result.insights.length} insights generados`);
      }
    }
    return result;
  }, [invokeGraphAction]);

  // === FULL ANALYSIS ===
  const runFullAnalysis = useCallback(async (
    text: string,
    context?: KnowledgeGraphContext
  ) => {
    setIsLoading(true);
    toast.info('Iniciando análisis completo de conocimiento...');

    try {
      // Extract entities first
      const entities = await extractEntities(text, context);
      
      if (entities && entities.entities.length > 0) {
        // Then discover relationships
        await discoverRelationships(context, {
          entities: entities.entities.map(e => e.id)
        });

        // Generate insights
        await generateInsights(context);
      }

      toast.success('Análisis de conocimiento completo');
    } catch (err) {
      console.error('[useKnowledgeGraph] Full analysis error:', err);
      toast.error('Error en análisis completo');
    } finally {
      setIsLoading(false);
    }
  }, [extractEntities, discoverRelationships, generateInsights]);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: KnowledgeGraphContext, intervalMs = 120000) => {
    stopAutoRefresh();
    autoRefreshInterval.current = setInterval(() => {
      generateInsights(context);
    }, intervalMs);
  }, [generateInsights]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  // === CLEANUP ===
  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  // === RETURN ===
  return {
    // Estado
    isLoading,
    error,
    lastRefresh,

    // Resultados cacheados
    graphData,
    queryResults,
    extractedEntities,
    discoveredRelations,
    searchResults,
    reasoningResult,
    fusionResult,
    ontologyMapping,
    enrichedContext,
    insights,

    // Acciones
    buildGraph,
    queryGraph,
    extractEntities,
    discoverRelationships,
    semanticSearch,
    executeReasoning,
    fuseKnowledge,
    mapOntologies,
    enrichContext,
    generateInsights,
    runFullAnalysis,

    // Auto-refresh
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useKnowledgeGraph;
