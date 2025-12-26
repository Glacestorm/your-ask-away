import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

// === INTERFACES ===
export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  document_type: 'article' | 'faq' | 'procedure' | 'troubleshooting' | 'template' | 'script';
  category: string;
  subcategory: string | null;
  tags: string[];
  embedding_status: 'pending' | 'processing' | 'completed' | 'failed';
  embedding_vector: number[] | null;
  source_url: string | null;
  author_id: string | null;
  is_published: boolean;
  is_archived: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  last_reviewed_at: string | null;
  reviewed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSearchResult {
  document: KnowledgeDocument;
  relevanceScore: number;
  matchedTerms: string[];
  snippet: string;
}

export interface DocumentInput {
  title: string;
  content: string;
  documentType: KnowledgeDocument['document_type'];
  category: string;
  subcategory?: string;
  tags?: string[];
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  category?: string;
  documentType?: KnowledgeDocument['document_type'];
  tags?: string[];
  limit?: number;
  useSemantic?: boolean;
}

// Helper to safely cast DB results
const castToDocument = (data: unknown): KnowledgeDocument => {
  const d = data as Record<string, unknown>;
  return {
    id: String(d.id || ''),
    title: String(d.title || ''),
    content: String(d.content || ''),
    document_type: (d.document_type || 'article') as KnowledgeDocument['document_type'],
    category: String(d.category || ''),
    subcategory: d.subcategory ? String(d.subcategory) : null,
    tags: Array.isArray(d.tags) ? d.tags as string[] : [],
    embedding_status: (d.embedding_status || 'pending') as KnowledgeDocument['embedding_status'],
    embedding_vector: Array.isArray(d.embedding_vector) ? d.embedding_vector as number[] : null,
    source_url: d.source_url ? String(d.source_url) : null,
    author_id: d.author_id ? String(d.author_id) : null,
    is_published: Boolean(d.is_published),
    is_archived: Boolean(d.is_archived),
    view_count: Number(d.view_count || 0),
    helpful_count: Number(d.helpful_count || 0),
    not_helpful_count: Number(d.not_helpful_count || 0),
    last_reviewed_at: d.last_reviewed_at ? String(d.last_reviewed_at) : null,
    reviewed_by: d.reviewed_by ? String(d.reviewed_by) : null,
    metadata: d.metadata as Record<string, unknown> | null,
    created_at: String(d.created_at || ''),
    updated_at: String(d.updated_at || '')
  };
};

// Generic query helper for tables not yet in types
const queryTable = (tableName: string) => {
  return (supabase as unknown as {
    from: (table: string) => ReturnType<typeof supabase.from>;
  }).from(tableName);
};

// === HOOK ===
export function useKnowledgeBase() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === FETCH DOCUMENTS ===
  const fetchDocuments = useCallback(async (options?: {
    category?: string;
    documentType?: KnowledgeDocument['document_type'];
    limit?: number;
    includeArchived?: boolean;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = queryTable('support_knowledge_documents')
        .select('*')
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

      if (!options?.includeArchived) {
        query = query.eq('is_archived', false);
      }
      if (options?.category) {
        query = query.eq('category', options.category);
      }
      if (options?.documentType) {
        query = query.eq('document_type', options.documentType);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const docs = (data || []).map(castToDocument);
      setDocuments(docs);
      return docs;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error cargando documentos';
      setError(message);
      console.error('[useKnowledgeBase] fetchDocuments error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === FETCH CATEGORIES ===
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await queryTable('support_knowledge_documents')
        .select('category')
        .eq('is_published', true)
        .eq('is_archived', false);

      if (fetchError) throw fetchError;

      const uniqueCategories = Array.from(new Set((data || []).map(d => String((d as Record<string, unknown>).category || '')))).filter(Boolean) as string[];
      setCategories(uniqueCategories);
      return uniqueCategories;
    } catch (err) {
      console.error('[useKnowledgeBase] fetchCategories error:', err);
      return [];
    }
  }, []);

  // === CREATE DOCUMENT ===
  const createDocument = useCallback(async (input: DocumentInput): Promise<KnowledgeDocument | null> => {
    try {
      const { data, error: insertError } = await queryTable('support_knowledge_documents')
        .insert([{
          title: input.title,
          content: input.content,
          document_type: input.documentType,
          category: input.category,
          subcategory: input.subcategory || null,
          tags: input.tags || [],
          source_url: input.sourceUrl || null,
          author_id: user?.id || null,
          metadata: input.metadata || null,
          embedding_status: 'pending'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Documento creado');
      await fetchDocuments();
      
      // Trigger embedding generation via edge function
      supabase.functions.invoke('generate-knowledge-embedding', {
        body: { documentId: (data as Record<string, unknown>).id }
      }).catch(console.error);

      return castToDocument(data);
    } catch (err) {
      console.error('[useKnowledgeBase] createDocument error:', err);
      toast.error('Error creando documento');
      return null;
    }
  }, [user, fetchDocuments]);

  // === UPDATE DOCUMENT ===
  const updateDocument = useCallback(async (
    documentId: string, 
    updates: Partial<DocumentInput>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.content) {
        updateData.content = updates.content;
        updateData.embedding_status = 'pending';
      }
      if (updates.documentType) updateData.document_type = updates.documentType;
      if (updates.category) updateData.category = updates.category;
      if (updates.subcategory !== undefined) updateData.subcategory = updates.subcategory;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.sourceUrl !== undefined) updateData.source_url = updates.sourceUrl;
      if (updates.metadata) updateData.metadata = updates.metadata;

      const { error: updateError } = await queryTable('support_knowledge_documents')
        .update(updateData)
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast.success('Documento actualizado');
      await fetchDocuments();

      if (updates.content) {
        supabase.functions.invoke('generate-knowledge-embedding', {
          body: { documentId }
        }).catch(console.error);
      }

      return true;
    } catch (err) {
      console.error('[useKnowledgeBase] updateDocument error:', err);
      toast.error('Error actualizando documento');
      return false;
    }
  }, [fetchDocuments]);

  // === ARCHIVE DOCUMENT ===
  const archiveDocument = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await queryTable('support_knowledge_documents')
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast.success('Documento archivado');
      setDocuments(prev => prev.filter(d => d.id !== documentId));
      return true;
    } catch (err) {
      console.error('[useKnowledgeBase] archiveDocument error:', err);
      toast.error('Error archivando documento');
      return false;
    }
  }, []);

  // === SEARCH DOCUMENTS ===
  const searchDocuments = useCallback(async (options: SearchOptions): Promise<DocumentSearchResult[]> => {
    setIsSearching(true);
    try {
      if (options.useSemantic) {
        const { data, error: fnError } = await supabase.functions.invoke('search-knowledge-base', {
          body: {
            query: options.query,
            category: options.category,
            documentType: options.documentType,
            tags: options.tags,
            limit: options.limit || 10
          }
        });

        if (fnError) throw fnError;

        const results = (data?.results || []) as DocumentSearchResult[];
        setSearchResults(results);
        return results;
      } else {
        let query = queryTable('support_knowledge_documents')
          .select('*')
          .eq('is_published', true)
          .eq('is_archived', false)
          .or(`title.ilike.%${options.query}%,content.ilike.%${options.query}%`)
          .limit(options.limit || 10);

        if (options.category) {
          query = query.eq('category', options.category);
        }
        if (options.documentType) {
          query = query.eq('document_type', options.documentType);
        }

        const { data, error: searchError } = await query;

        if (searchError) throw searchError;

        const results = (data || []).map(doc => {
          const d = castToDocument(doc);
          return {
            document: d,
            relevanceScore: 1,
            matchedTerms: [options.query],
            snippet: d.content.substring(0, 200) + '...'
          };
        });

        setSearchResults(results);
        return results;
      }
    } catch (err) {
      console.error('[useKnowledgeBase] searchDocuments error:', err);
      toast.error('Error en la búsqueda');
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);

  // === RECORD DOCUMENT FEEDBACK ===
  const recordDocumentFeedback = useCallback(async (
    documentId: string, 
    helpful: boolean
  ): Promise<boolean> => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return false;

      const { error: updateError } = await queryTable('support_knowledge_documents')
        .update({
          helpful_count: helpful ? doc.helpful_count + 1 : doc.helpful_count,
          not_helpful_count: !helpful ? doc.not_helpful_count + 1 : doc.not_helpful_count
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      setDocuments(prev => prev.map(d => 
        d.id === documentId 
          ? {
              ...d,
              helpful_count: helpful ? d.helpful_count + 1 : d.helpful_count,
              not_helpful_count: !helpful ? d.not_helpful_count + 1 : d.not_helpful_count
            }
          : d
      ));

      toast.success('Gracias por tu feedback');
      return true;
    } catch (err) {
      console.error('[useKnowledgeBase] recordDocumentFeedback error:', err);
      return false;
    }
  }, [documents]);

  // === INCREMENT VIEW COUNT ===
  const incrementViewCount = useCallback(async (documentId: string): Promise<void> => {
    try {
      const doc = documents.find(d => d.id === documentId);
      if (!doc) return;

      await queryTable('support_knowledge_documents')
        .update({ view_count: doc.view_count + 1 })
        .eq('id', documentId);

      setDocuments(prev => prev.map(d => 
        d.id === documentId ? { ...d, view_count: d.view_count + 1 } : d
      ));
    } catch (err) {
      console.error('[useKnowledgeBase] incrementViewCount error:', err);
    }
  }, [documents]);

  // === GET DOCUMENT STATS ===
  const getDocumentStats = useCallback(() => {
    const totalDocs = documents.length;
    const byType = documents.reduce((acc, doc) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byCategory = documents.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const pendingEmbeddings = documents.filter(d => d.embedding_status === 'pending').length;
    const totalViews = documents.reduce((sum, d) => sum + d.view_count, 0);
    const helpfulRatio = documents.reduce((sum, d) => sum + d.helpful_count, 0) / 
                         Math.max(1, documents.reduce((sum, d) => sum + d.helpful_count + d.not_helpful_count, 0));

    return {
      totalDocs,
      byType,
      byCategory,
      pendingEmbeddings,
      totalViews,
      helpfulRatio
    };
  }, [documents]);

  // === INITIAL FETCH ===
  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [fetchDocuments, fetchCategories]);

  return {
    // State
    documents,
    searchResults,
    categories,
    isLoading,
    isSearching,
    error,
    // Actions
    fetchDocuments,
    fetchCategories,
    createDocument,
    updateDocument,
    archiveDocument,
    searchDocuments,
    recordDocumentFeedback,
    incrementViewCount,
    // Helpers
    getDocumentStats
  };
}

export default useKnowledgeBase;
