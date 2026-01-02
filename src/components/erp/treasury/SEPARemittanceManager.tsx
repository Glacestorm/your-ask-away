import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Plus, 
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SEPARemittance {
  id: string;
  remittance_number?: string;
  remittance_type: string;
  status: string;
  presentation_date: string;
  charge_date: string;
  total_amount: number;
  currency_code: string;
  created_at: string;
}

interface SEPARemittanceManagerProps {
  companyId: string;
}

export function SEPARemittanceManager({ companyId }: SEPARemittanceManagerProps) {
  const [remittances, setRemittances] = useState<SEPARemittance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRemittances();
  }, [companyId]);

  const fetchRemittances = async () => {
    try {
      const { data, error } = await supabase
        .from('erp_sepa_remittances')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRemittances(data || []);
    } catch (err) {
      console.error('[SEPARemittanceManager] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Enviada</Badge>;
      case 'generated':
        return <Badge className="bg-blue-500"><Download className="h-3 w-3 mr-1" />Generada</Badge>;
      case 'validated':
        return <Badge className="bg-yellow-500"><CheckCircle className="h-3 w-3 mr-1" />Validada</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Borrador</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'SDD_CORE':
        return 'Adeudo CORE';
      case 'SDD_B2B':
        return 'Adeudo B2B';
      case 'SCT':
        return 'Transferencia';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Remesas SEPA
        </h3>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Remesa
        </Button>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : remittances.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No hay remesas SEPA</p>
              <p className="text-sm text-muted-foreground mt-1">Crea una remesa para agrupar cobros o pagos</p>
            </div>
          ) : (
            <div className="divide-y">
              {remittances.map((remittance) => (
                <div key={remittance.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{remittance.remittance_number || 'Sin número'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {getTypeLabel(remittance.remittance_type)}
                          </Badge>
                          <span>
                            Cargo: {format(new Date(remittance.charge_date), 'dd/MM/yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-bold">
                          {remittance.currency_code} {remittance.total_amount?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(remittance.created_at), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      {getStatusBadge(remittance.status)}
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

export default SEPARemittanceManager;
