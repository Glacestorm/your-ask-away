import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PartnerApplication } from '@/types/marketplace';
import { APP_CATEGORY_LABELS } from '@/types/marketplace';

interface AppCardProps {
  app: PartnerApplication;
  showCategory?: boolean;
}

export function AppCard({ app, showCategory = true }: AppCardProps) {
  const formatPrice = () => {
    if (app.price_type === 'free') return 'Gratis';
    const amount = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: app.price_currency,
    }).format(app.price_amount);
    if (app.price_type === 'subscription') {
      return `${amount}/${app.billing_period === 'yearly' ? 'año' : 'mes'}`;
    }
    return amount;
  };

  return (
    <Link to={`/marketplace/${app.app_key}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* App Icon */}
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
              {app.icon_url ? (
                <img 
                  src={app.icon_url} 
                  alt={app.app_name} 
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {app.app_name.charAt(0)}
                </span>
              )}
            </div>

            {/* App Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {app.app_name}
                </h3>
                {app.is_certified && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Certificado
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {app.short_description || app.description?.substring(0, 100)}
              </p>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {app.rating_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {app.rating_average.toFixed(1)}
                    <span className="text-muted-foreground/70">({app.rating_count})</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Download className="h-3 w-3" />
                  {app.install_count.toLocaleString()}
                </span>
                {showCategory && (
                  <Badge variant="outline" className="text-xs">
                    {APP_CATEGORY_LABELS[app.category]}
                  </Badge>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-right shrink-0">
              <span className={`text-sm font-medium ${app.price_type === 'free' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                {formatPrice()}
              </span>
              {app.is_premium && (
                <Badge className="mt-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                  Premium
                </Badge>
              )}
            </div>
          </div>

          {/* Tags */}
          {app.tags && app.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {app.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {app.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{app.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default AppCard;
