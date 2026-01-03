/**
 * Hook para operaciones de Descuento Comercial
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CommercialDiscount {
  id: string;
  company_id: string;
  discount_number: string;
  entity_id: string | null;
  customer_id: string | null;
  operation_type: 'national' | 'international';
  total_nominal: number;
  total_effective: number;
  interest_rate: number;
  interest_amount: number;
  commission_rate: number;
  commission_amount: number;
  expenses: number;
  net_amount: number;
  currency: string;
  discount_date: string | null;
  value_date: string | null;
  status: 'draft' | 'pending' | 'sent' | 'discounted' | 'partial_paid' | 'paid' | 'returned' | 'cancelled';
  bank_reference: string | null;
  internal_notes: string | null;
  is_accounted: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  entity?: {
    id: string;
    entity_name: string;
    swift_bic: string | null;
  };
  customer?: {
    id: string;
    legal_name: string;
    tax_id: string | null;
  };
  effects?: DiscountEffect[];
}

export interface DiscountEffect {
  id: string;
  discount_id: string | null;
  company_id: string;
  effect_type: 'bill' | 'promissory_note' | 'receipt' | 'check';
  effect_number: string | null;
  drawer_name: string | null;
  drawer_tax_id: string | null;
  drawee_name: string;
  drawee_tax_id: string | null;
  drawee_address: string | null;
  amount: number;
  currency: string;
  issue_date: string;
  maturity_date: string;
  bank_domiciliation: string | null;
  bank_iban: string | null;
  bank_swift: string | null;
  status: 'pending' | 'discounted' | 'paid' | 'returned' | 'protested';
  return_reason: string | null;
  return_date: string | null;
  payment_date: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  created_at: string;
}

export interface DiscountRemittance {
  id: string;
  company_id: string;
  remittance_number: string;
  entity_id: string | null;
  total_effects: number;
  total_amount: number;
  status: 'draft' | 'generated' | 'sent' | 'confirmed' | 'rejected';
  generation_date: string | null;
  sent_date: string | null;
  confirmation_date: string | null;
  file_format: string;
  file_url: string | null;
  bank_reference: string | null;
  created_at: string;
}

export interface DiscountCalculation {
  nominal: number;
  days: number;
  interestRate: number;
  commissionRate: number;
  expenses: number;
  // Resultados
  interestAmount: number;
  commissionAmount: number;
  totalDeductions: number;
  netAmount: number;
  effectiveRate: number;
}

export function useERPDiscountOperations() {
  const [discounts, setDiscounts] = useState<CommercialDiscount[]>([]);
  const [effects, setEffects] = useState<DiscountEffect[]>([]);
  const [remittances, setRemittances] = useState<DiscountRemittance[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalDiscounted: 0,
    totalReturned: 0,
    pendingAmount: 0,
    discountedAmount: 0
  });

  // Fetch all discounts
  const fetchDiscounts = useCallback(async (companyId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('erp_commercial_discounts')
        .select(`
          *,
          entity:erp_financial_entities(id, entity_name, swift_bic),
          customer:erp_trade_partners(id, legal_name, tax_id)
        `)
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDiscounts(data as unknown as CommercialDiscount[]);
      
      // Calculate stats
      const pending = data?.filter(d => d.status === 'pending' || d.status === 'sent') || [];
      const discounted = data?.filter(d => d.status === 'discounted') || [];
      const returned = data?.filter(d => d.status === 'returned') || [];
      
      setStats({
        totalPending: pending.length,
        totalDiscounted: discounted.length,
        totalReturned: returned.length,
        pendingAmount: pending.reduce((sum, d) => sum + Number(d.total_nominal || 0), 0),
        discountedAmount: discounted.reduce((sum, d) => sum + Number(d.net_amount || 0), 0)
      });

      return data;
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast.error('Error al cargar descuentos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch effects for a discount
  const fetchEffects = useCallback(async (discountId?: string) => {
    try {
      let query = supabase
        .from('erp_discount_effects')
        .select('*')
        .order('maturity_date', { ascending: true });

      if (discountId) {
        query = query.eq('discount_id', discountId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEffects(data as DiscountEffect[]);
      return data;
    } catch (error) {
      console.error('Error fetching effects:', error);
      return [];
    }
  }, []);

  // Fetch pending effects (not assigned to any discount)
  const fetchPendingEffects = useCallback(async (companyId?: string) => {
    try {
      let query = supabase
        .from('erp_discount_effects')
        .select('*')
        .is('discount_id', null)
        .eq('status', 'pending')
        .order('maturity_date', { ascending: true });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as DiscountEffect[];
    } catch (error) {
      console.error('Error fetching pending effects:', error);
      return [];
    }
  }, []);

  // Create new discount
  const createDiscount = useCallback(async (discount: Omit<Partial<CommercialDiscount>, 'company_id'> & { company_id: string; customer_id?: string }) => {
    try {
      // Generate discount number
      const discountNumber = `DESC-${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from('erp_commercial_discounts')
        .insert([{
          company_id: discount.company_id,
          discount_number: discountNumber,
          entity_id: discount.entity_id,
          customer_id: discount.customer_id,
          operation_type: discount.operation_type || 'national',
          discount_date: discount.discount_date,
          value_date: discount.value_date,
          interest_rate: discount.interest_rate,
          commission_rate: discount.commission_rate,
          expenses: discount.expenses,
          currency: discount.currency || 'EUR',
          internal_notes: discount.internal_notes,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Descuento creado');
      return data;
    } catch (error) {
      console.error('Error creating discount:', error);
      toast.error('Error al crear descuento');
      return null;
    }
  }, []);

  // Update discount
  const updateDiscount = useCallback(async (id: string, updates: Partial<CommercialDiscount>) => {
    try {
      const { error } = await supabase
        .from('erp_commercial_discounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Descuento actualizado');
      return true;
    } catch (error) {
      console.error('Error updating discount:', error);
      toast.error('Error al actualizar descuento');
      return false;
    }
  }, []);

  // Create effect
  const createEffect = useCallback(async (effect: Omit<Partial<DiscountEffect>, 'company_id' | 'amount' | 'drawee_name' | 'issue_date' | 'maturity_date' | 'effect_type'> & {
    company_id: string;
    amount: number;
    drawee_name: string;
    issue_date: string;
    maturity_date: string;
    effect_type: 'bill' | 'promissory_note' | 'receipt' | 'check';
  }) => {
    try {
      const { data, error } = await supabase
        .from('erp_discount_effects')
        .insert([{
          company_id: effect.company_id,
          effect_type: effect.effect_type,
          effect_number: effect.effect_number,
          drawee_name: effect.drawee_name,
          drawee_tax_id: effect.drawee_tax_id,
          drawee_address: effect.drawee_address,
          amount: effect.amount,
          currency: effect.currency || 'EUR',
          issue_date: effect.issue_date,
          maturity_date: effect.maturity_date,
          bank_iban: effect.bank_iban,
          invoice_number: effect.invoice_number,
          status: effect.status || 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Efecto registrado');
      return data;
    } catch (error) {
      console.error('Error creating effect:', error);
      toast.error('Error al registrar efecto');
      return null;
    }
  }, []);

  // Update effect
  const updateEffect = useCallback(async (id: string, updates: Partial<DiscountEffect>) => {
    try {
      const { error } = await supabase
        .from('erp_discount_effects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating effect:', error);
      return false;
    }
  }, []);

  // Add effects to discount
  const addEffectsToDiscount = useCallback(async (discountId: string, effectIds: string[]) => {
    try {
      const { error } = await supabase
        .from('erp_discount_effects')
        .update({ discount_id: discountId, status: 'discounted' })
        .in('id', effectIds);

      if (error) throw error;

      // Recalculate discount totals
      const { data: effects } = await supabase
        .from('erp_discount_effects')
        .select('amount')
        .eq('discount_id', discountId);

      if (effects) {
        const totalNominal = effects.reduce((sum, e) => sum + Number(e.amount), 0);
        await supabase
          .from('erp_commercial_discounts')
          .update({ total_nominal: totalNominal })
          .eq('id', discountId);
      }

      toast.success('Efectos añadidos al descuento');
      return true;
    } catch (error) {
      console.error('Error adding effects:', error);
      toast.error('Error al añadir efectos');
      return false;
    }
  }, []);

  // Calculate discount
  const calculateDiscount = useCallback((params: {
    nominal: number;
    days: number;
    interestRate: number;
    commissionRate: number;
    expenses: number;
  }): DiscountCalculation => {
    const { nominal, days, interestRate, commissionRate, expenses } = params;
    
    // Interest = Nominal * Rate * Days / 360 (commercial year)
    const interestAmount = (nominal * (interestRate / 100) * days) / 360;
    
    // Commission = Nominal * Commission Rate
    const commissionAmount = nominal * (commissionRate / 100);
    
    // Total deductions
    const totalDeductions = interestAmount + commissionAmount + expenses;
    
    // Net amount
    const netAmount = nominal - totalDeductions;
    
    // Effective annual rate
    const effectiveRate = days > 0 
      ? ((totalDeductions / nominal) * (360 / days)) * 100 
      : 0;

    return {
      nominal,
      days,
      interestRate,
      commissionRate,
      expenses,
      interestAmount: Math.round(interestAmount * 100) / 100,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100
    };
  }, []);

  // Change discount status
  const changeDiscountStatus = useCallback(async (
    id: string, 
    newStatus: CommercialDiscount['status'],
    additionalData?: Partial<CommercialDiscount>
  ) => {
    try {
      const { error } = await supabase
        .from('erp_commercial_discounts')
        .update({ 
          status: newStatus,
          ...additionalData
        })
        .eq('id', id);

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        draft: 'borrador',
        pending: 'pendiente',
        sent: 'enviado',
        discounted: 'descontado',
        partial_paid: 'parcialmente cobrado',
        paid: 'cobrado',
        returned: 'devuelto',
        cancelled: 'cancelado'
      };

      toast.success(`Estado cambiado a ${statusLabels[newStatus]}`);
      return true;
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Error al cambiar estado');
      return false;
    }
  }, []);

  // Fetch remittances
  const fetchRemittances = useCallback(async (companyId?: string) => {
    try {
      let query = supabase
        .from('erp_discount_remittances')
        .select('*')
        .order('created_at', { ascending: false });

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRemittances(data as DiscountRemittance[]);
      return data;
    } catch (error) {
      console.error('Error fetching remittances:', error);
      return [];
    }
  }, []);

  // Create remittance
  const createRemittance = useCallback(async (
    companyId: string,
    entityId: string,
    effectIds: string[]
  ) => {
    try {
      // Get effects data
      const { data: effectsData } = await supabase
        .from('erp_discount_effects')
        .select('amount')
        .in('id', effectIds);

      const totalAmount = effectsData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const remittanceNumber = `REM-${Date.now().toString(36).toUpperCase()}`;

      // Create remittance
      const { data: remittance, error: remError } = await supabase
        .from('erp_discount_remittances')
        .insert([{
          company_id: companyId,
          remittance_number: remittanceNumber,
          entity_id: entityId,
          total_effects: effectIds.length,
          total_amount: totalAmount,
          status: 'draft'
        }])
        .select()
        .single();

      if (remError) throw remError;

      // Link effects to remittance
      const remittanceEffects = effectIds.map(effectId => ({
        remittance_id: remittance.id,
        effect_id: effectId
      }));

      const { error: linkError } = await supabase
        .from('erp_remittance_effects')
        .insert(remittanceEffects);

      if (linkError) throw linkError;

      toast.success('Remesa creada');
      return remittance;
    } catch (error) {
      console.error('Error creating remittance:', error);
      toast.error('Error al crear remesa');
      return null;
    }
  }, []);

  return {
    // State
    discounts,
    effects,
    remittances,
    loading,
    stats,
    
    // Discount operations
    fetchDiscounts,
    createDiscount,
    updateDiscount,
    changeDiscountStatus,
    
    // Effect operations
    fetchEffects,
    fetchPendingEffects,
    createEffect,
    updateEffect,
    addEffectsToDiscount,
    
    // Calculations
    calculateDiscount,
    
    // Remittance operations
    fetchRemittances,
    createRemittance
  };
}

export default useERPDiscountOperations;
