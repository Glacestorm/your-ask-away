import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Sparkles, TrendingUp, Check, Plus, ArrowRight } from 'lucide-react';
import { useCNAEPricing, BundleSuggestion } from '@/hooks/useCNAEPricing';

interface BundleSuggestionsProps {
  currentCnaes: string[];
  companySector?: string;
  companyTurnover?: number;
  onAddCnae?: (cnaeCode: string) => void;
}

export function BundleSuggestions({
  currentCnaes,
  companySector,
  companyTurnover,
  onAddCnae
}: BundleSuggestionsProps) {
  const {
    isLoading,
    bundleSuggestions,
    suggestBundles
  } = useCNAEPricing();

  useEffect(() => {
    if (currentCnaes.length > 0) {
      suggestBundles(currentCnaes, companySector, companyTurnover);
    }
  }, [currentCnaes, companySector, companyTurnover]);

  if (currentCnaes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          Selecciona al menos un CNAE para ver sugerencias de bundles
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 animate-pulse text-primary" />
          Analizando opciones de bundles...
        </CardContent>
      </Card>
    );
  }

  if (!bundleSuggestions) return null;

  const qualifyingBundles = bundleSuggestions.bundle_suggestions.filter(b => b.qualifies_for_discount);
  const potentialBundles = bundleSuggestions.bundle_suggestions.filter(b => !b.qualifies_for_discount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bundles y Descuentos
        </CardTitle>
        <CardDescription>
          Optimiza tu inversión con packs sectoriales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Recommendations */}
        {bundleSuggestions.ai_recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Recomendaciones IA
            </h4>
            <div className="space-y-2">
              {bundleSuggestions.ai_recommendations.map((rec, i) => (
                <div 
                  key={i}
                  className="p-3 bg-primary/5 rounded-lg text-sm"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Qualifying Bundles */}
        {qualifyingBundles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Bundles Activos
            </h4>
            {qualifyingBundles.map((bundle) => (
              <BundleCard 
                key={bundle.bundle_id} 
                bundle={bundle} 
                isActive 
                onAddCnae={onAddCnae}
              />
            ))}
          </div>
        )}

        {/* Potential Bundles */}
        {potentialBundles.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Bundles Disponibles
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-3 pr-4">
                {potentialBundles.map((bundle) => (
                  <BundleCard 
                    key={bundle.bundle_id} 
                    bundle={bundle}
                    onAddCnae={onAddCnae}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Complementary CNAEs */}
        {bundleSuggestions.complementary_cnaes.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">CNAEs Complementarios</h4>
            <div className="flex flex-wrap gap-2">
              {bundleSuggestions.complementary_cnaes.map((cnae) => (
                <Badge
                  key={cnae.cnae_code}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => onAddCnae?.(cnae.cnae_code)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cnae.cnae_code} ({cnae.sector})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface BundleCardProps {
  bundle: BundleSuggestion;
  isActive?: boolean;
  onAddCnae?: (cnaeCode: string) => void;
}

function BundleCard({ bundle, isActive, onAddCnae }: BundleCardProps) {
  return (
    <Card className={isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="font-medium">{bundle.bundle_name}</h5>
            <p className="text-sm text-muted-foreground">{bundle.bundle_description}</p>
          </div>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className={isActive ? 'bg-green-600' : ''}
          >
            -{bundle.discount_percentage}%
          </Badge>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progreso</span>
            <span>{bundle.completion_percentage}%</span>
          </div>
          <Progress value={bundle.completion_percentage} className="h-2" />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Tienes:</span>
          <div className="flex flex-wrap gap-1">
            {bundle.matching_cnaes.map((cnae) => (
              <Badge key={cnae} variant="outline" className="text-xs">
                {cnae}
              </Badge>
            ))}
          </div>
        </div>

        {bundle.missing_cnaes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Faltan:</span>
              <div className="flex flex-wrap gap-1">
                {bundle.missing_cnaes.slice(0, 3).map((cnae) => (
                  <Badge 
                    key={cnae} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => onAddCnae?.(cnae)}
                  >
                    <Plus className="h-2 w-2 mr-1" />
                    {cnae}
                  </Badge>
                ))}
                {bundle.missing_cnaes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{bundle.missing_cnaes.length - 3} más
                  </Badge>
                )}
              </div>
            </div>

            {bundle.potential_savings > 0 && (
              <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                <span>Ahorro potencial:</span>
                <span className="font-medium text-green-600">
                  {bundle.potential_savings.toLocaleString()}€
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
