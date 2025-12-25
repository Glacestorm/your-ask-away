import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LessonSummary {
  summary: {
    title: string;
    main_points: string[];
    key_takeaways: string[];
    content: string;
  };
  learning_objectives: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time_minutes: number;
  related_topics: string[];
  review_questions: Array<{
    question: string;
    answer_hint: string;
  }>;
}

export interface ModuleSummary {
  module_summary: {
    title: string;
    overview: string;
    lessons_covered: number;
    main_themes: string[];
    progression: string;
  };
  lesson_summaries: Array<{
    lesson_number: number;
    title: string;
    key_points: string[];
    connection_to_next: string;
  }>;
  module_objectives_achieved: string[];
  preparation_for_next_module: string;
  assessment_readiness: {
    ready: boolean;
    areas_to_review: string[];
  };
}

export interface StudyGuide {
  study_guide: {
    title: string;
    objectives: string[];
    prerequisites: string[];
    estimated_study_time: string;
  };
  sections: Array<{
    title: string;
    content_summary: string;
    key_terms: Array<{
      term: string;
      definition: string;
    }>;
    examples: string[];
    practice_exercises: Array<{
      type: 'exercise' | 'reflection' | 'application';
      instruction: string;
      expected_outcome: string;
    }>;
  }>;
  review_checklist: string[];
  common_mistakes: string[];
  additional_resources: Array<{
    type: 'book' | 'video' | 'article' | 'tool';
    title: string;
    description: string;
  }>;
  self_assessment: {
    questions: string[];
    mastery_indicators: string[];
  };
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint?: string;
  category: string;
  difficulty: number;
  tags: string[];
}

export interface FlashcardSet {
  flashcard_set: {
    title: string;
    topic: string;
    total_cards: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  flashcards: Flashcard[];
  study_tips: string[];
  recommended_schedule: {
    initial_review: string;
    first_repetition: string;
    subsequent_reviews: string[];
  };
}

export interface KeyConcepts {
  concepts: Array<{
    name: string;
    definition: string;
    importance: 'high' | 'medium' | 'low';
    category: string;
    related_concepts: string[];
    examples: string[];
    common_misconceptions: string[];
    real_world_applications: string[];
  }>;
  concept_map: {
    central_theme: string;
    main_branches: Array<{
      branch: string;
      concepts: string[];
    }>;
    connections: Array<{
      from: string;
      to: string;
      relationship: string;
    }>;
  };
  learning_path: {
    sequence: string[];
    dependencies: Array<{
      concept: string;
      requires: string[];
    }>;
  };
  assessment_focus: string[];
}

interface SummarizerOptions {
  length?: 'brief' | 'standard' | 'detailed';
  format?: 'text' | 'bullets' | 'outline';
  language?: string;
  include_examples?: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useContentSummarizer() {
  const [status, setStatus] = useState<Status>('idle');
  const [lessonSummary, setLessonSummary] = useState<LessonSummary | null>(null);
  const [moduleSummary, setModuleSummary] = useState<ModuleSummary | null>(null);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardSet | null>(null);
  const [keyConcepts, setKeyConcepts] = useState<KeyConcepts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summarizeLesson = useCallback(async (
    lessonId: string,
    options?: SummarizerOptions
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-content-summarizer',
        {
          body: {
            action: 'summarize_lesson',
            lesson_id: lessonId,
            options
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setLessonSummary(data.data as LessonSummary);
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al resumir lección';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const summarizeModule = useCallback(async (
    moduleId: string,
    options?: SummarizerOptions
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-content-summarizer',
        {
          body: {
            action: 'summarize_module',
            module_id: moduleId,
            options
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setModuleSummary(data.data as ModuleSummary);
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al resumir módulo';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const generateStudyGuide = useCallback(async (
    lessonId?: string,
    moduleId?: string,
    content?: string
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-content-summarizer',
        {
          body: {
            action: 'generate_study_guide',
            lesson_id: lessonId,
            module_id: moduleId,
            content
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setStudyGuide(data.data as StudyGuide);
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al generar guía de estudio';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const createFlashcards = useCallback(async (
    lessonId?: string,
    moduleId?: string,
    content?: string
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-content-summarizer',
        {
          body: {
            action: 'create_flashcards',
            lesson_id: lessonId,
            module_id: moduleId,
            content
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setFlashcards(data.data as FlashcardSet);
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear flashcards';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const extractKeyConcepts = useCallback(async (
    lessonId?: string,
    moduleId?: string,
    content?: string
  ) => {
    setStatus('loading');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'academia-content-summarizer',
        {
          body: {
            action: 'extract_key_concepts',
            lesson_id: lessonId,
            module_id: moduleId,
            content
          }
        }
      );

      if (fnError) throw fnError;

      if (data?.success && data?.data) {
        setKeyConcepts(data.data as KeyConcepts);
        setStatus('success');
        return data.data;
      }

      throw new Error('Invalid response');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al extraer conceptos';
      setError(message);
      setStatus('error');
      toast.error(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setLessonSummary(null);
    setModuleSummary(null);
    setStudyGuide(null);
    setFlashcards(null);
    setKeyConcepts(null);
    setError(null);
  }, []);

  return {
    // State
    status,
    lessonSummary,
    moduleSummary,
    studyGuide,
    flashcards,
    keyConcepts,
    error,
    // Status helpers
    isIdle: status === 'idle',
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    // Actions
    summarizeLesson,
    summarizeModule,
    generateStudyGuide,
    createFlashcards,
    extractKeyConcepts,
    reset,
  };
}

export default useContentSummarizer;
