/**
 * AutomationEngineDashboard - Fase 9
 * Dashboard unificado del Motor de Automatización
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Workflow, 
  Scale, 
  Bell, 
  Clock,
  Sparkles,
  Settings,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';
import WorkflowEnginePanel from './WorkflowEnginePanel';
import BusinessRulesPanel from './BusinessRulesPanel';
import NotificationSystemPanel from './NotificationSystemPanel';
import ScheduledTasksPanel from './ScheduledTasksPanel';

export default function AutomationEngineDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 shadow-xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Motor de Automatización
              <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
                Fase 9
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Workflows, reglas, notificaciones y tareas programadas con IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90">
            <Zap className="h-4 w-4" />
            Nueva Automatización
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-violet-500/10">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="gap-2 data-[state=active]:bg-blue-500/10">
            <Workflow className="h-4 w-4" />
            <span className="hidden md:inline">Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2 data-[state=active]:bg-amber-500/10">
            <Scale className="h-4 w-4" />
            <span className="hidden md:inline">Reglas</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-indigo-500/10">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 data-[state=active]:bg-emerald-500/10">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Tareas</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkflowEnginePanel className="lg:col-span-1" />
            <BusinessRulesPanel className="lg:col-span-1" />
            <NotificationSystemPanel className="lg:col-span-1" />
            <ScheduledTasksPanel className="lg:col-span-1" />
          </div>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="mt-6">
          <WorkflowEnginePanel expanded />
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6">
          <BusinessRulesPanel expanded />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <NotificationSystemPanel expanded />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <ScheduledTasksPanel expanded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
