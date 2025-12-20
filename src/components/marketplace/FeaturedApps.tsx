import { useMarketplaceApps } from '@/hooks/useMarketplace';
import { AppCard } from './AppCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export function FeaturedApps() {
  const { data: apps, isLoading } = useMarketplaceApps(undefined, true);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Apps Destacadas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!apps || apps.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-500" />
        Apps Destacadas
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.slice(0, 6).map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

export default FeaturedApps;
