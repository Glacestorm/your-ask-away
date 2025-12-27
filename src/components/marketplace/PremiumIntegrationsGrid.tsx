import { usePremiumIntegrations } from '@/hooks/useMarketplace';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, ExternalLink, CheckCircle2 } from 'lucide-react';
import { INTEGRATION_CATEGORY_LABELS } from '@/types/marketplace';
import type { PremiumIntegration } from '@/types/marketplace';

interface PremiumIntegrationCardProps {
  integration: PremiumIntegration;
}

function PremiumIntegrationCard({ integration }: PremiumIntegrationCardProps) {
  const certificationColors = {
    basic: 'bg-gray-500/20 text-gray-700 dark:text-gray-300',
    certified: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
    premium: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
    enterprise: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
  };

  const features = Array.isArray(integration.features) 
    ? integration.features 
    : [];

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01]">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="h-16 w-16 rounded-xl bg-white dark:bg-slate-800 border border-border/50 flex items-center justify-center flex-shrink-0 p-2">
            {integration.logo_url ? (
              <img 
                src={integration.logo_url} 
                alt={integration.integration_name} 
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-2xl font-bold text-primary ${integration.logo_url ? 'hidden' : ''}`}>
              {integration.integration_name.charAt(0)}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">
                {integration.integration_name}
              </h4>
              <Badge 
                variant="secondary" 
                className={`text-xs ${certificationColors[integration.certification_level]}`}
              >
                <Award className="h-3 w-3 mr-1" />
                {integration.certification_level.charAt(0).toUpperCase() + integration.certification_level.slice(1)}
              </Badge>
              {integration.is_featured && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                  Destacado
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {integration.provider} • {INTEGRATION_CATEGORY_LABELS[integration.category]}
            </p>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {integration.description}
            </p>

            {/* Features */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {features.slice(0, 3).map((feature, idx) => (
                  <span 
                    key={idx} 
                    className="text-xs text-muted-foreground flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {feature as string}
                  </span>
                ))}
              </div>
            )}

            {/* Regions */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted-foreground">Regiones:</span>
              {integration.supported_regions.map((region) => (
                <Badge key={region} variant="outline" className="text-xs">
                  {region}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="shrink-0">
            {integration.documentation_url && (
              <a 
                href={integration.documentation_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Docs
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PremiumIntegrationsGridProps {
  category?: string;
  limit?: number;
}

export function PremiumIntegrationsGrid({ category, limit }: PremiumIntegrationsGridProps) {
  const { data: integrations, isLoading } = usePremiumIntegrations(category);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Integraciones Premium Certificadas
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const displayIntegrations = limit ? integrations?.slice(0, limit) : integrations;

  if (!displayIntegrations || displayIntegrations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          Integraciones Premium Certificadas
        </h3>
        <Badge variant="secondary">
          {displayIntegrations.length} integraciones
        </Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayIntegrations.map((integration) => (
          <PremiumIntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </div>
  );
}

export default PremiumIntegrationsGrid;
