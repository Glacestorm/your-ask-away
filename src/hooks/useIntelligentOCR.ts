import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === ERROR TIPADO KB ===
export interface IntelligentOCRError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface OCRResult {
  document_type: 'invoice' | 'contract' | 'id_document' | 'financial_statement' | 'receipt' | 'other';
  confidence: number;
  extracted_text: string;
  structured_data: Record<string, any>;
  entities: ExtractedEntity[];
  tables: ExtractedTable[];
  metadata: DocumentMetadata;
  validation_flags: ValidationFlag[];
}

export interface ExtractedEntity {
  type: 'company_name' | 'tax_id' | 'amount' | 'date' | 'address' | 'person' | 'account_number';
  value: string;
  confidence: number;
  position: { page: number; bbox: number[] };
  normalized_value?: string;
}

export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
  page: number;
}

export interface DocumentMetadata {
  pages: number;
  language: string;
  quality_score: number;
  processing_time_ms: number;
  detected_format: string;
}

export interface ValidationFlag {
  type: 'warning' | 'error' | 'info';
  message: string;
  field?: string;
}

export function useIntelligentOCR() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [progress, setProgress] = useState(0);
  // === ESTADO KB ===
  const [error, setError] = useState<IntelligentOCRError | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // === CLEAR ERROR KB ===
  const clearError = useCallback(() => setError(null), []);

  const processDocument = useCallback(async (
    fileUrl: string,
    options?: {
      extract_tables?: boolean;
      extract_entities?: boolean;
      expected_document_type?: OCRResult['document_type'];
      language?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(10);

    try {
      setProgress(30);
      
      const { data, error: fnError } = await supabase.functions.invoke('intelligent-ocr', {
        body: { 
          fileUrl,
          extract_tables: options?.extract_tables ?? true,
          extract_entities: options?.extract_entities ?? true,
          expected_document_type: options?.expected_document_type,
          language: options?.language || 'auto'
        }
      });

      setProgress(90);

      if (fnError) throw fnError;

      setResult(data);
      setProgress(100);
      setLastRefresh(new Date());
      setError(null);
      
      if (data.validation_flags?.some((f: ValidationFlag) => f.type === 'error')) {
        toast.warning('Document processat amb advertències');
      } else {
        toast.success(`Document processat: ${data.document_type}`);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error processant document';
      setError({
        code: 'PROCESS_DOCUMENT_ERROR',
        message,
        details: { originalError: String(err) }
      });
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const processMultipleDocuments = useCallback(async (
    fileUrls: string[],
    options?: Parameters<typeof processDocument>[1]
  ) => {
    const results: OCRResult[] = [];
    
    for (let i = 0; i < fileUrls.length; i++) {
      const result = await processDocument(fileUrls[i], options);
      if (result) results.push(result);
      setProgress(Math.round(((i + 1) / fileUrls.length) * 100));
    }

    toast.success(`${results.length}/${fileUrls.length} documents processats`);
    return results;
  }, [processDocument]);

  const getEntityIcon = useCallback((type: ExtractedEntity['type']): string => {
    const icons: Record<ExtractedEntity['type'], string> = {
      'company_name': '🏢',
      'tax_id': '🔢',
      'amount': '💰',
      'date': '📅',
      'address': '📍',
      'person': '👤',
      'account_number': '🏦'
    };
    return icons[type] || '📄';
  }, []);

  return {
    processDocument,
    processMultipleDocuments,
    result,
    isLoading,
    progress,
    getEntityIcon,
    // === KB ADDITIONS ===
    error,
    lastRefresh,
    clearError
  };
}

export default useIntelligentOCR;
