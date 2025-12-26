/**
 * EnterpriseDashboardPage
 * Dashboard Ejecutivo Enterprise con los 6 paneles principales
 * Fase 11 - Enterprise SaaS 2025-2026
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutGrid, 
  Maximize2,
  ArrowLeft,
  Shield,
  Activity,
  Workflow,
  Brain,
  Bot,
  HeartPulse,
  FileDown,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ComplianceMonitorPanel,
  CommandCenterPanel,
  WorkflowEnginePanel,
  BusinessIntelligencePanel,
  ExecutiveMetricsGrid,
  RealTimeAlertsPanel,
  EnterpriseActivityFeed
} from '@/components/admin/enterprise';
import { RevenueAIAgentsPanel } from '@/components/admin/revenue';
import { PredictiveHealthScorePanel } from '@/components/admin/cs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type PanelView = 'grid' | 'compliance' | 'command' | 'workflow' | 'bi' | 'revenue-ai' | 'health-score';

// Mock data para gráficos resumen
const summaryData = {
  compliance: { score: 92, items: 45, alerts: 3 },
  command: { uptime: 99.8, alerts: 7, resolved: 5 },
  workflow: { active: 12, completed: 156, pending: 8 },
  bi: { reports: 24, insights: 18, dashboards: 6 },
  revenue: { opportunities: 34, value: 125000, agents: 5 },
  health: { avgScore: 78, atRisk: 12, healthy: 45 }
};

const pieData = [
  { name: 'Compliance', value: 92, color: '#10B981' },
  { name: 'Workflows', value: 85, color: '#F59E0B' },
  { name: 'Health Score', value: 78, color: '#EF4444' },
  { name: 'BI Coverage', value: 88, color: '#8B5CF6' },
];

const barData = [
  { name: 'Ene', compliance: 88, health: 72, workflows: 45 },
  { name: 'Feb', compliance: 90, health: 75, workflows: 52 },
  { name: 'Mar', compliance: 91, health: 76, workflows: 58 },
  { name: 'Abr', compliance: 92, health: 78, workflows: 62 },
];

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

  const exportConsolidatedPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Enterprise Dashboard Report', 14, 25);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 35);
    
    doc.setTextColor(0, 0, 0);
    let yPos = 55;
    
    // Resumen Ejecutivo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Compliance
    doc.setFillColor(16, 185, 129);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Compliance: ${summaryData.compliance.score}% - ${summaryData.compliance.items} items monitoreados, ${summaryData.compliance.alerts} alertas`, 28, yPos + 4);
    yPos += 12;
    
    // Command Center
    doc.setFillColor(59, 130, 246);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Command Center: ${summaryData.command.uptime}% uptime - ${summaryData.command.alerts} alertas, ${summaryData.command.resolved} resueltas`, 28, yPos + 4);
    yPos += 12;
    
    // Workflows
    doc.setFillColor(245, 158, 11);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Workflows: ${summaryData.workflow.active} activos - ${summaryData.workflow.completed} completados, ${summaryData.workflow.pending} pendientes`, 28, yPos + 4);
    yPos += 12;
    
    // BI
    doc.setFillColor(139, 92, 246);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Business Intelligence: ${summaryData.bi.reports} reportes - ${summaryData.bi.insights} insights, ${summaryData.bi.dashboards} dashboards`, 28, yPos + 4);
    yPos += 12;
    
    // Revenue AI
    doc.setFillColor(6, 182, 212);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Revenue AI: ${summaryData.revenue.opportunities} oportunidades - €${summaryData.revenue.value.toLocaleString()} valor estimado`, 28, yPos + 4);
    yPos += 12;
    
    // Health Score
    doc.setFillColor(239, 68, 68);
    doc.circle(20, yPos + 2, 3, 'F');
    doc.text(`Health Score: ${summaryData.health.avgScore}% promedio - ${summaryData.health.atRisk} en riesgo, ${summaryData.health.healthy} saludables`, 28, yPos + 4);
    yPos += 20;
    
    // KPIs Clave
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KPIs Clave', 14, yPos);
    yPos += 15;
    
    // KPI boxes
    const kpis = [
      { label: 'Compliance Score', value: '92%', trend: '+3%' },
      { label: 'System Uptime', value: '99.8%', trend: '+0.2%' },
      { label: 'Avg Health Score', value: '78%', trend: '+5%' },
      { label: 'Revenue Pipeline', value: '€125K', trend: '+12%' },
    ];
    
    kpis.forEach((kpi, i) => {
      const xPos = 14 + (i % 2) * 95;
      const boxY = yPos + Math.floor(i / 2) * 25;
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(xPos, boxY, 90, 20, 3, 3, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(kpi.label, xPos + 5, boxY + 7);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(kpi.value, xPos + 5, boxY + 16);
      
      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129);
      doc.text(kpi.trend, xPos + 60, boxY + 16);
    });
    
    yPos += 60;
    
    // Acciones Recomendadas
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Acciones Recomendadas', 14, yPos);
    yPos += 12;
    
    const actions = [
      '• Revisar 3 alertas de compliance pendientes',
      '• Atender 12 clientes en riesgo detectados por Health Score ML',
      '• Completar 8 workflows pendientes antes de fin de mes',
      '• Analizar 18 insights de BI para optimización de procesos',
    ];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    actions.forEach(action => {
      doc.text(action, 14, yPos);
      yPos += 8;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este reporte fue generado automáticamente por el sistema Enterprise Dashboard', 14, 285);
    doc.text(`Página 1 de 1`, pageWidth - 30, 285);
    
    doc.save(`enterprise-dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF consolidado exportado correctamente');
  }, []);

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
            {activeView === 'grid' && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportConsolidatedPDF}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Exportar PDF
              </Button>
            )}
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
            {/* Executive Metrics Grid */}
            <ExecutiveMetricsGrid className="mb-6" />

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

            {/* Summary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Pie Chart - Estado General */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Estado General de Módulos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar Chart - Tendencias */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Tendencias Mensuales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="compliance" name="Compliance" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="health" name="Health" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="workflows" name="Workflows" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summaryData.compliance.score}%</p>
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summaryData.command.uptime}%</p>
                    <p className="text-xs text-muted-foreground">System Uptime</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summaryData.health.atRisk}</p>
                    <p className="text-xs text-muted-foreground">Clientes en Riesgo</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summaryData.bi.insights}</p>
                    <p className="text-xs text-muted-foreground">AI Insights</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Alerts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RealTimeAlertsPanel />
              <EnterpriseActivityFeed />
            </div>

            {/* 3x2 Grid with compact panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <ComplianceMonitorPanel />
              <CommandCenterPanel />
              <WorkflowEnginePanel />
              <BusinessIntelligencePanel />
              <RevenueAIAgentsPanel compact />
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
