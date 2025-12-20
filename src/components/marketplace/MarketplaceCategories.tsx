import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Receipt, 
  Landmark, 
  Truck, 
  BarChart3, 
  Briefcase, 
  MessageSquare, 
  Shield, 
  Layers 
} from 'lucide-react';
import type { AppCategory } from '@/types/marketplace';
import { APP_CATEGORY_LABELS } from '@/types/marketplace';

interface MarketplaceCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  counts?: Record<string, number>;
}

const CATEGORY_ICONS: Record<AppCategory, React.ReactNode> = {
  erp: <Building2 className="h-5 w-5" />,
  crm: <Users className="h-5 w-5" />,
  fiscal: <Receipt className="h-5 w-5" />,
  banking: <Landmark className="h-5 w-5" />,
  logistics: <Truck className="h-5 w-5" />,
  analytics: <BarChart3 className="h-5 w-5" />,
  productivity: <Briefcase className="h-5 w-5" />,
  communication: <MessageSquare className="h-5 w-5" />,
  security: <Shield className="h-5 w-5" />,
  other: <Layers className="h-5 w-5" />,
};

const CATEGORY_COLORS: Record<AppCategory, string> = {
  erp: 'from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border-blue-500/30',
  crm: 'from-green-500/20 to-green-600/10 hover:from-green-500/30 hover:to-green-600/20 border-green-500/30',
  fiscal: 'from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border-purple-500/30',
  banking: 'from-yellow-500/20 to-yellow-600/10 hover:from-yellow-500/30 hover:to-yellow-600/20 border-yellow-500/30',
  logistics: 'from-orange-500/20 to-orange-600/10 hover:from-orange-500/30 hover:to-orange-600/20 border-orange-500/30',
  analytics: 'from-cyan-500/20 to-cyan-600/10 hover:from-cyan-500/30 hover:to-cyan-600/20 border-cyan-500/30',
  productivity: 'from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 border-pink-500/30',
  communication: 'from-indigo-500/20 to-indigo-600/10 hover:from-indigo-500/30 hover:to-indigo-600/20 border-indigo-500/30',
  security: 'from-red-500/20 to-red-600/10 hover:from-red-500/30 hover:to-red-600/20 border-red-500/30',
  other: 'from-gray-500/20 to-gray-600/10 hover:from-gray-500/30 hover:to-gray-600/20 border-gray-500/30',
};

export function MarketplaceCategories({ 
  selectedCategory, 
  onSelectCategory, 
  counts = {} 
}: MarketplaceCategoriesProps) {
  const categories = Object.entries(APP_CATEGORY_LABELS) as [AppCategory, string][];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Categorías</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* All category */}
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            selectedCategory === null 
              ? 'ring-2 ring-primary bg-primary/10' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onSelectCategory(null)}
        >
          <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Todas</p>
              <p className="text-xs text-muted-foreground">
                {Object.values(counts).reduce((a, b) => a + b, 0)} apps
              </p>
            </div>
          </CardContent>
        </Card>

        {categories.map(([key, label]) => (
          <Card 
            key={key}
            className={`cursor-pointer transition-all duration-200 ${
              selectedCategory === key 
                ? `ring-2 ring-primary bg-gradient-to-br ${CATEGORY_COLORS[key]}` 
                : `hover:bg-gradient-to-br ${CATEGORY_COLORS[key]}`
            }`}
            onClick={() => onSelectCategory(key)}
          >
            <CardContent className="p-3 flex flex-col items-center gap-2 text-center">
              <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[key]} flex items-center justify-center`}>
                {CATEGORY_ICONS[key]}
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {counts[key] || 0} apps
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default MarketplaceCategories;
