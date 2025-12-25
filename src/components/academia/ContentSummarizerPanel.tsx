import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  CheckCircle,
  BookOpen,
  ListChecks,
  MessageSquare,
  Lightbulb,
  Languages
} from 'lucide-react';
import { useContentSummarizer } from '@/hooks/academia/useContentSummarizer';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContentSummarizerPanelProps {
  lessonId?: string;
  lessonContent?: string;
  className?: string;
}

export function ContentSummarizerPanel({ 
  lessonId, 
  lessonContent,
  className 
}: ContentSummarizerPanelProps) {
  const [content, setContent] = useState(lessonContent || '');
  const [activeTab, setActiveTab] = useState('summary');

  const {
    lessonSummary,
    studyGuide,
    keyConcepts,
    flashcards,
    isLoading,
    summarizeLesson,
    generateStudyGuide,
    extractKeyConcepts,
    createFlashcards
  } = useContentSummarizer();

  const handleSummarize = () => {
    if (!lessonId && !content.trim()) {
      toast.error('Por favor, ingresa contenido para resumir');
      return;
    }
    if (lessonId) {
      summarizeLesson(lessonId);
    }
  };

  const handleExtractConcepts = () => {
    if (!lessonId && !content.trim()) {
      toast.error('Por favor, ingresa contenido');
      return;
    }
    extractKeyConcepts(lessonId, undefined, content || undefined);
  };

  const handleGenerateStudyGuide = () => {
    if (!lessonId && !content.trim()) {
      toast.error('Por favor, ingresa contenido');
      return;
    }
    generateStudyGuide(lessonId, undefined, content || undefined);
  };

  const handleCreateFlashcards = () => {
    if (!lessonId && !content.trim()) {
      toast.error('Por favor, ingresa contenido');
      return;
    }
    createFlashcards(lessonId, undefined, content || undefined);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      {/* Panel de Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contenido Original
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Pega aquí el contenido de la lección, transcripción o texto que deseas procesar..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] resize-none"
          />

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleSummarize} disabled={isLoading} className="w-full">
              {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Resumir
            </Button>
            <Button variant="outline" onClick={handleExtractConcepts} disabled={isLoading}>
              <ListChecks className="h-4 w-4 mr-2" />
              Conceptos
            </Button>
            <Button variant="outline" onClick={handleGenerateStudyGuide} disabled={isLoading}>
              <BookOpen className="h-4 w-4 mr-2" />
              Guía de Estudio
            </Button>
            <Button variant="outline" onClick={handleCreateFlashcards} disabled={isLoading}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Flashcards
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Resultados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="summary">Resumen</TabsTrigger>
              <TabsTrigger value="concepts">Conceptos</TabsTrigger>
              <TabsTrigger value="guide">Guía</TabsTrigger>
              <TabsTrigger value="flashcards">Cards</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <ScrollArea className="h-[350px]">
                {lessonSummary ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {lessonSummary.difficulty_level} • {lessonSummary.estimated_read_time_minutes} min
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(lessonSummary.summary.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">{lessonSummary.summary.title}</h4>
                      <p className="text-sm text-muted-foreground">{lessonSummary.summary.content}</p>
                    </div>
                    {lessonSummary.summary.key_takeaways && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Puntos clave:</h4>
                        <ul className="space-y-1">
                          {lessonSummary.summary.key_takeaways.map((point, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {lessonSummary.related_topics && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Temas relacionados:</h4>
                        <div className="flex flex-wrap gap-1">
                          {lessonSummary.related_topics.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState message="Genera un resumen del contenido" />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="concepts">
              <ScrollArea className="h-[350px]">
                {keyConcepts && keyConcepts.concepts?.length > 0 ? (
                  <div className="space-y-2">
                    {keyConcepts.concepts.map((concept, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{concept.name}</p>
                          <p className="text-xs text-muted-foreground">{concept.definition}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            Importancia: {concept.importance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Extrae los conceptos clave del contenido" />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="guide">
              <ScrollArea className="h-[350px]">
                {studyGuide ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{studyGuide.study_guide.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(JSON.stringify(studyGuide, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Tiempo estimado: {studyGuide.study_guide.estimated_study_time}</p>
                    </div>

                    {studyGuide.sections?.map((section, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">{section.title}</h5>
                        <p className="text-sm text-muted-foreground">{section.content_summary}</p>
                        {section.examples?.length > 0 && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <strong>Ejemplos:</strong> {section.examples.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}

                    {studyGuide.review_checklist && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Checklist de Revisión</h4>
                        <ul className="space-y-1">
                          {studyGuide.review_checklist.map((item, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyState message="Genera una guía de estudio" />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="flashcards">
              <ScrollArea className="h-[350px]">
                {flashcards && flashcards.flashcards?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <Badge variant="outline">
                        {flashcards.flashcard_set.total_cards} tarjetas • {flashcards.flashcard_set.difficulty}
                      </Badge>
                    </div>
                    {flashcards.flashcards.map((card, idx) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">
                            {idx + 1}. {card.front}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0 ml-2">
                            {card.category}
                          </Badge>
                        </div>
                        <div className="p-2 rounded bg-primary/5 text-sm">
                          {card.back}
                        </div>
                        {card.hint && (
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 {card.hint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="Genera flashcards para estudiar" />
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center py-12">
        <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}

export default ContentSummarizerPanel;
