import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  MessageCircle, 
  Eye,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Users,
  BookOpen,
  ChevronLeft,
  Send,
  Pin,
  Star,
  MoreVertical,
  Sparkles
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CommunityPanel } from '@/components/academia/CommunityPanel';

interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  course_id?: string;
  course_title?: string;
  category: string;
  is_pinned: boolean;
  is_answered: boolean;
  likes_count: number;
  replies_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: string;
  discussion_id: string;
  content: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  is_solution: boolean;
  likes_count: number;
  created_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'question', label: 'Preguntas', icon: MessageCircle },
  { value: 'resource', label: 'Recursos', icon: BookOpen },
  { value: 'showcase', label: 'Proyectos', icon: Star }
];

export default function AcademiaCommunity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [newReply, setNewReply] = useState('');

  // Discussion form
  const [discussionForm, setDiscussionForm] = useState({
    title: '',
    content: '',
    category: 'general',
    course_id: ''
  });

  // Fetch discussions (simulated with mock data for now)
  const { data: discussions = [], isLoading } = useQuery({
    queryKey: ['community-discussions', selectedCategory, sortBy],
    queryFn: async () => {
      // For now, return mock data since we don't have a discussions table yet
      const mockDiscussions: Discussion[] = [
        {
          id: '1',
          title: '¿Cómo implementar autenticación con Supabase?',
          content: 'Estoy tratando de implementar autenticación en mi proyecto pero tengo dudas sobre las mejores prácticas...',
          author_id: '1',
          author_name: 'María García',
          category: 'question',
          is_pinned: true,
          is_answered: true,
          likes_count: 15,
          replies_count: 8,
          views_count: 234,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Recursos gratuitos para aprender React',
          content: 'Comparto esta lista de recursos que me han sido muy útiles para aprender React...',
          author_id: '2',
          author_name: 'Carlos López',
          category: 'resource',
          is_pinned: false,
          is_answered: false,
          likes_count: 42,
          replies_count: 12,
          views_count: 567,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Mi proyecto final: Dashboard de Analytics',
          content: 'Acabo de terminar mi proyecto final del curso de desarrollo web. Incluye gráficos interactivos, filtros dinámicos...',
          author_id: '3',
          author_name: 'Ana Martínez',
          category: 'showcase',
          is_pinned: false,
          is_answered: false,
          likes_count: 28,
          replies_count: 5,
          views_count: 189,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: 'Dudas sobre el módulo de TypeScript',
          content: 'No entiendo bien la diferencia entre interface y type. ¿Alguien puede explicármelo?',
          author_id: '4',
          author_name: 'Pedro Ruiz',
          category: 'question',
          is_pinned: false,
          is_answered: false,
          likes_count: 8,
          replies_count: 3,
          views_count: 78,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ];

      return mockDiscussions;
    }
  });

  // Fetch replies for selected discussion
  const { data: replies = [] } = useQuery({
    queryKey: ['discussion-replies', selectedDiscussion?.id],
    queryFn: async () => {
      if (!selectedDiscussion) return [];
      
      // Mock replies
      const mockReplies: Reply[] = [
        {
          id: 'r1',
          discussion_id: selectedDiscussion.id,
          content: 'Para implementar autenticación con Supabase, primero debes configurar el cliente...',
          author_id: '5',
          author_name: 'Laura Sánchez',
          is_solution: true,
          likes_count: 5,
          created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'r2',
          discussion_id: selectedDiscussion.id,
          content: '¡Gracias por la explicación! Me fue muy útil.',
          author_id: '1',
          author_name: 'María García',
          is_solution: false,
          likes_count: 2,
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      return mockReplies;
    },
    enabled: !!selectedDiscussion
  });

  // Filtered and sorted discussions
  const filteredDiscussions = useMemo(() => {
    let result = [...discussions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.title.toLowerCase().includes(query) || 
        d.content.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(d => d.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'unanswered':
        result = result.filter(d => !d.is_answered);
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Pin to top
    const pinned = result.filter(d => d.is_pinned);
    const notPinned = result.filter(d => !d.is_pinned);
    return [...pinned, ...notPinned];
  }, [discussions, searchQuery, selectedCategory, sortBy]);

  const handleCreateDiscussion = () => {
    toast.success('Discusión creada exitosamente');
    setIsCreateOpen(false);
    setDiscussionForm({
      title: '',
      content: '',
      category: 'general',
      course_id: ''
    });
  };

  const handlePostReply = () => {
    if (!newReply.trim()) return;
    toast.success('Respuesta publicada');
    setNewReply('');
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon || MessageSquare;
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  if (selectedDiscussion) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDiscussion(null)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {selectedDiscussion.is_pinned && (
                <Pin className="w-4 h-4 text-primary" />
              )}
              <Badge variant="outline">{getCategoryLabel(selectedDiscussion.category)}</Badge>
              {selectedDiscussion.is_answered && (
                <Badge variant="default" className="bg-green-500">Respondida</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mt-1">{selectedDiscussion.title}</h1>
          </div>
        </div>

        {/* Discussion Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={selectedDiscussion.author_avatar} />
                <AvatarFallback>
                  {selectedDiscussion.author_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedDiscussion.author_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedDiscussion.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-4 prose prose-sm max-w-none">
                  <p>{selectedDiscussion.content}</p>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {selectedDiscussion.likes_count}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    <Eye className="w-4 h-4 inline mr-1" />
                    {selectedDiscussion.views_count} vistas
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {replies.length} Respuestas
          </h2>

          {replies.map((reply) => (
            <Card key={reply.id} className={cn(reply.is_solution && "border-green-500 bg-green-500/5")}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={reply.author_avatar} />
                    <AvatarFallback>
                      {reply.author_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{reply.author_name}</p>
                        {reply.is_solution && (
                          <Badge variant="default" className="bg-green-500">
                            Solución
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                    <p className="mt-2 text-sm">{reply.content}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        {reply.likes_count}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Reply Form */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="Escribe tu respuesta..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handlePostReply} disabled={!newReply.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Responder
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* AI Community Panel - Prominent at top */}
      <CommunityPanel className="mb-2" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/academia">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Comunidad
            </h1>
            <p className="text-muted-foreground">
              Conecta con otros estudiantes y comparte conocimiento
            </p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Discusión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Discusión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={discussionForm.title}
                  onChange={(e) => setDiscussionForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="¿Cuál es tu pregunta o tema?"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select
                  value={discussionForm.category}
                  onValueChange={(value) => setDiscussionForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Contenido</Label>
                <Textarea
                  value={discussionForm.content}
                  onChange={(e) => setDiscussionForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe tu pregunta o comparte tu conocimiento..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateDiscussion}>Publicar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{discussions.length}</p>
                <p className="text-sm text-muted-foreground">Discusiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <MessageCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {discussions.reduce((acc, d) => acc + d.replies_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Respuestas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-500/10">
                <Star className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {discussions.filter(d => d.is_answered).length}
                </p>
                <p className="text-sm text-muted-foreground">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Miembros activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar discusiones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <TabsList>
            <TabsTrigger value="recent">
              <Clock className="w-4 h-4 mr-2" />
              Recientes
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="w-4 h-4 mr-2" />
              Populares
            </TabsTrigger>
            <TabsTrigger value="unanswered">
              <MessageCircle className="w-4 h-4 mr-2" />
              Sin responder
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.map((discussion) => {
          const CategoryIcon = getCategoryIcon(discussion.category);
          
          return (
            <Card 
              key={discussion.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-shadow",
                discussion.is_pinned && "border-primary/50"
              )}
              onClick={() => setSelectedDiscussion(discussion)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={discussion.author_avatar} />
                    <AvatarFallback>
                      {discussion.author_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {discussion.is_pinned && (
                        <Pin className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <Badge variant="outline" className="shrink-0">
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {getCategoryLabel(discussion.category)}
                      </Badge>
                      {discussion.is_answered && (
                        <Badge variant="default" className="bg-green-500 shrink-0">
                          Respondida
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mt-2 line-clamp-1">{discussion.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {discussion.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>{discussion.author_name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(discussion.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {discussion.likes_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {discussion.replies_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {discussion.views_count}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredDiscussions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold">No hay discusiones</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'No se encontraron resultados para tu búsqueda' : 'Sé el primero en iniciar una conversación'}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Discusión
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
