import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Target, Calendar, CheckCircle2 } from 'lucide-react';

// Lazy load the metrics components
const PersonalKPIsDashboard = lazy(() => 
  import('@/components/dashboard/PersonalKPIsDashboard').then(m => ({ default: m.PersonalKPIsDashboard }))
);

const LoadingSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-24 w-full" />
  </div>
);

interface FocusModeDashboardProps {
  startDate?: string;
  endDate?: string;
}

export function FocusModeDashboard({ startDate, endDate }: FocusModeDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold">Modo Foco</h2>
        <p className="text-muted-foreground">Métricas clave de un vistazo</p>
      </div>

      {/* Key Metrics Grid - 4 cards max */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FocusCard
          title="Visitas Hoy"
          icon={<Calendar className="h-5 w-5" />}
          value="--"
          subtitle="Programadas"
          color="primary"
        />
        <FocusCard
          title="Objetivo Mensual"
          icon={<Target className="h-5 w-5" />}
          value="--"
          subtitle="Progreso actual"
          color="secondary"
        />
        <FocusCard
          title="Conversiones"
          icon={<CheckCircle2 className="h-5 w-5" />}
          value="--"
          subtitle="Este mes"
          color="success"
        />
        <FocusCard
          title="Rendimiento"
          icon={<TrendingUp className="h-5 w-5" />}
          value="--"
          subtitle="vs. mes anterior"
          color="accent"
        />
      </div>

      {/* Main KPIs - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">KPIs Principales</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LoadingSkeleton />}>
            <PersonalKPIsDashboard />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

interface FocusCardProps {
  title: string;
  icon: React.ReactNode;
  value: string | number;
  subtitle: string;
  color: 'primary' | 'secondary' | 'success' | 'accent';
}

function FocusCard({ title, icon, value, subtitle, color }: FocusCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary-foreground border-secondary/20',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    accent: 'bg-accent/10 text-accent-foreground border-accent/20',
  };

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{title}</span>
          {icon}
        </div>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
