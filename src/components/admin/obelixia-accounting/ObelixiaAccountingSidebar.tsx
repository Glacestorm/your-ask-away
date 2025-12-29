/**
 * ObelixIA Accounting Sidebar
 * Sidebar navigation for the accounting module with collapsible groups
 */

import { 
  LayoutDashboard, 
  FolderTree, 
  FileText, 
  Users, 
  Building2,
  PieChart,
  Receipt,
  Bot,
  TrendingUp,
  Shield,
  Globe,
  GitMerge,
  Landmark,
  Calculator,
  BarChart3,
  ChevronDown,
  Plug,
  Workflow,
  FileArchive,
  Network
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ObelixiaAccountingHelpButton } from './ObelixiaAccountingHelpButton';

interface ObelixiaAccountingSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const coreModules = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chart', label: 'Plan Contable', icon: FolderTree },
  { id: 'entries', label: 'Asientos', icon: FileText },
  { id: 'partners', label: 'Socios', icon: Users },
  { id: 'banking', label: 'Bancos', icon: Building2 },
  { id: 'reports', label: 'Reportes', icon: PieChart },
  { id: 'fiscal', label: 'Fiscal', icon: Receipt },
];

const aiModules = [
  { id: 'ai-agent', label: 'Agente Autónomo', icon: Bot },
  { id: 'forecasting', label: 'Previsión Financiera', icon: TrendingUp },
  { id: 'compliance', label: 'Compliance & Auditoría', icon: Shield },
  { id: 'multicurrency', label: 'Multi-Divisa', icon: Globe },
  { id: 'reconciliation', label: 'Conciliación IA', icon: GitMerge },
  { id: 'treasury', label: 'Tesorería', icon: Landmark },
  { id: 'tax-planning', label: 'Planificación Fiscal', icon: Calculator },
  { id: 'analytics', label: 'Analytics Ejecutivo', icon: BarChart3 },
];

const enterpriseModules = [
  { id: 'integrations-hub', label: 'Hub Integraciones', icon: Plug },
  { id: 'workflow', label: 'Workflow Colaborativo', icon: Workflow },
  { id: 'documents', label: 'Gestión Documental', icon: FileArchive },
  { id: 'intercompany', label: 'Intercompañía', icon: Network },
];

export function ObelixiaAccountingSidebar({ 
  activeTab, 
  onTabChange 
}: ObelixiaAccountingSidebarProps) {
  const isAIModuleActive = aiModules.some(m => m.id === activeTab);
  const isEnterpriseModuleActive = enterpriseModules.some(m => m.id === activeTab);

  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Calculator className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">ObelixIA</h2>
              <p className="text-xs text-muted-foreground">Contabilidad</p>
            </div>
          </div>
          <ObelixiaAccountingHelpButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Core Accounting Modules */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
            Contabilidad
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {coreModules.map((module) => (
                <SidebarMenuItem key={module.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(module.id)}
                    className={cn(
                      "w-full justify-start gap-3 px-3 py-2 text-sm transition-colors",
                      activeTab === module.id 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "hover:bg-muted"
                    )}
                  >
                    <module.icon className="h-4 w-4 shrink-0" />
                    <span>{module.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Advanced Modules - Collapsible */}
        <Collapsible defaultOpen={isAIModuleActive} className="mt-4">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between text-xs font-medium px-2 py-1 cursor-pointer hover:bg-muted/50 rounded-md group">
                <div className="flex items-center gap-2 text-primary">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Módulos IA Avanzados</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {aiModules.map((module) => (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(module.id)}
                        className={cn(
                          "w-full justify-start gap-3 px-3 py-2 text-sm transition-colors",
                          activeTab === module.id 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "hover:bg-muted"
                        )}
                      >
                        <module.icon className="h-4 w-4 shrink-0" />
                        <span>{module.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Enterprise Modules - Phase 11 */}
        <Collapsible defaultOpen={isEnterpriseModuleActive} className="mt-4">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between text-xs font-medium px-2 py-1 cursor-pointer hover:bg-muted/50 rounded-md group">
                <div className="flex items-center gap-2 text-accent-foreground">
                  <Network className="h-3.5 w-3.5" />
                  <span>Enterprise</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu>
                  {enterpriseModules.map((module) => (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(module.id)}
                        className={cn(
                          "w-full justify-start gap-3 px-3 py-2 text-sm transition-colors",
                          activeTab === module.id 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "hover:bg-muted"
                        )}
                      >
                        <module.icon className="h-4 w-4 shrink-0" />
                        <span>{module.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}

export default ObelixiaAccountingSidebar;
