import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, Plus, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSalesPerformanceMutations } from '@/hooks/useSalesPerformance';
import { toast } from 'sonner';

const quotaFormSchema = z.object({
  gestor_id: z.string().min(1, 'Selecciona un gestor'),
  period_type: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  target_value: z.number().min(0, 'El valor debe ser positivo'),
  target_visits: z.number().min(0, 'El número debe ser positivo'),
  target_new_clients: z.number().min(0, 'El número debe ser positivo'),
  target_products_sold: z.number().min(0, 'El número debe ser positivo'),
});

type QuotaFormValues = z.infer<typeof quotaFormSchema>;

interface GestorProfile {
  id: string;
  full_name: string | null;
  oficina: string | null;
}

export function QuotaAssignmentForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createQuota } = useSalesPerformanceMutations();

  const { data: gestores, isLoading: gestoresLoading } = useQuery({
    queryKey: ['gestores-for-quotas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, oficina')
        .order('full_name');
      
      if (error) throw error;
      return data as GestorProfile[];
    }
  });

  const form = useForm<QuotaFormValues>({
    resolver: zodResolver(quotaFormSchema),
    defaultValues: {
      gestor_id: '',
      period_type: 'monthly',
      target_value: 50000,
      target_visits: 20,
      target_new_clients: 5,
      target_products_sold: 10,
    }
  });

  const calculatePeriodDates = (periodType: string) => {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (periodType) {
      case 'weekly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), quarter * 3, 1);
        periodEnd = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { periodStart, periodEnd };
  };

  const onSubmit = async (values: QuotaFormValues) => {
    setIsSubmitting(true);
    try {
      const { periodStart, periodEnd } = calculatePeriodDates(values.period_type);

      await createQuota.mutateAsync({
        gestor_id: values.gestor_id,
        period_type: values.period_type,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        target_value: values.target_value,
        target_visits: values.target_visits,
        target_new_clients: values.target_new_clients,
        target_products_sold: values.target_products_sold,
      });

      toast.success('Cuota asignada correctamente');
      form.reset();
    } catch (error) {
      console.error('Error creating quota:', error);
      toast.error('Error al asignar la cuota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignAll = async () => {
    if (!gestores || gestores.length === 0) {
      toast.error('No hay gestores disponibles');
      return;
    }

    setIsSubmitting(true);
    const values = form.getValues();
    const { periodStart, periodEnd } = calculatePeriodDates(values.period_type);
    
    try {
      for (const gestor of gestores) {
        await createQuota.mutateAsync({
          gestor_id: gestor.id,
          period_type: values.period_type,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          target_value: values.target_value,
          target_visits: values.target_visits,
          target_new_clients: values.target_new_clients,
          target_products_sold: values.target_products_sold,
        });
      }

      toast.success(`Cuotas asignadas a ${gestores.length} gestores`);
    } catch (error) {
      console.error('Error assigning quotas:', error);
      toast.error('Error al asignar cuotas masivas');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Asignar Cuotas de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gestor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={gestoresLoading ? "Cargando..." : "Seleccionar gestor"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {gestores?.map((gestor) => (
                          <SelectItem key={gestor.id} value={gestor.id}>
                            {gestor.full_name || 'Sin nombre'} ({gestor.oficina || 'Sin oficina'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="target_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Valor (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_visits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Visitas</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_new_clients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Clientes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_products_sold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objetivo Productos</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Asignar Cuota
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAssignAll}
                disabled={isSubmitting || !gestores || gestores.length === 0}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Asignar a Todos ({gestores?.length || 0})
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
