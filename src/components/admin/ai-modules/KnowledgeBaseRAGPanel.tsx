import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  FileText,
  Link2,
  RefreshCw
} from 'lucide-react';
import { useKnowledgeBaseRAG } from '@/hooks/admin/useKnowledgeBaseRAG';
import { cn } from '@/lib/utils';

interface KnowledgeBaseRAGPanelProps {
  className?: string;
}

export function KnowledgeBaseRAGPanel({ className }: KnowledgeBaseRAGPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  
  const {
    isLoading,
    response,
    articles,
    results,
    error,
    askQuestion,
    fetchArticles,
    reindexKnowledgeBase
  } = useKnowledgeBaseRAG();

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    
    await askQuestion(inputQuery);
  }, [inputQuery, askQuestion]);

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Base de Conocimiento RAG</CardTitle>
              <p className="text-xs text-muted-foreground">
                {articles.length} artículos indexados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchArticles()}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
        {/* Search Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Buscar en la base de conocimiento..."
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
            {/* Search Result */}
            {response && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Respuesta Generada</span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {response.answer}
                  </p>
                </div>

                {/* Sources */}
                {response.sources && response.sources.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Fuentes utilizadas:</span>
                    {response.sources.map((source, index) => (
                      <div key={index} className="p-2 rounded-lg border bg-muted/30">
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{source.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                Relevancia: {(source.relevance * 100).toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up Questions */}
                {response.follow_up_questions && response.follow_up_questions.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Preguntas relacionadas:</span>
                    <div className="flex flex-wrap gap-2">
                      {response.follow_up_questions.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setInputQuery(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Document Stats */}
            {!response && !error && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border bg-card text-center">
                    <FileText className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{articles.length}</p>
                    <p className="text-xs text-muted-foreground">Artículos</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card text-center">
                    <Link2 className="h-6 w-6 mx-auto mb-1 text-primary" />
                    <p className="text-2xl font-bold">{results.length}</p>
                    <p className="text-xs text-muted-foreground">Resultados</p>
                  </div>
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  Escribe una pregunta para buscar información<br />
                  en tu base de conocimiento
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default KnowledgeBaseRAGPanel;
