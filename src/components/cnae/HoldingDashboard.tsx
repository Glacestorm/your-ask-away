import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, TrendingUp, PieChart, Euro, Package, 
  Users, FileText, BarChart3, Settings, RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCNAEPricing } from '@/hooks/useCNAEPricing';
import { CNAEPricingCalculator } from './CNAEPricingCalculator';
import { BundleSuggestions } from './BundleSuggestions';

interface HoldingCompany {
  id: string;
  name: string;
  turnover: number;
  cnaes: string[];
  totalLicense: number;
  sector: string;
}

interface HoldingDashboardProps {
  parentCompanyId?: string;
}

export function HoldingDashboard({ parentCompanyId }: HoldingDashboardProps) {
  const [holdingCompanies, setHoldingCompanies] = useState<HoldingCompany[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allCnaes, setAllCnaes] = useState<string[]>([]);
  const { calculatePricing, pricingResult } = useCNAEPricing();

  useEffect(() => {
    loadHoldingData();
  }, [parentCompanyId]);

  const loadHoldingData = async () => {
    setIsLoading(true);
    try {
      // Get holding subscription if exists
      if (parentCompanyId) {
        const { data: sub } = await supabase
          .from('holding_subscriptions')
          .select('*')
          .eq('parent_company_id', parentCompanyId)
          .eq('is_active', true)
          .single();
        setSubscription(sub);
      }

      // Get companies with CNAEs (simplified approach without consolidation_groups dependency)
      const { data: companiesWithCnaes } = await supabase
        .from('company_cnaes')
        .select('company_id, cnae_code, license_price');

      // Group by company
      const companyIds = [...new Set(companiesWithCnaes?.map(c => c.company_id) || [])];
      
      // Get company details
      const { data: companyDetails } = await supabase
        .from('companies')
        .select('id, name, facturacion_anual, sector')
        .in('id', companyIds.slice(0, 20)); // Limit for performance

      const companies: HoldingCompany[] = [];
      const allCnaesList: string[] = [];

      for (const company of companyDetails || []) {
        const companyCnaes = companiesWithCnaes?.filter(c => c.company_id === company.id) || [];
        const cnaeList = companyCnaes.map(c => c.cnae_code);
        allCnaesList.push(...cnaeList);

        companies.push({
          id: company.id,
          name: company.name,
          turnover: company.facturacion_anual || 0,
          cnaes: cnaeList,
          totalLicense: companyCnaes.reduce((sum, c) => sum + (c.license_price || 0), 0),
          sector: company.sector || 'general'
        });
      }

      setHoldingCompanies(companies);
      setAllCnaes([...new Set(allCnaesList)]);

      // Calculate consolidated pricing
      if (allCnaesList.length > 0) {
        await calculatePricing([...new Set(allCnaesList)]);
      }
    } catch (error) {
      console.error('Error loading holding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalCompanies = holdingCompanies.length;
  const totalTurnover = holdingCompanies.reduce((sum, c) => sum + c.turnover, 0);
  const totalLicense = holdingCompanies.reduce((sum, c) => sum + c.totalLicense, 0);
  const uniqueSectors = [...new Set(holdingCompanies.map(c => c.sector))];

  // Group CNAEs by sector
  const cnaesBySector = holdingCompanies.reduce((acc, company) => {
    if (!acc[company.sector]) acc[company.sector] = [];
    acc[company.sector].push(...company.cnaes);
    return acc;
  }, {} as Record<string, string[]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          Cargando datos del holding...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Empresas
            </div>
            <div className="text-2xl font-bold">{totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Facturación Total
            </div>
            <div className="text-2xl font-bold">
              {(totalTurnover / 1000000).toFixed(1)}M€
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              CNAEs Activos
            </div>
            <div className="text-2xl font-bold">{allCnaes.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-primary/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Euro className="h-4 w-4" />
              Coste Total Licencias
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalLicense.toLocaleString()}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Tier */}
      {subscription && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="default" className="mb-2">
                  {subscription.subscription_tier.toUpperCase()}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Descuento por volumen: {subscription.volume_discount}%
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {subscription.annual_total?.toLocaleString()}€/año
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription.monthly_total?.toLocaleString()}€/mes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">
            <PieChart className="h-4 w-4 mr-2" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="companies">
            <Building2 className="h-4 w-4 mr-2" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Package className="h-4 w-4 mr-2" />
            Bundles
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <BarChart3 className="h-4 w-4 mr-2" />
            Calculadora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Sector Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Sector</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(cnaesBySector).map(([sector, cnaes]) => {
                  const percentage = (cnaes.length / allCnaes.length) * 100;
                  return (
                    <div key={sector} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{sector}</span>
                        <span>{cnaes.length} CNAEs ({percentage.toFixed(0)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Consolidated Pricing */}
          {pricingResult && (
            <Card>
              <CardHeader>
                <CardTitle>Pricing Consolidado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Precio sin descuento</p>
                    <p className="text-xl font-bold">
                      {pricingResult.summary.total_base_price.toLocaleString()}€
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precio con descuento</p>
                    <p className="text-xl font-bold text-primary">
                      {pricingResult.summary.total_final_price.toLocaleString()}€
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Ahorro total</p>
                    <p className="text-xl font-bold text-green-600">
                      {pricingResult.summary.total_savings.toLocaleString()}€ 
                      ({pricingResult.summary.savings_percentage}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Empresas del Holding</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {holdingCompanies.map((company) => (
                    <Card key={company.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{company.name}</h4>
                          <Badge variant="outline">{company.sector}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Facturación</p>
                            <p className="font-medium">
                              {(company.turnover / 1000000).toFixed(1)}M€
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CNAEs</p>
                            <p className="font-medium">{company.cnaes.length}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Licencia</p>
                            <p className="font-medium text-primary">
                              {company.totalLicense.toLocaleString()}€
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {company.cnaes.map((cnae) => (
                            <Badge key={cnae} variant="secondary" className="text-xs">
                              {cnae}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bundles">
          <BundleSuggestions 
            currentCnaes={allCnaes}
            companyTurnover={totalTurnover}
          />
        </TabsContent>

        <TabsContent value="calculator">
          <CNAEPricingCalculator 
            companyTurnover={totalTurnover}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
