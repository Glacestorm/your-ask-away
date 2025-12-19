import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormBuilder, RuleBuilder, ReportBuilder, PageBuilder, ModuleBuilder } from '@/components/lowcode';
import { FileText, Zap, BarChart3, Layout, Boxes } from 'lucide-react';

const LowCodePage = () => {
  const [activeTab, setActiveTab] = useState('modules');

  const tabs = [
    { id: 'modules', label: 'Módulos', icon: Boxes, description: 'Gestiona módulos de la aplicación' },
    { id: 'forms', label: 'Formularios', icon: FileText, description: 'Crea y edita formularios dinámicos' },
    { id: 'rules', label: 'Reglas', icon: Zap, description: 'Define reglas de negocio automatizadas' },
    { id: 'reports', label: 'Reportes', icon: BarChart3, description: 'Diseña reportes y dashboards' },
    { id: 'pages', label: 'Páginas', icon: Layout, description: 'Construye páginas personalizadas' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Low-Code Builder</h1>
          <p className="text-muted-foreground mt-2">
            Crea y gestiona componentes de la aplicación sin escribir código
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Gestión de Módulos
                </CardTitle>
                <CardDescription>
                  Crea y configura módulos que agrupan formularios, reglas, reportes y páginas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ModuleBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Constructor de Formularios
                </CardTitle>
                <CardDescription>
                  Diseña formularios dinámicos con validaciones y lógica condicional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Constructor de Reglas
                </CardTitle>
                <CardDescription>
                  Define reglas de negocio con condiciones y acciones automatizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RuleBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Constructor de Reportes
                </CardTitle>
                <CardDescription>
                  Crea reportes con gráficos, tablas y visualizaciones de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Constructor de Páginas
                </CardTitle>
                <CardDescription>
                  Diseña páginas personalizadas combinando componentes y layouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PageBuilder />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LowCodePage;
