import { useState, useEffect } from 'react';
import { Lightbulb, Send, ThumbsUp, MessageSquare, Filter, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Suggestion {
  id: string;
  user_id: string;
  suggestion_text: string;
  source: string;
  context: string | null;
  ai_response: string | null;
  status: string;
  admin_notes: string | null;
  priority: string;
  category: string | null;
  votes_count: number;
  created_at: string;
}

interface SuggestionVote {
  suggestion_id: string;
  user_id: string;
}

export function SuggestionBox() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [category, setCategory] = useState<string>('feature');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showProactivePrompt, setShowProactivePrompt] = useState(true);

  useEffect(() => {
    fetchSuggestions();
    fetchUserVotes();
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_suggestions')
        .select('*')
        .order('votes_count', { ascending: false });

      if (error) throw error;
      setSuggestions((data as Suggestion[]) || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVotes = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('suggestion_votes')
        .select('suggestion_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserVotes(new Set(data?.map(v => v.suggestion_id) || []));
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !newSuggestion.trim()) {
      toast.error('Por favor, escribe tu sugerencia');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_suggestions')
        .insert({
          user_id: user.id,
          suggestion_text: newSuggestion.trim(),
          source: 'manual',
          category,
          status: 'pending',
          priority: 'medium'
        });

      if (error) throw error;
      
      toast.success('¡Gracias por tu sugerencia! Los administradores la revisarán pronto.');
      setNewSuggestion('');
      fetchSuggestions();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Error al enviar la sugerencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (suggestionId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para votar');
      return;
    }

    const hasVoted = userVotes.has(suggestionId);
    
    try {
      if (hasVoted) {
        const { error } = await supabase
          .from('suggestion_votes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', user.id);

        if (error) throw error;
        setUserVotes(prev => {
          const next = new Set(prev);
          next.delete(suggestionId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('suggestion_votes')
          .insert({ suggestion_id: suggestionId, user_id: user.id });

        if (error) throw error;
        setUserVotes(prev => new Set([...prev, suggestionId]));
      }
      
      fetchSuggestions();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Error al registrar el voto');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pendiente' },
      reviewed: { color: 'bg-blue-500/10 text-blue-500', icon: MessageSquare, label: 'Revisada' },
      implemented: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle2, label: 'Implementada' },
      rejected: { color: 'bg-red-500/10 text-red-500', icon: XCircle, label: 'Rechazada' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (cat: string | null) => {
    const categories: Record<string, string> = {
      feature: 'Nueva Función',
      improvement: 'Mejora',
      bug: 'Corrección',
      documentation: 'Documentación'
    };
    return <Badge variant="outline">{categories[cat || 'feature']}</Badge>;
  };

  const filteredSuggestions = suggestions.filter(s => 
    filterStatus === 'all' || s.status === filterStatus
  );

  const proactivePrompts = [
    '¿Qué funcionalidad te gustaría ver en ObelixIA?',
    '¿Hay algún proceso que crees que podríamos automatizar?',
    '¿Qué información adicional te sería útil en el dashboard?',
    '¿Cómo podríamos mejorar tu experiencia de usuario?'
  ];

  const randomPrompt = proactivePrompts[Math.floor(Math.random() * proactivePrompts.length)];

  return (
    <div className="space-y-4">
      {/* Proactive Prompt */}
      {showProactivePrompt && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-primary">{randomPrompt}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu opinión nos ayuda a mejorar. ¡Comparte tus ideas!
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowProactivePrompt(false)}
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="submit" className="gap-2">
            <Send className="h-4 w-4" />
            Enviar Sugerencia
          </TabsTrigger>
          <TabsTrigger value="view" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Ver Todas ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Nueva Sugerencia
              </CardTitle>
              <CardDescription>
                Comparte tus ideas para mejorar ObelixIA. Todas las sugerencias son revisadas por el equipo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Nueva Función</SelectItem>
                    <SelectItem value="improvement">Mejora Existente</SelectItem>
                    <SelectItem value="bug">Corrección de Error</SelectItem>
                    <SelectItem value="documentation">Documentación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tu Sugerencia</label>
                <Textarea
                  placeholder="Describe tu sugerencia con el mayor detalle posible..."
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={submitting || !newSuggestion.trim()}
                className="w-full"
              >
                {submitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Sugerencia
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view" className="space-y-4 mt-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="reviewed">Revisadas</SelectItem>
                <SelectItem value="implemented">Implementadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Suggestions List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando sugerencias...
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>No hay sugerencias aún.</p>
                  <p className="text-sm">¡Sé el primero en compartir una idea!</p>
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{suggestion.suggestion_text}</p>
                        </div>
                        <Button
                          variant={userVotes.has(suggestion.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVote(suggestion.id)}
                          className="gap-1 shrink-0"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          {suggestion.votes_count}
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(suggestion.status)}
                        {getCategoryBadge(suggestion.category)}
                        {suggestion.source === 'ai_detected' && (
                          <Badge variant="secondary" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Detectada por IA
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(suggestion.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>

                      {suggestion.admin_notes && (
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          <strong>Respuesta admin:</strong> {suggestion.admin_notes}
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
