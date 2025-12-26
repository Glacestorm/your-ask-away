/**
 * CopilotMyDayView - Vista "Mi Día" Optimizada 2026
 * Muestra tareas prioritarias, reuniones, quick wins y gestión de energía
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  Zap, 
  Target, 
  Users, 
  Coffee,
  Sun,
  Moon,
  Sunrise,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Battery,
  BatteryMedium,
  BatteryLow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isToday, isBefore, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MyDayView, PriorityTask, ScheduledMeeting, QuickWin, FocusBlock } from '@/hooks/useRoleCopilot2026';

interface CopilotMyDayViewProps {
  myDayView: MyDayView | null;
  onTaskClick?: (task: PriorityTask) => void;
  onQuickWinClick?: (quickWin: QuickWin) => void;
  onMeetingClick?: (meeting: ScheduledMeeting) => void;
  isLoading?: boolean;
}

export function CopilotMyDayView({ 
  myDayView, 
  onTaskClick, 
  onQuickWinClick,
  onMeetingClick,
  isLoading 
}: CopilotMyDayViewProps) {
  const now = new Date();
  const currentHour = now.getHours();

  // Determine time of day
  const timeOfDay = useMemo(() => {
    if (currentHour < 12) return 'morning';
    if (currentHour < 18) return 'afternoon';
    return 'evening';
  }, [currentHour]);

  // Energy level based on time
  const currentEnergy = useMemo(() => {
    if (!myDayView?.energyForecast) return 75;
    return myDayView.energyForecast[timeOfDay] || 75;
  }, [myDayView?.energyForecast, timeOfDay]);

  // Next focus block
  const nextFocusBlock = useMemo(() => {
    if (!myDayView?.focusBlocks?.length) return null;
    return myDayView.focusBlocks.find(block => {
      const startTime = parseISO(block.startTime);
      return isBefore(now, startTime) || isToday(startTime);
    });
  }, [myDayView?.focusBlocks, now]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      default: return 'bg-green-500/20 text-green-600 border-green-500/30';
    }
  };

  const getEnergyIcon = (energy: number) => {
    if (energy >= 70) return Battery;
    if (energy >= 40) return BatteryMedium;
    return BatteryLow;
  };

  const getTimeIcon = (time: string) => {
    switch (time) {
      case 'morning': return Sunrise;
      case 'afternoon': return Sun;
      default: return Moon;
    }
  };

  const TimeIcon = getTimeIcon(timeOfDay);
  const EnergyIcon = getEnergyIcon(currentEnergy);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-40 bg-muted/50" />
          </Card>
        ))}
      </div>
    );
  }

  if (!myDayView) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Genera tu vista "Mi Día" para ver el plan optimizado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Energy & Time */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/20">
            <TimeIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {timeOfDay === 'morning' && 'Buenos días'}
              {timeOfDay === 'afternoon' && 'Buenas tardes'}
              {timeOfDay === 'evening' && 'Buenas noches'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(now, "EEEE, d 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Energy Level */}
          <div className="flex items-center gap-2">
            <EnergyIcon className={cn(
              "h-5 w-5",
              currentEnergy >= 70 ? "text-green-500" : currentEnergy >= 40 ? "text-amber-500" : "text-red-500"
            )} />
            <div className="w-24">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Energía</span>
                <span className="font-medium">{currentEnergy}%</span>
              </div>
              <Progress value={currentEnergy} className="h-1.5" />
            </div>
          </div>

          {/* Next Break */}
          {myDayView.energyForecast?.recommendedBreaks?.[0] && (
            <Badge variant="outline" className="gap-1">
              <Coffee className="h-3 w-3" />
              Descanso: {myDayView.energyForecast.recommendedBreaks[0]}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Priority Tasks */}
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Tareas Prioritarias
              <Badge variant="secondary" className="ml-auto">
                {myDayView.priorityTasks?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {myDayView.priorityTasks?.length ? (
                  myDayView.priorityTasks.map((task, idx) => (
                    <div 
                      key={task.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-xs", getImpactColor(task.impact))}>
                            {task.impact}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.estimatedTime}min
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin tareas prioritarias
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Scheduled Meetings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Reuniones Hoy
              <Badge variant="secondary" className="ml-auto">
                {myDayView.scheduledMeetings?.length || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {myDayView.scheduledMeetings?.length ? (
                  myDayView.scheduledMeetings.map((meeting) => (
                    <div 
                      key={meeting.id}
                      className="p-2 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onMeetingClick?.(meeting)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            meeting.type === 'external' ? 'bg-blue-500/10 text-blue-600' :
                            meeting.type === 'coaching' ? 'bg-purple-500/10 text-purple-600' :
                            'bg-muted'
                          )}
                        >
                          {meeting.type === 'external' ? 'Externa' : 
                           meeting.type === 'coaching' ? 'Coaching' : 'Interna'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(meeting.startTime), 'HH:mm')} - {format(parseISO(meeting.endTime), 'HH:mm')}
                        <Users className="h-3 w-3 ml-2" />
                        {meeting.attendees?.length || 0}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin reuniones programadas
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Wins */}
        <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Quick Wins
              <Badge variant="secondary" className="ml-auto bg-amber-500/20 text-amber-600">
                €{myDayView.quickWins?.reduce((sum, qw) => sum + qw.estimatedValue, 0).toLocaleString() || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {myDayView.quickWins?.length ? (
                  myDayView.quickWins.map((qw) => (
                    <Button
                      key={qw.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => onQuickWinClick?.(qw)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">{qw.action}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>€{qw.estimatedValue.toLocaleString()}</span>
                            <span>•</span>
                            <span>{qw.timeToComplete}min</span>
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin quick wins disponibles
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Focus Blocks */}
        {nextFocusBlock && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Próximo Bloque de Enfoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-purple-500/10">
                  <Clock className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {format(parseISO(nextFocusBlock.startTime), 'HH:mm')} - {format(parseISO(nextFocusBlock.endTime), 'HH:mm')}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {nextFocusBlock.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tareas sugeridas: {nextFocusBlock.suggestedTasks?.join(', ') || 'Ninguna'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default CopilotMyDayView;
