/**
 * ModuleCollaborationPanel - Collaboration para módulos
 * Comentarios, revisiones, asignaciones de equipo
 * Enhanced with more interactivity
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  UserPlus,
  MoreVertical,
  Heart,
  Reply,
  Trash2,
  Edit,
  ThumbsUp,
  AtSign,
  Smile
} from 'lucide-react';
import { useModuleCollaboration } from '@/hooks/admin/useModuleCollaboration';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ModuleCollabContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleCollaborationPanelProps {
  context: ModuleCollabContext | null;
  className?: string;
}

const EMOJI_OPTIONS = ['👍', '❤️', '🎉', '🚀', '👀', '💡'];

export function ModuleCollaborationPanel({ context, className }: ModuleCollaborationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

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
    
    const content = replyTo 
      ? `@${replyTo.author_name} ${newComment}` 
      : newComment;
    
    await addComment(context.moduleKey, content);
    setNewComment('');
    setReplyTo(null);
    toast.success('Comentario añadido');
  }, [context?.moduleKey, newComment, replyTo, addComment]);

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
    toast.success('Revisión solicitada');
  }, [context, createCodeReview]);

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReplyToComment = (comment: any) => {
    setReplyTo(comment);
  };

  const handleAddReaction = (commentId: string, emoji: string) => {
    toast.success(`Reacción ${emoji} añadida`);
  };

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
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
        className
      )}>
        <CardHeader className="pb-2 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="h-5 w-5 text-white" />
              </motion.div>
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
                title="Actualizar"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
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
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3 pr-2">
                    {comments.length === 0 ? (
                      <motion.div 
                        className="text-center py-4 text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Sin comentarios aún</p>
                      </motion.div>
                    ) : (
                      comments.map((comment, index) => (
                        <motion.div 
                          key={comment.id} 
                          className="p-2 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-start gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/20">
                                {getInitials(comment.author_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium">{comment.author_name}</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(comment.created_at), { locale: es, addSuffix: true })}
                                  </span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger 
                                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleReplyToComment(comment)}>
                                        <Reply className="h-4 w-4 mr-2" />
                                        Responder
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setEditingComment(comment)}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                              
                              {/* Actions row */}
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleLikeComment(comment.id)}
                                >
                                  <ThumbsUp className={cn(
                                    "h-3 w-3 mr-1",
                                    likedComments.has(comment.id) && "fill-current text-primary"
                                  )} />
                                  {likedComments.has(comment.id) ? 1 : 0}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleReplyToComment(comment)}
                                >
                                  <Reply className="h-3 w-3 mr-1" />
                                  Responder
                                </Button>
                                <Popover>
                                  <PopoverTrigger className="h-6 px-2 text-xs inline-flex items-center justify-center rounded-md font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none">
                                    <Smile className="h-3 w-3" />
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2" align="start">
                                    <div className="flex gap-1">
                                      {EMOJI_OPTIONS.map(emoji => (
                                        <Button 
                                          key={emoji}
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-8 w-8 p-0"
                                          onClick={() => handleAddReaction(comment.id, emoji)}
                                        >
                                          {emoji}
                                        </Button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </AnimatePresence>
              </ScrollArea>
              
              {/* Add Comment */}
              <div className="mt-3 space-y-2">
                {replyTo && (
                  <motion.div 
                    className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Reply className="h-3 w-3" />
                    <span>Respondiendo a <strong>{replyTo.author_name}</strong></span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-auto"
                      onClick={() => setReplyTo(null)}
                    >
                      ×
                    </Button>
                  </motion.div>
                )}
                <div className="flex gap-2">
                  <Textarea 
                    placeholder={replyTo ? `Responder a ${replyTo.author_name}...` : "Añadir comentario..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.metaKey) {
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="flex flex-col gap-1">
                    <Button 
                      size="icon"
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isLoading}
                      title="Enviar (⌘ + Enter)"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {reviews.length === 0 ? (
                      <motion.div 
                        className="text-center py-4 text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <GitPullRequest className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Sin revisiones</p>
                      </motion.div>
                    ) : (
                      reviews.map((review, index) => (
                        <motion.div 
                          key={review.id} 
                          className="p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                        >
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
                        </motion.div>
                      ))
                    )}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="team" className="flex-1 mt-0">
              <div className="mb-3">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddMember(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Añadir Miembro
                </Button>
              </div>
              <ScrollArea className={isExpanded ? "h-[calc(100vh-400px)]" : "h-[150px]"}>
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {assignments.length === 0 ? (
                      <motion.div 
                        className="text-center py-4 text-muted-foreground text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Sin asignaciones</p>
                      </motion.div>
                    ) : (
                      assignments.map((assignment, index) => (
                        <motion.div 
                          key={assignment.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/20">
                                {getInitials(assignment.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{assignment.user_name}</p>
                              <p className="text-xs text-muted-foreground">{assignment.role}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.role}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Cambiar rol
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Add Member Dialog */}
        <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Miembro al Equipo</DialogTitle>
              <DialogDescription>
                Invita a un nuevo colaborador a este módulo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="email@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol</label>
                <select className="w-full px-3 py-2 border rounded-md text-sm">
                  <option value="developer">Desarrollador</option>
                  <option value="reviewer">Revisor</option>
                  <option value="maintainer">Mantenedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMember(false)}>
                Cancelar
              </Button>
              <Button onClick={() => { toast.success('Invitación enviada'); setShowAddMember(false); }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Enviar Invitación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default ModuleCollaborationPanel;
