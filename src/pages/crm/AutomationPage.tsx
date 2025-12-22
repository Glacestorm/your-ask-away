import React, { useState } from 'react';
import { DashboardLayout } from '@/layouts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StageFlowAutomation, StageFlow } from '@/components/crm/automation';
import { IntelligentLeadDistribution, Agent, DistributionRule, DistributionStats } from '@/components/crm/automation';
import { Zap, Users } from 'lucide-react';

const demoStages = [
  { id: 'new', name: 'Nuevos', color: '#6366f1' },
  { id: 'contacted', name: 'Contactados', color: '#f59e0b' },
  { id: 'qualified', name: 'Calificados', color: '#10b981' },
  { id: 'proposal', name: 'Propuesta', color: '#8b5cf6' },
  { id: 'negotiation', name: 'Negociación', color: '#ec4899' },
  { id: 'won', name: 'Ganados', color: '#22c55e' },
  { id: 'lost', name: 'Perdidos', color: '#ef4444' },
];

const demoFlows: StageFlow[] = [
  {
    id: '1',
    name: 'Bienvenida Automática',
    fromStage: 'new',
    toStage: 'contacted',
    actions: [
      { id: 'a1', type: 'whatsapp', config: { template: 'welcome' } },
      { id: 'a2', type: 'notification', config: { message: 'Nuevo lead contactado' } }
    ],
    conditions: [],
    isActive: true,
    executionCount: 145,
    lastExecuted: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Seguimiento Calificados',
    fromStage: 'qualified',
    toStage: 'proposal',
    actions: [
      { id: 'a3', type: 'email', config: { template: 'proposal_intro' } },
      { id: 'a4', type: 'assign', config: { toSenior: true } }
    ],
    conditions: [],
    isActive: true,
    executionCount: 67,
    lastExecuted: '2024-01-14T15:45:00Z'
  },
  {
    id: '3',
    name: 'Alerta Negociación',
    fromStage: 'proposal',
    toStage: 'negotiation',
    actions: [
      { id: 'a5', type: 'notification', config: { priority: 'high' } },
      { id: 'a6', type: 'delay', config: { hours: 24 } },
      { id: 'a7', type: 'email', config: { template: 'followup' } }
    ],
    conditions: [],
    isActive: false,
    executionCount: 23,
    lastExecuted: '2024-01-10T09:00:00Z'
  }
];

const demoAgents: Agent[] = [
  {
    id: 'a1',
    name: 'Juan Pérez',
    activeLeads: 12,
    maxCapacity: 20,
    specializations: ['E-commerce', 'SaaS'],
    performanceScore: 92,
    avgResponseTime: 4,
    conversionRate: 28,
    isAvailable: true,
    currentWorkload: 60
  },
  {
    id: 'a2',
    name: 'María García',
    activeLeads: 8,
    maxCapacity: 15,
    specializations: ['Fintech', 'Seguros'],
    performanceScore: 88,
    avgResponseTime: 6,
    conversionRate: 32,
    isAvailable: true,
    currentWorkload: 53
  },
  {
    id: 'a3',
    name: 'Carlos Ruiz',
    activeLeads: 18,
    maxCapacity: 25,
    specializations: ['Retail', 'E-commerce'],
    performanceScore: 95,
    avgResponseTime: 3,
    conversionRate: 35,
    isAvailable: true,
    currentWorkload: 72
  },
  {
    id: 'a4',
    name: 'Ana Martínez',
    activeLeads: 5,
    maxCapacity: 20,
    specializations: ['Salud', 'Educación'],
    performanceScore: 85,
    avgResponseTime: 8,
    conversionRate: 24,
    isAvailable: false,
    currentWorkload: 25
  }
];

const demoRules: DistributionRule[] = [
  { id: 'r1', name: 'Balance de Carga', type: 'workload', weight: 40, isActive: true },
  { id: 'r2', name: 'Rendimiento', type: 'performance', weight: 30, isActive: true },
  { id: 'r3', name: 'Especialización', type: 'specialization', weight: 20, isActive: true },
  { id: 'r4', name: 'Round Robin', type: 'round_robin', weight: 10, isActive: false },
  { id: 'r5', name: 'IA Híbrida', type: 'hybrid', weight: 0, isActive: false }
];

const demoStats: DistributionStats = {
  totalDistributed: 1247,
  avgAssignmentTime: 2.3,
  balanceScore: 87,
  performanceImpact: 12
};

const AutomationPage = () => {
  const [flows, setFlows] = useState(demoFlows);
  const [rules, setRules] = useState(demoRules);
  const [agents, setAgents] = useState(demoAgents);

  const handleCreateFlow = (flow: Omit<StageFlow, 'id' | 'executionCount'>) => {
    const newFlow: StageFlow = {
      ...flow,
      id: `flow-${Date.now()}`,
      executionCount: 0
    };
    setFlows(prev => [...prev, newFlow]);
  };

  const handleToggleFlow = (id: string, isActive: boolean) => {
    setFlows(prev => prev.map(f => f.id === id ? { ...f, isActive } : f));
  };

  const handleDeleteFlow = (id: string) => {
    setFlows(prev => prev.filter(f => f.id !== id));
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<DistributionRule>) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));
  };

  const handleUpdateAgentCapacity = (agentId: string, capacity: number) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { ...a, maxCapacity: capacity, currentWorkload: (a.activeLeads / capacity) * 100 } 
        : a
    ));
  };

  return (
    <DashboardLayout title="Automatización CRM">
      <div className="p-6">
        <Tabs defaultValue="flows" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="flows" className="gap-2">
              <Zap className="h-4 w-4" />
              Flujos por Etapa
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2">
              <Users className="h-4 w-4" />
              Distribución Leads
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flows">
            <StageFlowAutomation
              stages={demoStages}
              flows={flows}
              onCreateFlow={handleCreateFlow}
              onToggleFlow={handleToggleFlow}
              onDeleteFlow={handleDeleteFlow}
            />
          </TabsContent>

          <TabsContent value="distribution">
            <IntelligentLeadDistribution
              agents={agents}
              rules={rules}
              stats={demoStats}
              onUpdateRule={handleUpdateRule}
              onUpdateAgentCapacity={handleUpdateAgentCapacity}
              onDistributeNow={() => console.log('Redistributing...')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AutomationPage;
