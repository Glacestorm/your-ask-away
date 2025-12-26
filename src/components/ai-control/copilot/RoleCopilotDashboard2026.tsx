/**
 * RoleCopilotDashboard2026 - Dashboard Renovado del Copiloto de Rol
 * Con tabs: Mi Día, Coaching, Sector Intel, Automatizaciones, Learning Hub, Collaboration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Calendar, 
  GraduationCap, 
  Globe, 
  Zap, 
  BookOpen, 
  Users,
  RefreshCw,
  Maximize2,
  Minimize2,
  Brain,
  Target,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useRoleCopilot2026 } from '@/hooks/useRoleCopilot2026';
import { CopilotMyDayView } from './CopilotMyDayView';
import { CopilotCoachingPanel } from './CopilotCoachingPanel';
import { CopilotSectorIntel } from './CopilotSectorIntel';
import { CopilotAutomationsPanel } from './CopilotAutomationsPanel';
import { CopilotLearningHub } from './CopilotLearningHub';
import { CopilotCollaborationPanel } from './CopilotCollaborationPanel';
import { CopilotSuggestionCard } from './CopilotSuggestionCard';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoleCopilotDashboard2026Props {
  className?: string;
}

export function RoleCopilotDashboard2026({ className }: RoleCopilotDashboard2026Props) {
  const [activeTab, setActiveTab] = useState('my-day');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    currentSuggestions,
    copilotConfig,
    session,
    metrics,
    myDayView,
    isLoading,
    generateSuggestions,
    executeAction,
    dismissSuggestion,
  } = useRoleCopilot2026();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateSuggestions();
    setIsRefreshing(false);
  };

  // Filtrar sugerencias por tipo para cada tab
  const coachingSuggestions = currentSuggestions.filter(s => 
    s.type === 'coaching' || s.type === 'learning'
  );
  const automationSuggestions = currentSuggestions.filter(s => 
    s.type === 'automation' || s.type === 'workflow'
  );
  const collaborationSuggestions = currentSuggestions.filter(s => 
    s.type === 'collaboration'
  );

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {copilotConfig?.copilot_name || 'Copiloto Inteligente 2026'}
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  v2026
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {session ? `Sesión activa` : 'Sincronizando...'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Stats */}
            <div className="hidden md:flex items-center gap-3 mr-4">
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-primary">{currentSuggestions.length}</div>
                <div className="text-[10px] text-muted-foreground">Sugerencias</div>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-green-500">
                  {metrics?.suggestionsAccepted || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">Aceptadas</div>
              </div>
              <div className="text-center px-3 py-1 rounded-lg bg-background/50">
                <div className="text-lg font-bold text-amber-500">
                  {metrics?.timeSavedMinutes || 0}m
                </div>
                <div className="text-[10px] text-muted-foreground">Ahorro</div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6 mb-3 h-auto p-1">
            <TabsTrigger value="my-day" className="text-xs py-2 flex flex-col gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Mi Día</span>
            </TabsTrigger>
            <TabsTrigger value="coaching" className="text-xs py-2 flex flex-col gap-1">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Coaching</span>
            </TabsTrigger>
            <TabsTrigger value="sector-intel" className="text-xs py-2 flex flex-col gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Sector</span>
            </TabsTrigger>
            <TabsTrigger value="automations" className="text-xs py-2 flex flex-col gap-1">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Auto</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="text-xs py-2 flex flex-col gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="text-xs py-2 flex flex-col gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Collab</span>
            </TabsTrigger>
          </TabsList>

          <div className={cn("flex-1 overflow-hidden", isExpanded ? "h-[calc(100vh-200px)]" : "")}>
            <TabsContent value="my-day" className="mt-0 h-full">
              <CopilotMyDayView 
                myDayView={myDayView} 
                isLoading={isLoading} 
              />
            </TabsContent>

            <TabsContent value="coaching" className="mt-0 h-full">
              <CopilotCoachingPanel 
                metrics={metrics}
              />
            </TabsContent>

            <TabsContent value="sector-intel" className="mt-0 h-full">
              <CopilotSectorIntel 
                sector={copilotConfig?.sector}
                cnae={copilotConfig?.cnae}
              />
            </TabsContent>

            <TabsContent value="automations" className="mt-0 h-full">
              <CopilotAutomationsPanel 
                metrics={metrics}
              />
            </TabsContent>

            <TabsContent value="learning" className="mt-0 h-full">
              <CopilotLearningHub 
                config={copilotConfig}
              />
            </TabsContent>

            <TabsContent value="collaboration" className="mt-0 h-full">
              <CopilotCollaborationPanel 
                suggestions={collaborationSuggestions}
                onExecuteAction={(suggestion, actionId) => executeAction.mutate({ suggestion, actionId })}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default RoleCopilotDashboard2026;
