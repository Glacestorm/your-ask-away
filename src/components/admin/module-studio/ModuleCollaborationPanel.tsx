/**
 * ModuleCollaborationPanel - Collaboration para módulos
 * Comentarios, revisiones, asignaciones de equipo
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  RefreshCw, 
  MessageSquare,
  Maximize2,
  Minimize2,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  GitPullRequest,
  UserPlus
} from 'lucide-react';
import { useModuleCollaboration } from '@/hooks/admin/useModuleCollaboration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ModuleCollabContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleCollaborationPanelProps {
  context: ModuleCollabContext | null;
  className?: string;
}

export function ModuleCollaborationPanel({ context, className }: ModuleCollaborationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [newComment, setNewComment] = useState('');

  const {
    isLoading,
    comments,
    reviews,
    assignments,
    getComments,
    addComment,
    getReviews,
    createCodeReview,
    getTeamAssignments,
  } = useModuleCollaboration();

  useEffect(() => {
    if (context?.moduleKey) {
      getComments(context.moduleKey);
      getReviews(context.moduleKey);
      getTeamAssignments(context.moduleKey);
    }
  }, [context?.moduleKey, getComments, getReviews, getTeamAssignments]);

  const handleAddComment = useCallback(async () => {
    if (!context?.moduleKey || !newComment.trim()) return;
    
    await addComment(context.moduleKey, newComment);
    setNewComment('');
  }, [context?.moduleKey, newComment, addComment]);

  const handleRequestReview = useCallback(async () => {
    if (!context?.moduleKey) return;
    await createCodeReview(
      context.moduleKey,
      `Review for ${context.moduleName || context.moduleKey}`,
      'Code review request',
      '1.0.0',
      '1.0.1',
      []
    );
  }, [context, createCodeReview]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': 
      case 'in_review': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'changes_requested': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <GitPullRequest className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para colaborar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Collaboration</CardTitle>
              <p className="text-xs text-muted-foreground">
                {comments.length} comentarios · {reviews.length} revisiones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => context?.moduleKey && getComments(context.moduleKey)}
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="comments" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Comentarios
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">
              <GitPullRequest className="h-3 w-3 mr-1" />
              Revisiones
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <UserPlus className="h-3 w-3 mr-1" />
              Equipo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="flex-1 mt-0 flex flex-col">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-420px)]" : "h-[140px]"}>
              <div className="space-y-3 pr-2">
                {comments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin comentarios aún</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(comment.author_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{comment.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            
            {/* Add Comment */}
            <div className="mt-3 flex gap-2">
              <Textarea 
                placeholder="Añadir comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm resize-none"
              />
              <Button 
                size="icon"
                onClick={handleAddComment}
                disabled={!newComment.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="flex-1 mt-0">
            <div className="mb-3">
              <Button 
                size="sm" 
                className="w-full"
                onClick={handleRequestReview}
                disabled={isLoading}
              >
                <GitPullRequest className="h-4 w-4 mr-2" />
                Solicitar Revisión
              </Button>
            </div>
            <ScrollArea className={isExpanded ? "h-[calc(100vh-400px)]" : "h-[150px]"}>
              <div className="space-y-2">
                {reviews.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <GitPullRequest className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin revisiones</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-2 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(review.status)}
                          <span className="text-sm font-medium">{review.author_name}</span>
                        </div>
                        <Badge 
                          variant={review.status === 'approved' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {review.status === 'approved' ? 'Aprobado' : 
                           review.status === 'pending' || review.status === 'in_review' ? 'Pendiente' : 'Cambios'}
                        </Badge>
                      </div>
                      {review.description && (
                        <p className="text-xs text-muted-foreground mt-2 ml-6">{review.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="team" className="flex-1 mt-0">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
              <div className="space-y-2">
                {assignments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Sin asignaciones</p>
                  </div>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {getInitials(assignment.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{assignment.user_name}</p>
                          <p className="text-xs text-muted-foreground">{assignment.role}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {assignment.role}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleCollaborationPanel;
