/**
 * Hook for generating and exporting remote support session data to PDF
 * 
 * KB Pattern: typed errors
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// === TYPES ===
export interface SessionExportData {
  session: {
    id: string;
    session_code: string;
    client_name?: string;
    status: string;
    started_at: string;
    ended_at?: string;
    duration_ms?: number;
    resolution?: string;
    resolution_notes?: string;
    technician_id?: string;
  };
  actions: Array<{
    id: string;
    action_type: string;
    description?: string;
    risk_level: string;
    component_affected?: string;
    created_at: string;
    duration_ms?: number;
    requires_approval?: boolean;
  }>;
  technician?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface ExportOptions {
  includeActions: boolean;
  includeTimestamps: boolean;
  includeSummary: boolean;
}

// KB Pattern: Typed error interface
export interface ExportError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export function useSessionExport() {
  const [isExporting, setIsExporting] = useState(false);
  
  // KB Pattern: Typed error state
  const [error, setError] = useState<ExportError | null>(null);

  // Generate a verification hash
  const generateVerificationHash = useCallback((data: string): string => {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  }, []);

  // Generate a unique verification code
  const generateVerificationCode = useCallback((): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Fetch session data for export
  const fetchSessionData = useCallback(async (sessionId: string): Promise<SessionExportData | null> => {
    try {
      const [sessionResult, actionsResult] = await Promise.all([
        supabase
          .from('remote_support_sessions')
          .select('*')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('session_actions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (actionsResult.error) throw actionsResult.error;

      let technician = null;
      if (sessionResult.data.performed_by) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', sessionResult.data.performed_by)
          .single();
        technician = profileData;
      }

      return {
        session: {
          ...sessionResult.data,
          technician_id: sessionResult.data.performed_by
        },
        actions: actionsResult.data || [],
        technician
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error fetching session data:', err);
      setError({ code: 'FETCH_DATA_ERROR', message, details: { sessionId } });
      return null;
    }
  }, []);

  // Format duration
  const formatDuration = useCallback((ms?: number): string => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }, []);

  // Get risk level label
  const getRiskLabel = useCallback((level: string): string => {
    const labels: Record<string, string> = {
      low: 'Bajo',
      medium: 'Medio',
      high: 'Alto',
      critical: 'Crítico'
    };
    return labels[level] || level;
  }, []);

  // Get action type label
  const getActionLabel = useCallback((type: string): string => {
    const labels: Record<string, string> = {
      config_change: 'Cambio de Configuración',
      data_access: 'Acceso a Datos',
      data_modification: 'Modificación de Datos',
      permission_change: 'Cambio de Permisos',
      system_command: 'Comando del Sistema',
      file_operation: 'Operación de Archivo',
      user_impersonation: 'Suplantación de Usuario',
      session_start: 'Inicio de Sesión',
      session_end: 'Fin de Sesión',
      screenshot: 'Captura de Pantalla',
      note: 'Nota',
      other: 'Otro'
    };
    return labels[type] || type;
  }, []);

  // Export session to PDF
  const exportToPDF = useCallback(async (
    sessionId: string, 
    options: ExportOptions = { includeActions: true, includeTimestamps: true, includeSummary: true }
  ): Promise<boolean> => {
    setIsExporting(true);
    setError(null);
    
    try {
      const data = await fetchSessionData(sessionId);
      if (!data) throw new Error('No se pudo obtener los datos de la sesión');

      const verificationCode = generateVerificationCode();
      const verificationHash = generateVerificationHash(
        JSON.stringify({ sessionId, timestamp: new Date().toISOString(), code: verificationCode })
      );

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPos = 20;

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informe de Sesión de Soporte Remoto', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Código de Sesión: ${data.session.session_code}`, pageWidth / 2, yPos, { align: 'center' });

      // Verification badge
      yPos += 15;
      pdf.setFillColor(34, 197, 94);
      pdf.roundedRect(pageWidth / 2 - 45, yPos - 5, 90, 12, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`✓ Verificado: ${verificationCode}`, pageWidth / 2, yPos + 2, { align: 'center' });
      pdf.setTextColor(0, 0, 0);

      // Session details
      yPos += 20;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalles de la Sesión', 14, yPos);
      
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      const sessionDetails = [
        ['Cliente:', data.session.client_name || 'No especificado'],
        ['Estado:', data.session.status === 'completed' ? 'Completada' : data.session.status === 'cancelled' ? 'Cancelada' : data.session.status],
        ['Inicio:', format(new Date(data.session.started_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })],
        ['Fin:', data.session.ended_at ? format(new Date(data.session.ended_at), "d 'de' MMMM yyyy, HH:mm", { locale: es }) : 'En curso'],
        ['Duración:', formatDuration(data.session.duration_ms)],
        ['Técnico:', data.technician ? `${data.technician.first_name || ''} ${data.technician.last_name || ''}`.trim() || data.technician.email || 'Desconocido' : 'No asignado'],
        ['Resolución:', data.session.resolution || 'N/A']
      ];

      sessionDetails.forEach(([label, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 14, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, 50, yPos);
        yPos += 6;
      });

      // Summary
      if (options.includeSummary) {
        yPos += 10;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resumen de Acciones', 14, yPos);
        
        yPos += 8;
        const totalActions = data.actions.length;
        const highRiskActions = data.actions.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length;
        const actionTypes = [...new Set(data.actions.map(a => a.action_type))];

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total de acciones: ${totalActions}`, 14, yPos);
        yPos += 6;
        pdf.text(`Acciones de alto riesgo: ${highRiskActions}`, 14, yPos);
        yPos += 6;
        pdf.text(`Tipos de acciones: ${actionTypes.length}`, 14, yPos);
      }

      // Actions table
      if (options.includeActions && data.actions.length > 0) {
        yPos += 15;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Registro de Acciones', 14, yPos);
        
        yPos += 5;

        const tableData = data.actions.map((action, index) => [
          (index + 1).toString(),
          getActionLabel(action.action_type),
          action.description?.substring(0, 40) || '-',
          getRiskLabel(action.risk_level),
          options.includeTimestamps 
            ? format(new Date(action.created_at), 'HH:mm:ss', { locale: es })
            : '-'
        ]);

        autoTable(pdf, {
          startY: yPos,
          head: [['#', 'Tipo', 'Descripción', 'Riesgo', 'Hora']],
          body: tableData,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [59, 130, 246], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 35 },
            2: { cellWidth: 70 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
          },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }

      // Footer with verification
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        pdf.text(
          `Generado: ${format(new Date(), "d/MM/yyyy HH:mm:ss", { locale: es })} | Hash: ${verificationHash} | Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `soporte-${data.session.session_code}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`;
      pdf.save(fileName);

      // Log the export
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from('session_export_logs').insert({
          session_id: sessionId,
          exported_by: userData.user.id,
          verification_hash: verificationHash,
          verification_code: verificationCode,
          includes_actions: options.includeActions,
          metadata: JSON.parse(JSON.stringify({ fileName, includeTimestamps: options.includeTimestamps, includeSummary: options.includeSummary }))
        });
      }

      toast({
        title: "Exportación completada",
        description: `Archivo: ${fileName}`,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error exporting session:', err);
      setError({ code: 'EXPORT_ERROR', message, details: { sessionId } });
      toast({
        title: "Error de exportación",
        description: "No se pudo generar el PDF",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [fetchSessionData, generateVerificationCode, generateVerificationHash, formatDuration, getActionLabel, getRiskLabel]);

  // KB Pattern: Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isExporting,
    error,
    // Actions
    exportToPDF,
    clearError,
    // Utilities
    generateVerificationCode,
    generateVerificationHash
  };
}
