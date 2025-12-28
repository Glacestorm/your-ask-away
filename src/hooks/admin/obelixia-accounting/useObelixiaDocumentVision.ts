import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface ExtractedInvoiceData {
  type: 'invoice';
  supplier_name: string;
  supplier_nif: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
  payment_method?: string;
  bank_account?: string;
}

export interface ExtractedReceiptData {
  type: 'receipt';
  merchant_name: string;
  merchant_nif?: string;
  date: string;
  time?: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  tax_amount?: number;
  total: number;
  payment_method?: string;
}

export interface ExtractedBankStatement {
  type: 'bank_statement';
  bank_name: string;
  account_number: string;
  period_start: string;
  period_end: string;
  opening_balance: number;
  closing_balance: number;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    balance: number;
    type: 'credit' | 'debit';
  }>;
}

export type DocumentAnalysisResult = ExtractedInvoiceData | ExtractedReceiptData | ExtractedBankStatement;

export interface DocumentUpload {
  id: string;
  file: File;
  preview_url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: DocumentAnalysisResult;
  error?: string;
  created_at: Date;
  confidence?: number;
}

export interface SuggestedEntry {
  date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  tax_amount?: number;
}

// === HOOK ===
export function useObelixiaDocumentVision() {
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUpload, setCurrentUpload] = useState<DocumentUpload | null>(null);
  const [suggestedEntry, setSuggestedEntry] = useState<SuggestedEntry | null>(null);

  // === FILE TO BASE64 ===
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // === UPLOAD DOCUMENT ===
  const uploadDocument = useCallback(async (file: File): Promise<DocumentUpload> => {
    const upload: DocumentUpload = {
      id: crypto.randomUUID(),
      file,
      preview_url: URL.createObjectURL(file),
      status: 'pending',
      created_at: new Date()
    };

    setUploads(prev => [...prev, upload]);
    setCurrentUpload(upload);
    return upload;
  }, []);

  // === ANALYZE DOCUMENT ===
  const analyzeDocument = useCallback(async (uploadId: string): Promise<DocumentAnalysisResult | null> => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload) {
      toast.error('Documento no encontrado');
      return null;
    }

    setIsProcessing(true);
    setUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, status: 'processing' as const } : u
    ));

    try {
      const base64Image = await fileToBase64(upload.file);
      const mimeType = upload.file.type;

      const { data, error } = await supabase.functions.invoke('obelixia-document-vision', {
        body: {
          action: 'analyze_document',
          image_base64: base64Image,
          mime_type: mimeType
        }
      });

      if (error) throw error;

      if (data?.success && data?.extracted_data) {
        const result = data.extracted_data as DocumentAnalysisResult;
        
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { 
            ...u, 
            status: 'completed' as const, 
            result,
            confidence: data.confidence || 0.95
          } : u
        ));

        if (data.suggested_entry) {
          setSuggestedEntry(data.suggested_entry);
        }

        toast.success(`Documento analizado: ${result.type}`);
        return result;
      }

      throw new Error('No se pudo extraer información del documento');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al analizar documento';
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'error' as const, error: message } : u
      ));
      
      toast.error(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [uploads, fileToBase64]);

  // === VALIDATE EXTRACTED DATA ===
  const validateExtractedData = useCallback(async (uploadId: string): Promise<boolean> => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload?.result) return false;

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-document-vision', {
        body: {
          action: 'validate_extraction',
          extracted_data: upload.result
        }
      });

      if (error) throw error;

      if (data?.valid) {
        toast.success('Datos validados correctamente');
        return true;
      } else {
        toast.warning(`Advertencias: ${data?.warnings?.join(', ')}`);
        return false;
      }
    } catch (err) {
      toast.error('Error al validar datos');
      return false;
    }
  }, [uploads]);

  // === CREATE JOURNAL ENTRY FROM DOCUMENT ===
  const createEntryFromDocument = useCallback(async (uploadId: string): Promise<boolean> => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload?.result) {
      toast.error('No hay datos extraídos');
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('obelixia-document-vision', {
        body: {
          action: 'generate_entry',
          extracted_data: upload.result
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Asiento contable creado');
        return true;
      }

      throw new Error('No se pudo crear el asiento');
    } catch (err) {
      toast.error('Error al crear asiento contable');
      return false;
    }
  }, [uploads]);

  // === REMOVE UPLOAD ===
  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === uploadId);
      if (upload?.preview_url) {
        URL.revokeObjectURL(upload.preview_url);
      }
      return prev.filter(u => u.id !== uploadId);
    });
    
    if (currentUpload?.id === uploadId) {
      setCurrentUpload(null);
    }
  }, [currentUpload]);

  // === CLEAR ALL ===
  const clearAll = useCallback(() => {
    uploads.forEach(u => {
      if (u.preview_url) URL.revokeObjectURL(u.preview_url);
    });
    setUploads([]);
    setCurrentUpload(null);
    setSuggestedEntry(null);
  }, [uploads]);

  return {
    uploads,
    currentUpload,
    isProcessing,
    suggestedEntry,
    uploadDocument,
    analyzeDocument,
    validateExtractedData,
    createEntryFromDocument,
    removeUpload,
    clearAll,
    setCurrentUpload
  };
}

export default useObelixiaDocumentVision;
