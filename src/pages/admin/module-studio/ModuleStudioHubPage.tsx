/**
 * ModuleStudioHubPage - Hub central del Module Studio
 * Vista general con acceso rápido a todas las subsecciones
 */

import { useNavigate } from 'react-router-dom';
import { ModuleStudioLayout } from '@/layouts/ModuleStudioLayout';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Code, 
  Rocket, 
  BarChart3, 
  Shield, 
  Store,
  Package,
  GitBranch,
  Activity,
  Clock,
  Users,
  Zap,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  {
    id: 'development',
    label: 'Development',
    description: 'Editor, Sandbox, Tests y Dependencias',
    icon: Code,
    path: '/obelixia-admin/module-studio/development',
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    features: ['Editor Visual', 'Sandbox', 'Testing', 'Dependencies']
  },
  {
    id: 'operations',
    label: 'Operations',
    description: 'Deploy, Versioning, Rollback y A/B Testing',
    icon: Rocket,
    path: '/obelixia-admin/module-studio/operations',
    color: 'from-amber-500/20 to-amber-600/10',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    features: ['Deployment', 'Versioning', 'Rollback', 'A/B Testing']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Métricas, Gráficos, Performance y Logs',
    icon: BarChart3,
    path: '/obelixia-admin/module-studio/analytics',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    features: ['Métricas', 'Históricos', 'Performance', 'Live Logs']
  },
  {
    id: 'governance',
    label: 'Governance',
    description: 'Seguridad, Documentación y Colaboración',
    icon: Shield,
    path: '/obelixia-admin/module-studio/governance',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    features: ['Security', 'Docs', 'Team', 'Compliance']
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    description: 'Marketplace, Templates y Export/Import',
    icon: Store,
    path: '/obelixia-admin/module-studio/ecosystem',
    color: 'from-cyan-500/20 to-cyan-600/10',
    borderColor: 'border-cyan-500/30',
    iconColor: 'text-cyan-400',
    features: ['Marketplace', 'Templates', 'Export', 'Import']
  },
];

export default function ModuleStudioHubPage() {
  const navigate = useNavigate();
  const { 
    selectedModule, 
    selectedModuleKey,
    modules,
    graph,
    dependencies 
  } = useModuleStudioContext();

  const navigateToSection = (path: string) => {
    navigate(path + (selectedModuleKey ? `?module=${selectedModuleKey}` : ''));
  };

  // Stats
  const totalModules = modules.length;
  const coreModules = modules.filter(m => m.is_core).length;
  const activeModules = modules.filter(m => !m.is_required).length;
  
  // Selected module stats
  const selectedNode = selectedModuleKey ? graph.nodes.get(selectedModuleKey) : null;
  const depCount = selectedNode?.dependencies.length || 0;
  const depByCount = selectedNode?.dependents.length || 0;

  return (
    <ModuleStudioLayout title="Module Studio Hub">
      <div className="space-y-6">
        {/* Module Overview Card - When module is selected */}
        {selectedModule ? (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {selectedModule.module_name}
                    {selectedModule.is_core && <Badge>Core</Badge>}
                    {selectedModule.is_required && <Badge variant="destructive">Required</Badge>}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedModule.description || 'Sin descripción'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    v{selectedModule.version || '1.0.0'}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {selectedModule.category}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-blue-400">{depCount}</div>
                  <div className="text-xs text-muted-foreground">Dependencias</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{depByCount}</div>
                  <div className="text-xs text-muted-foreground">Dependientes</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-amber-400">100%</div>
                  <div className="text-xs text-muted-foreground">Health</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold text-purple-400">45</div>
                  <div className="text-xs text-muted-foreground">Usuarios</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Welcome Card - When no module selected */
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Bienvenido al Module Studio</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Selecciona un módulo del panel izquierdo para ver su información y acceder a las herramientas de desarrollo, operaciones y análisis.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalModules}</div>
                  <div className="text-xs text-muted-foreground">Total Módulos</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <GitBranch className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{dependencies.length}</div>
                  <div className="text-xs text-muted-foreground">Dependencias</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{coreModules}</div>
                  <div className="text-xs text-muted-foreground">Core Modules</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Activity className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-xs text-muted-foreground">Uptime</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-5 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id}
                className={cn(
                  'cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg',
                  `bg-gradient-to-br ${section.color}`,
                  section.borderColor
                )}
                onClick={() => navigateToSection(section.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={cn('p-2 rounded-lg bg-background/50', section.iconColor)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base mt-2">{section.label}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {section.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-[10px] px-1.5 py-0">
                        {feature}
                      </Badge>
                    ))}
                    {section.features.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{section.features.length - 3}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        {selectedModule && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => navigateToSection('/obelixia-admin/module-studio/development')}>
                  <Code className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigateToSection('/obelixia-admin/module-studio/operations')}>
                  <Rocket className="h-4 w-4 mr-2" />
                  Deploy
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigateToSection('/obelixia-admin/module-studio/analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Métricas
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigateToSection('/obelixia-admin/module-studio/governance')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Seguridad
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ModuleStudioLayout>
  );
}
