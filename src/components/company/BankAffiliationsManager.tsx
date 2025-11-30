import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface BankAffiliation {
  id: string;
  company_id: string;
  bank_name: string;
  affiliation_percentage: number | null;
  priority_order: number;
  is_primary: boolean | null;
  active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface Props {
  companyId: string;
}

const BANKS = ['Creand', 'Morabanc', 'Andbank'];

export function BankAffiliationsManager({ companyId }: Props) {
  const [affiliations, setAffiliations] = useState<BankAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [percentages, setPercentages] = useState({
    Creand: 0,
    Morabanc: 0,
    Andbank: 0,
  });

  useEffect(() => {
    fetchAffiliations();
  }, [companyId]);

  const fetchAffiliations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_bank_affiliations' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('priority_order');

      if (error) throw error;
      
      const affiliationsData = data as any || [];
      setAffiliations(affiliationsData);
      
      // Cargar porcentajes existentes
      const newPercentages = { Creand: 0, Morabanc: 0, Andbank: 0 };
      affiliationsData.forEach((aff: BankAffiliation) => {
        if (aff.bank_name in newPercentages) {
          newPercentages[aff.bank_name as keyof typeof newPercentages] = aff.affiliation_percentage || 0;
        }
      });
      setPercentages(newPercentages);
    } catch (error: any) {
      console.error('Error fetching affiliations:', error);
      toast.error('Error al cargar vinculaciones bancarias');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar que la suma sea 100%
    const total = percentages.Creand + percentages.Morabanc + percentages.Andbank;
    
    if (total !== 100) {
      toast.error(`La suma de porcentajes debe ser 100%. Actualmente: ${total}%`);
      return;
    }

    try {
      setSaving(true);

      // Preparar las operaciones para las 3 entidades
      const operations = BANKS.map(async (bankName, index) => {
        const percentage = percentages[bankName as keyof typeof percentages];
        const existing = affiliations.find(aff => aff.bank_name === bankName);
        const priorityOrder = index + 1;
        const isPrimary = index === 0; // Creand es principal

        if (existing) {
          // Actualizar existente
          return supabase
            .from('company_bank_affiliations' as any)
            .update({
              affiliation_percentage: percentage,
              priority_order: priorityOrder,
              is_primary: isPrimary,
              active: true,
            })
            .eq('id', existing.id);
        } else if (percentage > 0) {
          // Insertar nuevo si tiene porcentaje
          return supabase
            .from('company_bank_affiliations' as any)
            .insert({
              company_id: companyId,
              bank_name: bankName,
              affiliation_percentage: percentage,
              priority_order: priorityOrder,
              is_primary: isPrimary,
              active: true,
            });
        }
        return Promise.resolve({ error: null });
      });

      // Ejecutar todas las operaciones en paralelo
      const results = await Promise.all(operations);
      
      // Verificar errores
      const errors = results.filter(r => r?.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }

      toast.success('Vinculaciones guardadas correctamente');
      fetchAffiliations();
    } catch (error: any) {
      console.error('Error saving affiliations:', error);
      toast.error(error.message || 'Error al guardar vinculaciones');
    } finally {
      setSaving(false);
    }
  };

  const totalPercentage = percentages.Creand + percentages.Morabanc + percentages.Andbank;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Vinculación Bancaria</CardTitle>
          <CardDescription>
            Configure los porcentajes de vinculación con las 3 entidades
          </CardDescription>
          <div className={`mt-2 text-sm font-medium ${
            totalPercentage === 100 ? 'text-green-600' : 
            totalPercentage > 100 ? 'text-red-600' : 
            'text-orange-600'
          }`}>
            Total vinculación: {totalPercentage}%
            {totalPercentage !== 100 && ` (Debe sumar 100%)`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground">Cargando...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {BANKS.map((bank, index) => (
                <div key={bank} className="space-y-2">
                  <Label htmlFor={bank} className="flex items-center gap-2">
                    {bank}
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">Principal</Badge>
                    )}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={bank}
                      type="number"
                      min="0"
                      max="100"
                      value={percentages[bank as keyof typeof percentages]}
                      onChange={(e) => setPercentages({
                        ...percentages,
                        [bank]: Number(e.target.value)
                      })}
                      className="text-lg font-semibold"
                    />
                    <span className="text-lg font-medium text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleSave} 
                disabled={saving || totalPercentage !== 100}
                size="lg"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Vinculaciones'}
              </Button>
            </div>

            {affiliations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Vinculaciones Actuales</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Banco</TableHead>
                      <TableHead>% Vinculación</TableHead>
                      <TableHead>Prioridad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliations.map((affiliation) => (
                      <TableRow 
                        key={affiliation.id}
                        className={affiliation.is_primary ? 'bg-primary/5' : ''}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {affiliation.bank_name}
                            {affiliation.is_primary && (
                              <Badge variant="default" className="text-xs">Principal</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-lg">
                            {affiliation.affiliation_percentage || 0}%
                          </span>
                        </TableCell>
                        <TableCell>{affiliation.priority_order}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
