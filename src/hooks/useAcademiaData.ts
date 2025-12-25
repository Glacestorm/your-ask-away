/**
 * useAcademiaData - Hook para datos de Academia desde Supabase
 * Maneja cursos, inscripciones, progreso y comunidad
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// === TYPES ===
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category: string;
  level: string;
  duration_hours: number | null;
  thumbnail_url: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  is_free: boolean | null;
  price: number | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_students: number | null;
  total_lessons: number | null;
  learning_objectives: string[] | null;
  prerequisites: string[] | null;
  tags: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string | null;
  progress_percentage: number | null;
  enrolled_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  certificate_issued: boolean | null;
  certificate_code: string | null;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  status: string | null;
  progress_seconds: number | null;
  completed_at: string | null;
  notes: string | null;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  content: string;
  post_type: string | null;
  tags: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  is_pinned: boolean | null;
  is_solved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  likes_count: number | null;
  is_solution: boolean | null;
  created_at: string | null;
}

// === HOOK ===
export function useAcademiaData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // === COURSES ===
  const coursesQuery = useQuery({
    queryKey: ['academia-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academia_courses')
        .select('*')
        .eq('is_published', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // === USER ENROLLMENTS ===
  const enrollmentsQuery = useQuery({
    queryKey: ['academia-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('academia_enrollments')
        .select(`
          *,
          course:academia_courses(*)
        `)
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // === LESSON PROGRESS ===
  const lessonProgressQuery = useQuery({
    queryKey: ['academia-lesson-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('academia_lesson_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as LessonProgress[];
    },
    enabled: !!user?.id,
  });

  // === COMMUNITY POSTS ===
  const communityPostsQuery = useQuery({
    queryKey: ['academia-community-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academia_community_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CommunityPost[];
    },
  });

  // === ENROLL IN COURSE ===
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('academia_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          enrolled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-enrollments'] });
      toast.success('¡Inscripción exitosa!');
    },
    onError: (error) => {
      console.error('Enrollment error:', error);
      toast.error('Error al inscribirse en el curso');
    },
  });

  // === UPDATE LESSON PROGRESS ===
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      courseId,
      lessonId,
      progressSeconds,
      status,
    }: {
      courseId: string;
      lessonId: string;
      progressSeconds?: number;
      status?: string;
    }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('academia_lesson_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          progress_seconds: progressSeconds,
          status: status || 'in_progress',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,course_id,lesson_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-lesson-progress'] });
    },
  });

  // === CREATE COMMUNITY POST ===
  const createPostMutation = useMutation({
    mutationFn: async (post: {
      title: string;
      content: string;
      post_type?: string;
      course_id?: string;
      tags?: string[];
    }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('academia_community_posts')
        .insert({
          user_id: user.id,
          ...post,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-community-posts'] });
      toast.success('Publicación creada');
    },
    onError: (error) => {
      console.error('Create post error:', error);
      toast.error('Error al crear publicación');
    },
  });

  // === ADD COMMENT ===
  const addCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      content,
      parentId,
    }: {
      postId: string;
      content: string;
      parentId?: string;
    }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('academia_community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-community-posts'] });
      toast.success('Comentario añadido');
    },
  });

  // === LIKE POST ===
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { error } = await supabase
        .from('academia_community_likes')
        .insert({
          post_id: postId,
          user_id: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          // Already liked, remove like
          await supabase
            .from('academia_community_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);
        } else {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academia-community-posts'] });
    },
  });

  // === RETURN ===
  return {
    // Queries
    courses: coursesQuery.data || [],
    coursesLoading: coursesQuery.isLoading,
    enrollments: enrollmentsQuery.data || [],
    enrollmentsLoading: enrollmentsQuery.isLoading,
    lessonProgress: lessonProgressQuery.data || [],
    communityPosts: communityPostsQuery.data || [],
    communityLoading: communityPostsQuery.isLoading,
    // Mutations
    enroll: enrollMutation.mutate,
    enrolling: enrollMutation.isPending,
    updateProgress: updateProgressMutation.mutate,
    createPost: createPostMutation.mutate,
    addComment: addCommentMutation.mutate,
    likePost: likePostMutation.mutate,
    // Refetch
    refetchCourses: coursesQuery.refetch,
    refetchEnrollments: enrollmentsQuery.refetch,
    refetchCommunity: communityPostsQuery.refetch,
  };
}

export default useAcademiaData;
