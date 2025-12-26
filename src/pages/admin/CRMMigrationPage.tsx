import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Database, 
  Upload, 
  BarChart3, 
  Shield, 
  Settings, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  FileUp,
  GitMerge,
  Play,
  HelpCircle,
  BookOpen,
  Activity,
  RotateCcw
} from 'lucide-react';
import { 
  CRMMigrationPanel, 
  CRMMigrationDashboard, 
  CRMValidationPanel, 
  CRMAdvancedToolsPanel,
  CRMMonitoringPanel,
  CRMRollbackPanel
} from '@/components/admin/crm-migration';
import { useCRMMigration } from '@/hooks/admin/integrations';
import { cn } from '@/lib/utils';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  completed: boolean;
}

export default function CRMMigrationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showQuickStart, setShowQuickStart] = useState(true);
  const { 
    connectors, 
    migrations, 
    activeMigration,
    fetchConnectors,
    fetchMigrations 
  } = useCRMMigration();

  const hasConnectors = connectors.length > 0;
  const hasMigrations = migrations.length > 0;
  const hasActiveMigration = !!activeMigration;

  const quickStartSteps: QuickStartStep[] = [
    {
      id: 'connect',
      title: 'Conectar CRM de Origen',
      description: 'Configura la conexión con tu CRM actual (Salesforce, HubSpot, etc.)',
      icon: <Database className="h-5 w-5" />,
      action: () => setActiveTab('migration'),
      completed: hasConnectors
    },
    {
      id: 'mapping',
      title: 'Mapear Campos',
      description: 'Define cómo se transformarán los datos entre sistemas',
      icon: <GitMerge className="h-5 w-5" />,
      action: () => setActiveTab('migration'),
      completed: hasMigrations
    },
    {
      id: 'validate',
      title: 'Validar Datos',
      description: 'Ejecuta validaciones para asegurar la calidad de datos',
      icon: <Shield className="h-5 w-5" />,
      action: () => setActiveTab('validation'),
      completed: false
    },
    {
      id: 'migrate',
      title: 'Ejecutar Migración',
      description: 'Inicia la migración con monitoreo en tiempo real',
      icon: <Play className="h-5 w-5" />,
      action: () => setActiveTab('dashboard'),
      completed: hasActiveMigration
    }
  ];

  const completedSteps = quickStartSteps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / quickStartSteps.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Migración de CRM
              </h1>
              <p className="text-sm text-muted-foreground">
                Transfiere datos desde cualquier CRM con IA asistida
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Documentación
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Ayuda
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12 bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Inicio Rápido
              </TabsTrigger>
              <TabsTrigger 
                value="migration" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <FileUp className="h-4 w-4" />
                Migración
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="validation" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Shield className="h-4 w-4" />
                Validación
              </TabsTrigger>
              <TabsTrigger 
                value="monitoring" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Activity className="h-4 w-4" />
                Monitoreo
              </TabsTrigger>
              <TabsTrigger 
                value="rollback" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Rollback
              </TabsTrigger>
              <TabsTrigger 
                value="tools" 
                className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary gap-2"
              >
                <Settings className="h-4 w-4" />
                Herramientas
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {/* Overview / Quick Start Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Progress Card */}
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Progreso de Configuración</CardTitle>
                        <CardDescription>
                          {completedSteps} de {quickStartSteps.length} pasos completados
                        </CardDescription>
                      </div>
                      <Badge variant={completedSteps === quickStartSteps.length ? "default" : "secondary"}>
                        {Math.round(progressPercentage)}% Completado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-secondary/50 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {quickStartSteps.map((step, index) => (
                        <Card 
                          key={step.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            step.completed 
                              ? "border-green-500/30 bg-green-500/5" 
                              : "hover:border-primary/30"
                          )}
                          onClick={step.action}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                step.completed 
                                  ? "bg-green-500/20 text-green-600" 
                                  : "bg-primary/10 text-primary"
                              )}>
                                {step.completed ? <CheckCircle className="h-5 w-5" /> : step.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Paso {index + 1}</span>
                                  {step.completed && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                                      Completado
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-medium text-sm mt-1">{step.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                            {!step.completed && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full mt-3 gap-2 text-primary"
                              >
                                Comenzar
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Database className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{connectors.length}</p>
                          <p className="text-xs text-muted-foreground">Conectores Configurados</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Upload className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{migrations.length}</p>
                          <p className="text-xs text-muted-foreground">Migraciones Totales</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Sparkles className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {migrations.filter(m => m.status === 'completed').length}
                          </p>
                          <p className="text-xs text-muted-foreground">Migraciones Exitosas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* CRM Connectors Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      CRMs Soportados
                    </CardTitle>
                    <CardDescription>
                      Conecta con los principales sistemas CRM del mercado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {['Salesforce', 'HubSpot', 'Zoho CRM', 'Pipedrive', 'Microsoft Dynamics', 'Freshsales', 'Monday CRM', 'Zendesk Sell', 'Close', 'Copper', 'Insightly', 'CSV/Excel'].map((crm) => (
                        <div 
                          key={crm}
                          className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-center"
                        >
                          <p className="text-sm font-medium">{crm}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Migration Tab */}
              <TabsContent value="migration" className="mt-0">
                <CRMMigrationPanel />
              </TabsContent>

              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="mt-0">
                <CRMMigrationDashboard />
              </TabsContent>

              {/* Validation Tab */}
              <TabsContent value="validation" className="mt-0">
                {activeMigration ? (
                  <CRMValidationPanel migration={activeMigration} />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Selecciona una migración en la pestaña "Migración" para validar datos
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('migration')}
                      >
                        Ir a Migraciones
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Monitoring Tab */}
              <TabsContent value="monitoring" className="mt-0">
                <CRMMonitoringPanel migration={activeMigration} />
              </TabsContent>

              {/* Rollback Tab */}
              <TabsContent value="rollback" className="mt-0">
                <CRMRollbackPanel migration={activeMigration} />
              </TabsContent>

              {/* Advanced Tools Tab */}
              <TabsContent value="tools" className="mt-0">
                {activeMigration ? (
                  <CRMAdvancedToolsPanel migration={activeMigration} />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Selecciona una migración en la pestaña "Migración" para usar herramientas avanzadas
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setActiveTab('migration')}
                      >
                        Ir a Migraciones
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
