import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Save, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

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

const BANKS = [
  { name: 'Creand', color: 'from-emerald-500 to-green-600', icon: '🏦' },
  { name: 'Morabanc', color: 'from-blue-500 to-indigo-600', icon: '🏛️' },
  { name: 'Andbank', color: 'from-amber-500 to-orange-600', icon: '🏢' }
];

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
        .from('company_bank_affiliations')
        .select('*')
        .eq('company_id', companyId)
        .order('priority_order');

      if (error) throw error;
      
      const affiliationsData = data || [];
      setAffiliations(affiliationsData);
      
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
    const total = percentages.Creand + percentages.Morabanc + percentages.Andbank;
    
    if (total !== 100) {
      toast.error(`La suma debe ser 100%. Actualmente: ${total}%`);
      return;
    }

    try {
      setSaving(true);

      const operations = BANKS.map(async (bank, index) => {
        const percentage = percentages[bank.name as keyof typeof percentages];
        const existing = affiliations.find(aff => aff.bank_name === bank.name);
        const priorityOrder = index + 1;
        const isPrimary = index === 0;

        if (existing) {
          return supabase
            .from('company_bank_affiliations')
            .update({
              affiliation_percentage: percentage,
              priority_order: priorityOrder,
              is_primary: isPrimary,
              active: true,
            })
            .eq('id', existing.id);
        } else if (percentage > 0) {
          return supabase
            .from('company_bank_affiliations')
            .insert({
              company_id: companyId,
              bank_name: bank.name,
              affiliation_percentage: percentage,
              priority_order: priorityOrder,
              is_primary: isPrimary,
              active: true,
            });
        }
        return Promise.resolve({ error: null });
      });

      const results = await Promise.all(operations);
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
  const isValid = totalPercentage === 100;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                Vinculación Bancaria
              </CardTitle>
              <CardDescription>
                Configure la distribución de vinculación entre las tres entidades
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold transition-colors ${
                isValid ? 'text-green-600' : 
                totalPercentage > 100 ? 'text-red-600' : 
                'text-orange-600'
              }`}>
                {totalPercentage}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {isValid ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Completo
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Falta {100 - totalPercentage}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <Progress value={Math.min(totalPercentage, 100)} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {BANKS.map((bank, index) => {
              const percentage = percentages[bank.name as keyof typeof percentages];
              return (
                <Card 
                  key={bank.name} 
                  className="relative overflow-hidden border-2 transition-all hover:shadow-lg"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bank.color}`} />
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{bank.icon}</span>
                        <CardTitle className="text-lg">{bank.name}</CardTitle>
                      </div>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Porcentaje
                        </span>
                        <div className={`text-3xl font-bold bg-gradient-to-r ${bank.color} bg-clip-text text-transparent`}>
                          {percentage}%
                        </div>
                      </div>
                      
                      <Slider
                        value={[percentage]}
                        onValueChange={([value]) => {
                          setPercentages({
                            ...percentages,
                            [bank.name]: value
                          });
                        }}
                        max={100}
                        step={1}
                        className="cursor-pointer"
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Progress 
                        value={percentage} 
                        className="h-1.5"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Estado de la vinculación
              </p>
              <p className="text-xs text-muted-foreground">
                {isValid 
                  ? 'La distribución es correcta y está lista para guardar' 
                  : 'Ajuste los porcentajes para que sumen exactamente 100%'
                }
              </p>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving || !isValid}
              size="lg"
              className="min-w-[200px]"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Vinculaciones
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {affiliations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Vinculaciones Actuales</CardTitle>
            <CardDescription>
              Distribución registrada en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {affiliations.map((affiliation) => {
                const bank = BANKS.find(b => b.name === affiliation.bank_name);
                return (
                  <div 
                    key={affiliation.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bank?.icon || '🏦'}</span>
                      <div>
                        <p className="font-medium">{affiliation.bank_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Prioridad {affiliation.priority_order}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {affiliation.affiliation_percentage || 0}%
                      </p>
                      {affiliation.is_primary && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Principal
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
