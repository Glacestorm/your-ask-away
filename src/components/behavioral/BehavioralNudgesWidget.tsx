import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Trophy, 
  Users, 
  Clock, 
  Gift, 
  Target,
  Flame,
  Star,
  X,
  ChevronRight
} from 'lucide-react';
import { useBehavioralNudges } from '@/hooks/useBehavioralNudges';
import { cn } from '@/lib/utils';

interface BehavioralNudgesWidgetProps {
  companyId?: string;
  compact?: boolean;
}

const nudgeIcons: Record<string, React.ElementType> = {
  achievement: Trophy,
  social: Users,
  scarcity: Clock,
  mystery: Gift,
  challenge: Target,
  streak: Flame,
  progress: Star,
};

const urgencyColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export function BehavioralNudgesWidget({ companyId, compact = false }: BehavioralNudgesWidgetProps) {
  const { 
    activeNudges, 
    streakData, 
    dismissNudge, 
    handleNudgeAction,
    calculateEngagementScore 
  } = useBehavioralNudges(undefined, companyId);

  const engagementData = calculateEngagementScore();

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">{streakData?.current_streak || 0} días</p>
                <p className="text-xs text-muted-foreground">Racha actual</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{engagementData.score}</p>
              <Badge variant="outline" className="text-xs capitalize">
                {engagementData.level.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          {activeNudges.length > 0 && (
            <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-primary truncate">
                {activeNudges[0].message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Engagement Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Engagement Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold">{engagementData.score}</p>
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  engagementData.level === 'champion' && 'bg-purple-500/10 text-purple-600',
                  engagementData.level === 'expert' && 'bg-green-500/10 text-green-600',
                  engagementData.level === 'rising_star' && 'bg-blue-500/10 text-blue-600',
                  engagementData.level === 'newcomer' && 'bg-yellow-500/10 text-yellow-600'
                )}
              >
                {engagementData.level.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{streakData?.current_streak || 0} días de racha</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mejor: {streakData?.best_streak || 0} días
              </p>
            </div>
          </div>
          <Progress value={engagementData.score} className="h-2" />
        </CardContent>
      </Card>

      {/* Active Nudges */}
      {activeNudges.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Acciones Recomendadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeNudges.map((nudge) => {
              const Icon = nudgeIcons[nudge.type] || Zap;
              return (
                <div 
                  key={nudge.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all hover:shadow-sm",
                    urgencyColors[nudge.urgency || 'low']
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-background">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{nudge.message}</p>
                      {nudge.cta_text && (
                        <Button 
                          size="sm" 
                          variant="link" 
                          className="h-auto p-0 mt-1"
                          onClick={() => handleNudgeAction({ nudge, action: nudge.cta_action || 'click' })}
                        >
                          {nudge.cta_text}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => dismissNudge(nudge.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Streak Details */}
      {streakData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Tu Racha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-orange-500">{streakData.current_streak}</p>
                <p className="text-xs text-muted-foreground">Actual</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{streakData.best_streak}</p>
                <p className="text-xs text-muted-foreground">Mejor</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {streakData.last_activity_date === new Date().toISOString().split('T')[0] ? '✓' : '○'}
                </p>
                <p className="text-xs text-muted-foreground">Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BehavioralNudgesWidget;
