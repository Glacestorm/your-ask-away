import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, CheckCircle2, AlertCircle, Building2, Calculator, Hand } from 'lucide-react';

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
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [percentages, setPercentages] = useState({
    Creand: 0,
    Morabanc: 0,
    Andbank: 0,
  });
  
  // Financial data for automatic calculation
  const [facturacionAnual, setFacturacionAnual] = useState<number>(0);
  const [periodoFacturacion, setPeriodoFacturacion] = useState<string>('anual');
  const [ingresosCreand, setIngresosCreand] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch affiliations
      const { data: affiliationsData, error: affiliationsError } = await supabase
        .from('company_bank_affiliations')
        .select('*')
        .eq('company_id', companyId)
        .order('priority_order');

      if (affiliationsError) throw affiliationsError;
      
      const affiliationsList = affiliationsData || [];
      setAffiliations(affiliationsList);
      
      // Fetch company financial data
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('facturacion_anual, periodo_facturacion, ingresos_creand, vinculacion_modo')
        .eq('id', companyId)
        .single();

      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      
      if (companyData) {
        setFacturacionAnual(companyData.facturacion_anual || 0);
        setPeriodoFacturacion(companyData.periodo_facturacion || 'anual');
        setIngresosCreand(companyData.ingresos_creand || 0);
        setIsAutomatic(companyData.vinculacion_modo === 'automatica');
      }
      
      // Set percentages from affiliations
      const newPercentages = { Creand: 0, Morabanc: 0, Andbank: 0 };
      affiliationsList.forEach((aff: BankAffiliation) => {
        if (aff.bank_name in newPercentages) {
          newPercentages[aff.bank_name as keyof typeof newPercentages] = aff.affiliation_percentage || 0;
        }
      });
      setPercentages(newPercentages);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateAutomaticPercentages = () => {
    if (facturacionAnual <= 0) {
      toast.error('Debe ingresar la facturación anual para el cálculo automático');
      return;
    }

    // Calculate Creand percentage based on revenue
    const creandPercentage = Math.min(100, Math.round((ingresosCreand / facturacionAnual) * 100));
    
    // Distribute remaining percentage between Morabanc and Andbank
    const remaining = 100 - creandPercentage;
    const morabancPercentage = Math.round(remaining * 0.6); // 60% of remaining
    const andbankPercentage = remaining - morabancPercentage; // Rest to Andbank

    setPercentages({
      Creand: creandPercentage,
      Morabanc: morabancPercentage,
      Andbank: andbankPercentage,
    });

    toast.success('Porcentajes calculados automáticamente');
  };

  const handleSave = async () => {
    const total = percentages.Creand + percentages.Morabanc + percentages.Andbank;
    
    if (total !== 100) {
      toast.error(`La suma debe ser 100%. Actualmente: ${total}%`);
      return;
    }

    try {
      setSaving(true);

      // Save company financial data
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          facturacion_anual: facturacionAnual,
          periodo_facturacion: periodoFacturacion,
          ingresos_creand: ingresosCreand,
          vinculacion_modo: isAutomatic ? 'automatica' : 'manual',
        })
        .eq('id', companyId);

      if (companyError) throw companyError;

      // Save bank affiliations
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
      fetchData();
    } catch (error: any) {
      console.error('Error saving:', error);
      toast.error(error.message || 'Error al guardar');
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
    <div className="space-y-4 pb-6">
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Vinculación Bancaria
              </CardTitle>
              <CardDescription>
                Configure la distribución entre las tres entidades
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold transition-colors ${
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
          
          <div className="pt-3">
            <Progress value={Math.min(totalPercentage, 100)} className="h-1.5" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mode selector */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isAutomatic ? (
                    <Calculator className="h-4 w-4 text-primary" />
                  ) : (
                    <Hand className="h-4 w-4 text-primary" />
                  )}
                  <Label htmlFor="mode" className="font-medium">
                    {isAutomatic ? 'Cálculo Automático' : 'Configuración Manual'}
                  </Label>
                </div>
                <Switch
                  id="mode"
                  checked={isAutomatic}
                  onCheckedChange={setIsAutomatic}
                />
              </div>

              {isAutomatic && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Facturación Anual (€)</Label>
                      <Input
                        type="number"
                        value={facturacionAnual || ''}
                        onChange={(e) => setFacturacionAnual(Number(e.target.value))}
                        placeholder="Ej: 1000000"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Periodo</Label>
                      <Select value={periodoFacturacion} onValueChange={setPeriodoFacturacion}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semestral">Semestral</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ingresos por Creand (€)</Label>
                    <Input
                      type="number"
                      value={ingresosCreand || ''}
                      onChange={(e) => setIngresosCreand(Number(e.target.value))}
                      placeholder="Ej: 450000"
                      className="h-9"
                    />
                  </div>
                  <Button 
                    onClick={calculateAutomaticPercentages}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Calculator className="h-3 w-3 mr-2" />
                    Calcular Automáticamente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank sliders */}
          <div className="grid gap-3">
            {BANKS.map((bank, index) => {
              const percentage = percentages[bank.name as keyof typeof percentages];
              return (
                <Card key={bank.name} className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{bank.icon}</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{bank.name}</span>
                            {index === 0 && (
                              <Badge variant="default" className="text-[10px] h-4 px-1.5">Principal</Badge>
                            )}
                          </div>
                          <div className={`text-xl font-bold bg-gradient-to-r ${bank.color} bg-clip-text text-transparent`}>
                            {percentage}%
                          </div>
                        </div>
                        <Slider
                          value={[percentage]}
                          onValueChange={([value]) => {
                            if (!isAutomatic) {
                              setPercentages({
                                ...percentages,
                                [bank.name]: value
                              });
                            }
                          }}
                          max={100}
                          step={1}
                          disabled={isAutomatic}
                          className={isAutomatic ? 'opacity-50' : 'cursor-pointer'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Save button */}
          <div className="pt-2">
            <Button 
              onClick={handleSave} 
              disabled={saving || !isValid}
              size="lg"
              className="w-full"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Todo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
