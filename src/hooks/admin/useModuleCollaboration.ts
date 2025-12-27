import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// === INTERFACES ===
export interface Comment {
  id: string;
  module_key: string;
  file_path?: string;
  line_number?: number;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  is_resolved: boolean;
  parent_id?: string;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface CodeReview {
  id: string;
  module_key: string;
  version_from: string;
  version_to: string;
  title: string;
  description: string;
  status: 'pending' | 'in_review' | 'changes_requested' | 'approved' | 'rejected';
  author_id: string;
  author_name: string;
  reviewers: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'pending' | 'approved' | 'changes_requested';
    reviewed_at?: string;
  }>;
  comments_count: number;
  files_changed: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAssignment {
  id: string;
  module_key: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'reviewer';
  permissions: string[];
  assigned_at: string;
  assigned_by: string;
}

export interface Activity {
  id: string;
  module_key: string;
  action_type: 'comment' | 'review' | 'assignment' | 'approval' | 'change' | 'deploy';
  description: string;
  actor_id: string;
  actor_name: string;
  actor_avatar?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  module_key: string;
  type: 'comment_mention' | 'review_request' | 'approval' | 'assignment' | 'reply';
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// === HOOK ===
export function useModuleCollaboration() {
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reviews, setReviews] = useState<CodeReview[]>([]);
  const [assignments, setAssignments] = useState<TeamAssignment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const autoRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  // === ADD COMMENT ===
  const addComment = useCallback(async (
    moduleKey: string,
    content: string,
    options?: {
      filePath?: string;
      lineNumber?: number;
      parentId?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'add_comment',
            moduleKey,
            content,
            ...options
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.comment) {
        setComments(prev => [data.comment, ...prev]);
        toast.success('Comentario agregado');
        return data.comment;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al agregar comentario');
      console.error('[useModuleCollaboration] addComment error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET COMMENTS ===
  const getComments = useCallback(async (moduleKey: string, filePath?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'get_comments',
            moduleKey,
            filePath
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.comments) {
        setComments(data.comments);
        return data.comments;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleCollaboration] getComments error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === RESOLVE COMMENT ===
  const resolveComment = useCallback(async (commentId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'resolve_comment',
            commentId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, is_resolved: true } : c
        ));
        toast.success('Comentario resuelto');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleCollaboration] resolveComment error:', err);
      toast.error('Error al resolver comentario');
      return false;
    }
  }, []);

  // === CREATE CODE REVIEW ===
  const createCodeReview = useCallback(async (
    moduleKey: string,
    title: string,
    description: string,
    versionFrom: string,
    versionTo: string,
    reviewerIds: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'create_review',
            moduleKey,
            title,
            description,
            versionFrom,
            versionTo,
            reviewerIds
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.review) {
        setReviews(prev => [data.review, ...prev]);
        toast.success('Revisión de código creada');
        return data.review;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      toast.error('Error al crear revisión');
      console.error('[useModuleCollaboration] createCodeReview error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === GET REVIEWS ===
  const getReviews = useCallback(async (moduleKey: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'get_reviews',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.reviews) {
        setReviews(data.reviews);
        return data.reviews;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      console.error('[useModuleCollaboration] getReviews error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === SUBMIT REVIEW ===
  const submitReview = useCallback(async (
    reviewId: string,
    status: 'approved' | 'changes_requested',
    comment?: string
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'submit_review',
            reviewId,
            status,
            comment
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(status === 'approved' ? 'Revisión aprobada' : 'Cambios solicitados');
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleCollaboration] submitReview error:', err);
      toast.error('Error al enviar revisión');
      return false;
    }
  }, []);

  // === ASSIGN TEAM MEMBER ===
  const assignTeamMember = useCallback(async (
    moduleKey: string,
    userId: string,
    role: 'owner' | 'maintainer' | 'contributor' | 'reviewer'
  ) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'assign_member',
            moduleKey,
            userId,
            role
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.assignment) {
        setAssignments(prev => [...prev, data.assignment]);
        toast.success('Miembro asignado');
        return data.assignment;
      }

      throw new Error('Invalid response');
    } catch (err) {
      console.error('[useModuleCollaboration] assignTeamMember error:', err);
      toast.error('Error al asignar miembro');
      return null;
    }
  }, []);

  // === GET TEAM ASSIGNMENTS ===
  const getTeamAssignments = useCallback(async (moduleKey: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'get_assignments',
            moduleKey
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.assignments) {
        setAssignments(data.assignments);
        return data.assignments;
      }

      return null;
    } catch (err) {
      console.error('[useModuleCollaboration] getTeamAssignments error:', err);
      return null;
    }
  }, []);

  // === GET ACTIVITY FEED ===
  const getActivityFeed = useCallback(async (moduleKey: string, limit = 50) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'get_activity',
            moduleKey,
            limit
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.activities) {
        setActivities(data.activities);
        return data.activities;
      }

      return null;
    } catch (err) {
      console.error('[useModuleCollaboration] getActivityFeed error:', err);
      return null;
    }
  }, []);

  // === GET NOTIFICATIONS ===
  const getNotifications = useCallback(async () => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'get_notifications'
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
        return data.notifications;
      }

      return null;
    } catch (err) {
      console.error('[useModuleCollaboration] getNotifications error:', err);
      return null;
    }
  }, []);

  // === MARK NOTIFICATION AS READ ===
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'module-collaboration',
        {
          body: {
            action: 'mark_notification_read',
            notificationId
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }

      return false;
    } catch (err) {
      console.error('[useModuleCollaboration] markNotificationAsRead error:', err);
      return false;
    }
  }, []);

  // === AUTO-REFRESH ===
  const startAutoRefresh = useCallback((moduleKey: string, intervalMs = 30000) => {
    stopAutoRefresh();
    getComments(moduleKey);
    getReviews(moduleKey);
    getActivityFeed(moduleKey);
    getNotifications();
    autoRefreshInterval.current = setInterval(() => {
      getActivityFeed(moduleKey);
      getNotifications();
    }, intervalMs);
  }, [getComments, getReviews, getActivityFeed, getNotifications]);

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
    comments,
    reviews,
    assignments,
    activities,
    notifications,
    unreadCount,
    error,
    addComment,
    getComments,
    resolveComment,
    createCodeReview,
    getReviews,
    submitReview,
    assignTeamMember,
    getTeamAssignments,
    getActivityFeed,
    getNotifications,
    markNotificationAsRead,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

export default useModuleCollaboration;
