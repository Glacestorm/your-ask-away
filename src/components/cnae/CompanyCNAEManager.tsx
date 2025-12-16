import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Trash2, Star, Percent, Euro, Settings } from 'lucide-react';
import { useCNAEPricing } from '@/hooks/useCNAEPricing';
import { useToast } from '@/hooks/use-toast';

interface CompanyCNAE {
  id: string;
  company_id: string;
  cnae_code: string;
  is_primary: boolean;
  percentage_activity: number;
  license_price: number;
  discount_applied: number;
  valid_from: string;
  valid_until: string | null;
}

interface CompanyCNAEManagerProps {
  companyId: string;
  companyName?: string;
  companyTurnover?: number;
  onCnaeChange?: () => void;
}

export function CompanyCNAEManager({
  companyId,
  companyName,
  companyTurnover,
  onCnaeChange
}: CompanyCNAEManagerProps) {
  const [companyCnaes, setCompanyCnaes] = useState<CompanyCNAE[]>([]);
  const [availableCnaes, setAvailableCnaes] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCnaeCode, setNewCnaeCode] = useState('');
  const [newPercentage, setNewPercentage] = useState([100]);
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    fetchCompanyCnaes,
    fetchCNAEPricing,
    addCompanyCnae,
    removeCompanyCnae,
    calculatePricing,
    getComplexityTierColor
  } = useCNAEPricing();

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cnaes, pricing] = await Promise.all([
        fetchCompanyCnaes(companyId),
        fetchCNAEPricing()
      ]);
      setCompanyCnaes(cnaes || []);
      setAvailableCnaes(pricing || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCnae = async () => {
    if (!newCnaeCode) return;

    try {
      await addCompanyCnae(companyId, newCnaeCode, newIsPrimary, newPercentage[0]);
      await loadData();
      setIsAddDialogOpen(false);
      setNewCnaeCode('');
      setNewPercentage([100]);
      setNewIsPrimary(false);
      onCnaeChange?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRemoveCnae = async (cnaeId: string) => {
    try {
      await removeCompanyCnae(cnaeId);
      await loadData();
      onCnaeChange?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const totalLicenseCost = companyCnaes.reduce((sum, c) => sum + (c.license_price || 0), 0);
  const totalDiscount = companyCnaes.reduce((sum, c) => sum + (c.discount_applied || 0), 0);

  const filteredAvailableCnaes = availableCnaes.filter(
    cnae => !companyCnaes.some(cc => cc.cnae_code === cnae.cnae_code)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              CNAEs de {companyName || 'Empresa'}
            </CardTitle>
            <CardDescription>
              Gestiona los códigos CNAE y licencias asociadas
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir CNAE
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir CNAE</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Código CNAE</Label>
                  <Input
                    value={newCnaeCode}
                    onChange={(e) => setNewCnaeCode(e.target.value)}
                    placeholder="Buscar CNAE..."
                  />
                  {newCnaeCode && (
                    <ScrollArea className="h-40 border rounded-md p-2">
                      {filteredAvailableCnaes
                        .filter(c => c.cnae_code.includes(newCnaeCode))
                        .slice(0, 10)
                        .map(cnae => (
                          <div
                            key={cnae.cnae_code}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => setNewCnaeCode(cnae.cnae_code)}
                          >
                            <div>
                              <span className="font-medium">{cnae.cnae_code}</span>
                              <span className="text-muted-foreground ml-2 text-sm">
                                {cnae.sector_category}
                              </span>
                            </div>
                            <Badge className={getComplexityTierColor(cnae.complexity_tier)}>
                              {cnae.base_price?.toLocaleString()}€
                            </Badge>
                          </div>
                        ))}
                    </ScrollArea>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>% Actividad: {newPercentage[0]}%</Label>
                  <Slider
                    value={newPercentage}
                    onValueChange={setNewPercentage}
                    max={100}
                    min={1}
                    step={1}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>CNAE Principal</Label>
                  <Switch
                    checked={newIsPrimary}
                    onCheckedChange={setNewIsPrimary}
                  />
                </div>

                <Button onClick={handleAddCnae} className="w-full" disabled={!newCnaeCode}>
                  Añadir CNAE
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">CNAEs Activos</div>
              <div className="text-2xl font-bold">{companyCnaes.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/10">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Coste Total</div>
              <div className="text-2xl font-bold text-primary">
                {totalLicenseCost.toLocaleString()}€
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-100 dark:bg-green-900/30">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Descuento</div>
              <div className="text-2xl font-bold text-green-600">
                {totalDiscount}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CNAE Table */}
        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : companyCnaes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay CNAEs asociados a esta empresa
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CNAE</TableHead>
                <TableHead>% Actividad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companyCnaes.map((cnae) => {
                const pricingInfo = availableCnaes.find(a => a.cnae_code === cnae.cnae_code);
                return (
                  <TableRow key={cnae.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cnae.is_primary && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="font-mono">{cnae.cnae_code}</span>
                        {pricingInfo && (
                          <Badge 
                            variant="outline" 
                            className={getComplexityTierColor(pricingInfo.complexity_tier)}
                          >
                            {pricingInfo.complexity_tier}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        {cnae.percentage_activity}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-3 w-3 text-muted-foreground" />
                        {cnae.license_price?.toLocaleString() || '0'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cnae.discount_applied > 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          -{cnae.discount_applied}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCnae(cnae.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
