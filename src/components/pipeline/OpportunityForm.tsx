import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Opportunity, OpportunityStage } from '@/hooks/useOpportunities';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarIcon, Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const opportunitySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  company_id: z.string().min(1, 'Selecciona una empresa'),
  description: z.string().optional(),
  stage: z.enum(['discovery', 'proposal', 'negotiation', 'won', 'lost']),
  probability: z.number().min(0).max(100),
  estimated_value: z.number().optional(),
  estimated_close_date: z.date().optional(),
  contact_id: z.string().optional(),
  notes: z.string().optional(),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface OpportunityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity?: Opportunity | null;
  onSubmit: (data: Partial<Opportunity>) => void;
  defaultCompanyId?: string;
}

interface Company {
  id: string;
  name: string;
  is_vip: boolean;
}

interface Contact {
  id: string;
  contact_name: string;
  position: string | null;
}

const stages: { value: OpportunityStage; label: string }[] = [
  { value: 'discovery', label: 'Descubrimiento' },
  { value: 'proposal', label: 'Propuesta' },
  { value: 'negotiation', label: 'Negociación' },
  { value: 'won', label: 'Ganada' },
  { value: 'lost', label: 'Perdida' },
];

export function OpportunityForm({ 
  open, 
  onOpenChange, 
  opportunity, 
  onSubmit,
  defaultCompanyId 
}: OpportunityFormProps) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      company_id: defaultCompanyId || '',
      description: '',
      stage: 'discovery',
      probability: 25,
      estimated_value: undefined,
      estimated_close_date: undefined,
      contact_id: '',
      notes: '',
    },
  });

  const selectedCompanyId = form.watch('company_id');

  useEffect(() => {
    if (open) {
      fetchCompanies();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchContacts(selectedCompanyId);
    } else {
      setContacts([]);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (opportunity) {
      form.reset({
        title: opportunity.title,
        company_id: opportunity.company_id,
        description: opportunity.description || '',
        stage: opportunity.stage,
        probability: opportunity.probability,
        estimated_value: opportunity.estimated_value || undefined,
        estimated_close_date: opportunity.estimated_close_date 
          ? new Date(opportunity.estimated_close_date) 
          : undefined,
        contact_id: opportunity.contact_id || '',
        notes: opportunity.notes || '',
      });
    } else {
      form.reset({
        title: '',
        company_id: defaultCompanyId || '',
        description: '',
        stage: 'discovery',
        probability: 25,
        estimated_value: undefined,
        estimated_close_date: undefined,
        contact_id: '',
        notes: '',
      });
    }
  }, [opportunity, defaultCompanyId, form]);

  const fetchCompanies = async () => {
    const { data } = await supabase
      .from('companies')
      .select('id, name, is_vip')
      .order('name');
    if (data) setCompanies(data);
  };

  const fetchContacts = async (companyId: string) => {
    const { data } = await supabase
      .from('company_contacts')
      .select('id, contact_name, position')
      .eq('company_id', companyId)
      .order('contact_name');
    if (data) setContacts(data);
  };

  const handleSubmit = async (data: OpportunityFormData) => {
    setLoading(true);
    try {
      const submitData: Partial<Opportunity> = {
        ...data,
        estimated_close_date: data.estimated_close_date 
          ? format(data.estimated_close_date, 'yyyy-MM-dd')
          : null,
        owner_id: opportunity?.owner_id || user?.id,
        contact_id: data.contact_id || null,
      };
      
      if (opportunity?.id) {
        submitData.id = opportunity.id;
      }
      
      onSubmit(submitData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {opportunity ? 'Editar Oportunidad' : 'Nueva Oportunidad'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Financiación nueva nave industrial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Selector */}
            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Empresa *</FormLabel>
                  <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {selectedCompany ? selectedCompany.name : "Seleccionar empresa..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar empresa..." />
                        <CommandList>
                          <CommandEmpty>No se encontraron empresas.</CommandEmpty>
                          <CommandGroup>
                            {companies.map((company) => (
                              <CommandItem
                                key={company.id}
                                value={company.name}
                                onSelect={() => {
                                  form.setValue('company_id', company.id);
                                  form.setValue('contact_id', '');
                                  setCompanyOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    company.id === field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {company.name}
                                {company.is_vip && (
                                  <span className="ml-2 text-amber-500">⭐ VIP</span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Selector */}
            {contacts.length > 0 && (
              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar contacto..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.contact_name}
                            {contact.position && ` - ${contact.position}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Stage & Probability */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-update probability
                        const probs: Record<OpportunityStage, number> = {
                          discovery: 25,
                          proposal: 50,
                          negotiation: 75,
                          won: 100,
                          lost: 0,
                        };
                        form.setValue('probability', probs[value as OpportunityStage]);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
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
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probabilidad (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Value & Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_close_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Cierre Est.</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: es })
                            ) : (
                              <span>Seleccionar...</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={es}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe la oportunidad..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {opportunity ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
