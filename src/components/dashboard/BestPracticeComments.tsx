import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageSquare, Reply, Trash2, Edit2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Comment {
  id: string;
  practice_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    gestor_number: string;
  };
  replies?: Comment[];
}

interface BestPracticeCommentsProps {
  practiceId: string;
}

export const BestPracticeComments = ({ practiceId }: BestPracticeCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`practice-comments-${practiceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "best_practice_comments",
          filter: `practice_id=eq.${practiceId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [practiceId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("best_practice_comments")
        .select(`
          *,
          profiles:user_id (full_name, gestor_number)
        `)
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Organize comments into threads
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      data?.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      data?.forEach((comment) => {
        const commentWithReplies = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies?.push(commentWithReplies);
          }
        } else {
          rootComments.push(commentWithReplies);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Error al cargar los comentarios");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("best_practice_comments").insert({
        practice_id: practiceId,
        user_id: user!.id,
        parent_id: replyTo,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      setReplyTo(null);
      toast.success("Comentario publicado");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Error al publicar el comentario");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast.error("El comentario no puede estar vacío");
      return;
    }

    try {
      const { error } = await supabase
        .from("best_practice_comments")
        .update({ content: editContent.trim() })
        .eq("id", commentId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      toast.success("Comentario actualizado");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Error al actualizar el comentario");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("best_practice_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast.success("Comentario eliminado");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Error al eliminar el comentario");
    }
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isEditing = editingId === comment.id;
    const isOwner = comment.user_id === user?.id;
    const isReplying = replyTo === comment.id;

    return (
      <div key={comment.id} className={`${depth > 0 ? "ml-8 mt-3" : "mt-4"}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {comment.profiles?.full_name?.[0] || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.profiles?.full_name || "Usuario"}
              </span>
              {comment.profiles?.gestor_number && (
                <span className="text-xs text-muted-foreground">
                  #{comment.profiles.gestor_number}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
              {comment.created_at !== comment.updated_at && (
                <span className="text-xs text-muted-foreground italic">
                  (editado)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
                <div className="flex gap-2">
                  {depth < 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyTo(comment.id);
                        setNewComment("");
                      }}
                      className="h-7 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                  )}
                  {isOwner && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="h-7 text-xs"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-7 text-xs text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}

            {isReplying && (
              <div className="space-y-2 pt-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={`Responder a ${comment.profiles?.full_name}...`}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={loading}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Responder
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyTo(null);
                      setNewComment("");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="border-l-2 border-border pl-2">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="font-semibold">
          Comentarios ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
      </div>

      {!replyTo && (
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Comparte tus pensamientos o haz una pregunta..."
            rows={3}
          />
          <Button onClick={handleSubmitComment} disabled={loading} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Comentar
          </Button>
        </div>
      )}

      <ScrollArea className="max-h-[600px]">
        <div className="pr-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sé el primero en comentar esta práctica
            </p>
          ) : (
            comments.map((comment) => renderComment(comment))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
