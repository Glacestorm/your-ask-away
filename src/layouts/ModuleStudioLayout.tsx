/**
 * ModuleStudioLayout - Layout compartido para todas las páginas del Module Studio
 * Incluye selector de módulos, navegación rápida y paneles de Copilot/Agent
 * Con mejoras de UX: animaciones, favoritos, atajos de teclado
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import {
  Package,
  GitBranch,
  Network,
  Search,
  RefreshCw,
  Eye,
  Bot,
  Sparkles,
  Home,
  Code,
  Rocket,
  BarChart3,
  Shield,
  Store,
  ChevronRight,
  Star,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleStudioContext } from '@/contexts/ModuleStudioContext';
import { IMPLEMENTED_MODULE_KEYS } from '@/components/admin/modules/implementedModules';
import { ModuleCopilotPanel, ModuleAutonomousAgentPanel, ModulePreviewPanel, ModuleStudioHelpButton, ModuleDependencyDetailDialog } from '@/components/admin/module-studio';
import { ModuleSelectorSkeleton } from '@/components/admin/module-studio/ModuleStudioSkeleton';
import { ModuleSearchCommand } from '@/components/admin/module-studio/ModuleSearchCommand';
import { ModuleStudioKeyboardHelp } from '@/components/admin/module-studio/ModuleStudioKeyboardHelp';
import { useModuleStudioKeyboard } from '@/hooks/admin/useModuleStudioKeyboard';
import { useModuleStudioFavorites } from '@/hooks/admin/useModuleStudioFavorites';
import { motion, AnimatePresence } from 'framer-motion';

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const navSections: NavSection[] = [
  { id: 'hub', label: 'Hub', icon: Home, path: '/obelixia-admin/module-studio', color: 'text-primary' },
  { id: 'development', label: 'Development', icon: Code, path: '/obelixia-admin/module-studio/development', color: 'text-blue-400' },
  { id: 'operations', label: 'Operations', icon: Rocket, path: '/obelixia-admin/module-studio/operations', color: 'text-amber-400' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/obelixia-admin/module-studio/analytics', color: 'text-emerald-400' },
  { id: 'governance', label: 'Governance', icon: Shield, path: '/obelixia-admin/module-studio/governance', color: 'text-purple-400' },
  { id: 'ecosystem', label: 'Ecosystem', icon: Store, path: '/obelixia-admin/module-studio/ecosystem', color: 'text-cyan-400' },
];

function ModuleStudioLayoutContent({ 
  children, 
  title,
  showModuleSelector = true 
}: { 
  children: React.ReactNode;
  title: string;
  showModuleSelector?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [dependencyDialogModule, setDependencyDialogModule] = useState<typeof modules[0] | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  const {
    selectedModuleKey,
    selectedModule,
    setSelectedModuleKey,
    modules,
    isLoadingModules,
    graph,
    dependencies,
    copilotContext,
    refreshAll,
    showCopilot,
    setShowCopilot,
    showAgent,
    setShowAgent,
    showPreview,
    setShowPreview,
  } = useModuleStudioContext();

  // Favorites hook
  const { isFavorite, toggleFavorite, addRecent } = useModuleStudioFavorites();

  // Track module selection in recent
  useEffect(() => {
    if (selectedModule && selectedModuleKey) {
      const sectionId = navSections.find(s => location.pathname === s.path)?.label;
      addRecent(selectedModuleKey, selectedModule.module_name, sectionId);
    }
  }, [selectedModuleKey, selectedModule, location.pathname, addRecent]);

  // Keyboard shortcuts
  useModuleStudioKeyboard({
    selectedModuleKey,
    onToggleCopilot: () => setShowCopilot(!showCopilot),
    onToggleAgent: () => setShowAgent(!showAgent),
    onTogglePreview: () => setShowPreview(!showPreview),
    onRefresh: refreshAll,
    onSearch: () => {
      setShowSearch(true);
    },
  });

  // Filtrar módulos
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const query = searchQuery.toLowerCase();
    return modules.filter(m => 
      m.module_name.toLowerCase().includes(query) ||
      m.module_key.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    );
  }, [modules, searchQuery]);

  // Current section
  const currentSection = navSections.find(s => location.pathname === s.path) || navSections[0];

  // Header badges
  const headerTitleActions = (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="gap-1 text-xs">
        <Network className="h-3 w-3" />
        {graph.nodes.size} módulos
      </Badge>
      <Badge variant="outline" className="gap-1 text-xs">
        <GitBranch className="h-3 w-3" />
        {dependencies.length} deps
      </Badge>
      {selectedModule && (
        <Badge variant="secondary" className="gap-1 animate-in fade-in duration-200">
          <Package className="h-3 w-3" />
          {selectedModule.module_name}
        </Badge>
      )}
    </div>
  );

  // Header right slot
  const headerRightSlot = (
    <div className="flex items-center gap-1.5">
      <ModuleStudioKeyboardHelp />
      <ModuleStudioHelpButton />
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowSearch(true)} 
        className="h-8 gap-1.5"
      >
        <Search className="h-3.5 w-3.5" />
        <kbd className="hidden sm:inline text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <Button variant="outline" size="sm" onClick={refreshAll} className="h-8">
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Refrescar
      </Button>
      <Button 
        variant={showPreview ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowPreview(!showPreview)}
        className="h-8 transition-all"
      >
        <Eye className="h-3.5 w-3.5 mr-1.5" />
        Preview
      </Button>
      <Button 
        variant={showCopilot ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowCopilot(!showCopilot)}
        className="h-8 transition-all"
      >
        <Bot className="h-3.5 w-3.5 mr-1.5" />
        Copilot
      </Button>
      <Button 
        variant={showAgent ? 'default' : 'outline'} 
        size="sm" 
        onClick={() => setShowAgent(!showAgent)}
        className="h-8 transition-all"
      >
        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        Agent
      </Button>
    </div>
  );

  // Calculate grid columns
  const sidebarCols = showModuleSelector ? 2 : 0;
  const copilotCols = showCopilot ? 2 : 0;
  const previewCols = showPreview ? 2 : 0;
  const agentCols = showAgent ? 2 : 0;
  const mainCols = 12 - sidebarCols - copilotCols - previewCols - agentCols;
  
  const mainColClass = `col-span-${Math.max(mainCols, 4)}`;

  return (
    <DashboardLayout
      title={title}
      subtitle="Module Studio Hub"
      titleActions={headerTitleActions}
      rightSlot={headerRightSlot}
    >
      <div className="space-y-3">
        {/* Quick Navigation Bar */}
        <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg border border-border/50">
          {navSections.map((section) => {
            const Icon = section.icon;
            const isActive = location.pathname === section.path;

            return (
              <Button
                key={section.id}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() =>
                  navigate(
                    section.path + (selectedModuleKey ? `?module=${selectedModuleKey}` : '')
                  )
                }
                className={cn('h-9 gap-2', isActive && 'shadow-sm')}
                aria-label={section.label}
                title={section.label}
              >
                <Icon className={cn('h-4 w-4', !isActive && section.color)} />
                <span className="hidden sm:inline">{section.label}</span>
              </Button>
            );
          })}

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center justify-end gap-1 text-sm text-muted-foreground px-2">
            <span>Module Studio</span>
            <ChevronRight className="h-3 w-3" />
            <span className={currentSection.color}>{currentSection.label}</span>
            {selectedModule && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{selectedModule.module_name}</span>
              </>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Module Selector Sidebar */}
          {showModuleSelector && (
            <div className="col-span-2">
              <Card className="h-[calc(100vh-280px)]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Módulos ({filteredModules.length})</span>
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[calc(100vh-400px)] overflow-y-auto overscroll-contain">
                    <div className="p-2 space-y-1">
                      {isLoadingModules ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredModules.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No hay módulos
                        </div>
                      ) : (
                        filteredModules.map(mod => {
                          // Use the dependencies array from the module itself
                          const directDepsFromArray = mod.dependencies || [];
                          const depCount = directDepsFromArray.length;
                          
                          // Calculate dependents (modules that depend on this one)
                          const depByCount = modules.filter(
                            m => (m.dependencies || []).includes(mod.module_key)
                          ).length;
                          
                          const isImplemented = IMPLEMENTED_MODULE_KEYS.has(mod.module_key);
                          const hasDependencies = depCount > 0 || depByCount > 0;

                          const handleDependencyClick = (e: React.MouseEvent) => {
                            e.stopPropagation();
                            setDependencyDialogModule(mod);
                            setShowDependencyDialog(true);
                          };

                          return (
                            <div
                              key={mod.id}
                              onClick={() => setSelectedModuleKey(mod.module_key)}
                              className={cn(
                                'w-full text-left p-3 rounded-lg transition-all cursor-pointer',
                                selectedModuleKey === mod.module_key
                                  ? 'bg-primary/10 border border-primary/30 shadow-sm'
                                  : 'hover:bg-muted/50'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm truncate flex-1">{mod.module_name}</span>

                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge
                                    variant={isImplemented ? 'success' : 'warning'}
                                    className="h-5 px-1.5 text-[10px]"
                                    title={isImplemented ? 'Implementado' : 'No implementado'}
                                  >
                                    {isImplemented ? '✓' : '○'}
                                  </Badge>

                                  {/* Dependency button */}
                                  <button
                                    onClick={handleDependencyClick}
                                    className={cn(
                                      'inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-semibold border transition-colors',
                                      hasDependencies
                                        ? 'bg-info/12 border-info/30 text-info hover:bg-info/20'
                                        : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted/60'
                                    )}
                                    title={`${depCount} dependencias, ${depByCount} dependientes - Clic para ver detalles`}
                                  >
                                    <GitBranch className="h-3 w-3" />
                                    {depCount + depByCount}
                                  </button>

                                  {mod.is_core && (
                                    <Badge variant="secondary" className="text-[10px] px-1 h-5">
                                      Core
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                <span>↓{depCount} ↑{depByCount}</span>
                                <span>v{mod.version || '1.0.0'}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={cn(
            showModuleSelector ? '' : 'col-start-1',
            mainCols >= 8 ? 'col-span-8' : 
            mainCols >= 6 ? 'col-span-6' : 
            mainCols >= 4 ? 'col-span-4' : 'col-span-4'
          )}>
            {children}
          </div>

          {/* Preview Panel */}
          {showPreview && copilotContext && (
            <div className="col-span-2">
              <ModulePreviewPanel moduleData={copilotContext.currentState} />
            </div>
          )}

          {/* Copilot Panel */}
          {showCopilot && (
            <div className="col-span-2">
              <ModuleCopilotPanel moduleContext={copilotContext} />
            </div>
          )}

          {/* Agent Panel */}
          {showAgent && copilotContext && (
            <div className="col-span-2">
              <ModuleAutonomousAgentPanel context={copilotContext} />
            </div>
          )}
        </div>

        {/* Search Command Palette */}
        <ModuleSearchCommand
          modules={modules}
          selectedModuleKey={selectedModuleKey}
          onSelectModule={setSelectedModuleKey}
          open={showSearch}
          onOpenChange={setShowSearch}
        />

        {/* Dependency Detail Dialog */}
        <ModuleDependencyDetailDialog
          open={showDependencyDialog}
          onOpenChange={setShowDependencyDialog}
          module={dependencyDialogModule}
          allModules={modules}
          onNavigateToModule={(key) => setSelectedModuleKey(key)}
        />
      </div>
    </DashboardLayout>
  );
}

export function ModuleStudioLayout({ 
  children, 
  title = 'Module Studio',
  showModuleSelector = true 
}: { 
  children: React.ReactNode;
  title?: string;
  showModuleSelector?: boolean;
}) {
  // Layout sin provider - el provider se añade externamente en AppRoutes
  return (
    <ModuleStudioLayoutContent title={title} showModuleSelector={showModuleSelector}>
      {children}
    </ModuleStudioLayoutContent>
  );
}

export default ModuleStudioLayout;
