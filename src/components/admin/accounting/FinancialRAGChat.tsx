import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  Trash2,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  BarChart3,
  PieChart,
  Wallet,
  Scale,
  Activity,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface FinancialRAGChatProps {
  companyId?: string;
  companyName?: string;
  fiscalYear?: number;
}

const EXAMPLE_QUERIES = [
  {
    category: "Liquidesa",
    icon: <Wallet className="h-4 w-4" />,
    queries: [
      "Quin és el ràtio de liquidesa corrent?",
      "Analitza la capacitat de pagament a curt termini",
      "Quina és la situació del fons de maniobra?"
    ]
  },
  {
    category: "Solvència",
    icon: <Scale className="h-4 w-4" />,
    queries: [
      "Avalua el nivell d'endeutament",
      "Quin és el ràtio de solvència?",
      "Com és l'estructura del passiu?"
    ]
  },
  {
    category: "Rendibilitat",
    icon: <TrendingUp className="h-4 w-4" />,
    queries: [
      "Calcula el ROE i ROA",
      "Quina és l'evolució del marge net?",
      "Analitza la rendibilitat econòmica"
    ]
  },
  {
    category: "Operacions",
    icon: <Activity className="h-4 w-4" />,
    queries: [
      "Com han evolucionat les vendes?",
      "Analitza els costos operatius",
      "Quin és el punt d'equilibri?"
    ]
  }
];

export const FinancialRAGChat = ({ companyId, companyName, fiscalYear }: FinancialRAGChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingsCount, setEmbeddingsCount] = useState<number | null>(null);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (companyId) {
      checkEmbeddings();
      loadConversations();
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

  const loadConversations = async () => {
    if (!companyId || !user?.id) return;

    const { data } = await supabase
      .from('financial_rag_conversations')
      .select('id, title, created_at')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const conversationsWithCount = await Promise.all(
        data.map(async (conv) => {
          const { count } = await supabase
            .from('financial_rag_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          return { ...conv, message_count: count || 0 };
        })
      );
      setConversations(conversationsWithCount);
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data } = await supabase
      .from('financial_rag_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (data) {
      const loadedMessages: Message[] = data.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        sources: msg.sources as Message['sources'],
        timestamp: new Date(msg.created_at)
      }));
      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      setActiveTab("chat");
    }
  };

  const startNewConversation = async () => {
    if (!companyId || !user?.id) return null;

    const title = `Conversa ${new Date().toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`;
    
    const { data, error } = await supabase
      .from('financial_rag_conversations')
      .insert({
        company_id: companyId,
        user_id: user.id,
        title
      })
      .select('id')
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    setCurrentConversationId(data.id);
    await loadConversations();
    return data.id;
  };

  const generateEmbeddings = async () => {
    if (!companyId) {
      toast.error("Selecciona una empresa primer");
      return;
    }

    setIsGeneratingEmbeddings(true);
    setIndexingProgress(0);

    try {
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year')
        .eq('company_id', companyId)
        .eq('is_archived', false);

      if (!statements || statements.length === 0) {
        toast.error("No hi ha estats financers per indexar");
        return;
      }

      let totalEmbeddings = 0;
      const totalStatements = statements.length;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        setIndexingProgress(Math.round(((i + 1) / totalStatements) * 100));

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

      toast.success(`Indexats ${totalEmbeddings} documents financers`);
      await checkEmbeddings();

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar embeddings");
    } finally {
      setIsGeneratingEmbeddings(false);
      setIndexingProgress(0);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let conversationId = currentConversationId;
    if (!conversationId && companyId) {
      conversationId = await startNewConversation();
    }

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
          fiscalYear: fiscalYear || null,
          conversationId,
          userId: user?.id
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

      // Save messages to database
      if (conversationId) {
        await supabase.from('financial_rag_messages').insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: userMessage.content,
            sources: []
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantMessage.content,
            sources: assistantMessage.sources || []
          }
        ]);
        await loadConversations();
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al processar la consulta");
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Ho sento, s'ha produït un error en processar la teva consulta. Si us plau, torna-ho a provar.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
  };

  const deleteConversation = async (conversationId: string) => {
    await supabase.from('financial_rag_messages').delete().eq('conversation_id', conversationId);
    await supabase.from('financial_rag_conversations').delete().eq('id', conversationId);
    
    if (currentConversationId === conversationId) {
      clearChat();
    }
    await loadConversations();
    toast.success("Conversa eliminada");
  };

  const getEmbeddingsStatus = () => {
    if (embeddingsCount === null) return { color: 'secondary', text: 'Carregant...', icon: <Loader2 className="h-3 w-3 animate-spin" /> };
    if (embeddingsCount === 0) return { color: 'destructive', text: 'No indexat', icon: <AlertCircle className="h-3 w-3" /> };
    if (embeddingsCount < 5) return { color: 'warning', text: `${embeddingsCount} docs`, icon: <Clock className="h-3 w-3" /> };
    return { color: 'default', text: `${embeddingsCount} docs`, icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  const status = getEmbeddingsStatus();

  return (
    <Card className="h-[700px] flex flex-col bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Assistent Financer IA
                <Badge variant="outline" className="text-xs font-normal">RAG</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Consulta intel·ligent sobre dades financeres
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={status.color as any} 
              className="flex items-center gap-1 px-2 py-1"
            >
              {status.icon}
              <Database className="h-3 w-3" />
              {status.text}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={generateEmbeddings}
              disabled={isGeneratingEmbeddings || !companyId}
              className="h-8"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  {indexingProgress}%
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Indexar
                </>
              )}
            </Button>
          </div>
        </div>
        
        {companyName && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            <Badge variant="secondary" className="font-normal">
              {companyName}
            </Badge>
            {fiscalYear && (
              <Badge variant="outline" className="font-normal">
                Any {fiscalYear}
              </Badge>
            )}
          </div>
        )}

        {isGeneratingEmbeddings && (
          <Progress value={indexingProgress} className="h-1 mt-2" />
        )}
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-4">
          <TabsTrigger value="chat" className="flex items-center gap-1.5 data-[state=active]:bg-muted">
            <MessageSquare className="h-3.5 w-3.5" />
            Xat
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 data-[state=active]:bg-muted">
            <History className="h-3.5 w-3.5" />
            Historial
            {conversations.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {conversations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-1.5 data-[state=active]:bg-muted">
            <HelpCircle className="h-3.5 w-3.5" />
            Ajuda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <CardContent className="flex-1 flex flex-col p-4 pt-3">
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950 dark:to-purple-950 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Com et puc ajudar?</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    Pots fer-me preguntes sobre els estats financers de l'empresa. 
                    Utilitzo cerca semàntica per trobar informació rellevant.
                  </p>
                  
                  {embeddingsCount === 0 && companyId && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6 max-w-md">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Documents no indexats
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Fes clic a "Indexar" per generar els embeddings dels estats financers abans de fer consultes.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                    {EXAMPLE_QUERIES.map((category) => (
                      <div key={category.category} className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          {category.icon}
                          {category.category}
                        </div>
                        {category.queries.slice(0, 1).map((query, i) => (
                          <Button
                            key={i}
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs justify-start h-auto py-2 px-3 bg-muted/50 hover:bg-muted"
                            onClick={() => setInput(query)}
                          >
                            <Lightbulb className="h-3 w-3 mr-2 flex-shrink-0 text-amber-500" />
                            <span className="truncate text-left">{query}</span>
                          </Button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-xl p-3 shadow-sm ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        </div>

                        {message.sources && message.sources.length > 0 && (
                          <Accordion type="single" collapsible className="mt-2">
                            <AccordionItem value="sources" className="border rounded-lg overflow-hidden">
                              <AccordionTrigger className="text-xs text-muted-foreground py-2 px-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-1.5">
                                  <FileText className="h-3 w-3" />
                                  {message.sources.length} fonts consultades
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-3 pb-3">
                                <div className="space-y-2">
                                  {message.sources.map((source, i) => (
                                    <div
                                      key={i}
                                      className="text-xs bg-background border rounded-lg p-2.5"
                                    >
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                          {source.type.replace('_', ' ')}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                          Any {source.year}
                                        </span>
                                        <Badge 
                                          variant={source.similarity > 70 ? "default" : "outline"} 
                                          className="text-[10px] px-1.5 py-0 ml-auto"
                                        >
                                          {source.similarity}%
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

                        <p className="text-[10px] text-muted-foreground mt-1 px-1">
                          {message.timestamp.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {message.role === 'user' && (
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-xl rounded-bl-sm p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm text-muted-foreground">Analitzant documents...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <Separator className="my-3" />

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Fes una pregunta sobre els estats financers..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearChat} title="Nova conversa">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="history" className="flex-1 p-4 m-0">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <History className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No hi ha converses guardades</p>
                <p className="text-xs text-muted-foreground mt-1">Les converses es guarden automàticament</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.message_count} missatges · {new Date(conv.created_at).toLocaleDateString('ca-ES')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="help" className="flex-1 p-4 m-0 overflow-auto">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Com funciona?
              </h3>
              <p className="text-sm text-muted-foreground">
                L'Assistent Financer utilitza <strong>RAG (Retrieval-Augmented Generation)</strong> per respondre 
                les teves preguntes basant-se en els estats financers de l'empresa.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-500" />
                Indexació de documents
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Abans de fer consultes, cal indexar els documents financers. Fes clic a "Indexar" per:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Processar balanços, comptes de resultats i notes</li>
                <li>Generar embeddings semàntics</li>
                <li>Habilitar la cerca intel·ligent</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Exemples de consultes
              </h3>
              <div className="space-y-3">
                {EXAMPLE_QUERIES.map((category) => (
                  <div key={category.category}>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
                      {category.icon}
                      {category.category}
                    </div>
                    <div className="grid gap-1.5">
                      {category.queries.map((query, i) => (
                        <Button
                          key={i}
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs justify-start h-auto py-1.5 px-2"
                          onClick={() => {
                            setInput(query);
                            setActiveTab("chat");
                          }}
                        >
                          <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground" />
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};