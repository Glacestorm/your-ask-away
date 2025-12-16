import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Regulation {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  sector: string | null;
  regulation_source: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  is_mandatory: boolean;
  requires_acknowledgment: boolean;
  acknowledgment_deadline: string | null;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ComplianceDocument {
  id: string;
  organization_id: string | null;
  document_type: string;
  title: string;
  description: string | null;
  content: string | null;
  file_url: string | null;
  sector: string | null;
  status: string;
  version: string;
  created_at: string;
  updated_at: string;
}

export interface PendingAcknowledgment {
  id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  deadline: string | null;
  is_mandatory: boolean;
}

export interface ChecklistItem {
  id: string;
  requirement_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  document_title: string;
}

export interface ComplianceTask {
  id: string;
  task_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  document_id: string | null;
}

export function useSectorCompliance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get official regulations by sector
  const getOfficialRegulations = useCallback(async (sectorKey: string): Promise<Regulation[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('organization_compliance_documents')
        .select('*')
        .eq('document_type', 'official_regulation')
        .eq('sector', sectorKey)
        .eq('status', 'active')
        .order('effective_date', { ascending: false });

      if (queryError) throw queryError;
      
      return (data || []).map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        document_type: doc.document_type,
        sector: doc.sector,
        regulation_source: doc.regulation_source,
        effective_date: doc.effective_date,
        expiry_date: doc.expiry_date,
        is_mandatory: doc.is_mandatory || false,
        requires_acknowledgment: doc.requires_acknowledgment || false,
        acknowledgment_deadline: doc.acknowledgment_deadline,
        status: doc.status,
        metadata: (doc.metadata as Record<string, any>) || {},
        created_at: doc.created_at
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching regulations';
      setError(message);
      console.error('Error fetching official regulations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get internal documents for an organization
  const getInternalDocuments = useCallback(async (organizationId: string): Promise<ComplianceDocument[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('organization_compliance_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .neq('document_type', 'official_regulation')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;
      
      return (data || []).map(doc => ({
        id: doc.id,
        organization_id: doc.organization_id,
        document_type: doc.document_type,
        title: doc.title,
        description: doc.description,
        content: doc.content,
        file_url: doc.file_url,
        sector: doc.sector,
        status: doc.status,
        version: doc.version || '1.0',
        created_at: doc.created_at,
        updated_at: doc.updated_at
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching documents';
      setError(message);
      console.error('Error fetching internal documents:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pending acknowledgments for an employee
  const getPendingAcknowledgments = useCallback(async (employeeId: string): Promise<PendingAcknowledgment[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get documents that require acknowledgment
      const { data: docs, error: docsError } = await supabase
        .from('organization_compliance_documents')
        .select('id, title, document_type, acknowledgment_deadline, is_mandatory')
        .eq('requires_acknowledgment', true)
        .eq('status', 'active');

      if (docsError) throw docsError;

      // Get existing acknowledgments for this employee
      const { data: acks, error: acksError } = await supabase
        .from('compliance_acknowledgments')
        .select('document_id')
        .eq('employee_id', employeeId);

      if (acksError) throw acksError;

      const acknowledgedIds = new Set((acks || []).map(a => a.document_id));

      // Filter to only pending documents
      const pending = (docs || [])
        .filter(doc => !acknowledgedIds.has(doc.id))
        .map(doc => ({
          id: doc.id,
          document_id: doc.id,
          document_title: doc.title,
          document_type: doc.document_type,
          deadline: doc.acknowledgment_deadline,
          is_mandatory: doc.is_mandatory || false
        }));

      return pending;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching pending acknowledgments';
      setError(message);
      console.error('Error fetching pending acknowledgments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload internal document
  const uploadInternalDocument = useCallback(async (
    file: File,
    metadata: {
      organization_id: string;
      document_type: 'internal_policy' | 'procedure' | 'training_material' | 'audit_report';
      title: string;
      description?: string;
      sector?: string;
      requires_acknowledgment?: boolean;
      acknowledgment_deadline?: string;
    }
  ): Promise<ComplianceDocument | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${metadata.organization_id}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue without file URL if storage fails
      }

      const fileUrl = uploadData 
        ? supabase.storage.from('compliance-documents').getPublicUrl(fileName).data.publicUrl
        : null;

      // Create document record
      const { data: doc, error: insertError } = await supabase
        .from('organization_compliance_documents')
        .insert({
          organization_id: metadata.organization_id,
          document_type: metadata.document_type,
          title: metadata.title,
          description: metadata.description || null,
          file_url: fileUrl,
          sector: metadata.sector || null,
          requires_acknowledgment: metadata.requires_acknowledgment || false,
          acknowledgment_deadline: metadata.acknowledgment_deadline || null,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Documento subido correctamente');

      return doc ? {
        id: doc.id,
        organization_id: doc.organization_id,
        document_type: doc.document_type,
        title: doc.title,
        description: doc.description,
        content: doc.content,
        file_url: doc.file_url,
        sector: doc.sector,
        status: doc.status,
        version: doc.version || '1.0',
        created_at: doc.created_at,
        updated_at: doc.updated_at
      } : null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error uploading document';
      setError(message);
      toast.error(message);
      console.error('Error uploading document:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Acknowledge a document
  const acknowledgeDocument = useCallback(async (documentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: insertError } = await supabase
        .from('compliance_acknowledgments')
        .insert({
          document_id: documentId,
          employee_id: user.id,
          acknowledged_at: new Date().toISOString(),
          signature_hash: btoa(`${user.id}:${documentId}:${Date.now()}`)
        });

      if (insertError) throw insertError;

      toast.success('Documento confirmado correctamente');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error acknowledging document';
      setError(message);
      toast.error(message);
      console.error('Error acknowledging document:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get compliance checklist for an employee
  const getComplianceChecklist = useCallback(async (employeeId: string): Promise<ChecklistItem[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: requirements, error: reqError } = await supabase
        .from('compliance_requirements')
        .select(`
          id,
          requirement_key,
          requirement_title,
          requirement_description,
          category,
          priority,
          status,
          due_date,
          document_id,
          organization_compliance_documents!inner(title)
        `)
        .in('status', ['pending', 'in_progress']);

      if (reqError) throw reqError;

      return (requirements || []).map((req: any) => ({
        id: req.id,
        requirement_id: req.id,
        title: req.requirement_title,
        description: req.requirement_description,
        category: req.category,
        priority: req.priority,
        status: req.status,
        due_date: req.due_date,
        document_title: req.organization_compliance_documents?.title || 'Sin documento'
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching checklist';
      setError(message);
      console.error('Error fetching compliance checklist:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get assigned tasks
  const getAssignedTasks = useCallback(async (userId: string): Promise<ComplianceTask[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: queryError } = await supabase
        .from('compliance_review_tasks')
        .select('*')
        .eq('assigned_to', userId)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });

      if (queryError) throw queryError;

      return (data || []).map(task => ({
        id: task.id,
        task_type: task.task_type,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        document_id: task.document_id
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error fetching tasks';
      setError(message);
      console.error('Error fetching tasks:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete a task
  const completeTask = useCallback(async (taskId: string, result?: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await supabase
        .from('compliance_review_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: result || null
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      toast.success('Tarea completada');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error completing task';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update requirement status
  const updateRequirementStatus = useCallback(async (
    requirementId: string,
    status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant' | 'not_applicable',
    notes?: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        status,
        notes: notes || null
      };

      if (status === 'compliant') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id || null;
      }

      const { error: updateError } = await supabase
        .from('compliance_requirements')
        .update(updateData)
        .eq('id', requirementId);

      if (updateError) throw updateError;

      toast.success('Estado actualizado');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating status';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getOfficialRegulations,
    getInternalDocuments,
    getPendingAcknowledgments,
    uploadInternalDocument,
    acknowledgeDocument,
    getComplianceChecklist,
    getAssignedTasks,
    completeTask,
    updateRequirementStatus
  };
}
