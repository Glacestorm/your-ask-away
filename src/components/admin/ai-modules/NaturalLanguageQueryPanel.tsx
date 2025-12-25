import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useNaturalLanguageQuery } from '@/hooks/admin/useNaturalLanguageQuery';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NaturalLanguageQueryPanelProps {
  className?: string;
}

export function NaturalLanguageQueryPanel({ className }: NaturalLanguageQueryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  
  const {
    isLoading,
    result,
    history,
    error,
    executeQuery,
    fetchHistory
  } = useNaturalLanguageQuery();

  useEffect(() => {
    fetchHistory(5);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    
    await executeQuery(inputQuery);
    setInputQuery('');
  }, [inputQuery, executeQuery]);

  const handleHistoryClick = useCallback((query: string) => {
    setInputQuery(query);
  }, []);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Consultas en Lenguaje Natural</CardTitle>
              <p className="text-xs text-muted-foreground">
                Pregunta lo que quieras sobre tus datos
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        {/* Query Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ej: ¿Cuántos clientes nuevos hay este mes?"
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputQuery.trim()}>
            {isLoading ? (
              <Sparkles className="h-4 w-4 animate-pulse" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[240px]"}>
          <div className="space-y-4">
            {/* Query Result */}
            {result && (
              <div className="p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Respuesta</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.explanation}
                </p>
                
                {result.data && result.data.length > 0 && (
                  <div className="p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(result.data.slice(0, 5), null, 2)}</pre>
                    {result.row_count > 5 && (
                      <p className="text-muted-foreground mt-1">... y {result.row_count - 5} más</p>
                    )}
                  </div>
                )}

                {result.sql_generated && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Ver consulta generada
                    </summary>
                    <pre className="mt-1 p-2 rounded bg-muted/50 text-xs font-mono overflow-x-auto">
                      {result.sql_generated}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Query History */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Historial de consultas</span>
                </div>
                {history.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item.query)}
                    className="w-full p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.query}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!result && history.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm text-center">
                  Escribe una pregunta en lenguaje natural<br />
                  para consultar tus datos
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default NaturalLanguageQueryPanel;
