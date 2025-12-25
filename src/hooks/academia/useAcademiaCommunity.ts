/**
 * useAcademiaCommunity - Hook para gestión de comunidad académica
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  course_id?: string;
  post_type: 'question' | 'discussion' | 'resource' | 'announcement';
  tags: string[];
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  is_solved: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    avatar_url?: string;
  };
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  likes_count: number;
  is_solution: boolean;
  created_at: string;
  author?: {
    name: string;
    avatar_url?: string;
  };
}

export interface CommunityStats {
  totalPosts: number;
  totalComments: number;
  activeUsers: number;
  solvedQuestions: number;
  trendingTags: Array<{ tag: string; count: number }>;
}

export interface CommunityContext {
  courseId?: string;
  userId?: string;
  filters?: {
    postType?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
  };
}

export function useAcademiaCommunity() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === FETCH POSTS ===
  const fetchPosts = useCallback(async (context?: CommunityContext) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'get_posts',
            context: {
              ...context,
              userId: user?.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setPosts(data.data?.posts || []);
        setStats(data.data?.stats || null);
        setLastRefresh(new Date());
        return data.data;
      }

      throw new Error(data?.error || 'Error fetching posts');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useAcademiaCommunity] fetchPosts error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // === CREATE POST ===
  const createPost = useCallback(async (post: {
    title: string;
    content: string;
    postType: string;
    courseId?: string;
    tags?: string[];
  }) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'create_post',
            params: {
              ...post,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Publicación creada');
        await fetchPosts();
        return data.data;
      }

      throw new Error(data?.error || 'Error creating post');
    } catch (err) {
      console.error('[useAcademiaCommunity] createPost error:', err);
      toast.error('Error al crear publicación');
      return null;
    }
  }, [user?.id, fetchPosts]);

  // === ADD COMMENT ===
  const addComment = useCallback(async (
    postId: string,
    content: string,
    parentId?: string
  ) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return null;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'add_comment',
            params: {
              postId,
              content,
              parentId,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Comentario añadido');
        return data.data;
      }

      throw new Error(data?.error || 'Error adding comment');
    } catch (err) {
      console.error('[useAcademiaCommunity] addComment error:', err);
      toast.error('Error al añadir comentario');
      return null;
    }
  }, [user?.id]);

  // === TOGGLE LIKE ===
  const toggleLike = useCallback(async (postId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión');
      return false;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'toggle_like',
            params: {
              postId,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.success || false;
    } catch (err) {
      console.error('[useAcademiaCommunity] toggleLike error:', err);
      return false;
    }
  }, [user?.id]);

  // === MARK AS SOLUTION ===
  const markAsSolution = useCallback(async (commentId: string, postId: string) => {
    if (!user?.id) return false;

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'mark_solution',
            params: {
              commentId,
              postId,
              userId: user.id
            }
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Marcado como solución');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[useAcademiaCommunity] markAsSolution error:', err);
      return false;
    }
  }, [user?.id]);

  // === GENERATE AI RESPONSE ===
  const generateAIResponse = useCallback(async (postId: string, question: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-community',
        {
          body: {
            action: 'ai_response',
            params: { postId, question }
          }
        }
      );

      if (fnError) throw fnError;
      return data?.data?.response || null;
    } catch (err) {
      console.error('[useAcademiaCommunity] generateAIResponse error:', err);
      toast.error('Error al generar respuesta IA');
      return null;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((context: CommunityContext, intervalMs = 60000) => {
    stopAutoRefresh();
    fetchPosts(context);
    autoRefreshInterval.current = setInterval(() => {
      fetchPosts(context);
    }, intervalMs);
  }, [fetchPosts]);

  const stopAutoRefresh = useCallback(() => {
    if (autoRefreshInterval.current) {
      clearInterval(autoRefreshInterval.current);
      autoRefreshInterval.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopAutoRefresh();
  }, [stopAutoRefresh]);

  return {
    isLoading,
    posts,
    stats,
    error,
    lastRefresh,
    fetchPosts,
    createPost,
    addComment,
    toggleLike,
    markAsSolution,
    generateAIResponse,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useAcademiaCommunity;
