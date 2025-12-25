import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface TelemedicineSession {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  video_url?: string;
  notes?: string;
  prescription?: ElectronicPrescription;
}

export interface ElectronicPrescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medications: Medication[];
  issued_at: string;
  expires_at: string;
  signature_hash: string;
  qr_code?: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface EHRRecord {
  id: string;
  patient_id: string;
  record_type: 'consultation' | 'lab_result' | 'imaging' | 'procedure' | 'vaccination';
  data: Record<string, unknown>;
  fhir_resource?: Record<string, unknown>;
  created_at: string;
  provider_id: string;
}

export interface DiagnosisAssistResult {
  possible_conditions: Array<{
    condition: string;
    icd10_code: string;
    probability: number;
    reasoning: string;
  }>;
  recommended_tests: string[];
  red_flags: string[];
  differential_diagnosis: string[];
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  recommendation: string;
}

export interface RemoteMonitoringData {
  device_id: string;
  patient_id: string;
  vital_type: 'heart_rate' | 'blood_pressure' | 'glucose' | 'oxygen' | 'temperature' | 'weight';
  value: number;
  unit: string;
  measured_at: string;
  alerts?: string[];
}

export interface PatientJourney {
  patient_id: string;
  touchpoints: Array<{
    type: string;
    timestamp: string;
    provider: string;
    outcome?: string;
    satisfaction_score?: number;
  }>;
  total_cost: number;
  outcomes: Record<string, unknown>;
  recommendations: string[];
}

// === HOOK ===
export function useHealthcarePro() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === TELEMEDICINE ===
  const createTelemedicineSession = useCallback(async (
    patientId: string,
    doctorId: string,
    scheduledAt: string
  ): Promise<TelemedicineSession | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'create_telemedicine_session',
          params: { patientId, doctorId, scheduledAt }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Sesión de telemedicina creada');
        return data.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear sesión';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generatePrescription = useCallback(async (
    sessionId: string,
    medications: Medication[]
  ): Promise<ElectronicPrescription | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'generate_prescription',
          params: { sessionId, medications }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Receta electrónica generada');
        return data.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar receta';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EHR INTEROPERABILITY ===
  const fetchEHRRecords = useCallback(async (
    patientId: string,
    recordTypes?: string[]
  ): Promise<EHRRecord[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'fetch_ehr_records',
          params: { patientId, recordTypes }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching EHR:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportFHIRResource = useCallback(async (
    recordId: string,
    resourceType: string
  ): Promise<Record<string, unknown> | null> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'export_fhir',
          params: { recordId, resourceType }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error exporting FHIR:', err);
      return null;
    }
  }, []);

  // === AI DIAGNOSIS ASSISTANT ===
  const getDiagnosisAssist = useCallback(async (
    symptoms: string[],
    patientHistory?: Record<string, unknown>
  ): Promise<DiagnosisAssistResult | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'ai_diagnosis_assist',
          params: { symptoms, patientHistory }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        return data.data;
      }
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en asistente diagnóstico';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === DRUG INTERACTION CHECKER ===
  const checkDrugInteractions = useCallback(async (
    medications: string[]
  ): Promise<DrugInteraction[]> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'check_drug_interactions',
          params: { medications }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error checking interactions:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === REMOTE PATIENT MONITORING ===
  const getMonitoringData = useCallback(async (
    patientId: string,
    vitalTypes?: string[],
    dateRange?: { start: string; end: string }
  ): Promise<RemoteMonitoringData[]> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'get_monitoring_data',
          params: { patientId, vitalTypes, dateRange }
        }
      });

      if (fnError) throw fnError;
      return data?.data || [];
    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      return [];
    }
  }, []);

  const setVitalAlert = useCallback(async (
    patientId: string,
    vitalType: string,
    thresholds: { min?: number; max?: number }
  ): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'set_vital_alert',
          params: { patientId, vitalType, thresholds }
        }
      });

      if (fnError) throw fnError;
      if (data?.success) {
        toast.success('Alerta configurada');
        return true;
      }
      return false;
    } catch (err) {
      toast.error('Error al configurar alerta');
      return false;
    }
  }, []);

  // === PATIENT JOURNEY ANALYTICS ===
  const analyzePatientJourney = useCallback(async (
    patientId: string,
    dateRange?: { start: string; end: string }
  ): Promise<PatientJourney | null> => {
    setIsLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('healthcare-pro', {
        body: {
          action: 'analyze_patient_journey',
          params: { patientId, dateRange }
        }
      });

      if (fnError) throw fnError;
      return data?.data || null;
    } catch (err) {
      console.error('Error analyzing journey:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    // Telemedicine
    createTelemedicineSession,
    generatePrescription,
    // EHR
    fetchEHRRecords,
    exportFHIRResource,
    // AI Diagnosis
    getDiagnosisAssist,
    // Drug Interactions
    checkDrugInteractions,
    // Remote Monitoring
    getMonitoringData,
    setVitalAlert,
    // Patient Journey
    analyzePatientJourney,
  };
}

export default useHealthcarePro;
