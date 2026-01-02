import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Plus, 
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SEPAMandate {
  id: string;
  mandate_reference: string;
  signature_date: string;
  mandate_type: string;
  iban: string;
  debtor_name: string;
  status: string;
  created_at: string;
}

interface SEPAMandatesManagerProps {
  companyId: string;
}

export function SEPAMandatesManager({ companyId }: SEPAMandatesManagerProps) {
  const [mandates, setMandates] = useState<SEPAMandate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMandates();
  }, [companyId]);

  const fetchMandates = async () => {
    try {
      const { data, error } = await supabase
        .from('erp_sepa_mandates')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMandates(data || []);
    } catch (err) {
      console.error('[SEPAMandatesManager] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Activo</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const maskIBAN = (iban: string) => {
    if (!iban || iban.length < 10) return iban;
    return `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Mandatos SEPA
        </h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Mandato
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : mandates.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay mandatos SEPA</p>
              <p className="text-sm text-muted-foreground mt-1">
                Los mandatos autorizan adeudos directos en cuentas de clientes
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {mandates.map((mandate) => (
                <div key={mandate.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{mandate.debtor_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {maskIBAN(mandate.iban)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{mandate.mandate_reference}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(mandate.signature_date), 'dd/MM/yyyy')}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {mandate.mandate_type}
                        </Badge>
                        {getStatusBadge(mandate.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SEPAMandatesManager;
