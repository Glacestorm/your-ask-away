import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Package, Target, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MetricsCardsSection() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const metricsCards = [
    {
      id: 'visits',
      title: 'Mètriques de Visites',
      description: 'Anàlisi detallat de les visites comercials',
      icon: BarChart3,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      id: 'products-metrics',
      title: 'Mètriques de Productes',
      description: 'Rendiment i distribució de productes',
      icon: Package,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      id: 'vinculacion',
      title: 'Mètriques de Vinculació',
      description: 'Anàlisi de vinculació amb entitats',
      icon: Target,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      id: 'gestores',
      title: 'Mètriques de Gestors',
      description: 'Anàlisi de rendiment per gestor',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    }
  ];

  const handleCardClick = (sectionId: string) => {
    navigate(`/admin?section=${sectionId}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metricsCards.map((card) => (
        <Card 
          key={card.id}
          className="cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
          onClick={() => handleCardClick(card.id)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{card.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{card.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
