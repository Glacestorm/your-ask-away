import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ExtractedField {
  name: string;
  value: string;
  confidence: number;
  bounding_box?: { x: number; y: number; width: number; height: number };
}

export interface DocumentAnalysis {
  id: string;
  document_type: 'invoice' | 'contract' | 'id_document' | 'receipt' | 'form' | 'other';
  filename: string;
  extracted_fields: ExtractedField[];
  raw_text: string;
  summary: string;
  entities: Array<{ type: string; value: string; confidence: number }>;
  tables?: Array<{ headers: string[]; rows: string[][] }>;
  confidence_score: number;
  processing_time_ms: number;
  created_at: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  document_type: string;
  fields: Array<{ name: string; type: string; required: boolean }>;
  extraction_rules: Record<string, unknown>;
}

// === HOOK ===
export function useDocumentIntelligence() {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // === ANALYZE DOCUMENT ===
  const analyzeDocument = useCallback(async (
    file: File,
    templateId?: string
  ): Promise<DocumentAnalysis | null> => {
    setIsLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setProgress(30);

      const { data, error: fnError } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'analyze',
          file: {
            name: file.name,
            type: file.type,
            content: base64
          },
          templateId
        }
      });

      setProgress(80);

      if (fnError) throw fnError;

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        setProgress(100);
        toast.success('Documento analizado');
        return data.analysis;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error analyzing document';
      setError(message);
      console.error('[useDocumentIntelligence] analyzeDocument error:', err);
      toast.error('Error al analizar documento');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXTRACT FIELDS ===
  const extractFields = useCallback(async (
    documentId: string,
    fields: string[]
  ): Promise<ExtractedField[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('document-intelligence', {
        body: { action: 'extract_fields', documentId, fields }
      });

      if (fnError) throw fnError;

      return data?.fields || [];
    } catch (err) {
      console.error('[useDocumentIntelligence] extractFields error:', err);
      return [];
    }
  }, []);

  // === CLASSIFY DOCUMENT ===
  const classifyDocument = useCallback(async (
    file: File
  ): Promise<{ type: string; confidence: number } | null> => {
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error: fnError } = await supabase.functions.invoke('document-intelligence', {
        body: {
          action: 'classify',
          file: { name: file.name, type: file.type, content: base64 }
        }
      });

      if (fnError) throw fnError;

      return data?.classification || null;
    } catch (err) {
      console.error('[useDocumentIntelligence] classifyDocument error:', err);
      return null;
    }
  }, []);

  // === FETCH TEMPLATES ===
  const fetchTemplates = useCallback(async (): Promise<DocumentTemplate[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('document-intelligence', {
        body: { action: 'list_templates' }
      });

      if (fnError) throw fnError;

      if (data?.templates) {
        setTemplates(data.templates);
        return data.templates;
      }

      return [];
    } catch (err) {
      console.error('[useDocumentIntelligence] fetchTemplates error:', err);
      return [];
    }
  }, []);

  // === COMPARE DOCUMENTS ===
  const compareDocuments = useCallback(async (
    docId1: string,
    docId2: string
  ): Promise<{ differences: Array<{ field: string; doc1: string; doc2: string }> } | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('document-intelligence', {
        body: { action: 'compare', docId1, docId2 }
      });

      if (fnError) throw fnError;

      return data?.comparison || null;
    } catch (err) {
      console.error('[useDocumentIntelligence] compareDocuments error:', err);
      return null;
    }
  }, []);

  // === CLEAR ===
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setProgress(0);
    setError(null);
  }, []);

  return {
    analysis,
    templates,
    isLoading,
    progress,
    error,
    analyzeDocument,
    extractFields,
    classifyDocument,
    fetchTemplates,
    compareDocuments,
    clearAnalysis,
  };
}

export default useDocumentIntelligence;
