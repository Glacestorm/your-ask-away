/**
 * CommunityPanel - Panel de comunidad académica
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  CheckCircle2,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  HelpCircle,
  BookOpen,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAcademiaCommunity, CommunityPost } from '@/hooks/academia/useAcademiaCommunity';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommunityPanelProps {
  courseId?: string;
  className?: string;
}

export function CommunityPanel({ courseId, className }: CommunityPanelProps) {
  const [activeTab, setActiveTab] = useState('feed');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<string>('discussion');

  const {
    isLoading,
    posts,
    stats,
    fetchPosts,
    createPost,
    toggleLike,
    generateAIResponse
  } = useAcademiaCommunity();

  useEffect(() => {
    fetchPosts({ courseId });
  }, [courseId, fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    await createPost({
      title: newPostTitle,
      content: newPostContent,
      postType: newPostType,
      courseId
    });

    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPost(false);
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <HelpCircle className="h-4 w-4" />;
      case 'discussion': return <MessageSquare className="h-4 w-4" />;
      case 'resource': return <BookOpen className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPostTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      question: 'bg-amber-500/20 text-amber-600',
      discussion: 'bg-blue-500/20 text-blue-600',
      resource: 'bg-green-500/20 text-green-600',
      announcement: 'bg-purple-500/20 text-purple-600'
    };
    return styles[type] || styles.discussion;
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Comunidad</CardTitle>
              <p className="text-xs text-muted-foreground">
                {stats?.activeUsers || 0} usuarios activos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPosts({ courseId })}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowNewPost(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Publicar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{stats.totalPosts}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{stats.totalComments}</p>
              <p className="text-xs text-muted-foreground">Comentarios</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{stats.solvedQuestions}</p>
              <p className="text-xs text-muted-foreground">Resueltas</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-bold">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </div>
        )}

        {/* New Post Form */}
        {showNewPost && (
          <Card className="mb-4 border-primary/20">
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2">
                {['discussion', 'question', 'resource'].map(type => (
                  <Button
                    key={type}
                    variant={newPostType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewPostType(type)}
                    className="gap-1"
                  >
                    {getPostTypeIcon(type)}
                    {type === 'discussion' ? 'Discusión' : type === 'question' ? 'Pregunta' : 'Recurso'}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Título de tu publicación..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="¿Qué quieres compartir?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowNewPost(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreatePost} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-1" />
                  Publicar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="feed" className="text-xs">Feed</TabsTrigger>
            <TabsTrigger value="trending" className="text-xs">Tendencias</TabsTrigger>
            <TabsTrigger value="unanswered" className="text-xs">Sin respuesta</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No hay publicaciones aún</p>
                    <p className="text-xs">¡Sé el primero en compartir!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => toggleLike(post.id)}
                      onAIResponse={() => generateAIResponse(post.id, post.content)}
                      getPostTypeBadge={getPostTypeBadge}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trending" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {posts
                  .sort((a, b) => b.likes_count - a.likes_count)
                  .slice(0, 10)
                  .map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => toggleLike(post.id)}
                      onAIResponse={() => generateAIResponse(post.id, post.content)}
                      getPostTypeBadge={getPostTypeBadge}
                      showTrending
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unanswered" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {posts
                  .filter(p => p.post_type === 'question' && !p.is_solved && p.comments_count === 0)
                  .map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => toggleLike(post.id)}
                      onAIResponse={() => generateAIResponse(post.id, post.content)}
                      getPostTypeBadge={getPostTypeBadge}
                    />
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// === Post Card Component ===
function PostCard({ 
  post, 
  onLike, 
  onAIResponse,
  getPostTypeBadge,
  showTrending = false
}: { 
  post: CommunityPost; 
  onLike: () => void;
  onAIResponse: () => void;
  getPostTypeBadge: (type: string) => string;
  showTrending?: boolean;
}) {
  return (
    <div className="p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={post.author?.avatar_url} />
          <AvatarFallback>{post.author?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className={cn("text-xs", getPostTypeBadge(post.post_type))}>
              {post.post_type}
            </Badge>
            {post.is_solved && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Resuelto
              </Badge>
            )}
            {showTrending && (
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Badge>
            )}
          </div>
          <h4 className="font-medium text-sm truncate">{post.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {post.content}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <button 
              onClick={onLike}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ThumbsUp className="h-3 w-3" />
              {post.likes_count}
            </button>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {post.comments_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {post.views_count}
            </span>
            <button
              onClick={onAIResponse}
              className="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
            >
              <Sparkles className="h-3 w-3" />
              Respuesta IA
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(post.created_at), { locale: es, addSuffix: true })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CommunityPanel;
