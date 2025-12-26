// GraphRAG Module - Knowledge Graph with RAG for Support
// Knowledge Graph dinámico, memoria contextual infinita, aprendizaje continuo

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface KnowledgeNode {
  id: string;
  type: 'problem' | 'solution' | 'symptom' | 'cause' | 'product' | 'feature' | 'customer' | 'agent' | 'document';
  label: string;
  properties: Record<string, unknown>;
  embeddings?: number[];
  createdAt: string;
  lastAccessed: string;
  accessCount: number;
  relevanceScore: number;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: 'causes' | 'solves' | 'relates_to' | 'similar_to' | 'part_of' | 'leads_to' | 'prevents' | 'requires';
  weight: number;
  confidence: number;
  learnedFrom: string[];
  createdAt: string;
}

export interface CustomerContext {
  customerId: string;
  sessionHistory: SessionMemory[];
  interactionPatterns: InteractionPattern[];
  preferredSolutions: string[];
  knownIssues: string[];
  lastInteraction: string;
  totalInteractions: number;
  satisfactionTrend: number;
}

export interface SessionMemory {
  sessionId: string;
  timestamp: string;
  problemDescription: string;
  resolution: string;
  resolutionPath: string[];
  effectiveness: number;
  learnings: string[];
}

export interface InteractionPattern {
  patternType: string;
  frequency: number;
  typicalDuration: number;
  commonTriggers: string[];
  preferredChannels: string[];
}

export interface LearningPattern {
  id: string;
  patternType: 'problem_solution' | 'escalation_trigger' | 'success_factor' | 'failure_indicator';
  description: string;
  sourceNodes: string[];
  confidence: number;
  validationCount: number;
  lastValidated: string;
  actionable: boolean;
  suggestedAction?: string;
}

export interface GraphQuery {
  query: string;
  nodeTypes?: string[];
  maxDepth?: number;
  minConfidence?: number;
  includeContext?: boolean;
}

export interface GraphQueryResult {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  contextualInsights: string[];
  suggestedPaths: string[][];
  relevantPatterns: LearningPattern[];
  confidence: number;
}

// === HOOK ===
export function useGraphRAG() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [edges, setEdges] = useState<KnowledgeEdge[]>([]);
  const [customerContext, setCustomerContext] = useState<CustomerContext | null>(null);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLearning, setIsLearning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphStats, setGraphStats] = useState<{
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    lastUpdated: string;
  } | null>(null);

  const contextCache = useRef<Map<string, CustomerContext>>(new Map());

  // === SEMANTIC SEARCH IN GRAPH ===
  const searchGraph = useCallback(async (query: GraphQuery): Promise<GraphQueryResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'search',
          query: query.query,
          nodeTypes: query.nodeTypes,
          maxDepth: query.maxDepth || 3,
          minConfidence: query.minConfidence || 0.5,
          includeContext: query.includeContext ?? true
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        return data.result as GraphQueryResult;
      }

      throw new Error(data?.error || 'Graph search failed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useGraphRAG] searchGraph error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET CUSTOMER INFINITE CONTEXT ===
  const getCustomerContext = useCallback(async (customerId: string): Promise<CustomerContext | null> => {
    // Check cache first
    if (contextCache.current.has(customerId)) {
      const cached = contextCache.current.get(customerId)!;
      setCustomerContext(cached);
      return cached;
    }

    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'get_customer_context',
          customerId
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.context) {
        const context = data.context as CustomerContext;
        contextCache.current.set(customerId, context);
        setCustomerContext(context);
        return context;
      }

      return null;
    } catch (err) {
      console.error('[useGraphRAG] getCustomerContext error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === ADD PROBLEM-SOLUTION PATTERN ===
  const learnFromResolution = useCallback(async (
    problemDescription: string,
    solution: string,
    resolutionSteps: string[],
    effectiveness: number,
    sessionId: string
  ) => {
    setIsLearning(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'learn_pattern',
          problemDescription,
          solution,
          resolutionSteps,
          effectiveness,
          sessionId
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Patrón aprendido', {
          description: 'El grafo de conocimiento ha sido actualizado'
        });
        
        // Refresh patterns
        fetchLearningPatterns();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useGraphRAG] learnFromResolution error:', err);
      return false;
    } finally {
      setIsLearning(false);
    }
  }, []);

  // === FIND SIMILAR PROBLEMS ===
  const findSimilarProblems = useCallback(async (
    problemDescription: string,
    limit = 5
  ): Promise<{ problem: string; solution: string; confidence: number }[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'find_similar',
          problemDescription,
          limit
        }
      });

      if (fnError) throw fnError;

      return data?.similar || [];
    } catch (err) {
      console.error('[useGraphRAG] findSimilarProblems error:', err);
      return [];
    }
  }, []);

  // === GET RESOLUTION PATH ===
  const getResolutionPath = useCallback(async (
    problemNodeId: string,
    targetOutcome?: string
  ): Promise<{ path: KnowledgeNode[]; steps: string[]; confidence: number } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'get_resolution_path',
          problemNodeId,
          targetOutcome
        }
      });

      if (fnError) throw fnError;

      return data?.path || null;
    } catch (err) {
      console.error('[useGraphRAG] getResolutionPath error:', err);
      return null;
    }
  }, []);

  // === ADD NODE TO GRAPH ===
  const addNode = useCallback(async (node: Omit<KnowledgeNode, 'id' | 'createdAt' | 'lastAccessed' | 'accessCount' | 'relevanceScore'>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'add_node',
          node
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.node) {
        setNodes(prev => [...prev, data.node]);
        return data.node as KnowledgeNode;
      }

      return null;
    } catch (err) {
      console.error('[useGraphRAG] addNode error:', err);
      return null;
    }
  }, []);

  // === CREATE EDGE ===
  const createEdge = useCallback(async (edge: Omit<KnowledgeEdge, 'id' | 'createdAt'>) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'add_edge',
          edge
        }
      });

      if (fnError) throw fnError;

      if (data?.success && data?.edge) {
        setEdges(prev => [...prev, data.edge]);
        return data.edge as KnowledgeEdge;
      }

      return null;
    } catch (err) {
      console.error('[useGraphRAG] createEdge error:', err);
      return null;
    }
  }, []);

  // === FETCH LEARNING PATTERNS ===
  const fetchLearningPatterns = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: { action: 'get_patterns' }
      });

      if (fnError) throw fnError;

      setLearningPatterns(data?.patterns || []);
      return data?.patterns || [];
    } catch (err) {
      console.error('[useGraphRAG] fetchLearningPatterns error:', err);
      return [];
    }
  }, []);

  // === GET GRAPH STATISTICS ===
  const fetchGraphStats = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: { action: 'get_stats' }
      });

      if (fnError) throw fnError;

      if (data?.stats) {
        setGraphStats(data.stats);
        return data.stats;
      }

      return null;
    } catch (err) {
      console.error('[useGraphRAG] fetchGraphStats error:', err);
      return null;
    }
  }, []);

  // === VALIDATE PATTERN ===
  const validatePattern = useCallback(async (patternId: string, isValid: boolean) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('graph-rag-support', {
        body: {
          action: 'validate_pattern',
          patternId,
          isValid
        }
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setLearningPatterns(prev => prev.map(p => 
          p.id === patternId 
            ? { ...p, validationCount: p.validationCount + 1, lastValidated: new Date().toISOString() }
            : p
        ));
        toast.success(isValid ? 'Patrón validado' : 'Patrón marcado como inválido');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useGraphRAG] validatePattern error:', err);
      return false;
    }
  }, []);

  // === INITIAL LOAD ===
  useEffect(() => {
    fetchGraphStats();
    fetchLearningPatterns();
  }, [fetchGraphStats, fetchLearningPatterns]);

  return {
    // State
    nodes,
    edges,
    customerContext,
    learningPatterns,
    isLoading,
    isLearning,
    error,
    graphStats,
    // Actions
    searchGraph,
    getCustomerContext,
    learnFromResolution,
    findSimilarProblems,
    getResolutionPath,
    addNode,
    createEdge,
    fetchLearningPatterns,
    fetchGraphStats,
    validatePattern,
  };
}

export default useGraphRAG;
