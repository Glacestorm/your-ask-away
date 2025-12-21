import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSurveyGamification } from '@/hooks/useSurveyGamification';
import { Trophy, Flame, Star, Coins, Medal } from 'lucide-react';

interface SurveyGamificationWidgetProps {
  companyId?: string;
  showLeaderboard?: boolean;
}

export function SurveyGamificationWidget({ 
  companyId, 
  showLeaderboard = true 
}: SurveyGamificationWidgetProps) {
  const {
    gamification,
    leaderboard,
    isLoading,
    getLevelName,
    getLevelProgress,
    getLevelFromCoins,
    getBadgeIcon,
    getBadgeName,
  } = useSurveyGamification(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Stats Card */}
      {gamification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Tu Progreso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level & Coins */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nivel</p>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-xl font-bold">
                    {getLevelName(getLevelFromCoins(gamification.total_coins))}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monedas</p>
                <div className="flex items-center gap-1">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="text-xl font-bold">{gamification.total_coins}</span>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            {(() => {
              const progress = getLevelProgress(gamification.total_coins);
              return (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progreso al siguiente nivel</span>
                    <span>{Math.round(progress.progress)}%</span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {progress.coinsToNext} monedas para subir de nivel
                  </p>
                </div>
              );
            })()}

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-500">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">{gamification.streak_days}</span>
                </div>
                <p className="text-xs text-muted-foreground">Días seguidos</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{gamification.surveys_completed}</p>
                <p className="text-xs text-muted-foreground">Encuestas</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{gamification.best_streak}</p>
                <p className="text-xs text-muted-foreground">Mejor racha</p>
              </div>
            </div>

            {/* Badges */}
            {gamification.badges && gamification.badges.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Insignias</p>
                <div className="flex flex-wrap gap-2">
                  {gamification.badges.map((badge) => (
                    <Badge 
                      key={badge} 
                      variant="secondary"
                      className="text-lg py-1 px-2"
                      title={getBadgeName(badge)}
                    >
                      {getBadgeIcon(badge)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {showLeaderboard && leaderboard && leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              Tabla de Líderes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                    {index > 2 && (
                      <span className="text-lg font-bold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {entry.company?.name?.slice(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.company?.name || 'Anónimo'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getLevelName(getLevelFromCoins(entry.total_coins))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Coins className="h-4 w-4" />
                    <span className="font-bold">{entry.total_coins}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!gamification && !isLoading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">Sin progreso aún</h3>
            <p className="text-sm text-muted-foreground">
              Completa encuestas para ganar monedas y subir de nivel
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
