import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Loader2, 
  Sparkles,
  Database,
  RefreshCw,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    id: string;
    type: string;
    year: number;
    similarity: number;
    excerpt: string;
  }[];
  timestamp: Date;
}

interface FinancialRAGChatProps {
  companyId?: string;
  companyName?: string;
  fiscalYear?: number;
}

export const FinancialRAGChat = ({ companyId, companyName, fiscalYear }: FinancialRAGChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingsCount, setEmbeddingsCount] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (companyId) {
      checkEmbeddings();
    }
  }, [companyId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkEmbeddings = async () => {
    if (!companyId) return;
    
    const { count } = await supabase
      .from('financial_document_embeddings')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    
    setEmbeddingsCount(count || 0);
  };

  const generateEmbeddings = async () => {
    if (!companyId) {
      toast.error("Selecciona una empresa primero");
      return;
    }

    setIsGeneratingEmbeddings(true);

    try {
      // Get all statements for this company
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (!statements || statements.length === 0) {
        toast.error("No hay estados financieros para indexar");
        return;
      }

      let totalEmbeddings = 0;

      for (const statement of statements) {
        const { data, error } = await supabase.functions.invoke('generate-financial-embeddings', {
          body: {
            companyId,
            statementId: statement.id,
            fiscalYear: statement.fiscal_year
          }
        });

        if (error) {
          console.error("Error generating embeddings:", error);
          continue;
        }

        totalEmbeddings += data?.embeddingsCount || 0;
      }

      toast.success(`Indexados ${totalEmbeddings} documentos financieros`);
      await checkEmbeddings();

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar embeddings");
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('financial-rag-chat', {
        body: {
          query: input,
          companyId: companyId || null,
          fiscalYear: fiscalYear || null
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar la consulta");
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const exampleQueries = [
    "¿Cuál es la situación de liquidez de la empresa?",
    "Analiza la evolución del resultado neto",
    "¿Cuáles son los principales ratios de solvencia?",
    "Compara los ingresos entre años fiscales"
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Chat Financiero con IA (RAG)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {embeddingsCount !== null ? `${embeddingsCount} docs` : '...'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={generateEmbeddings}
              disabled={isGeneratingEmbeddings || !companyId}
            >
              {isGeneratingEmbeddings ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1 hidden sm:inline">Indexar</span>
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {companyName && (
          <p className="text-sm text-muted-foreground">
            Analizando: {companyName} {fiscalYear ? `(${fiscalYear})` : ''}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 pt-0">
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Asistente Financiero RAG</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consulta sobre los estados financieros usando lenguaje natural.
                El sistema buscará en los documentos indexados para darte respuestas precisas.
              </p>
              
              {embeddingsCount === 0 && companyId && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    ⚠️ No hay documentos indexados. Haz clic en "Indexar" para generar los embeddings.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {exampleQueries.map((query, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start h-auto py-2 px-3"
                    onClick={() => setInput(query)}
                  >
                    <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{query}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <Accordion type="single" collapsible className="mt-2">
                        <AccordionItem value="sources" className="border-none">
                          <AccordionTrigger className="text-xs text-muted-foreground py-1 hover:no-underline">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {message.sources.length} fuentes consultadas
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-1">
                              {message.sources.map((source, i) => (
                                <div
                                  key={i}
                                  className="text-xs bg-background border rounded p-2"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-[10px]">
                                      {source.type}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                      Año {source.year}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                      {source.similarity}% relevancia
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground line-clamp-2">
                                    {source.excerpt}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analizando documentos...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pregunta sobre los estados financieros..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
