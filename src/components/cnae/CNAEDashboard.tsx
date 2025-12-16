import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Calculator, Package, LayoutDashboard, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CNAEPricingCalculator } from './CNAEPricingCalculator';
import { CompanyCNAEManager } from './CompanyCNAEManager';
import { HoldingDashboard } from './HoldingDashboard';
import { BundleSuggestions } from './BundleSuggestions';
import { CNAEPricingAdmin } from './CNAEPricingAdmin';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  name: string;
  turnover: number | null;
  cnae: string | null;
}

export function CNAEDashboard() {
  const { isSuperAdmin, isCommercialDirector } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyCnaes, setCompanyCnaes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      setSelectedCompany(company || null);
      loadCompanyCnaes(selectedCompanyId);
    } else {
      setSelectedCompany(null);
      setCompanyCnaes([]);
    }
  }, [selectedCompanyId, companies]);

  const loadCompanies = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, turnover, cnae')
      .order('name');

    if (data) {
      setCompanies(data);
    }
    setIsLoading(false);
  };

  const loadCompanyCnaes = async (companyId: string) => {
    const { data } = await supabase
      .from('company_cnaes')
      .select('cnae_code')
      .eq('company_id', companyId);

    if (data) {
      setCompanyCnaes(data.map(c => c.cnae_code));
    }
  };

  const handleCnaeChange = () => {
    if (selectedCompanyId) {
      loadCompanyCnaes(selectedCompanyId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sistema Multi-CNAE per a Holdings
          </CardTitle>
          <CardDescription>
            Gestiona múltiples sectors (CNAEs) per empresa amb pricing dinàmic i bundles intel·ligents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger className="w-[350px]">
                <SelectValue placeholder="Selecciona una empresa..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center gap-2">
                      <span>{company.name}</span>
                      {company.cnae && (
                        <Badge variant="outline" className="text-xs">
                          {company.cnae}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCompany && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Facturació:</span>
                <Badge variant="secondary">
                  {selectedCompany.turnover 
                    ? `${(selectedCompany.turnover / 1000000).toFixed(1)}M €`
                    : 'No especificada'}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2" disabled={!selectedCompanyId}>
            <Building2 className="h-4 w-4" />
            CNAEs Empresa
          </TabsTrigger>
          <TabsTrigger value="bundles" className="flex items-center gap-2" disabled={companyCnaes.length === 0}>
            <Package className="h-4 w-4" />
            Bundles
          </TabsTrigger>
          <TabsTrigger value="holding" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Holdings 360°
          </TabsTrigger>
          {(isSuperAdmin || isCommercialDirector) && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Admin Pricing
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pricing" className="mt-6">
          <CNAEPricingCalculator />
        </TabsContent>

        <TabsContent value="manager" className="mt-6">
          {selectedCompanyId ? (
            <CompanyCNAEManager
              companyId={selectedCompanyId}
              companyName={selectedCompany?.name}
              companyTurnover={selectedCompany?.turnover || undefined}
              onCnaeChange={handleCnaeChange}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Selecciona una empresa per gestionar els seus CNAEs
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bundles" className="mt-6">
          <BundleSuggestions
            currentCnaes={companyCnaes}
            companySector={selectedCompany?.cnae || undefined}
            companyTurnover={selectedCompany?.turnover || undefined}
            onAddCnae={handleCnaeChange}
          />
        </TabsContent>

        <TabsContent value="holding" className="mt-6">
          <HoldingDashboard />
        </TabsContent>

        {(isSuperAdmin || isCommercialDirector) && (
          <TabsContent value="admin" className="mt-6">
            <CNAEPricingAdmin />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
