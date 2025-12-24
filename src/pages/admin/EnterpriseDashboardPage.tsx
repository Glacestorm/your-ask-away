/**
 * EnterpriseDashboardPage
 * Dashboard Ejecutivo Enterprise con los 6 paneles principales
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutGrid, 
  Maximize2,
  ArrowLeft,
  Shield,
  Activity,
  Workflow,
  Brain,
  Bot,
  HeartPulse
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ComplianceMonitorPanel,
  CommandCenterPanel,
  WorkflowEnginePanel,
  BusinessIntelligencePanel
} from '@/components/admin/enterprise';
import { RevenueAIAgentsPanel } from '@/components/admin/revenue';
import { PredictiveHealthScorePanel } from '@/components/admin/cs';
import { cn } from '@/lib/utils';

type PanelView = 'grid' | 'compliance' | 'command' | 'workflow' | 'bi' | 'revenue-ai' | 'health-score';

export default function EnterpriseDashboardPage() {
  const [activeView, setActiveView] = useState<PanelView>('grid');

  const panels = [
    { id: 'compliance', label: 'Compliance', icon: Shield, color: 'from-green-500 to-emerald-600' },
    { id: 'command', label: 'Command Center', icon: Activity, color: 'from-blue-500 to-indigo-600' },
    { id: 'workflow', label: 'Workflows', icon: Workflow, color: 'from-orange-500 to-amber-600' },
    { id: 'bi', label: 'Business Intelligence', icon: Brain, color: 'from-purple-500 to-pink-600' },
    { id: 'revenue-ai', label: 'Revenue AI Agents', icon: Bot, color: 'from-cyan-500 to-teal-600' },
    { id: 'health-score', label: 'Health Score ML', icon: HeartPulse, color: 'from-rose-500 to-red-600' },
  ] as const;

  const renderFullPanel = () => {
    switch (activeView) {
      case 'compliance':
        return <ComplianceMonitorPanel className="h-full" />;
      case 'command':
        return <CommandCenterPanel className="h-full" />;
      case 'workflow':
        return <WorkflowEnginePanel className="h-full" />;
      case 'bi':
        return <BusinessIntelligencePanel className="h-full" />;
      case 'revenue-ai':
        return <RevenueAIAgentsPanel className="h-full" />;
      case 'health-score':
        return <PredictiveHealthScorePanel className="h-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Enterprise Dashboard</h1>
              <Badge variant="secondary" className="text-xs">Fase 11</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeView !== 'grid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveView('grid')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Vista Grid
              </Button>
            )}
            {panels.map((panel) => (
              <Button
                key={panel.id}
                variant={activeView === panel.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView(panel.id as PanelView)}
                className="hidden md:flex"
              >
                <panel.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container px-4 py-6">
        {activeView === 'grid' ? (
          <>
            {/* Quick Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {panels.map((panel) => (
                <button
                  key={panel.id}
                  onClick={() => setActiveView(panel.id as PanelView)}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className={cn(
                    "inline-flex p-2 rounded-lg bg-gradient-to-br mb-2",
                    panel.color
                  )}>
                    <panel.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium">{panel.label}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <Maximize2 className="h-3 w-3" />
                    <span>Ver completo</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 3x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <ComplianceMonitorPanel />
              <CommandCenterPanel />
              <WorkflowEnginePanel />
              <BusinessIntelligencePanel />
              <RevenueAIAgentsPanel />
              <PredictiveHealthScorePanel />
            </div>
          </>
        ) : (
          <div className="h-[calc(100vh-8rem)]">
            {renderFullPanel()}
          </div>
        )}
      </main>
    </div>
  );
}
