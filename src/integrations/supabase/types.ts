export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academia_achievements: {
        Row: {
          badge_url: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          points: number | null
        }
        Insert: {
          badge_url?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points?: number | null
        }
        Update: {
          badge_url?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      academia_certificates: {
        Row: {
          certificate_code: string
          course_id: string
          created_at: string | null
          enrollment_id: string | null
          id: string
          issued_at: string | null
          metadata: Json | null
          pdf_url: string | null
          user_id: string
          verification_url: string | null
        }
        Insert: {
          certificate_code: string
          course_id: string
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          user_id: string
          verification_url?: string | null
        }
        Update: {
          certificate_code?: string
          course_id?: string
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          issued_at?: string | null
          metadata?: Json | null
          pdf_url?: string | null
          user_id?: string
          verification_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "academia_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_community_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "academia_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "academia_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_community_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "academia_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "academia_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_community_posts: {
        Row: {
          comments_count: number | null
          content: string
          course_id: string | null
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_solved: boolean | null
          likes_count: number | null
          post_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_solved?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_solved?: boolean | null
          likes_count?: number | null
          post_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_community_posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_courses: {
        Row: {
          average_rating: number | null
          category: string
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          instructor_id: string | null
          instructor_name: string | null
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          learning_objectives: string[] | null
          level: string
          prerequisites: string[] | null
          price: number | null
          short_description: string | null
          slug: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          total_reviews: number | null
          total_students: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string[] | null
          level?: string
          prerequisites?: string[] | null
          price?: number | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          instructor_id?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          learning_objectives?: string[] | null
          level?: string
          prerequisites?: string[] | null
          price?: number | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          total_reviews?: number | null
          total_students?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_enrollments: {
        Row: {
          certificate_code: string | null
          certificate_issued: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string | null
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          progress_percentage: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certificate_code?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certificate_code?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_lesson_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string
          notes: string | null
          progress_seconds: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id: string
          notes?: string | null
          progress_seconds?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          notes?: string | null
          progress_seconds?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academia_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          is_published: boolean | null
          lesson_type: string | null
          module_id: string
          order_index: number
          resources: Json | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          module_id: string
          order_index?: number
          resources?: Json | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          lesson_type?: string | null
          module_id?: string
          order_index?: number
          resources?: Json | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academia_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academia_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academia_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_notifications: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_notifications_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_reviews: {
        Row: {
          content: string | null
          course_id: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified: boolean | null
          rating: number
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          rating: number
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academia_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academia_user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academia_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "academia_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      access_control_policies: {
        Row: {
          access_level: string
          approved_by: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          policy_type: string
          roles_affected: string[] | null
          updated_at: string | null
        }
        Insert: {
          access_level: string
          approved_by?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          policy_type: string
          roles_affected?: string[] | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          approved_by?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          policy_type?: string
          roles_affected?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      action_plan_steps: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          plan_id: string
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id: string
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id?: string
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          gap_percentage: number | null
          generated_at: string
          id: string
          status: string
          target_date: string | null
          target_metric: string
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          gap_percentage?: number | null
          generated_at?: string
          id?: string
          status?: string
          target_date?: string | null
          target_metric: string
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          gap_percentage?: number | null
          generated_at?: string
          id?: string
          status?: string
          target_date?: string | null
          target_metric?: string
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      adoption_milestones: {
        Row: {
          badge_icon: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          milestone_key: string
          milestone_name: string
          order_index: number | null
          points_value: number | null
          required_for_activation: boolean | null
        }
        Insert: {
          badge_icon?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          milestone_key: string
          milestone_name: string
          order_index?: number | null
          points_value?: number | null
          required_for_activation?: boolean | null
        }
        Update: {
          badge_icon?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          milestone_key?: string
          milestone_name?: string
          order_index?: number | null
          points_value?: number | null
          required_for_activation?: boolean | null
        }
        Relationships: []
      }
      adoption_scores: {
        Row: {
          activation_score: number | null
          breadth_score: number | null
          company_id: string | null
          created_at: string | null
          depth_score: number | null
          engagement_score: number | null
          id: string
          last_calculated_at: string | null
          next_calculation_at: string | null
          overall_score: number | null
          recommendations: Json | null
          risk_level: string | null
          score_breakdown: Json | null
          stickiness_score: number | null
          time_to_value_score: number | null
          trend: string | null
          trend_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          activation_score?: number | null
          breadth_score?: number | null
          company_id?: string | null
          created_at?: string | null
          depth_score?: number | null
          engagement_score?: number | null
          id?: string
          last_calculated_at?: string | null
          next_calculation_at?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          risk_level?: string | null
          score_breakdown?: Json | null
          stickiness_score?: number | null
          time_to_value_score?: number | null
          trend?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          activation_score?: number | null
          breadth_score?: number | null
          company_id?: string | null
          created_at?: string | null
          depth_score?: number | null
          engagement_score?: number | null
          id?: string
          last_calculated_at?: string | null
          next_calculation_at?: string | null
          overall_score?: number | null
          recommendations?: Json | null
          risk_level?: string | null
          score_breakdown?: Json | null
          stickiness_score?: number | null
          time_to_value_score?: number | null
          trend?: string | null
          trend_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adoption_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interventions: {
        Row: {
          ai_analysis: string
          auto_execute_at: string | null
          created_at: string
          diagnostic_log_id: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          issue_description: string
          proposed_solution: string
          reverted_at: string | null
          reverted_by: string | null
          rollback_data: Json | null
          solution_code: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis: string
          auto_execute_at?: string | null
          created_at?: string
          diagnostic_log_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          issue_description: string
          proposed_solution: string
          reverted_at?: string | null
          reverted_by?: string | null
          rollback_data?: Json | null
          solution_code?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string
          auto_execute_at?: string | null
          created_at?: string
          diagnostic_log_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          issue_description?: string
          proposed_solution?: string
          reverted_at?: string | null
          reverted_by?: string | null
          rollback_data?: Json | null
          solution_code?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interventions_diagnostic_log_id_fkey"
            columns: ["diagnostic_log_id"]
            isOneToOne: false
            referencedRelation: "system_diagnostic_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_task_queue: {
        Row: {
          ai_reasoning: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          estimated_value: number | null
          id: string
          priority: number
          result_notes: string | null
          status: string
          suggested_action: string | null
          target_entity_id: string | null
          target_entity_type: string | null
          target_gestor_id: string | null
          task_description: string | null
          task_title: string
          task_type: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          priority?: number
          result_notes?: string | null
          status?: string
          suggested_action?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_gestor_id?: string | null
          task_description?: string | null
          task_title: string
          task_type: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          priority?: number
          result_notes?: string | null
          status?: string
          suggested_action?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_gestor_id?: string | null
          task_description?: string | null
          task_title?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_queue_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_task_queue_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_history: {
        Row: {
          alert_id: string
          alert_name: string
          condition_type: string
          escalated_at: string | null
          escalation_level: number | null
          escalation_notified_to: Json | null
          id: string
          metric_type: string
          metric_value: number
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          target_gestor_id: string | null
          target_office: string | null
          target_type: string | null
          threshold_value: number
          triggered_at: string
        }
        Insert: {
          alert_id: string
          alert_name: string
          condition_type: string
          escalated_at?: string | null
          escalation_level?: number | null
          escalation_notified_to?: Json | null
          id?: string
          metric_type: string
          metric_value: number
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value: number
          triggered_at?: string
        }
        Update: {
          alert_id?: string
          alert_name?: string
          condition_type?: string
          escalated_at?: string | null
          escalation_level?: number | null
          escalation_notified_to?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value?: number
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          active: boolean | null
          alert_name: string
          condition_type: string
          created_at: string | null
          created_by: string | null
          escalation_enabled: boolean | null
          escalation_hours: number | null
          id: string
          last_checked: string | null
          max_escalation_level: number | null
          metric_type: string
          period_type: string
          target_gestor_id: string | null
          target_office: string | null
          target_type: string | null
          threshold_value: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          alert_name: string
          condition_type: string
          created_at?: string | null
          created_by?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          id?: string
          last_checked?: string | null
          max_escalation_level?: number | null
          metric_type: string
          period_type: string
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          alert_name?: string
          condition_type?: string
          created_at?: string | null
          created_by?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          id?: string
          last_checked?: string | null
          max_escalation_level?: number | null
          metric_type?: string
          period_type?: string
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_predictions: {
        Row: {
          accuracy_score: number | null
          actual_value: number | null
          confidence_interval_high: number | null
          confidence_interval_low: number | null
          confidence_level: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          feature_importances: Json | null
          id: string
          input_features: Json | null
          metadata: Json | null
          model_name: string
          model_version: string | null
          predicted_category: string | null
          predicted_value: number | null
          prediction_date: string
          prediction_horizon_days: number
          prediction_type: string
          priority_score: number | null
          recommendations: Json | null
          scenario: string | null
          scenario_parameters: Json | null
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          feature_importances?: Json | null
          id?: string
          input_features?: Json | null
          metadata?: Json | null
          model_name: string
          model_version?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_date?: string
          prediction_horizon_days: number
          prediction_type: string
          priority_score?: number | null
          recommendations?: Json | null
          scenario?: string | null
          scenario_parameters?: Json | null
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          feature_importances?: Json | null
          id?: string
          input_features?: Json | null
          metadata?: Json | null
          model_name?: string
          model_version?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_date?: string
          prediction_horizon_days?: number
          prediction_type?: string
          priority_score?: number | null
          recommendations?: Json | null
          scenario?: string | null
          scenario_parameters?: Json | null
          valid_until?: string | null
        }
        Relationships: []
      }
      anonymized_training_data: {
        Row: {
          aggregated_metrics: Json
          aggregation_period: string
          anonymization_level: string
          created_at: string
          data_type: string
          expires_at: string
          id: string
          period_end: string
          period_start: string
          purpose: string
          sample_size: number
          source_hash: string
          techniques_applied: string[]
          transfer_restrictions: string
        }
        Insert: {
          aggregated_metrics?: Json
          aggregation_period: string
          anonymization_level?: string
          created_at?: string
          data_type: string
          expires_at?: string
          id?: string
          period_end: string
          period_start: string
          purpose?: string
          sample_size: number
          source_hash: string
          techniques_applied?: string[]
          transfer_restrictions?: string
        }
        Update: {
          aggregated_metrics?: Json
          aggregation_period?: string
          anonymization_level?: string
          created_at?: string
          data_type?: string
          expires_at?: string
          id?: string
          period_end?: string
          period_start?: string
          purpose?: string
          sample_size?: number
          source_hash?: string
          techniques_applied?: string[]
          transfer_restrictions?: string
        }
        Relationships: []
      }
      app_modules: {
        Row: {
          base_price: number | null
          category: Database["public"]["Enums"]["module_category"]
          changelog: Json | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          documentation_url: string | null
          features: Json | null
          id: string
          is_core: boolean | null
          is_required: boolean | null
          min_core_version: string | null
          module_icon: string | null
          module_key: string
          module_name: string
          screenshots: Json | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["module_category"]
          changelog?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          is_required?: boolean | null
          min_core_version?: string | null
          module_icon?: string | null
          module_key: string
          module_name: string
          screenshots?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["module_category"]
          changelog?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          is_required?: boolean | null
          min_core_version?: string | null
          module_icon?: string | null
          module_key?: string
          module_name?: string
          screenshots?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      asset_inventory: {
        Row: {
          asset_name: string
          asset_type: string
          backup_policy: string | null
          classification: string
          created_at: string | null
          criticality: string
          data_types: string[] | null
          dependencies: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          last_review_date: string | null
          location: string | null
          next_review_date: string | null
          owner: string | null
          recovery_point_objective: number | null
          recovery_time_objective: number | null
          updated_at: string | null
        }
        Insert: {
          asset_name: string
          asset_type: string
          backup_policy?: string | null
          classification: string
          created_at?: string | null
          criticality: string
          data_types?: string[] | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          location?: string | null
          next_review_date?: string | null
          owner?: string | null
          recovery_point_objective?: number | null
          recovery_time_objective?: number | null
          updated_at?: string | null
        }
        Update: {
          asset_name?: string
          asset_type?: string
          backup_policy?: string | null
          classification?: string
          created_at?: string | null
          criticality?: string
          data_types?: string[] | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          location?: string | null
          next_review_date?: string | null
          owner?: string | null
          recovery_point_objective?: number | null
          recovery_time_objective?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assistant_conversation_audit: {
        Row: {
          content: string
          context: string | null
          conversation_id: string
          created_at: string
          id: string
          input_method: string | null
          role: string
          user_deleted_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          input_method?: string | null
          role: string
          user_deleted_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          input_method?: string | null
          role?: string
          user_deleted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_knowledge_documents: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          document_type: string
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_alerts: {
        Row: {
          alert_type: string
          auto_generated: boolean | null
          created_at: string | null
          days_until_due: number | null
          description: string | null
          due_date: string | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          organization_id: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          title: string
        }
        Insert: {
          alert_type: string
          auto_generated?: boolean | null
          created_at?: string | null
          days_until_due?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          organization_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title: string
        }
        Update: {
          alert_type?: string
          auto_generated?: boolean | null
          created_at?: string | null
          days_until_due?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          organization_id?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidence: {
        Row: {
          collected_at: string | null
          created_at: string
          data: Json
          evidence_period_end: string
          evidence_period_start: string
          evidence_type: string
          file_url: string | null
          id: string
          is_validated: boolean | null
          organization_id: string | null
          source_query: string | null
          source_table: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          data?: Json
          evidence_period_end: string
          evidence_period_start: string
          evidence_type: string
          file_url?: string | null
          id?: string
          is_validated?: boolean | null
          organization_id?: string | null
          source_query?: string | null
          source_table?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          data?: Json
          evidence_period_end?: string
          evidence_period_start?: string
          evidence_type?: string
          file_url?: string | null
          id?: string
          is_validated?: boolean | null
          organization_id?: string | null
          source_query?: string | null
          source_table?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          category: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          request_id: string | null
          session_id: string | null
          severity: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_reports_generated: {
        Row: {
          auditor_emails: string[] | null
          compliance_score: number | null
          created_at: string
          findings_summary: Json | null
          generated_at: string | null
          generated_by: string | null
          id: string
          organization_id: string | null
          pdf_url: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          sections_data: Json | null
          sector_key: string
          sent_at: string | null
          sent_to_auditors: boolean | null
          template_id: string | null
        }
        Insert: {
          auditor_emails?: string[] | null
          compliance_score?: number | null
          created_at?: string
          findings_summary?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          pdf_url?: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          sections_data?: Json | null
          sector_key: string
          sent_at?: string | null
          sent_to_auditors?: boolean | null
          template_id?: string | null
        }
        Update: {
          auditor_emails?: string[] | null
          compliance_score?: number | null
          created_at?: string
          findings_summary?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          pdf_url?: string | null
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          sections_data?: Json | null
          sector_key?: string
          sent_at?: string | null
          sent_to_auditors?: boolean | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_generated_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_generated_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "auditor_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_access_tokens: {
        Row: {
          access_count: number | null
          auditor_email: string
          auditor_name: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_accessed_at: string | null
          organization_id: string | null
          permissions: Json | null
          token_hash: string
        }
        Insert: {
          access_count?: number | null
          auditor_email: string
          auditor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          token_hash: string
        }
        Update: {
          access_count?: number | null
          auditor_email?: string
          auditor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_accessed_at?: string | null
          organization_id?: string | null
          permissions?: Json | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_access_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_questions: {
        Row: {
          category: string
          created_at: string
          expected_evidence: Json | null
          id: string
          is_active: boolean | null
          priority: string
          question_code: string
          question_text: string
          regulation_code: string
          sector_key: string
          standard_response_template: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          expected_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string
          question_code: string
          question_text: string
          regulation_code: string
          sector_key: string
          standard_response_template?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          expected_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string
          question_code?: string
          question_text?: string
          regulation_code?: string
          sector_key?: string
          standard_response_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auditor_report_templates: {
        Row: {
          created_at: string
          evidence_types: string[] | null
          frequency: string
          id: string
          is_active: boolean | null
          regulation_code: string
          required_questions: Json | null
          sections: Json
          sector_key: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_types?: string[] | null
          frequency: string
          id?: string
          is_active?: boolean | null
          regulation_code: string
          required_questions?: Json | null
          sections?: Json
          sector_key: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_types?: string[] | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          regulation_code?: string
          required_questions?: Json | null
          sections?: Json
          sector_key?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditor_responses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_generated_evidence: Json | null
          created_at: string
          evidence_urls: string[] | null
          id: string
          last_updated_at: string | null
          organization_id: string | null
          question_id: string
          response_text: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_generated_evidence?: Json | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          last_updated_at?: string | null
          organization_id?: string | null
          question_id: string
          response_text?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_generated_evidence?: Json | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          last_updated_at?: string | null
          organization_id?: string | null
          question_id?: string
          response_text?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_responses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditor_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "auditor_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_challenges: {
        Row: {
          attempts: number | null
          challenge_code: string | null
          challenge_type: Database["public"]["Enums"]["auth_factor_type"]
          created_at: string | null
          email_sent_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          session_id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          challenge_code?: string | null
          challenge_type: Database["public"]["Enums"]["auth_factor_type"]
          created_at?: string | null
          email_sent_at?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          session_id: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          challenge_code?: string | null
          challenge_type?: Database["public"]["Enums"]["auth_factor_type"]
          created_at?: string | null
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          session_id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      backup_verifications: {
        Row: {
          backup_date: string
          backup_type: string
          created_at: string | null
          data_integrity_verified: boolean | null
          id: string
          notes: string | null
          restoration_time_seconds: number | null
          restored_successfully: boolean | null
          verification_date: string | null
          verification_result: string
          verified_by: string | null
        }
        Insert: {
          backup_date: string
          backup_type: string
          created_at?: string | null
          data_integrity_verified?: boolean | null
          id?: string
          notes?: string | null
          restoration_time_seconds?: number | null
          restored_successfully?: boolean | null
          verification_date?: string | null
          verification_result: string
          verified_by?: string | null
        }
        Update: {
          backup_date?: string
          backup_type?: string
          created_at?: string | null
          data_integrity_verified?: boolean | null
          id?: string
          notes?: string | null
          restoration_time_seconds?: number | null
          restored_successfully?: boolean | null
          verification_date?: string | null
          verification_result?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      balance_sheets: {
        Row: {
          accruals_assets: number | null
          available_for_sale_assets_adjustment: number | null
          capital_grants: number | null
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          goodwill: number | null
          hedging_operations_adjustment: number | null
          id: string
          intangible_assets: number | null
          interim_dividend: number | null
          inventory: number | null
          legal_reserve: number | null
          liabilities_held_for_sale: number | null
          long_term_accruals: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_group_debts: number | null
          long_term_group_investments: number | null
          long_term_provisions: number | null
          long_term_trade_receivables: number | null
          non_current_assets_held_for_sale: number | null
          other_creditors: number | null
          other_equity_instruments: number | null
          other_value_adjustments: number | null
          real_estate_investments: number | null
          retained_earnings: number | null
          revaluation_reserve: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_accruals: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_group_debts: number | null
          short_term_group_receivables: number | null
          short_term_provisions: number | null
          statement_id: string
          statutory_reserves: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          translation_differences: number | null
          treasury_shares: number | null
          updated_at: string
          voluntary_reserves: number | null
        }
        Insert: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Update: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id?: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_sheets_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practice_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          practice_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          practice_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          practice_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "best_practice_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "best_practice_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_comments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "best_practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practice_likes: {
        Row: {
          created_at: string | null
          id: string
          practice_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          practice_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          practice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "best_practice_likes_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "best_practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practices: {
        Row: {
          category: string
          content: string
          created_at: string | null
          gestor_id: string
          id: string
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          gestor_id: string
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          gestor_id?: string
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "best_practices_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_audit_entries: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          block_number: number | null
          created_at: string | null
          data_hash: string
          entity_id: string
          entity_type: string
          entry_type: string
          id: string
          is_verified: boolean | null
          merkle_root: string | null
          metadata: Json | null
          organization_id: string | null
          previous_hash: string | null
          timestamp: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          block_number?: number | null
          created_at?: string | null
          data_hash: string
          entity_id: string
          entity_type: string
          entry_type: string
          id?: string
          is_verified?: boolean | null
          merkle_root?: string | null
          metadata?: Json | null
          organization_id?: string | null
          previous_hash?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          block_number?: number | null
          created_at?: string | null
          data_hash?: string
          entity_id?: string
          entity_type?: string
          entry_type?: string
          id?: string
          is_verified?: boolean | null
          merkle_root?: string | null
          metadata?: Json | null
          organization_id?: string | null
          previous_hash?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blockchain_audit_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_process_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          edges: Json
          entity_type: string
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          nodes: Json
          sla_config: Json | null
          tenant_id: string | null
          trigger_conditions: Json | null
          updated_at: string
          updated_by: string | null
          variables_schema: Json | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          entity_type: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          nodes?: Json
          sla_config?: Json | null
          tenant_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          entity_type?: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          nodes?: Json
          sla_config?: Json | null
          tenant_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_process_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_definitions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_process_instances: {
        Row: {
          actual_completion: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          current_node_id: string
          entity_id: string
          entity_type: string
          expected_completion: string | null
          history: Json | null
          id: string
          previous_node_id: string | null
          process_definition_id: string
          sla_status: string | null
          started_at: string
          status: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          actual_completion?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          current_node_id: string
          entity_id: string
          entity_type: string
          expected_completion?: string | null
          history?: Json | null
          id?: string
          previous_node_id?: string | null
          process_definition_id: string
          sla_status?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          actual_completion?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          current_node_id?: string
          entity_id?: string
          entity_type?: string
          expected_completion?: string | null
          history?: Json | null
          id?: string
          previous_node_id?: string | null
          process_definition_id?: string
          sla_status?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_process_instances_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_instances_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_dafo_analysis: {
        Row: {
          ai_generated: boolean | null
          analysis_date: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          project_name: string
          sector_key: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          analysis_date?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          project_name: string
          sector_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          analysis_date?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          project_name?: string
          sector_key?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_dafo_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plan_evaluations: {
        Row: {
          ai_recommendations: Json | null
          company_id: string | null
          created_at: string | null
          evaluation_date: string | null
          evaluator_id: string | null
          id: string
          project_description: string | null
          project_name: string
          status: string | null
          total_score: number | null
          updated_at: string | null
          viability_level: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          company_id?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          id?: string
          project_description?: string | null
          project_name: string
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
          viability_level?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          company_id?: string | null
          created_at?: string | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          id?: string
          project_description?: string | null
          project_name?: string
          status?: string | null
          total_score?: number | null
          updated_at?: string | null
          viability_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_plan_evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      business_plan_sections: {
        Row: {
          ai_recommendations: Json | null
          created_at: string | null
          evaluation_id: string
          id: string
          notes: string | null
          questions: Json | null
          section_max_score: number | null
          section_name: string
          section_number: number
          section_score: number | null
          section_weight: number | null
          updated_at: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string | null
          evaluation_id: string
          id?: string
          notes?: string | null
          questions?: Json | null
          section_max_score?: number | null
          section_name: string
          section_number: number
          section_score?: number | null
          section_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string | null
          evaluation_id?: string
          id?: string
          notes?: string | null
          questions?: Json | null
          section_max_score?: number | null
          section_name?: string
          section_number?: number
          section_score?: number | null
          section_weight?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_plan_sections_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "business_plan_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_telemetry: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          segment: string | null
          updated_at: string
          user_id: string | null
          value: number
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          segment?: string | null
          updated_at?: string
          user_id?: string | null
          value: number
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          segment?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      cash_flow_statements: {
        Row: {
          corporate_tax_paid: number | null
          created_at: string
          depreciation_adjustments: number | null
          exchange_differences_adjustments: number | null
          exchange_rate_effect: number | null
          financial_expenses_adjustments: number | null
          financial_income_adjustments: number | null
          financing_dividends_paid: number | null
          financing_interest_paid: number | null
          financing_payments_debt: number | null
          financing_payments_equity: number | null
          financing_payments_group_debt: number | null
          financing_receipts_debt: number | null
          financing_receipts_equity: number | null
          financing_receipts_grants: number | null
          financing_receipts_group_debt: number | null
          gains_losses_financial_instruments: number | null
          gains_losses_fixed_assets: number | null
          grants_adjustments: number | null
          id: string
          impairment_adjustments: number | null
          inventory_changes: number | null
          investing_dividends_received: number | null
          investing_interest_received: number | null
          investing_payments_financial: number | null
          investing_payments_group: number | null
          investing_payments_intangible: number | null
          investing_payments_other: number | null
          investing_payments_real_estate: number | null
          investing_payments_tangible: number | null
          investing_receipts_financial: number | null
          investing_receipts_group: number | null
          investing_receipts_intangible: number | null
          investing_receipts_other: number | null
          investing_receipts_real_estate: number | null
          investing_receipts_tangible: number | null
          operating_dividends_received: number | null
          operating_interest_paid: number | null
          operating_interest_received: number | null
          operating_result: number | null
          other_financing_payments: number | null
          other_investing_receipts: number | null
          other_operating_changes: number | null
          other_operating_payments: number | null
          payables_changes: number | null
          provisions_variation: number | null
          receivables_changes: number | null
          statement_id: string
          updated_at: string
          working_capital_changes: number | null
        }
        Insert: {
          corporate_tax_paid?: number | null
          created_at?: string
          depreciation_adjustments?: number | null
          exchange_differences_adjustments?: number | null
          exchange_rate_effect?: number | null
          financial_expenses_adjustments?: number | null
          financial_income_adjustments?: number | null
          financing_dividends_paid?: number | null
          financing_interest_paid?: number | null
          financing_payments_debt?: number | null
          financing_payments_equity?: number | null
          financing_payments_group_debt?: number | null
          financing_receipts_debt?: number | null
          financing_receipts_equity?: number | null
          financing_receipts_grants?: number | null
          financing_receipts_group_debt?: number | null
          gains_losses_financial_instruments?: number | null
          gains_losses_fixed_assets?: number | null
          grants_adjustments?: number | null
          id?: string
          impairment_adjustments?: number | null
          inventory_changes?: number | null
          investing_dividends_received?: number | null
          investing_interest_received?: number | null
          investing_payments_financial?: number | null
          investing_payments_group?: number | null
          investing_payments_intangible?: number | null
          investing_payments_other?: number | null
          investing_payments_real_estate?: number | null
          investing_payments_tangible?: number | null
          investing_receipts_financial?: number | null
          investing_receipts_group?: number | null
          investing_receipts_intangible?: number | null
          investing_receipts_other?: number | null
          investing_receipts_real_estate?: number | null
          investing_receipts_tangible?: number | null
          operating_dividends_received?: number | null
          operating_interest_paid?: number | null
          operating_interest_received?: number | null
          operating_result?: number | null
          other_financing_payments?: number | null
          other_investing_receipts?: number | null
          other_operating_changes?: number | null
          other_operating_payments?: number | null
          payables_changes?: number | null
          provisions_variation?: number | null
          receivables_changes?: number | null
          statement_id: string
          updated_at?: string
          working_capital_changes?: number | null
        }
        Update: {
          corporate_tax_paid?: number | null
          created_at?: string
          depreciation_adjustments?: number | null
          exchange_differences_adjustments?: number | null
          exchange_rate_effect?: number | null
          financial_expenses_adjustments?: number | null
          financial_income_adjustments?: number | null
          financing_dividends_paid?: number | null
          financing_interest_paid?: number | null
          financing_payments_debt?: number | null
          financing_payments_equity?: number | null
          financing_payments_group_debt?: number | null
          financing_receipts_debt?: number | null
          financing_receipts_equity?: number | null
          financing_receipts_grants?: number | null
          financing_receipts_group_debt?: number | null
          gains_losses_financial_instruments?: number | null
          gains_losses_fixed_assets?: number | null
          grants_adjustments?: number | null
          id?: string
          impairment_adjustments?: number | null
          inventory_changes?: number | null
          investing_dividends_received?: number | null
          investing_interest_received?: number | null
          investing_payments_financial?: number | null
          investing_payments_group?: number | null
          investing_payments_intangible?: number | null
          investing_payments_other?: number | null
          investing_payments_real_estate?: number | null
          investing_payments_tangible?: number | null
          investing_receipts_financial?: number | null
          investing_receipts_group?: number | null
          investing_receipts_intangible?: number | null
          investing_receipts_other?: number | null
          investing_receipts_real_estate?: number | null
          investing_receipts_tangible?: number | null
          operating_dividends_received?: number | null
          operating_interest_paid?: number | null
          operating_interest_received?: number | null
          operating_result?: number | null
          other_financing_payments?: number | null
          other_investing_receipts?: number | null
          other_operating_changes?: number | null
          other_operating_payments?: number | null
          payables_changes?: number | null
          provisions_variation?: number | null
          receivables_changes?: number | null
          statement_id?: string
          updated_at?: string
          working_capital_changes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connectors: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string | null
          credentials_valid: boolean | null
          daily_limit: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          provider: string
          rate_limit: number | null
          stats: Json | null
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string | null
          credentials_valid?: boolean | null
          daily_limit?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          provider: string
          rate_limit?: number | null
          stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          credentials_valid?: boolean | null
          daily_limit?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          provider?: string
          rate_limit?: number | null
          stats?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          priority: string | null
          reactions: Json | null
          read_by: string[] | null
          reply_to_id: string | null
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_typing: {
        Row: {
          id: string
          room_id: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_installations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          installation_config: Json | null
          installation_key: string
          installation_name: string
          is_active: boolean
          last_sync_at: string | null
          preferred_locale: string
          remote_access_allowed: boolean
          remote_access_pin: string | null
          remote_access_pin_expires_at: string | null
          secondary_locales: string[] | null
          updated_at: string
          user_id: string | null
          version: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          installation_config?: Json | null
          installation_key?: string
          installation_name: string
          is_active?: boolean
          last_sync_at?: string | null
          preferred_locale?: string
          remote_access_allowed?: boolean
          remote_access_pin?: string | null
          remote_access_pin_expires_at?: string | null
          secondary_locales?: string[] | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          installation_config?: Json | null
          installation_key?: string
          installation_name?: string
          is_active?: boolean
          last_sync_at?: string | null
          preferred_locale?: string
          remote_access_allowed?: boolean
          remote_access_pin?: string | null
          remote_access_pin_expires_at?: string | null
          secondary_locales?: string[] | null
          updated_at?: string
          user_id?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_installations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_installations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          last_used_at: string | null
          permissions: string[] | null
          prefix: string
          rate_limit: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          last_used_at?: string | null
          permissions?: string[] | null
          prefix: string
          rate_limit?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          last_used_at?: string | null
          permissions?: string[] | null
          prefix?: string
          rate_limit?: number | null
        }
        Relationships: []
      }
      cms_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cms_blocks: {
        Row: {
          block_key: string
          block_name: string
          block_type: string
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          block_key: string
          block_name: string
          block_type?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          block_key?: string
          block_name?: string
          block_type?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: Json
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_comments: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_engagement: {
        Row: {
          avg_read_time: number | null
          clicks: number | null
          comments_count: number | null
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string | null
          date: string
          id: string
          likes: number | null
          scroll_depth: number | null
          shares: number | null
        }
        Insert: {
          avg_read_time?: number | null
          clicks?: number | null
          comments_count?: number | null
          content_id: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          date?: string
          id?: string
          likes?: number | null
          scroll_depth?: number | null
          shares?: number | null
        }
        Update: {
          avg_read_time?: number | null
          clicks?: number | null
          comments_count?: number | null
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          date?: string
          id?: string
          likes?: number | null
          scroll_depth?: number | null
          shares?: number | null
        }
        Relationships: []
      }
      cms_content_versions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_current: boolean | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_current?: boolean | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_current?: boolean | null
          version_number?: number
        }
        Relationships: []
      }
      cms_content_workflow: {
        Row: {
          assignee: string | null
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          reviewer: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          content_id: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewer?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewer?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_dashboard_layouts: {
        Row: {
          created_at: string | null
          created_by: string | null
          grid_config: Json | null
          id: string
          is_default: boolean | null
          layout_name: string
          target_role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grid_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_name: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grid_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_name?: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          widgets?: Json
        }
        Relationships: []
      }
      cms_editorial_calendar: {
        Row: {
          assignee: string | null
          channel: string | null
          color: string | null
          content_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          assignee?: string | null
          channel?: string | null
          color?: string | null
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          assignee?: string | null
          channel?: string | null
          color?: string | null
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_editorial_calendar_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "cms_content_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          html_content: Json
          id: string
          is_active: boolean | null
          subject: Json
          template_key: string
          template_name: string
          text_content: Json | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: Json
          id?: string
          is_active?: boolean | null
          subject?: Json
          template_key: string
          template_name: string
          text_content?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: Json
          id?: string
          is_active?: boolean | null
          subject?: Json
          template_key?: string
          template_name?: string
          text_content?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      cms_feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          rollout_percentage: number | null
          start_date: string | null
          target_offices: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_offices?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_offices?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_media_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          folder_name: string
          icon: string | null
          id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_name: string
          icon?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_name?: string
          icon?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_library: {
        Row: {
          alt_text: Json | null
          caption: Json | null
          created_at: string | null
          description: string | null
          duration: number | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string
          original_name: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type: string
          original_name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      cms_navigation_items: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_external: boolean | null
          is_visible: boolean | null
          label: Json
          menu_location: string
          parent_id: string | null
          sort_order: number | null
          target: string | null
          updated_at: string | null
          url: string | null
          visible_to_roles: Database["public"]["Enums"]["app_role"][] | null
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_external?: boolean | null
          is_visible?: boolean | null
          label?: Json
          menu_location: string
          parent_id?: string | null
          sort_order?: number | null
          target?: string | null
          updated_at?: string | null
          url?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_external?: boolean | null
          is_visible?: boolean | null
          label?: Json
          menu_location?: string
          parent_id?: string | null
          sort_order?: number | null
          target?: string | null
          updated_at?: string | null
          url?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_notification_templates: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          message: Json
          template_key: string
          template_name: string
          title: Json
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: Json
          template_key: string
          template_name: string
          title?: Json
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: Json
          template_key?: string
          template_name?: string
          title?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_page_analytics: {
        Row: {
          avg_time_on_page: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          page_id: string | null
          page_path: string
          page_title: string | null
          unique_visitors: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_id?: string | null
          page_path: string
          page_title?: string | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_id?: string | null
          page_path?: string
          page_title?: string | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_page_revisions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          page_id: string
          revision_number: number
          title: Json
        }
        Insert: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id: string
          revision_number?: number
          title?: Json
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id?: string
          revision_number?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][] | null
          author_id: string | null
          content: Json
          created_at: string | null
          featured_image: string | null
          id: string
          is_homepage: boolean | null
          meta_description: Json | null
          meta_title: Json | null
          parent_id: string | null
          published_at: string | null
          requires_auth: boolean | null
          scheduled_at: string | null
          slug: string
          sort_order: number | null
          status: string | null
          template: string | null
          title: Json
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          author_id?: string | null
          content?: Json
          created_at?: string | null
          featured_image?: string | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          parent_id?: string | null
          published_at?: string | null
          requires_auth?: boolean | null
          scheduled_at?: string | null
          slug: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          title?: Json
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          author_id?: string | null
          content?: Json
          created_at?: string | null
          featured_image?: string | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          parent_id?: string | null
          published_at?: string | null
          requires_auth?: boolean | null
          scheduled_at?: string | null
          slug?: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          title?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_post_revisions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          post_id: string
          revision_number: number
          title: Json
        }
        Insert: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id: string
          revision_number?: number
          title?: Json
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id?: string
          revision_number?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cms_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "cms_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_posts: {
        Row: {
          allow_comments: boolean | null
          author_id: string | null
          category_id: string | null
          content: Json
          created_at: string | null
          excerpt: Json | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          meta_description: Json | null
          meta_title: Json | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          slug: string
          status: string
          title: Json
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          allow_comments?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug: string
          status?: string
          title?: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_realtime_visitors: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          first_seen: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      cms_redirects: {
        Row: {
          created_at: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          redirect_type: number | null
          source_path: string
          target_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          source_path: string
          target_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          source_path?: string
          target_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_seo_meta: {
        Row: {
          canonical_url: string | null
          created_at: string | null
          description: Json | null
          id: string
          keywords: Json | null
          og_description: Json | null
          og_image: string | null
          og_title: Json | null
          page_path: string
          robots: string | null
          structured_data: Json | null
          title: Json | null
          twitter_card: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          keywords?: Json | null
          og_description?: Json | null
          og_image?: string | null
          og_title?: Json | null
          page_path: string
          robots?: string | null
          structured_data?: Json | null
          title?: Json | null
          twitter_card?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          keywords?: Json | null
          og_description?: Json | null
          og_image?: string | null
          og_title?: Json | null
          page_path?: string
          robots?: string | null
          structured_data?: Json | null
          title?: Json | null
          twitter_card?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_site_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          label: string
          setting_key: string
          setting_type: string
          setting_value: Json
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          label: string
          setting_key: string
          setting_type?: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          label?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: Json | null
          id: string
          is_active: boolean | null
          name: Json
          slug: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          name?: Json
          slug: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          name?: Json
          slug?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      cms_theme_config: {
        Row: {
          animations: Json | null
          borders: Json | null
          colors: Json | null
          created_at: string | null
          created_by: string | null
          custom_css: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          shadows: Json | null
          spacing: Json | null
          theme_name: string
          typography: Json | null
          updated_at: string | null
        }
        Insert: {
          animations?: Json | null
          borders?: Json | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          shadows?: Json | null
          spacing?: Json | null
          theme_name: string
          typography?: Json | null
          updated_at?: string | null
        }
        Update: {
          animations?: Json | null
          borders?: Json | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          shadows?: Json | null
          spacing?: Json | null
          theme_name?: string
          typography?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_translations: {
        Row: {
          created_at: string | null
          id: string
          is_machine_translated: boolean | null
          is_reviewed: boolean | null
          locale: string
          namespace: string
          priority: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_locale: string | null
          translation_key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_machine_translated?: boolean | null
          is_reviewed?: boolean | null
          locale: string
          namespace?: string
          priority?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_locale?: string | null
          translation_key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_machine_translated?: boolean | null
          is_reviewed?: boolean | null
          locale?: string
          namespace?: string
          priority?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_locale?: string | null
          translation_key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      cms_webhooks_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          endpoint_url: string
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_status: number | null
          last_triggered_at: string | null
          retry_count: number | null
          secret_key: string | null
          updated_at: string | null
          webhook_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          endpoint_url: string
          events: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          retry_count?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          retry_count?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_name?: string
        }
        Relationships: []
      }
      cms_widgets: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][] | null
          component_name: string
          created_at: string | null
          default_config: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          widget_key: string
          widget_name: string
          widget_type: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          component_name: string
          created_at?: string | null
          default_config?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          widget_key: string
          widget_name: string
          widget_type: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          component_name?: string
          created_at?: string | null
          default_config?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          widget_key?: string
          widget_name?: string
          widget_type?: string
        }
        Relationships: []
      }
      cms_workflow_history: {
        Row: {
          changed_by: string | null
          comment: string | null
          content_id: string
          created_at: string | null
          from_status: string | null
          id: string
          to_status: string
          workflow_id: string | null
        }
        Insert: {
          changed_by?: string | null
          comment?: string | null
          content_id: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          to_status: string
          workflow_id?: string | null
        }
        Update: {
          changed_by?: string | null
          comment?: string | null
          content_id?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          to_status?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_workflow_history_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "cms_content_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      cnae_bundles: {
        Row: {
          bundle_description: string | null
          bundle_name: string
          cnae_codes: string[]
          created_at: string | null
          discount_percentage: number
          id: string
          is_active: boolean | null
          is_ai_suggested: boolean | null
          max_discount_cap: number | null
          min_cnaes_required: number | null
          updated_at: string | null
        }
        Insert: {
          bundle_description?: string | null
          bundle_name: string
          cnae_codes: string[]
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          is_ai_suggested?: boolean | null
          max_discount_cap?: number | null
          min_cnaes_required?: number | null
          updated_at?: string | null
        }
        Update: {
          bundle_description?: string | null
          bundle_name?: string
          cnae_codes?: string[]
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          is_ai_suggested?: boolean | null
          max_discount_cap?: number | null
          min_cnaes_required?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cnae_pricing: {
        Row: {
          base_price: number
          cnae_code: string
          complexity_tier: string
          created_at: string | null
          id: string
          includes_features: string[] | null
          is_active: boolean | null
          sector_category: string | null
          tier_multipliers: Json | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          cnae_code: string
          complexity_tier?: string
          created_at?: string | null
          id?: string
          includes_features?: string[] | null
          is_active?: boolean | null
          sector_category?: string | null
          tier_multipliers?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          cnae_code?: string
          complexity_tier?: string
          created_at?: string | null
          id?: string
          includes_features?: string[] | null
          is_active?: boolean | null
          sector_category?: string | null
          tier_multipliers?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cnae_sector_mapping: {
        Row: {
          cnae_code: string
          cnae_description: string | null
          created_at: string
          default_kpis: string[] | null
          default_regulations: string[] | null
          id: string
          sector: string
          sector_name: string
        }
        Insert: {
          cnae_code: string
          cnae_description?: string | null
          created_at?: string
          default_kpis?: string[] | null
          default_regulations?: string[] | null
          id?: string
          sector: string
          sector_name: string
        }
        Update: {
          cnae_code?: string
          cnae_description?: string | null
          created_at?: string
          default_kpis?: string[] | null
          default_regulations?: string[] | null
          id?: string
          sector?: string
          sector_name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string
          beneficios: number | null
          bp: string | null
          client_type: string | null
          cnae: string | null
          created_at: string | null
          email: string | null
          employees: number | null
          facturacion_anual: number | null
          fecha_ultima_visita: string | null
          gestor_id: string | null
          id: string
          import_batch_id: string | null
          ingresos_entidad_principal: number | null
          is_vip: boolean | null
          latitude: number
          legal_form: string | null
          longitude: number
          name: string
          observaciones: string | null
          oficina: string | null
          organization_id: string | null
          parroquia: string
          periodo_facturacion: string | null
          phone: string | null
          pl_banco: number | null
          registration_number: string | null
          sector: string | null
          status_id: string | null
          tags: string[] | null
          tax_id: string | null
          turnover: number | null
          updated_at: string | null
          vinculacion_entidad_1: number | null
          vinculacion_entidad_2: number | null
          vinculacion_entidad_3: number | null
          vinculacion_modo: string | null
          vip_notes: string | null
          website: string | null
        }
        Insert: {
          address: string
          beneficios?: number | null
          bp?: string | null
          client_type?: string | null
          cnae?: string | null
          created_at?: string | null
          email?: string | null
          employees?: number | null
          facturacion_anual?: number | null
          fecha_ultima_visita?: string | null
          gestor_id?: string | null
          id?: string
          import_batch_id?: string | null
          ingresos_entidad_principal?: number | null
          is_vip?: boolean | null
          latitude: number
          legal_form?: string | null
          longitude: number
          name: string
          observaciones?: string | null
          oficina?: string | null
          organization_id?: string | null
          parroquia: string
          periodo_facturacion?: string | null
          phone?: string | null
          pl_banco?: number | null
          registration_number?: string | null
          sector?: string | null
          status_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          turnover?: number | null
          updated_at?: string | null
          vinculacion_entidad_1?: number | null
          vinculacion_entidad_2?: number | null
          vinculacion_entidad_3?: number | null
          vinculacion_modo?: string | null
          vip_notes?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          beneficios?: number | null
          bp?: string | null
          client_type?: string | null
          cnae?: string | null
          created_at?: string | null
          email?: string | null
          employees?: number | null
          facturacion_anual?: number | null
          fecha_ultima_visita?: string | null
          gestor_id?: string | null
          id?: string
          import_batch_id?: string | null
          ingresos_entidad_principal?: number | null
          is_vip?: boolean | null
          latitude?: number
          legal_form?: string | null
          longitude?: number
          name?: string
          observaciones?: string | null
          oficina?: string | null
          organization_id?: string | null
          parroquia?: string
          periodo_facturacion?: string | null
          phone?: string | null
          pl_banco?: number | null
          registration_number?: string | null
          sector?: string | null
          status_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          turnover?: number | null
          updated_at?: string | null
          vinculacion_entidad_1?: number | null
          vinculacion_entidad_2?: number | null
          vinculacion_entidad_3?: number | null
          vinculacion_modo?: string | null
          vip_notes?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_colors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_bank_affiliations: {
        Row: {
          account_number: string | null
          active: boolean | null
          affiliation_percentage: number | null
          affiliation_type: string | null
          bank_code: string | null
          bank_name: string
          company_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          notes: string | null
          priority_order: number | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          active?: boolean | null
          affiliation_percentage?: number | null
          affiliation_type?: string | null
          bank_code?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          priority_order?: number | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          active?: boolean | null
          affiliation_percentage?: number | null
          affiliation_type?: string | null
          bank_code?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          priority_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cnaes: {
        Row: {
          cnae_code: string
          company_id: string
          created_at: string | null
          discount_applied: number | null
          id: string
          installed_module_id: string | null
          is_primary: boolean | null
          license_price: number | null
          percentage_activity: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          cnae_code: string
          company_id: string
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          installed_module_id?: string | null
          is_primary?: boolean | null
          license_price?: number | null
          percentage_activity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          cnae_code?: string
          company_id?: string
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          installed_module_id?: string | null
          is_primary?: boolean | null
          license_price?: number | null
          percentage_activity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cnaes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_cnaes_installed_module_id_fkey"
            columns: ["installed_module_id"]
            isOneToOne: false
            referencedRelation: "installed_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          company_id: string
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string | null
          document_name: string
          document_type: string | null
          document_url: string | null
          file_size: number | null
          id: string
          notes: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_name: string
          document_type?: string | null
          document_url?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_name?: string
          document_type?: string | null
          document_url?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          fiscal_year: number
          id: string
          is_archived: boolean
          source: Database["public"]["Enums"]["financial_data_source"]
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
          status: Database["public"]["Enums"]["financial_statement_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          id?: string
          is_archived?: boolean
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          is_archived?: boolean
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_financial_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_milestones: {
        Row: {
          achieved_at: string | null
          achieved_by: string | null
          celebrated: boolean | null
          company_id: string | null
          context: Json | null
          created_at: string | null
          id: string
          milestone_id: string | null
          points_awarded: number | null
        }
        Insert: {
          achieved_at?: string | null
          achieved_by?: string | null
          celebrated?: boolean | null
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          points_awarded?: number | null
        }
        Update: {
          achieved_at?: string | null
          achieved_by?: string | null
          celebrated?: boolean | null
          company_id?: string | null
          context?: Json | null
          created_at?: string | null
          id?: string
          milestone_id?: string | null
          points_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "company_milestones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "adoption_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      company_news_profiles: {
        Row: {
          alert_threshold: number | null
          auto_subscribe: boolean | null
          cnae_codes: string[] | null
          company_id: string
          competitor_ids: string[] | null
          created_at: string
          custom_keywords: string[] | null
          id: string
          regions: string[] | null
          sectors: string[] | null
          updated_at: string
        }
        Insert: {
          alert_threshold?: number | null
          auto_subscribe?: boolean | null
          cnae_codes?: string[] | null
          company_id: string
          competitor_ids?: string[] | null
          created_at?: string
          custom_keywords?: string[] | null
          id?: string
          regions?: string[] | null
          sectors?: string[] | null
          updated_at?: string
        }
        Update: {
          alert_threshold?: number | null
          auto_subscribe?: boolean | null
          cnae_codes?: string[] | null
          company_id?: string
          competitor_ids?: string[] | null
          created_at?: string
          custom_keywords?: string[] | null
          id?: string
          regions?: string[] | null
          sectors?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_news_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_photos: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_products: {
        Row: {
          active: boolean | null
          company_id: string
          contract_date: string | null
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tpv_terminals: {
        Row: {
          commission_rate: number | null
          company_id: string
          created_at: string
          id: string
          installation_date: string | null
          monthly_transactions: number | null
          monthly_volume: number | null
          notes: string | null
          provider: string
          status: string | null
          terminal_id: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          company_id: string
          created_at?: string
          id?: string
          installation_date?: string | null
          monthly_transactions?: number | null
          monthly_volume?: number | null
          notes?: string | null
          provider: string
          status?: string | null
          terminal_id: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          company_id?: string
          created_at?: string
          id?: string
          installation_date?: string | null
          monthly_transactions?: number | null
          monthly_volume?: number | null
          notes?: string | null
          provider?: string
          status?: string | null
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_tpv"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          document_id: string
          employee_id: string
          id: string
          ip_address: string | null
          notes: string | null
          signature_hash: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          document_id: string
          employee_id: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_hash?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          document_id?: string
          employee_id?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          document_id: string
          due_date: string | null
          evidence_urls: string[] | null
          id: string
          notes: string | null
          organization_id: string | null
          priority: string | null
          requirement_description: string | null
          requirement_key: string
          requirement_title: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          document_id: string
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          requirement_description?: string | null
          requirement_key: string
          requirement_title: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          document_id?: string
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          requirement_description?: string | null
          requirement_key?: string
          requirement_title?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_review_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          document_id: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: string | null
          requirement_id: string | null
          result: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          requirement_id?: string | null
          result?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          requirement_id?: string | null
          result?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_review_tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_review_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_review_tasks_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          active: boolean | null
          concept_key: string
          concept_type: string
          concept_value: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          concept_key: string
          concept_type: string
          concept_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          concept_key?: string
          concept_type?: string
          concept_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consolidated_balance_sheets: {
        Row: {
          accruals_assets: number | null
          available_for_sale_assets_adjustment: number | null
          capital_grants: number | null
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          goodwill: number | null
          goodwill_eliminations: number | null
          hedging_operations_adjustment: number | null
          id: string
          intangible_assets: number | null
          intercompany_eliminations: number | null
          interim_dividend: number | null
          inventory: number | null
          legal_reserve: number | null
          liabilities_held_for_sale: number | null
          long_term_accruals: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_group_debts: number | null
          long_term_group_investments: number | null
          long_term_provisions: number | null
          long_term_trade_receivables: number | null
          minority_interests: number | null
          non_current_assets_held_for_sale: number | null
          other_creditors: number | null
          other_equity_instruments: number | null
          other_value_adjustments: number | null
          real_estate_investments: number | null
          retained_earnings: number | null
          revaluation_reserve: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_accruals: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_group_debts: number | null
          short_term_group_receivables: number | null
          short_term_provisions: number | null
          statement_id: string
          statutory_reserves: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          translation_differences: number | null
          treasury_shares: number | null
          updated_at: string
          voluntary_reserves: number | null
        }
        Insert: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          goodwill_eliminations?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          intercompany_eliminations?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          minority_interests?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Update: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          goodwill_eliminations?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          intercompany_eliminations?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          minority_interests?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id?: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_balance_sheets_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "consolidated_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidated_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          fiscal_year: number
          group_id: string
          id: string
          source: string
          statement_type: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          group_id: string
          id?: string
          source?: string
          statement_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          group_id?: string
          id?: string
          source?: string
          statement_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidated_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidated_financial_statements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "consolidation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_group_members: {
        Row: {
          company_id: string
          consolidation_method: string
          created_at: string
          group_id: string
          id: string
          is_parent: boolean
          participation_percentage: number
        }
        Insert: {
          company_id: string
          consolidation_method?: string
          created_at?: string
          group_id: string
          id?: string
          is_parent?: boolean
          participation_percentage?: number
        }
        Update: {
          company_id?: string
          consolidation_method?: string
          created_at?: string
          group_id?: string
          id?: string
          is_parent?: boolean
          participation_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_group_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "consolidation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_groups: {
        Row: {
          created_at: string
          created_by: string | null
          fiscal_year: number
          group_name: string
          id: string
          notes: string | null
          parent_company_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          group_name: string
          id?: string
          notes?: string | null
          parent_company_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          group_name?: string
          id?: string
          notes?: string | null
          parent_company_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_groups_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      continuous_controls: {
        Row: {
          auto_generate_evidence: boolean | null
          check_frequency: string
          check_logic: Json | null
          check_query: string | null
          control_category: string
          control_code: string
          control_description: string | null
          control_name: string
          created_at: string | null
          evidence_template: Json | null
          id: string
          is_active: boolean | null
          last_execution_at: string | null
          notification_channels: string[] | null
          notification_recipients: Json | null
          remediation_steps: Json | null
          severity_on_failure: string | null
          threshold_config: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_generate_evidence?: boolean | null
          check_frequency: string
          check_logic?: Json | null
          check_query?: string | null
          control_category: string
          control_code: string
          control_description?: string | null
          control_name: string
          created_at?: string | null
          evidence_template?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          notification_channels?: string[] | null
          notification_recipients?: Json | null
          remediation_steps?: Json | null
          severity_on_failure?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_generate_evidence?: boolean | null
          check_frequency?: string
          check_logic?: Json | null
          check_query?: string | null
          control_category?: string
          control_code?: string
          control_description?: string | null
          control_name?: string
          created_at?: string | null
          evidence_template?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          notification_channels?: string[] | null
          notification_recipients?: Json | null
          remediation_steps?: Json | null
          severity_on_failure?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      control_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_count: number | null
          affected_entities: Json | null
          alert_type: string
          control_id: string
          created_at: string | null
          description: string | null
          evidence_summary: Json | null
          execution_id: string | null
          id: string
          recommended_actions: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_count?: number | null
          affected_entities?: Json | null
          alert_type: string
          control_id: string
          created_at?: string | null
          description?: string | null
          evidence_summary?: Json | null
          execution_id?: string | null
          id?: string
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_count?: number | null
          affected_entities?: Json | null
          alert_type?: string
          control_id?: string
          created_at?: string | null
          description?: string | null
          evidence_summary?: Json | null
          execution_id?: string | null
          id?: string
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_alerts_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "continuous_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_alerts_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "control_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      control_executions: {
        Row: {
          ai_analysis: string | null
          ai_recommendations: Json | null
          control_id: string
          created_at: string | null
          error_message: string | null
          evidence_ids: string[] | null
          execution_end: string | null
          execution_start: string
          findings: Json | null
          id: string
          items_checked: number | null
          items_failed: number | null
          items_passed: number | null
          metrics_collected: Json | null
          status: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          control_id: string
          created_at?: string | null
          error_message?: string | null
          evidence_ids?: string[] | null
          execution_end?: string | null
          execution_start?: string
          findings?: Json | null
          id?: string
          items_checked?: number | null
          items_failed?: number | null
          items_passed?: number | null
          metrics_collected?: Json | null
          status?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          control_id?: string
          created_at?: string | null
          error_message?: string | null
          evidence_ids?: string[] | null
          execution_end?: string | null
          execution_start?: string
          findings?: Json | null
          id?: string
          items_checked?: number | null
          items_failed?: number | null
          items_passed?: number | null
          metrics_collected?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_executions_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "continuous_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          company_id: string | null
          created_at: string
          generated_at: string
          id: string
          key_topics: string[] | null
          last_activity: string | null
          message_count: number | null
          room_id: string | null
          sentiment: string | null
          summary_text: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          key_topics?: string[] | null
          last_activity?: string | null
          message_count?: number | null
          room_id?: string | null
          sentiment?: string | null
          summary_text?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          key_topics?: string[] | null
          last_activity?: string | null
          message_count?: number | null
          room_id?: string | null
          sentiment?: string | null
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      conversational_survey_flows: {
        Row: {
          condition_type: string
          condition_value: Json
          created_at: string
          followup_question: string
          id: string
          is_active: boolean | null
          options: Json | null
          priority: number | null
          question_type: string | null
          survey_id: string
        }
        Insert: {
          condition_type: string
          condition_value: Json
          created_at?: string
          followup_question: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
          priority?: number | null
          question_type?: string | null
          survey_id: string
        }
        Update: {
          condition_type?: string
          condition_value?: Json
          created_at?: string
          followup_question?: string
          id?: string
          is_active?: boolean | null
          options?: Json | null
          priority?: number | null
          question_type?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversational_survey_flows_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_action_log: {
        Row: {
          action_data: Json | null
          action_source: string
          action_type: string
          ai_reasoning: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          executed_at: string | null
          id: string
          outcome: string | null
          outcome_details: Json | null
          outcome_value: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_source: string
          action_type: string
          ai_reasoning?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          outcome_value?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_source?: string
          action_type?: string
          ai_reasoning?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          outcome_value?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_action_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "copilot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_role_configs: {
        Row: {
          available_tools: Json | null
          context_sources: string[] | null
          copilot_description: string | null
          copilot_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          priority_metrics: string[] | null
          quick_actions: Json | null
          role: string
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          available_tools?: Json | null
          context_sources?: string[] | null
          copilot_description?: string | null
          copilot_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_metrics?: string[] | null
          quick_actions?: Json | null
          role: string
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          available_tools?: Json | null
          context_sources?: string[] | null
          copilot_description?: string | null
          copilot_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_metrics?: string[] | null
          quick_actions?: Json | null
          role?: string
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      copilot_sessions: {
        Row: {
          active_suggestions: Json | null
          context_data: Json | null
          created_at: string | null
          id: string
          last_interaction: string | null
          metrics_snapshot: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_suggestions?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          metrics_snapshot?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_suggestions?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          metrics_snapshot?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      core_banking_configs: {
        Row: {
          api_endpoint: string
          api_version: string | null
          auth_config: Json | null
          auth_type: string
          core_type: string
          created_at: string | null
          created_by: string | null
          entity_name: string
          id: string
          is_active: boolean | null
          retry_config: Json | null
          timeout_ms: number | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_version?: string | null
          auth_config?: Json | null
          auth_type: string
          core_type: string
          created_at?: string | null
          created_by?: string | null
          entity_name: string
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_version?: string | null
          auth_config?: Json | null
          auth_type?: string
          core_type?: string
          created_at?: string | null
          created_by?: string | null
          entity_name?: string
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_360_profiles: {
        Row: {
          active_products: number | null
          avg_monthly_volume: number | null
          avg_visit_frequency_days: number | null
          churn_probability: number | null
          clv_score: number | null
          communication_preferences: Json | null
          company_id: string | null
          compliance_status: string | null
          created_at: string | null
          credit_score: number | null
          cross_sell_opportunities: Json | null
          health_score: number | null
          id: string
          interaction_summary: Json | null
          last_calculated_at: string | null
          last_visit_date: string | null
          lifecycle_stage: string | null
          next_best_actions: Json | null
          preferred_channel: string | null
          preferred_contact_time: string | null
          recommended_products: Json | null
          rfm_score: Json | null
          risk_flags: Json | null
          segment: string | null
          successful_visits: number | null
          tier: string | null
          total_products: number | null
          total_transaction_volume: number | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          active_products?: number | null
          avg_monthly_volume?: number | null
          avg_visit_frequency_days?: number | null
          churn_probability?: number | null
          clv_score?: number | null
          communication_preferences?: Json | null
          company_id?: string | null
          compliance_status?: string | null
          created_at?: string | null
          credit_score?: number | null
          cross_sell_opportunities?: Json | null
          health_score?: number | null
          id?: string
          interaction_summary?: Json | null
          last_calculated_at?: string | null
          last_visit_date?: string | null
          lifecycle_stage?: string | null
          next_best_actions?: Json | null
          preferred_channel?: string | null
          preferred_contact_time?: string | null
          recommended_products?: Json | null
          rfm_score?: Json | null
          risk_flags?: Json | null
          segment?: string | null
          successful_visits?: number | null
          tier?: string | null
          total_products?: number | null
          total_transaction_volume?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          active_products?: number | null
          avg_monthly_volume?: number | null
          avg_visit_frequency_days?: number | null
          churn_probability?: number | null
          clv_score?: number | null
          communication_preferences?: Json | null
          company_id?: string | null
          compliance_status?: string | null
          created_at?: string | null
          credit_score?: number | null
          cross_sell_opportunities?: Json | null
          health_score?: number | null
          id?: string
          interaction_summary?: Json | null
          last_calculated_at?: string | null
          last_visit_date?: string | null
          lifecycle_stage?: string | null
          next_best_actions?: Json | null
          preferred_channel?: string | null
          preferred_contact_time?: string | null
          recommended_products?: Json | null
          rfm_score?: Json | null
          risk_flags?: Json | null
          segment?: string | null
          successful_visits?: number | null
          tier?: string | null
          total_products?: number | null
          total_transaction_volume?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_360_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_action_recommendations: {
        Row: {
          action_description: string | null
          action_title: string
          action_type: string
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          due_date: string | null
          estimated_value: number | null
          expected_impact: string | null
          id: string
          priority: number | null
          source_model: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_description?: string | null
          action_title: string
          action_type: string
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          expected_impact?: string | null
          id?: string
          priority?: number | null
          source_model?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string | null
          action_title?: string
          action_type?: string
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          expected_impact?: string | null
          id?: string
          priority?: number | null
          source_model?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_action_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          company_id: string | null
          consent_type: string
          contact_id: string | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          ip_address: string | null
          legal_basis: string | null
          metadata: Json | null
          source: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
          version: string | null
          withdrawn_at: string | null
        }
        Insert: {
          company_id?: string | null
          consent_type: string
          contact_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          version?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          company_id?: string | null
          consent_type?: string
          contact_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          version?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          channel: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          importance: string | null
          interaction_date: string
          interaction_type: string
          metadata: Json | null
          outcome: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          interaction_date: string
          interaction_type: string
          metadata?: Json | null
          outcome?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          interaction_date?: string
          interaction_type?: string
          metadata?: Json | null
          outcome?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journeys: {
        Row: {
          bpmn_process_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_segment_id: string | null
          exit_conditions: Json | null
          goals: Json | null
          id: string
          name: string
          stats: Json | null
          status: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          bpmn_process_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_segment_id?: string | null
          exit_conditions?: Json | null
          goals?: Json | null
          id?: string
          name: string
          stats?: Json | null
          status?: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          bpmn_process_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_segment_id?: string | null
          exit_conditions?: Json | null
          goals?: Json | null
          id?: string
          name?: string
          stats?: Json | null
          status?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_journeys_bpmn_process_id_fkey"
            columns: ["bpmn_process_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_quote_items: {
        Row: {
          created_at: string
          custom_price: number
          id: string
          license_type: string
          module_key: string
          module_name: string
          notes: string | null
          quantity: number
          quote_id: string
        }
        Insert: {
          created_at?: string
          custom_price: number
          id?: string
          license_type?: string
          module_key: string
          module_name: string
          notes?: string | null
          quantity?: number
          quote_id: string
        }
        Update: {
          created_at?: string
          custom_price?: number
          id?: string
          license_type?: string
          module_key?: string
          module_name?: string
          notes?: string | null
          quantity?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_quotes: {
        Row: {
          assigned_by: string | null
          created_at: string
          customer_company: string | null
          customer_email: string
          customer_name: string | null
          customer_tax_id: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email: string
          customer_name?: string | null
          customer_tax_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      customer_rfm_scores: {
        Row: {
          calculated_at: string
          company_id: string
          created_at: string
          frequency_count: number
          frequency_score: number
          id: string
          monetary_score: number
          monetary_value: number
          recency_days: number
          recency_score: number
          recommended_actions: string[] | null
          rfm_score: number | null
          rfm_segment: string
          segment_description: string | null
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          company_id: string
          created_at?: string
          frequency_count?: number
          frequency_score: number
          id?: string
          monetary_score: number
          monetary_value?: number
          recency_days?: number
          recency_score: number
          recommended_actions?: string[] | null
          rfm_score?: number | null
          rfm_segment: string
          segment_description?: string | null
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          company_id?: string
          created_at?: string
          frequency_count?: number
          frequency_score?: number
          id?: string
          monetary_score?: number
          monetary_value?: number
          recency_days?: number
          recency_score?: number
          recommended_actions?: string[] | null
          rfm_score?: number | null
          rfm_segment?: string
          segment_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_rfm_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_roi_tracking: {
        Row: {
          acquisition_cost: number | null
          calculation_date: string
          company_id: string | null
          created_at: string | null
          gross_margin: number | null
          gross_margin_percentage: number | null
          id: string
          is_profitable: boolean | null
          ltv: number | null
          ltv_cac_ratio: number | null
          metadata: Json | null
          onboarding_cost: number | null
          payback_months: number | null
          profitability_date: string | null
          projected_ltv: number | null
          success_cost: number | null
          support_cost: number | null
          total_cost: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          acquisition_cost?: number | null
          calculation_date?: string
          company_id?: string | null
          created_at?: string | null
          gross_margin?: number | null
          gross_margin_percentage?: number | null
          id?: string
          is_profitable?: boolean | null
          ltv?: number | null
          ltv_cac_ratio?: number | null
          metadata?: Json | null
          onboarding_cost?: number | null
          payback_months?: number | null
          profitability_date?: string | null
          projected_ltv?: number | null
          success_cost?: number | null
          support_cost?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          acquisition_cost?: number | null
          calculation_date?: string
          company_id?: string | null
          created_at?: string | null
          gross_margin?: number | null
          gross_margin_percentage?: number | null
          id?: string
          is_profitable?: boolean | null
          ltv?: number | null
          ltv_cac_ratio?: number | null
          metadata?: Json | null
          onboarding_cost?: number | null
          payback_months?: number | null
          profitability_date?: string | null
          projected_ltv?: number | null
          success_cost?: number | null
          support_cost?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_roi_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          calculated_at: string
          churn_probability: number | null
          churn_risk_level: string | null
          clv_estimate: number | null
          clv_percentile: number | null
          company_id: string
          created_at: string
          decision_path: string[] | null
          engagement_score: number | null
          feature_importance: Json | null
          id: string
          loyalty_score: number | null
          model_confidence: number | null
          model_version: string | null
          next_best_action: string | null
          priority_score: number | null
          profitability_tier: string | null
          recommended_actions: Json | null
          segment_name: string
          segment_type: string
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          churn_probability?: number | null
          churn_risk_level?: string | null
          clv_estimate?: number | null
          clv_percentile?: number | null
          company_id: string
          created_at?: string
          decision_path?: string[] | null
          engagement_score?: number | null
          feature_importance?: Json | null
          id?: string
          loyalty_score?: number | null
          model_confidence?: number | null
          model_version?: string | null
          next_best_action?: string | null
          priority_score?: number | null
          profitability_tier?: string | null
          recommended_actions?: Json | null
          segment_name: string
          segment_type?: string
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          churn_probability?: number | null
          churn_risk_level?: string | null
          clv_estimate?: number | null
          clv_percentile?: number | null
          company_id?: string
          created_at?: string
          decision_path?: string[] | null
          engagement_score?: number | null
          feature_importance?: Json | null
          id?: string
          loyalty_score?: number | null
          model_confidence?: number | null
          model_version?: string | null
          next_best_action?: string | null
          priority_score?: number | null
          profitability_tier?: string | null
          recommended_actions?: Json | null
          segment_name?: string
          segment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dafo_items: {
        Row: {
          action_plan: string | null
          ai_suggestions: Json | null
          category: string
          concept: string | null
          created_at: string | null
          dafo_id: string
          description: string
          id: string
          importance: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          action_plan?: string | null
          ai_suggestions?: Json | null
          category: string
          concept?: string | null
          created_at?: string | null
          dafo_id: string
          description: string
          id?: string
          importance?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          action_plan?: string | null
          ai_suggestions?: Json | null
          category?: string
          concept?: string | null
          created_at?: string | null
          dafo_id?: string
          description?: string
          id?: string
          importance?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dafo_items_dafo_id_fkey"
            columns: ["dafo_id"]
            isOneToOne: false
            referencedRelation: "business_dafo_analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: unknown
          policy_version: string
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          assigned_to: string | null
          availability: Json | null
          company: string
          company_size: string | null
          contacted_at: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          position: string | null
          scheduled_at: string | null
          sector: string | null
          source_page: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          availability?: Json | null
          company: string
          company_size?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          scheduled_at?: string | null
          sector?: string | null
          source_page?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          availability?: Json | null
          company?: string
          company_size?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          scheduled_at?: string | null
          sector?: string | null
          source_page?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          cleanup_status: string | null
          created_at: string
          created_companies: number | null
          created_goals: number | null
          created_visits: number | null
          data_ids: Json | null
          demo_user_id: string | null
          ended_at: string | null
          id: string
          ip_address: string | null
          sections_visited: string[] | null
          selected_role: string
          started_at: string
          tour_completed: boolean | null
          tour_step: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          cleanup_status?: string | null
          created_at?: string
          created_companies?: number | null
          created_goals?: number | null
          created_visits?: number | null
          data_ids?: Json | null
          demo_user_id?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          sections_visited?: string[] | null
          selected_role: string
          started_at?: string
          tour_completed?: boolean | null
          tour_step?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          cleanup_status?: string | null
          created_at?: string
          created_companies?: number | null
          created_goals?: number | null
          created_visits?: number | null
          data_ids?: Json | null
          demo_user_id?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          sections_visited?: string[] | null
          selected_role?: string
          started_at?: string
          tour_completed?: boolean | null
          tour_step?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      developer_api_keys: {
        Row: {
          allowed_ips: string[] | null
          allowed_origins: string[] | null
          api_key_hash: string
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_prefix: string
          last_used_at: string | null
          partner_company_id: string | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          revoked_at: string | null
          revoked_reason: string | null
          scopes: string[] | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          api_key_hash: string
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          partner_company_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          api_key_hash?: string
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          partner_company_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_api_keys_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_signatures: {
        Row: {
          certificate_issuer: string | null
          certificate_serial: string | null
          created_at: string | null
          document_hash: string
          document_id: string
          document_type: string
          eidas_level: string | null
          id: string
          signature_data: Json | null
          signature_type: string | null
          signed_at: string | null
          signer_email: string
          signer_id: string | null
          signer_name: string
          timestamp_authority: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          certificate_issuer?: string | null
          certificate_serial?: string | null
          created_at?: string | null
          document_hash: string
          document_id: string
          document_type: string
          eidas_level?: string | null
          id?: string
          signature_data?: Json | null
          signature_type?: string | null
          signed_at?: string | null
          signer_email: string
          signer_id?: string | null
          signer_name: string
          timestamp_authority?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          certificate_issuer?: string | null
          certificate_serial?: string | null
          created_at?: string | null
          document_hash?: string
          document_id?: string
          document_type?: string
          eidas_level?: string | null
          id?: string
          signature_data?: Json | null
          signature_type?: string | null
          signed_at?: string | null
          signer_email?: string
          signer_id?: string | null
          signer_name?: string
          timestamp_authority?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      dora_compliance_items: {
        Row: {
          article: string
          completion_date: string | null
          created_at: string
          evidence_description: string | null
          evidence_url: string | null
          id: string
          implementation_status: string
          notes: string | null
          priority: string | null
          requirement_category: string
          requirement_description: string | null
          requirement_title: string
          responsible_person: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          article: string
          completion_date?: string | null
          created_at?: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          implementation_status?: string
          notes?: string | null
          priority?: string | null
          requirement_category: string
          requirement_description?: string | null
          requirement_title: string
          responsible_person?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          article?: string
          completion_date?: string | null
          created_at?: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          implementation_status?: string
          notes?: string | null
          priority?: string | null
          requirement_category?: string
          requirement_description?: string | null
          requirement_title?: string
          responsible_person?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_kpis: {
        Row: {
          alert_status: string | null
          alert_threshold_high: number | null
          alert_threshold_low: number | null
          benchmark_percentile: number | null
          benchmark_value: number | null
          calculation_formula: Json | null
          change_percentage: number | null
          confidence_score: number | null
          created_at: string
          current_value: number | null
          data_sources: string[] | null
          entity_id: string
          entity_type: string
          id: string
          kpi_category: string
          kpi_code: string
          kpi_name: string
          metadata: Json | null
          period_end: string
          period_start: string
          period_type: string
          previous_value: number | null
          sector_average: number | null
          trend: string | null
          trend_strength: number | null
          updated_at: string
        }
        Insert: {
          alert_status?: string | null
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          benchmark_percentile?: number | null
          benchmark_value?: number | null
          calculation_formula?: Json | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          current_value?: number | null
          data_sources?: string[] | null
          entity_id: string
          entity_type: string
          id?: string
          kpi_category: string
          kpi_code: string
          kpi_name: string
          metadata?: Json | null
          period_end: string
          period_start: string
          period_type: string
          previous_value?: number | null
          sector_average?: number | null
          trend?: string | null
          trend_strength?: number | null
          updated_at?: string
        }
        Update: {
          alert_status?: string | null
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          benchmark_percentile?: number | null
          benchmark_value?: number | null
          calculation_formula?: Json | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          current_value?: number | null
          data_sources?: string[] | null
          entity_id?: string
          entity_type?: string
          id?: string
          kpi_category?: string
          kpi_code?: string
          kpi_name?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          previous_value?: number | null
          sector_average?: number | null
          trend?: string | null
          trend_strength?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_reminder_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean
          id: string
          updated_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean
          id?: string
          updated_at?: string | null
          urgency_level?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean
          id?: string
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      encrypted_fields: {
        Row: {
          created_at: string | null
          created_by: string | null
          encrypted_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          iv: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          encrypted_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id?: string
          iv: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          encrypted_value?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: string
          iv?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enriched_transactions: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          enriched_at: string | null
          id: string
          is_recurring: boolean | null
          location: Json | null
          mcc_code: string | null
          merchant_logo_url: string | null
          merchant_name: string | null
          original_transaction_id: string | null
          raw_description: string | null
          recurring_frequency: string | null
          recurring_type: string | null
          subcategory: string | null
          transaction_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: Json | null
          mcc_code?: string | null
          merchant_logo_url?: string | null
          merchant_name?: string | null
          original_transaction_id?: string | null
          raw_description?: string | null
          recurring_frequency?: string | null
          recurring_type?: string | null
          subcategory?: string | null
          transaction_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: Json | null
          mcc_code?: string | null
          merchant_logo_url?: string | null
          merchant_name?: string | null
          original_transaction_id?: string | null
          raw_description?: string | null
          recurring_frequency?: string | null
          recurring_type?: string | null
          subcategory?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enriched_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_changes_statements: {
        Row: {
          adjusted_initial_grants: number | null
          adjusted_initial_other_equity: number | null
          adjusted_initial_reserves: number | null
          adjusted_initial_result: number | null
          adjusted_initial_retained_earnings: number | null
          adjusted_initial_share_capital: number | null
          adjusted_initial_share_premium: number | null
          adjusted_initial_treasury_shares: number | null
          adjusted_initial_value_adjustments: number | null
          created_at: string
          criterion_changes_reserves: number | null
          criterion_changes_retained: number | null
          error_adjustments_reserves: number | null
          error_adjustments_retained: number | null
          final_grants: number | null
          final_other_equity: number | null
          final_reserves: number | null
          final_result: number | null
          final_retained_earnings: number | null
          final_share_capital: number | null
          final_share_premium: number | null
          final_treasury_shares: number | null
          final_value_adjustments: number | null
          id: string
          initial_grants: number | null
          initial_other_equity: number | null
          initial_reserves: number | null
          initial_result: number | null
          initial_retained_earnings: number | null
          initial_share_capital: number | null
          initial_share_premium: number | null
          initial_treasury_shares: number | null
          initial_value_adjustments: number | null
          statement_id: string
          updated_at: string
          variation_dividends: number | null
          variation_grants: number | null
          variation_income_expenses_equity: number | null
          variation_other: number | null
          variation_reserves: number | null
          variation_result: number | null
          variation_share_capital: number | null
          variation_share_premium: number | null
          variation_treasury_shares: number | null
        }
        Insert: {
          adjusted_initial_grants?: number | null
          adjusted_initial_other_equity?: number | null
          adjusted_initial_reserves?: number | null
          adjusted_initial_result?: number | null
          adjusted_initial_retained_earnings?: number | null
          adjusted_initial_share_capital?: number | null
          adjusted_initial_share_premium?: number | null
          adjusted_initial_treasury_shares?: number | null
          adjusted_initial_value_adjustments?: number | null
          created_at?: string
          criterion_changes_reserves?: number | null
          criterion_changes_retained?: number | null
          error_adjustments_reserves?: number | null
          error_adjustments_retained?: number | null
          final_grants?: number | null
          final_other_equity?: number | null
          final_reserves?: number | null
          final_result?: number | null
          final_retained_earnings?: number | null
          final_share_capital?: number | null
          final_share_premium?: number | null
          final_treasury_shares?: number | null
          final_value_adjustments?: number | null
          id?: string
          initial_grants?: number | null
          initial_other_equity?: number | null
          initial_reserves?: number | null
          initial_result?: number | null
          initial_retained_earnings?: number | null
          initial_share_capital?: number | null
          initial_share_premium?: number | null
          initial_treasury_shares?: number | null
          initial_value_adjustments?: number | null
          statement_id: string
          updated_at?: string
          variation_dividends?: number | null
          variation_grants?: number | null
          variation_income_expenses_equity?: number | null
          variation_other?: number | null
          variation_reserves?: number | null
          variation_result?: number | null
          variation_share_capital?: number | null
          variation_share_premium?: number | null
          variation_treasury_shares?: number | null
        }
        Update: {
          adjusted_initial_grants?: number | null
          adjusted_initial_other_equity?: number | null
          adjusted_initial_reserves?: number | null
          adjusted_initial_result?: number | null
          adjusted_initial_retained_earnings?: number | null
          adjusted_initial_share_capital?: number | null
          adjusted_initial_share_premium?: number | null
          adjusted_initial_treasury_shares?: number | null
          adjusted_initial_value_adjustments?: number | null
          created_at?: string
          criterion_changes_reserves?: number | null
          criterion_changes_retained?: number | null
          error_adjustments_reserves?: number | null
          error_adjustments_retained?: number | null
          final_grants?: number | null
          final_other_equity?: number | null
          final_reserves?: number | null
          final_result?: number | null
          final_retained_earnings?: number | null
          final_share_capital?: number | null
          final_share_premium?: number | null
          final_treasury_shares?: number | null
          final_value_adjustments?: number | null
          id?: string
          initial_grants?: number | null
          initial_other_equity?: number | null
          initial_reserves?: number | null
          initial_result?: number | null
          initial_retained_earnings?: number | null
          initial_share_capital?: number | null
          initial_share_premium?: number | null
          initial_treasury_shares?: number | null
          initial_value_adjustments?: number | null
          statement_id?: string
          updated_at?: string
          variation_dividends?: number | null
          variation_grants?: number | null
          variation_income_expenses_equity?: number | null
          variation_other?: number | null
          variation_reserves?: number | null
          variation_result?: number | null
          variation_share_capital?: number | null
          variation_share_premium?: number | null
          variation_treasury_shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_changes_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_code: string | null
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expansion_opportunities: {
        Row: {
          ai_confidence: number | null
          assigned_to: string | null
          company_id: string | null
          created_at: string | null
          current_mrr: number | null
          current_plan: string | null
          id: string
          lost_reason: string | null
          mrr_uplift: number | null
          next_action: string | null
          next_action_date: string | null
          opportunity_type: string
          optimal_timing: string | null
          potential_mrr: number | null
          propensity_score: number | null
          recommended_actions: Json | null
          signals: Json | null
          status: string | null
          target_plan: string | null
          timing_score: number | null
          updated_at: string | null
          won_date: string | null
          won_mrr: number | null
        }
        Insert: {
          ai_confidence?: number | null
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          current_mrr?: number | null
          current_plan?: string | null
          id?: string
          lost_reason?: string | null
          mrr_uplift?: number | null
          next_action?: string | null
          next_action_date?: string | null
          opportunity_type: string
          optimal_timing?: string | null
          potential_mrr?: number | null
          propensity_score?: number | null
          recommended_actions?: Json | null
          signals?: Json | null
          status?: string | null
          target_plan?: string | null
          timing_score?: number | null
          updated_at?: string | null
          won_date?: string | null
          won_mrr?: number | null
        }
        Update: {
          ai_confidence?: number | null
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          current_mrr?: number | null
          current_plan?: string | null
          id?: string
          lost_reason?: string | null
          mrr_uplift?: number | null
          next_action?: string | null
          next_action_date?: string | null
          opportunity_type?: string
          optimal_timing?: string | null
          potential_mrr?: number | null
          propensity_score?: number | null
          recommended_actions?: Json | null
          signals?: Json | null
          status?: string | null
          target_plan?: string | null
          timing_score?: number | null
          updated_at?: string | null
          won_date?: string | null
          won_mrr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "expansion_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expansion_predictions: {
        Row: {
          company_id: string | null
          confidence: number | null
          created_at: string | null
          id: string
          model_version: string | null
          optimal_timing: string | null
          predicted_arr_uplift: number | null
          predicted_mrr_uplift: number | null
          propensity_score: number | null
          recommended_products: Json | null
          signals: Json | null
          valid_until: string | null
        }
        Insert: {
          company_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          optimal_timing?: string | null
          predicted_arr_uplift?: number | null
          predicted_mrr_uplift?: number | null
          propensity_score?: number | null
          recommended_products?: Json | null
          signals?: Json | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string | null
          confidence?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          optimal_timing?: string | null
          predicted_arr_uplift?: number | null
          predicted_mrr_uplift?: number | null
          propensity_score?: number | null
          recommended_products?: Json | null
          signals?: Json | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expansion_predictions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category_id: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          not_helpful_count: number | null
          priority: number | null
          question: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          answer: string
          category_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          priority?: number | null
          question: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          answer?: string
          category_id?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          not_helpful_count?: number | null
          priority?: number | null
          question?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_tracking: {
        Row: {
          company_id: string | null
          created_at: string | null
          feature_key: string
          first_used_at: string | null
          id: string
          last_used_at: string | null
          metadata: Json | null
          product_key: string | null
          session_duration_seconds: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          feature_key: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          product_key?: string | null
          session_duration_seconds?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          feature_key?: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          product_key?: string | null
          session_duration_seconds?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_gamification: {
        Row: {
          badges: string[] | null
          best_streak: number | null
          coins_earned_30d: number | null
          company_id: string
          company_rank: number | null
          contact_id: string | null
          created_at: string
          id: string
          last_response_date: string | null
          streak_days: number | null
          surveys_completed: number | null
          total_coins: number | null
          updated_at: string
        }
        Insert: {
          badges?: string[] | null
          best_streak?: number | null
          coins_earned_30d?: number | null
          company_id: string
          company_rank?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_response_date?: string | null
          streak_days?: number | null
          surveys_completed?: number | null
          total_coins?: number | null
          updated_at?: string
        }
        Update: {
          badges?: string[] | null
          best_streak?: number | null
          coins_earned_30d?: number | null
          company_id?: string
          company_rank?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_response_date?: string | null
          streak_days?: number | null
          surveys_completed?: number | null
          total_coins?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_gamification_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_gamification_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_loops: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          closed_at: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          escalated_at: string | null
          escalated_to: string | null
          escalation_level: number | null
          escalation_reason: string | null
          followup_date: string | null
          followup_notes: string | null
          id: string
          is_recovered: boolean | null
          original_category: string | null
          original_feedback: string | null
          original_score: number | null
          priority: string | null
          recovery_score: number | null
          recovery_survey_scheduled: string | null
          recovery_survey_sent_at: string | null
          resolution_notes: string | null
          sla_deadline: string | null
          source_id: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          followup_date?: string | null
          followup_notes?: string | null
          id?: string
          is_recovered?: boolean | null
          original_category?: string | null
          original_feedback?: string | null
          original_score?: number | null
          priority?: string | null
          recovery_score?: number | null
          recovery_survey_scheduled?: string | null
          recovery_survey_sent_at?: string | null
          resolution_notes?: string | null
          sla_deadline?: string | null
          source_id: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          followup_date?: string | null
          followup_notes?: string | null
          id?: string
          is_recovered?: boolean | null
          original_category?: string | null
          original_feedback?: string | null
          original_score?: number | null
          priority?: string | null
          recovery_score?: number | null
          recovery_survey_scheduled?: string | null
          recovery_survey_sent_at?: string | null
          resolution_notes?: string | null
          sla_deadline?: string | null
          source_id?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_loops_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_loops_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_loops_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_loops_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_document_embeddings: {
        Row: {
          chunk_index: number
          company_id: string
          content: string
          created_at: string
          document_type: string
          embedding: string | null
          fiscal_year: number
          id: string
          metadata: Json | null
          statement_id: string | null
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          company_id: string
          content: string
          created_at?: string
          document_type: string
          embedding?: string | null
          fiscal_year: number
          id?: string
          metadata?: Json | null
          statement_id?: string | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          company_id?: string
          content?: string
          created_at?: string
          document_type?: string
          embedding?: string | null
          fiscal_year?: number
          id?: string
          metadata?: Json | null
          statement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_document_embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_document_embeddings_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_notes: {
        Row: {
          created_at: string
          id: string
          note_content: string | null
          note_number: number
          note_title: string
          statement_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_content?: string | null
          note_number: number
          note_title: string
          statement_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note_content?: string | null
          note_number?: number
          note_title?: string
          statement_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_notes_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_plan_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          amount: number | null
          created_at: string | null
          formula: string | null
          id: string
          notes: string | null
          parent_code: string | null
          plan_id: string
          sort_order: number | null
          source: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          amount?: number | null
          created_at?: string | null
          formula?: string | null
          id?: string
          notes?: string | null
          parent_code?: string | null
          plan_id: string
          sort_order?: number | null
          source?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          amount?: number | null
          created_at?: string | null
          formula?: string | null
          id?: string
          notes?: string | null
          parent_code?: string | null
          plan_id?: string
          sort_order?: number | null
          source?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_plan_accounts_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_viability_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_plan_ratios: {
        Row: {
          benchmark_value: number | null
          category: string | null
          created_at: string | null
          id: string
          plan_id: string
          ratio_key: string
          ratio_name: string
          ratio_value: number | null
          status: string | null
          year: number
        }
        Insert: {
          benchmark_value?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          plan_id: string
          ratio_key: string
          ratio_name: string
          ratio_value?: number | null
          status?: string | null
          year: number
        }
        Update: {
          benchmark_value?: number | null
          category?: string | null
          created_at?: string | null
          id?: string
          plan_id?: string
          ratio_key?: string
          ratio_name?: string
          ratio_value?: number | null
          status?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_plan_ratios_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_viability_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_plan_variables: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          percentage: number | null
          plan_id: string
          unit: string | null
          updated_at: string | null
          value: number | null
          variable_key: string
          variable_name: string
          year: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          percentage?: number | null
          plan_id: string
          unit?: string | null
          updated_at?: string | null
          value?: number | null
          variable_key: string
          variable_name: string
          year?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          percentage?: number | null
          plan_id?: string
          unit?: string | null
          updated_at?: string | null
          value?: number | null
          variable_key?: string
          variable_name?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_plan_variables_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_viability_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_rag_conversations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_rag_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_rag_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_rag_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "financial_rag_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_scenarios: {
        Row: {
          breakeven_year: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          irr: number | null
          is_base_scenario: boolean | null
          npv: number | null
          payback_period: number | null
          plan_id: string
          projections: Json | null
          scenario_name: string
          scenario_type: string | null
          summary_metrics: Json | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          breakeven_year?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          irr?: number | null
          is_base_scenario?: boolean | null
          npv?: number | null
          payback_period?: number | null
          plan_id: string
          projections?: Json | null
          scenario_name: string
          scenario_type?: string | null
          summary_metrics?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          breakeven_year?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          irr?: number | null
          is_base_scenario?: boolean | null
          npv?: number | null
          payback_period?: number | null
          plan_id?: string
          projections?: Json | null
          scenario_name?: string
          scenario_type?: string | null
          summary_metrics?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_scenarios_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "financial_viability_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statements_archive: {
        Row: {
          archived_at: string
          archived_by: string | null
          balance_sheet_data: Json | null
          cash_flow_data: Json | null
          company_id: string
          created_at: string
          equity_changes_data: Json | null
          fiscal_year: number
          id: string
          income_statement_data: Json | null
          notes_data: Json | null
          original_statement_id: string
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          balance_sheet_data?: Json | null
          cash_flow_data?: Json | null
          company_id: string
          created_at?: string
          equity_changes_data?: Json | null
          fiscal_year: number
          id?: string
          income_statement_data?: Json | null
          notes_data?: Json | null
          original_statement_id: string
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          balance_sheet_data?: Json | null
          cash_flow_data?: Json | null
          company_id?: string
          created_at?: string
          equity_changes_data?: Json | null
          fiscal_year?: number
          id?: string
          income_statement_data?: Json | null
          notes_data?: Json | null
          original_statement_id?: string
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_archive_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_statements_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_viability_plans: {
        Row: {
          base_currency: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          last_sync_at: string | null
          plan_name: string
          projection_years: number | null
          start_year: number
          status: string | null
          sync_source: string | null
          synced_with_accounting: boolean | null
          updated_at: string | null
        }
        Insert: {
          base_currency?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_sync_at?: string | null
          plan_name: string
          projection_years?: number | null
          start_year: number
          status?: string | null
          sync_source?: string | null
          synced_with_accounting?: boolean | null
          updated_at?: string | null
        }
        Update: {
          base_currency?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          last_sync_at?: string | null
          plan_name?: string
          projection_years?: number | null
          start_year?: number
          status?: string | null
          sync_source?: string | null
          synced_with_accounting?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_viability_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_modules: {
        Row: {
          accounting_ratios: Json | null
          ai_generated: boolean | null
          cnae_code: string
          compliance_panel_config: Json | null
          components: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          generation_metadata: Json | null
          id: string
          is_published: boolean | null
          kpis: Json | null
          module_key: string
          module_name: string
          regulations: Json | null
          sector: string
          sector_name: string
          updated_at: string
          visit_form_config: Json | null
        }
        Insert: {
          accounting_ratios?: Json | null
          ai_generated?: boolean | null
          cnae_code: string
          compliance_panel_config?: Json | null
          components?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          is_published?: boolean | null
          kpis?: Json | null
          module_key: string
          module_name: string
          regulations?: Json | null
          sector: string
          sector_name: string
          updated_at?: string
          visit_form_config?: Json | null
        }
        Update: {
          accounting_ratios?: Json | null
          ai_generated?: boolean | null
          cnae_code?: string
          compliance_panel_config?: Json | null
          components?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          is_published?: boolean | null
          kpis?: Json | null
          module_key?: string
          module_name?: string
          regulations?: Json | null
          sector?: string
          sector_name?: string
          updated_at?: string
          visit_form_config?: Json | null
        }
        Relationships: []
      }
      geocode_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          assigned_to: string | null
          contributes_to_parent: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          goal_level: string | null
          id: string
          metric_type: string
          office: string | null
          parent_goal_id: string | null
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          assigned_to?: string | null
          contributes_to_parent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_level?: string | null
          id?: string
          metric_type: string
          office?: string | null
          parent_goal_id?: string | null
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          assigned_to?: string | null
          contributes_to_parent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_level?: string | null
          id?: string
          metric_type?: string
          office?: string | null
          parent_goal_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          target_value?: number
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_subscriptions: {
        Row: {
          annual_total: number | null
          created_at: string | null
          features_included: Json | null
          id: string
          is_active: boolean | null
          monthly_total: number | null
          parent_company_id: string
          subscription_tier: string
          total_cnaes: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          volume_discount: number | null
        }
        Insert: {
          annual_total?: number | null
          created_at?: string | null
          features_included?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_total?: number | null
          parent_company_id: string
          subscription_tier?: string
          total_cnaes?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          volume_discount?: number | null
        }
        Update: {
          annual_total?: number | null
          created_at?: string | null
          features_included?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_total?: number | null
          parent_company_id?: string
          subscription_tier?: string
          total_cnaes?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          volume_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holding_subscriptions_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_records: number
          filename: string | null
          id: string
          notes: string | null
          successful_records: number
          total_records: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_records?: number
          filename?: string | null
          id?: string
          notes?: string | null
          successful_records?: number
          total_records?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_records?: number
          filename?: string | null
          id?: string
          notes?: string | null
          successful_records?: number
          total_records?: number
        }
        Relationships: []
      }
      income_statements: {
        Row: {
          capitalized_work: number | null
          corporate_tax: number | null
          created_at: string
          depreciation: number | null
          discontinued_operations_result: number | null
          excess_provisions: number | null
          exchange_differences: number | null
          financial_expenses: number | null
          financial_income: number | null
          grants_allocation: number | null
          id: string
          impairment_financial_instruments: number | null
          impairment_trade_operations: number | null
          inventory_variation: number | null
          net_turnover: number | null
          operating_grants: number | null
          other_financial_results: number | null
          other_operating_expenses: number | null
          other_operating_income: number | null
          other_operating_results: number | null
          personnel_expenses: number | null
          statement_id: string
          supplies: number | null
          updated_at: string
        }
        Insert: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          discontinued_operations_result?: number | null
          excess_provisions?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          grants_allocation?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          statement_id: string
          supplies?: number | null
          updated_at?: string
        }
        Update: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          discontinued_operations_result?: number | null
          excess_provisions?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          grants_allocation?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          statement_id?: string
          supplies?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_benchmarks: {
        Row: {
          created_at: string | null
          effective_date: string
          expires_date: string | null
          id: string
          industry: string
          is_active: boolean | null
          metric_name: string
          metric_value: number
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          sample_size: number | null
          segment: string | null
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_date?: string
          expires_date?: string | null
          id?: string
          industry: string
          is_active?: boolean | null
          metric_name: string
          metric_value: number
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          sample_size?: number | null
          segment?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          expires_date?: string | null
          id?: string
          industry?: string
          is_active?: boolean | null
          metric_name?: string
          metric_value?: number
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          sample_size?: number | null
          segment?: string | null
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      industry_packs: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          features: Json | null
          id: string
          included_modules: string[] | null
          industry_key: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_modules?: string[] | null
          industry_key: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_modules?: string[] | null
          industry_key?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      installation_downloads: {
        Row: {
          download_duration_ms: number | null
          download_size_bytes: number | null
          download_status: string
          download_type: string
          downloaded_at: string
          error_message: string | null
          id: string
          installation_id: string
          ip_address: unknown
          locale_downloaded: string
          module_id: string
          module_version: string
          user_agent: string | null
        }
        Insert: {
          download_duration_ms?: number | null
          download_size_bytes?: number | null
          download_status?: string
          download_type?: string
          downloaded_at?: string
          error_message?: string | null
          id?: string
          installation_id: string
          ip_address?: unknown
          locale_downloaded: string
          module_id: string
          module_version: string
          user_agent?: string | null
        }
        Update: {
          download_duration_ms?: number | null
          download_size_bytes?: number | null
          download_status?: string
          download_type?: string
          downloaded_at?: string
          error_message?: string | null
          id?: string
          installation_id?: string
          ip_address?: unknown
          locale_downloaded?: string
          module_id?: string
          module_version?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_downloads_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "client_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "installation_downloads_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      installed_modules: {
        Row: {
          auto_update_translations: boolean | null
          created_at: string | null
          id: string
          installed_at: string | null
          installed_by: string | null
          is_active: boolean | null
          last_used_at: string | null
          license_key: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          locale_installed: string | null
          module_id: string
          organization_id: string
          settings: Json | null
          updated_at: string | null
          usage_stats: Json | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          auto_update_translations?: boolean | null
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          locale_installed?: string | null
          module_id: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          auto_update_translations?: boolean | null
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          locale_installed?: string | null
          module_id?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_mappings: {
        Row: {
          config_id: string | null
          core_field: string
          created_at: string | null
          default_value: string | null
          direction: string
          entity_type: string
          id: string
          is_required: boolean | null
          obelixia_field: string
          transformation_rule: Json | null
          updated_at: string | null
        }
        Insert: {
          config_id?: string | null
          core_field: string
          created_at?: string | null
          default_value?: string | null
          direction: string
          entity_type: string
          id?: string
          is_required?: boolean | null
          obelixia_field: string
          transformation_rule?: Json | null
          updated_at?: string | null
        }
        Update: {
          config_id?: string | null
          core_field?: string
          created_at?: string | null
          default_value?: string | null
          direction?: string
          entity_type?: string
          id?: string
          is_required?: boolean | null
          obelixia_field?: string
          transformation_rule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_mappings_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "core_banking_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          config_id: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          operation_type: string
          payload: Json
          priority: number | null
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          operation_type: string
          payload: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          operation_type?: string
          payload?: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_queue_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "core_banking_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_assistant_conversations: {
        Row: {
          context_type: string
          created_at: string
          id: string
          is_sensitive: boolean | null
          requires_human_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_type?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_type?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      internal_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flagged_for_review: boolean | null
          id: string
          is_sensitive: boolean | null
          metadata: Json | null
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flagged_for_review?: boolean | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flagged_for_review?: boolean | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "internal_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          current_step_id: string | null
          enrolled_at: string | null
          exit_reason: string | null
          exited_at: string | null
          id: string
          journey_id: string
          next_action_at: string | null
          status: string
          step_history: Json | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step_id?: string | null
          enrolled_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          journey_id: string
          next_action_at?: string | null
          status?: string
          step_history?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step_id?: string | null
          enrolled_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          journey_id?: string
          next_action_at?: string | null
          status?: string
          step_history?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          action_type: string | null
          config: Json | null
          created_at: string | null
          delay_duration: unknown
          delay_until_time: string | null
          id: string
          journey_id: string
          next_step_id: string | null
          no_step_id: string | null
          stats: Json | null
          step_order: number
          step_type: string
          template_id: string | null
          updated_at: string | null
          yes_step_id: string | null
        }
        Insert: {
          action_type?: string | null
          config?: Json | null
          created_at?: string | null
          delay_duration?: unknown
          delay_until_time?: string | null
          id?: string
          journey_id: string
          next_step_id?: string | null
          no_step_id?: string | null
          stats?: Json | null
          step_order: number
          step_type: string
          template_id?: string | null
          updated_at?: string | null
          yes_step_id?: string | null
        }
        Update: {
          action_type?: string | null
          config?: Json | null
          created_at?: string | null
          delay_duration?: unknown
          delay_until_time?: string | null
          id?: string
          journey_id?: string
          next_step_id?: string | null
          no_step_id?: string | null
          stats?: Json | null
          step_order?: number
          step_type?: string
          template_id?: string | null
          updated_at?: string | null
          yes_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_next_step_id_fkey"
            columns: ["next_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_no_step_id_fkey"
            columns: ["no_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_yes_step_id_fkey"
            columns: ["yes_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_report_history: {
        Row: {
          created_at: string
          html_content: string
          id: string
          recipients: Json
          report_date: string
          report_type: string
          sent_count: number
          stats: Json
          total_recipients: number
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          recipients?: Json
          report_date: string
          report_type?: string
          sent_count?: number
          stats: Json
          total_recipients?: number
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          recipients?: Json
          report_date?: string
          report_type?: string
          sent_count?: number
          stats?: Json
          total_recipients?: number
        }
        Relationships: []
      }
      lead_distribution_rules: {
        Row: {
          agent_weights: Json | null
          channel_filters: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_concurrent: number | null
          name: string
          priority: number | null
          rule_type: string | null
          specialty_filters: Json | null
          updated_at: string | null
        }
        Insert: {
          agent_weights?: Json | null
          channel_filters?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent?: number | null
          name: string
          priority?: number | null
          rule_type?: string | null
          specialty_filters?: Json | null
          updated_at?: string | null
        }
        Update: {
          agent_weights?: Json | null
          channel_filters?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent?: number | null
          name?: string
          priority?: number | null
          rule_type?: string | null
          specialty_filters?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lead_magnet_downloads: {
        Row: {
          company: string | null
          downloaded_at: string | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          id: string
          lead_magnet_key: string
          lead_magnet_name: string
          phone: string | null
          position: string | null
          sector: string | null
          source_page: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          downloaded_at?: string | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          id?: string
          lead_magnet_key: string
          lead_magnet_name: string
          phone?: string | null
          position?: string | null
          sector?: string | null
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          downloaded_at?: string | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          id?: string
          lead_magnet_key?: string
          lead_magnet_name?: string
          phone?: string | null
          position?: string | null
          sector?: string | null
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      low_usage_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          assigned_to: string | null
          auto_action_taken: string | null
          company_id: string | null
          created_at: string | null
          days_since_last_use: number | null
          expected_usage_frequency: string | null
          feature_key: string | null
          id: string
          product_key: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          assigned_to?: string | null
          auto_action_taken?: string | null
          company_id?: string | null
          created_at?: string | null
          days_since_last_use?: number | null
          expected_usage_frequency?: string | null
          feature_key?: string | null
          id?: string
          product_key?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          assigned_to?: string | null
          auto_action_taken?: string | null
          company_id?: string | null
          created_at?: string | null
          days_since_last_use?: number | null
          expected_usage_frequency?: string | null
          feature_key?: string | null
          id?: string
          product_key?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "low_usage_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_form_definitions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          fields: Json
          form_key: string
          form_name: string
          id: string
          module_id: string | null
          permissions: Json | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          validations: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          form_key: string
          form_name: string
          id?: string
          module_id?: string | null
          permissions?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          validations?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          form_key?: string
          form_name?: string
          id?: string
          module_id?: string | null
          permissions?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          validations?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_form_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_form_submissions: {
        Row: {
          created_at: string | null
          data: Json
          form_id: string | null
          id: string
          metadata: Json | null
          status: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          form_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          form_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "lowcode_form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_modules: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          forms: string[] | null
          icon: string | null
          id: string
          module_key: string
          module_name: string
          pages: string[] | null
          permissions: Json | null
          published_at: string | null
          reports: string[] | null
          rules: string[] | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          forms?: string[] | null
          icon?: string | null
          id?: string
          module_key: string
          module_name: string
          pages?: string[] | null
          permissions?: Json | null
          published_at?: string | null
          reports?: string[] | null
          rules?: string[] | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          forms?: string[] | null
          icon?: string | null
          id?: string
          module_key?: string
          module_name?: string
          pages?: string[] | null
          permissions?: Json | null
          published_at?: string | null
          reports?: string[] | null
          rules?: string[] | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      lowcode_page_definitions: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          data_sources: Json | null
          description: string | null
          id: string
          layout: Json
          module_id: string | null
          page_key: string
          page_name: string
          settings: Json | null
          status: string | null
          updated_at: string | null
          visibility_rules: Json | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          description?: string | null
          id?: string
          layout?: Json
          module_id?: string | null
          page_key: string
          page_name: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          visibility_rules?: Json | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          description?: string | null
          id?: string
          layout?: Json
          module_id?: string | null
          page_key?: string
          page_name?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          visibility_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_page_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_report_definitions: {
        Row: {
          aggregations: Json | null
          columns: Json
          created_at: string | null
          created_by: string | null
          data_source: Json
          description: string | null
          export_formats: string[] | null
          filters: Json | null
          grouping: Json | null
          id: string
          module_id: string | null
          permissions: Json | null
          report_key: string
          report_name: string
          schedule: Json | null
          sorting: Json | null
          updated_at: string | null
          visualizations: Json | null
        }
        Insert: {
          aggregations?: Json | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          data_source: Json
          description?: string | null
          export_formats?: string[] | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          module_id?: string | null
          permissions?: Json | null
          report_key: string
          report_name: string
          schedule?: Json | null
          sorting?: Json | null
          updated_at?: string | null
          visualizations?: Json | null
        }
        Update: {
          aggregations?: Json | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          data_source?: Json
          description?: string | null
          export_formats?: string[] | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          module_id?: string | null
          permissions?: Json | null
          report_key?: string
          report_name?: string
          schedule?: Json | null
          sorting?: Json | null
          updated_at?: string | null
          visualizations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_report_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_rule_executions: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          rule_id: string | null
          status: string | null
          trigger_data: Json | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_rule_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "lowcode_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          module_id: string | null
          priority: number | null
          rule_key: string
          rule_name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string | null
          priority?: number | null
          rule_key: string
          rule_name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string | null
          priority?: number | null
          rule_key?: string
          rule_name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_rules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ltv_predictions: {
        Row: {
          cac: number | null
          churn_probability: number | null
          company_id: string | null
          confidence_score: number | null
          created_at: string
          engagement_score: number | null
          expansion_probability: number | null
          expected_lifetime_months: number | null
          feature_usage_score: number | null
          health_score: number | null
          id: string
          input_features: Json | null
          ltv_cac_ratio: number | null
          ltv_confidence_high: number | null
          ltv_confidence_low: number | null
          model_version: string | null
          payback_months: number | null
          predicted_ltv: number
          prediction_date: string
          segment: string | null
          updated_at: string
        }
        Insert: {
          cac?: number | null
          churn_probability?: number | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          engagement_score?: number | null
          expansion_probability?: number | null
          expected_lifetime_months?: number | null
          feature_usage_score?: number | null
          health_score?: number | null
          id?: string
          input_features?: Json | null
          ltv_cac_ratio?: number | null
          ltv_confidence_high?: number | null
          ltv_confidence_low?: number | null
          model_version?: string | null
          payback_months?: number | null
          predicted_ltv: number
          prediction_date?: string
          segment?: string | null
          updated_at?: string
        }
        Update: {
          cac?: number | null
          churn_probability?: number | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string
          engagement_score?: number | null
          expansion_probability?: number | null
          expected_lifetime_months?: number | null
          feature_usage_score?: number | null
          health_score?: number | null
          id?: string
          input_features?: Json | null
          ltv_cac_ratio?: number | null
          ltv_confidence_high?: number | null
          ltv_confidence_low?: number | null
          model_version?: string | null
          payback_months?: number | null
          predicted_ltv?: number
          prediction_date?: string
          segment?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ltv_predictions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      map_color_mode: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      map_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      map_tooltip_config: {
        Row: {
          created_at: string
          display_order: number
          enabled: boolean
          field_label: string
          field_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          field_label: string
          field_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          field_label?: string
          field_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          sector: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          sector?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          sector?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      marketplace_installations: {
        Row: {
          application_id: string | null
          config: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          installed_by: string
          is_active: boolean | null
          last_used_at: string | null
          license_key: string | null
          license_type: string | null
          organization_id: string
          uninstall_reason: string | null
          uninstalled_at: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          application_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installed_by: string
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: string | null
          organization_id: string
          uninstall_reason?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          application_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installed_by?: string
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: string | null
          organization_id?: string
          uninstall_reason?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_installations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          application_id: string | null
          cons: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          pros: string | null
          rating: number
          response_at: string | null
          response_by: string | null
          response_text: string | null
          review_text: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          cons?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          pros?: string | null
          rating: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          cons?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          pros?: string | null
          rating?: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_requirements: {
        Row: {
          created_at: string | null
          id: string
          last_mfa_challenge: string | null
          mfa_bypass_until: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          mfa_required: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_mfa_challenge?: string | null
          mfa_bypass_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_mfa_challenge?: string | null
          mfa_bypass_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      microsurvey_responses: {
        Row: {
          company_id: string
          contact_id: string | null
          created_at: string
          id: string
          microsurvey_id: string
          open_feedback: string | null
          responded_at: string
          response_score: number | null
          response_time_seconds: number | null
          response_value: string
          trigger_context: Json | null
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          microsurvey_id: string
          open_feedback?: string | null
          responded_at?: string
          response_score?: number | null
          response_time_seconds?: number | null
          response_value: string
          trigger_context?: Json | null
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          microsurvey_id?: string
          open_feedback?: string | null
          responded_at?: string
          response_score?: number | null
          response_time_seconds?: number | null
          response_value?: string
          trigger_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "microsurvey_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microsurvey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "microsurvey_responses_microsurvey_id_fkey"
            columns: ["microsurvey_id"]
            isOneToOne: false
            referencedRelation: "microsurveys"
            referencedColumns: ["id"]
          },
        ]
      }
      microsurveys: {
        Row: {
          cooldown_days: number | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          max_impressions_per_contact: number | null
          name: string
          options: Json | null
          priority: number | null
          question_text: string
          question_type: string
          target_segments: string[] | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          cooldown_days?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_impressions_per_contact?: number | null
          name: string
          options?: Json | null
          priority?: number | null
          question_text: string
          question_type?: string
          target_segments?: string[] | null
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          cooldown_days?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          max_impressions_per_contact?: number | null
          name?: string
          options?: Json | null
          priority?: number | null
          question_text?: string
          question_type?: string
          target_segments?: string[] | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "microsurveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_ab_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          model_a_id: string | null
          model_b_id: string | null
          results: Json | null
          start_date: string
          status: string | null
          test_name: string
          traffic_split_a: number | null
          updated_at: string | null
          winner_model_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          model_a_id?: string | null
          model_b_id?: string | null
          results?: Json | null
          start_date?: string
          status?: string | null
          test_name: string
          traffic_split_a?: number | null
          updated_at?: string | null
          winner_model_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          model_a_id?: string | null
          model_b_id?: string | null
          results?: Json | null
          start_date?: string
          status?: string | null
          test_name?: string
          traffic_split_a?: number | null
          updated_at?: string | null
          winner_model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_ab_tests_model_a_id_fkey"
            columns: ["model_a_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_model_b_id_fkey"
            columns: ["model_b_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_winner_model_id_fkey"
            columns: ["winner_model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_executions: {
        Row: {
          companies_processed: number | null
          completed_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          model_type: string
          model_version: string | null
          parameters: Json | null
          results_summary: Json | null
          segments_created: number | null
          started_at: string
        }
        Insert: {
          companies_processed?: number | null
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          model_type: string
          model_version?: string | null
          parameters?: Json | null
          results_summary?: Json | null
          segments_created?: number | null
          started_at?: string
        }
        Update: {
          companies_processed?: number | null
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          model_type?: string
          model_version?: string | null
          parameters?: Json | null
          results_summary?: Json | null
          segments_created?: number | null
          started_at?: string
        }
        Relationships: []
      }
      ml_model_registry: {
        Row: {
          ab_test_group: string | null
          ab_test_weight: number | null
          created_at: string | null
          created_by: string | null
          deployed_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_production: boolean | null
          model_name: string
          model_type: string
          parameters: Json | null
          performance_metrics: Json | null
          trained_at: string | null
          training_data_info: Json | null
          updated_at: string | null
          version: string
        }
        Insert: {
          ab_test_group?: string | null
          ab_test_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_production?: boolean | null
          model_name: string
          model_type: string
          parameters?: Json | null
          performance_metrics?: Json | null
          trained_at?: string | null
          training_data_info?: Json | null
          updated_at?: string | null
          version: string
        }
        Update: {
          ab_test_group?: string | null
          ab_test_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_production?: boolean | null
          model_name?: string
          model_type?: string
          parameters?: Json | null
          performance_metrics?: Json | null
          trained_at?: string | null
          training_data_info?: Json | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ml_prediction_logs: {
        Row: {
          ab_test_id: string | null
          actual_outcome: Json | null
          company_id: string | null
          created_at: string | null
          explanation_id: string | null
          id: string
          input_features: Json
          is_correct: boolean | null
          latency_ms: number | null
          model_id: string | null
          prediction: Json
          prediction_probability: number | null
        }
        Insert: {
          ab_test_id?: string | null
          actual_outcome?: Json | null
          company_id?: string | null
          created_at?: string | null
          explanation_id?: string | null
          id?: string
          input_features: Json
          is_correct?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          prediction: Json
          prediction_probability?: number | null
        }
        Update: {
          ab_test_id?: string | null
          actual_outcome?: Json | null
          company_id?: string | null
          created_at?: string | null
          explanation_id?: string | null
          id?: string
          input_features?: Json
          is_correct?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          prediction?: Json
          prediction_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_prediction_logs_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ml_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_explanation_id_fkey"
            columns: ["explanation_id"]
            isOneToOne: false
            referencedRelation: "model_explanations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      model_explanations: {
        Row: {
          company_id: string | null
          confidence_intervals: Json | null
          counterfactuals: Json | null
          created_at: string | null
          created_by: string | null
          decision_path: string[] | null
          feature_importances: Json | null
          human_readable_explanation: string | null
          id: string
          lime_weights: Json | null
          model_type: string
          model_version: string | null
          prediction_id: string | null
          shap_values: Json | null
        }
        Insert: {
          company_id?: string | null
          confidence_intervals?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          created_by?: string | null
          decision_path?: string[] | null
          feature_importances?: Json | null
          human_readable_explanation?: string | null
          id?: string
          lime_weights?: Json | null
          model_type: string
          model_version?: string | null
          prediction_id?: string | null
          shap_values?: Json | null
        }
        Update: {
          company_id?: string | null
          confidence_intervals?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          created_by?: string | null
          decision_path?: string[] | null
          feature_importances?: Json | null
          human_readable_explanation?: string | null
          id?: string
          lime_weights?: Json | null
          model_type?: string
          model_version?: string | null
          prediction_id?: string | null
          shap_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "model_explanations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      module_components: {
        Row: {
          admin_section_key: string | null
          component_name: string
          component_path: string
          component_type: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          menu_icon: string | null
          menu_label: string | null
          menu_order: number | null
          module_key: string
          permissions_required: string[] | null
          props_config: Json | null
          route_path: string | null
          updated_at: string | null
        }
        Insert: {
          admin_section_key?: string | null
          component_name: string
          component_path: string
          component_type?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          menu_icon?: string | null
          menu_label?: string | null
          menu_order?: number | null
          module_key: string
          permissions_required?: string[] | null
          props_config?: Json | null
          route_path?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_section_key?: string | null
          component_name?: string
          component_path?: string
          component_type?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          menu_icon?: string | null
          menu_label?: string | null
          menu_order?: number | null
          module_key?: string
          permissions_required?: string[] | null
          props_config?: Json | null
          route_path?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      module_translations: {
        Row: {
          ai_generated: boolean
          created_at: string
          id: string
          is_verified: boolean
          locale: string
          module_id: string
          namespace: string
          translation_key: string
          translation_value: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_generated?: boolean
          created_at?: string
          id?: string
          is_verified?: boolean
          locale: string
          module_id: string
          namespace?: string
          translation_key: string
          translation_value: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_generated?: boolean
          created_at?: string
          id?: string
          is_verified?: boolean
          locale?: string
          module_id?: string
          namespace?: string
          translation_key?: string
          translation_value?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_translations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_translations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_trials: {
        Row: {
          converted_at: string | null
          converted_to_purchase: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          module_key: string
          organization_id: string | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          converted_at?: string | null
          converted_to_purchase?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          module_key: string
          organization_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          converted_at?: string | null
          converted_to_purchase?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          module_key?: string
          organization_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_trials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      monte_carlo_simulations: {
        Row: {
          base_arr: number | null
          base_mrr: number | null
          best_case: number | null
          confidence_interval_95_high: number | null
          confidence_interval_95_low: number | null
          created_at: string
          created_by: string | null
          distribution_data: Json | null
          id: string
          input_parameters: Json
          key_risk_factors: Json | null
          mean_outcome: number | null
          num_iterations: number
          percentile_10: number | null
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          probability_of_target: number | null
          results_summary: Json
          sensitivity_analysis: Json | null
          simulation_date: string
          simulation_name: string
          simulation_type: string
          std_deviation: number | null
          target_value: number | null
          time_horizon_months: number
          worst_case: number | null
        }
        Insert: {
          base_arr?: number | null
          base_mrr?: number | null
          best_case?: number | null
          confidence_interval_95_high?: number | null
          confidence_interval_95_low?: number | null
          created_at?: string
          created_by?: string | null
          distribution_data?: Json | null
          id?: string
          input_parameters?: Json
          key_risk_factors?: Json | null
          mean_outcome?: number | null
          num_iterations?: number
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          probability_of_target?: number | null
          results_summary?: Json
          sensitivity_analysis?: Json | null
          simulation_date?: string
          simulation_name: string
          simulation_type: string
          std_deviation?: number | null
          target_value?: number | null
          time_horizon_months?: number
          worst_case?: number | null
        }
        Update: {
          base_arr?: number | null
          base_mrr?: number | null
          best_case?: number | null
          confidence_interval_95_high?: number | null
          confidence_interval_95_low?: number | null
          created_at?: string
          created_by?: string | null
          distribution_data?: Json | null
          id?: string
          input_parameters?: Json
          key_risk_factors?: Json | null
          mean_outcome?: number | null
          num_iterations?: number
          percentile_10?: number | null
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          probability_of_target?: number | null
          results_summary?: Json
          sensitivity_analysis?: Json | null
          simulation_date?: string
          simulation_name?: string
          simulation_type?: string
          std_deviation?: number | null
          target_value?: number | null
          time_horizon_months?: number
          worst_case?: number | null
        }
        Relationships: []
      }
      mrr_snapshots: {
        Row: {
          arpu: number | null
          churned_customers: number | null
          churned_mrr: number | null
          contraction_customers: number | null
          contraction_mrr: number | null
          created_at: string | null
          customer_count: number | null
          expansion_customers: number | null
          expansion_mrr: number | null
          grr_percentage: number | null
          id: string
          net_mrr_change: number | null
          new_customers: number | null
          new_mrr: number | null
          nrr_percentage: number | null
          quick_ratio: number | null
          reactivation_mrr: number | null
          segment_breakdown: Json | null
          snapshot_date: string
          total_arr: number
          total_mrr: number
        }
        Insert: {
          arpu?: number | null
          churned_customers?: number | null
          churned_mrr?: number | null
          contraction_customers?: number | null
          contraction_mrr?: number | null
          created_at?: string | null
          customer_count?: number | null
          expansion_customers?: number | null
          expansion_mrr?: number | null
          grr_percentage?: number | null
          id?: string
          net_mrr_change?: number | null
          new_customers?: number | null
          new_mrr?: number | null
          nrr_percentage?: number | null
          quick_ratio?: number | null
          reactivation_mrr?: number | null
          segment_breakdown?: Json | null
          snapshot_date: string
          total_arr?: number
          total_mrr?: number
        }
        Update: {
          arpu?: number | null
          churned_customers?: number | null
          churned_mrr?: number | null
          contraction_customers?: number | null
          contraction_mrr?: number | null
          created_at?: string | null
          customer_count?: number | null
          expansion_customers?: number | null
          expansion_mrr?: number | null
          grr_percentage?: number | null
          id?: string
          net_mrr_change?: number | null
          new_customers?: number | null
          new_mrr?: number | null
          nrr_percentage?: number | null
          quick_ratio?: number | null
          reactivation_mrr?: number | null
          segment_breakdown?: Json | null
          snapshot_date?: string
          total_arr?: number
          total_mrr?: number
        }
        Relationships: []
      }
      nba_action_types: {
        Row: {
          action_category: string
          action_code: string
          action_description: string | null
          action_name: string
          created_at: string | null
          effort_level: string | null
          estimated_mrr_impact: number | null
          execution_config: Json | null
          execution_type: string
          id: string
          is_active: boolean | null
          priority_weight: number | null
          target_roles: string[]
          updated_at: string | null
        }
        Insert: {
          action_category: string
          action_code: string
          action_description?: string | null
          action_name: string
          created_at?: string | null
          effort_level?: string | null
          estimated_mrr_impact?: number | null
          execution_config?: Json | null
          execution_type: string
          id?: string
          is_active?: boolean | null
          priority_weight?: number | null
          target_roles: string[]
          updated_at?: string | null
        }
        Update: {
          action_category?: string
          action_code?: string
          action_description?: string | null
          action_name?: string
          created_at?: string | null
          effort_level?: string | null
          estimated_mrr_impact?: number | null
          execution_config?: Json | null
          execution_type?: string
          id?: string
          is_active?: boolean | null
          priority_weight?: number | null
          target_roles?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      nba_queue: {
        Row: {
          action_type_id: string | null
          ai_reasoning: string | null
          context_data: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          estimated_value: number | null
          executed_at: string | null
          executed_by: string | null
          execution_result: Json | null
          expires_at: string | null
          id: string
          mrr_impact_actual: number | null
          priority: number | null
          score: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type_id?: string | null
          ai_reasoning?: string | null
          context_data?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          estimated_value?: number | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at?: string | null
          id?: string
          mrr_impact_actual?: number | null
          priority?: number | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type_id?: string | null
          ai_reasoning?: string | null
          context_data?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          estimated_value?: number | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at?: string | null
          id?: string
          mrr_impact_actual?: number | null
          priority?: number | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nba_queue_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "nba_action_types"
            referencedColumns: ["id"]
          },
        ]
      }
      news_admin_config: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      news_alert_log: {
        Row: {
          article_id: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_content: string | null
          read_at: string | null
          recipient: string
          sent_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string | null
          read_at?: string | null
          recipient: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string | null
          read_at?: string | null
          recipient?: string
          sent_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_alert_log_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_alert_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          ai_summary: string | null
          archive_reason: string | null
          category: string
          content: string | null
          created_at: string
          detected_trends: string[] | null
          excerpt: string | null
          fetched_at: string
          id: string
          image_credit: string | null
          image_url: string | null
          importance_level: string | null
          improvement_status: string | null
          improvement_suggestions: string | null
          is_archived: boolean | null
          is_featured: boolean | null
          product_connection: string | null
          product_relevance_reason: string | null
          published_at: string
          read_count: number | null
          relevance_score: number | null
          slug: string
          source_name: string
          source_url: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          archive_reason?: string | null
          category?: string
          content?: string | null
          created_at?: string
          detected_trends?: string[] | null
          excerpt?: string | null
          fetched_at?: string
          id?: string
          image_credit?: string | null
          image_url?: string | null
          importance_level?: string | null
          improvement_status?: string | null
          improvement_suggestions?: string | null
          is_archived?: boolean | null
          is_featured?: boolean | null
          product_connection?: string | null
          product_relevance_reason?: string | null
          published_at?: string
          read_count?: number | null
          relevance_score?: number | null
          slug: string
          source_name: string
          source_url: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          archive_reason?: string | null
          category?: string
          content?: string | null
          created_at?: string
          detected_trends?: string[] | null
          excerpt?: string | null
          fetched_at?: string
          id?: string
          image_credit?: string | null
          image_url?: string | null
          importance_level?: string | null
          improvement_status?: string | null
          improvement_suggestions?: string | null
          is_archived?: boolean | null
          is_featured?: boolean | null
          product_connection?: string | null
          product_relevance_reason?: string | null
          published_at?: string
          read_count?: number | null
          relevance_score?: number | null
          slug?: string
          source_name?: string
          source_url?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_audio_summaries: {
        Row: {
          articles_included: string[] | null
          audio_url: string | null
          created_at: string
          date: string
          duration_seconds: number | null
          error_message: string | null
          generated_at: string | null
          id: string
          language: string | null
          script: string | null
          status: string | null
          transcript: string | null
          updated_at: string
          voice_id: string | null
        }
        Insert: {
          articles_included?: string[] | null
          audio_url?: string | null
          created_at?: string
          date: string
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          language?: string | null
          script?: string | null
          status?: string | null
          transcript?: string | null
          updated_at?: string
          voice_id?: string | null
        }
        Update: {
          articles_included?: string[] | null
          audio_url?: string | null
          created_at?: string
          date?: string
          duration_seconds?: number | null
          error_message?: string | null
          generated_at?: string | null
          id?: string
          language?: string | null
          script?: string | null
          status?: string | null
          transcript?: string | null
          updated_at?: string
          voice_id?: string | null
        }
        Relationships: []
      }
      news_chat_conversations: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_chat_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "news_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "news_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news_commercial_opportunities: {
        Row: {
          action_items: Json | null
          article_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          company_id: string | null
          confidence_score: number | null
          converted_at: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          opportunity_type: string
          outcome_notes: string | null
          potential_value: number | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          article_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          company_id?: string | null
          confidence_score?: number | null
          converted_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          opportunity_type: string
          outcome_notes?: string | null
          potential_value?: number | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          article_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          company_id?: string | null
          confidence_score?: number | null
          converted_at?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          opportunity_type?: string
          outcome_notes?: string | null
          potential_value?: number | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_commercial_opportunities_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_commercial_opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_commercial_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      news_competitor_mentions: {
        Row: {
          article_id: string
          competitor_id: string
          detected_at: string
          id: string
          keyword_matched: string | null
          mention_context: string | null
          prominence: string | null
          sentiment: string | null
          sentiment_score: number | null
        }
        Insert: {
          article_id: string
          competitor_id: string
          detected_at?: string
          id?: string
          keyword_matched?: string | null
          mention_context?: string | null
          prominence?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
        }
        Update: {
          article_id?: string
          competitor_id?: string
          detected_at?: string
          id?: string
          keyword_matched?: string | null
          mention_context?: string | null
          prominence?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_competitor_mentions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_competitor_mentions_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "news_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      news_competitors: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          logo_url: string | null
          name: string
          updated_at: string
          website: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          logo_url?: string | null
          name: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          logo_url?: string | null
          name?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_competitors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_fetch_logs: {
        Row: {
          articles_fetched: number | null
          articles_processed: number | null
          articles_saved: number | null
          created_at: string | null
          duration_ms: number | null
          errors: string[] | null
          execution_time: string | null
          id: string
          sources_status: Json | null
          status: string | null
          warnings: string[] | null
        }
        Insert: {
          articles_fetched?: number | null
          articles_processed?: number | null
          articles_saved?: number | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: string[] | null
          execution_time?: string | null
          id?: string
          sources_status?: Json | null
          status?: string | null
          warnings?: string[] | null
        }
        Update: {
          articles_fetched?: number | null
          articles_processed?: number | null
          articles_saved?: number | null
          created_at?: string | null
          duration_ms?: number | null
          errors?: string[] | null
          execution_time?: string | null
          id?: string
          sources_status?: Json | null
          status?: string | null
          warnings?: string[] | null
        }
        Relationships: []
      }
      news_improvement_insights: {
        Row: {
          ai_recommendation: string | null
          created_at: string | null
          description: string | null
          detected_from_trends: string[] | null
          id: string
          insight_type: string
          news_article_id: string | null
          priority: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_recommendation?: string | null
          created_at?: string | null
          description?: string | null
          detected_from_trends?: string[] | null
          id?: string
          insight_type: string
          news_article_id?: string | null
          priority?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_recommendation?: string | null
          created_at?: string | null
          description?: string | null
          detected_from_trends?: string[] | null
          id?: string
          insight_type?: string
          news_article_id?: string | null
          priority?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_improvement_insights_news_article_id_fkey"
            columns: ["news_article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_lead_links: {
        Row: {
          article_id: string
          company_id: string | null
          id: string
          link_type: string | null
          linked_at: string
          linked_by: string | null
          relevance_reason: string | null
          relevance_score: number | null
        }
        Insert: {
          article_id: string
          company_id?: string | null
          id?: string
          link_type?: string | null
          linked_at?: string
          linked_by?: string | null
          relevance_reason?: string | null
          relevance_score?: number | null
        }
        Update: {
          article_id?: string
          company_id?: string | null
          id?: string
          link_type?: string | null
          linked_at?: string
          linked_by?: string | null
          relevance_reason?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "news_lead_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_lead_links_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_lead_links_linked_by_fkey"
            columns: ["linked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sources: {
        Row: {
          articles_fetched: number | null
          articles_relevant: number | null
          category: string
          created_at: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_fetch_at: string | null
          name: string
          updated_at: string | null
          url: string
        }
        Insert: {
          articles_fetched?: number | null
          articles_relevant?: number | null
          category: string
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_fetch_at?: string | null
          name: string
          updated_at?: string | null
          url: string
        }
        Update: {
          articles_fetched?: number | null
          articles_relevant?: number | null
          category?: string
          created_at?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_fetch_at?: string | null
          name?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      news_trend_history: {
        Row: {
          article_ids: string[] | null
          avg_sentiment: number | null
          created_at: string
          date: string
          id: string
          mention_count: number
          trend_name: string
        }
        Insert: {
          article_ids?: string[] | null
          avg_sentiment?: number | null
          created_at?: string
          date: string
          id?: string
          mention_count?: number
          trend_name: string
        }
        Update: {
          article_ids?: string[] | null
          avg_sentiment?: number | null
          created_at?: string
          date?: string
          id?: string
          mention_count?: number
          trend_name?: string
        }
        Relationships: []
      }
      news_trend_predictions: {
        Row: {
          analysis_date: string
          analysis_factors: Json | null
          confidence_score: number | null
          created_at: string
          current_mentions: number | null
          id: string
          peak_prediction_date: string | null
          predicted_growth: number | null
          status: string | null
          supporting_articles: string[] | null
          trend_category: string | null
          trend_name: string
          updated_at: string
          velocity_score: number | null
        }
        Insert: {
          analysis_date?: string
          analysis_factors?: Json | null
          confidence_score?: number | null
          created_at?: string
          current_mentions?: number | null
          id?: string
          peak_prediction_date?: string | null
          predicted_growth?: number | null
          status?: string | null
          supporting_articles?: string[] | null
          trend_category?: string | null
          trend_name: string
          updated_at?: string
          velocity_score?: number | null
        }
        Update: {
          analysis_date?: string
          analysis_factors?: Json | null
          confidence_score?: number | null
          created_at?: string
          current_mentions?: number | null
          id?: string
          peak_prediction_date?: string | null
          predicted_growth?: number | null
          status?: string | null
          supporting_articles?: string[] | null
          trend_category?: string | null
          trend_name?: string
          updated_at?: string
          velocity_score?: number | null
        }
        Relationships: []
      }
      news_weekly_reports: {
        Row: {
          created_at: string | null
          detected_trends: Json | null
          id: string
          improvement_proposals: Json | null
          report_data: Json
          sent_at: string | null
          sent_to_emails: string[] | null
          statistics: Json | null
          summary: string | null
          top_news: Json | null
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          detected_trends?: Json | null
          id?: string
          improvement_proposals?: Json | null
          report_data?: Json
          sent_at?: string | null
          sent_to_emails?: string[] | null
          statistics?: Json | null
          summary?: string | null
          top_news?: Json | null
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          detected_trends?: Json | null
          id?: string
          improvement_proposals?: Json | null
          report_data?: Json
          sent_at?: string | null
          sent_to_emails?: string[] | null
          statistics?: Json | null
          summary?: string | null
          top_news?: Json | null
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      notification_channels: {
        Row: {
          channel_name: string
          channel_type: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          channel_name: string
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          channel_name?: string
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          alert_type: string
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          min_severity: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_severity?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_severity?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          channel_id: string
          created_at: string | null
          delivery_methods: string[] | null
          filters: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          delivery_methods?: string[] | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          delivery_methods?: string[] | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_webhooks: {
        Row: {
          channel_id: string | null
          created_at: string | null
          created_by: string | null
          events: string[] | null
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          retry_config: Json | null
          secret_key: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_webhooks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          alert_id: string | null
          channel_id: string | null
          created_at: string | null
          delivery_status: Json | null
          event_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          metric_value: number | null
          priority: number | null
          severity: string
          source_system: string | null
          threshold_value: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          alert_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          metric_value?: number | null
          priority?: number | null
          severity: string
          source_system?: string | null
          threshold_value?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          alert_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          metric_value?: number | null
          priority?: number | null
          severity?: string
          source_system?: string | null
          threshold_value?: number | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      nps_metrics: {
        Row: {
          avg_ces: number | null
          avg_csat: number | null
          avg_sentiment: number | null
          company_id: string | null
          created_at: string | null
          detractors: number | null
          gestor_id: string | null
          id: string
          nps_score: number | null
          passives: number | null
          period_end: string
          period_start: string
          period_type: string | null
          product_id: string | null
          promoters: number | null
          segment: string | null
          total_responses: number | null
          trend_vs_previous: number | null
          updated_at: string | null
        }
        Insert: {
          avg_ces?: number | null
          avg_csat?: number | null
          avg_sentiment?: number | null
          company_id?: string | null
          created_at?: string | null
          detractors?: number | null
          gestor_id?: string | null
          id?: string
          nps_score?: number | null
          passives?: number | null
          period_end: string
          period_start: string
          period_type?: string | null
          product_id?: string | null
          promoters?: number | null
          segment?: string | null
          total_responses?: number | null
          trend_vs_previous?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_ces?: number | null
          avg_csat?: number | null
          avg_sentiment?: number | null
          company_id?: string | null
          created_at?: string | null
          detractors?: number | null
          gestor_id?: string | null
          id?: string
          nps_score?: number | null
          passives?: number | null
          period_end?: string
          period_start?: string
          period_type?: string | null
          product_id?: string | null
          promoters?: number | null
          segment?: string | null
          total_responses?: number | null
          trend_vs_previous?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nps_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      obelixia_content: {
        Row: {
          content: string
          content_key: string
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          content: string
          content_key: string
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          content_key?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      obelixia_invoices: {
        Row: {
          cover_letter: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_company: string | null
          customer_email: string
          customer_name: string | null
          customer_tax_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          quote_id: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_company?: string | null
          customer_email: string
          customer_name?: string | null
          customer_tax_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_company?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obelixia_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      obelixia_module_pricing: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_discount: number | null
          module_key: string
          module_name: string
          monthly_divisor: number | null
          perpetual_multiplier: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_discount?: number | null
          module_key: string
          module_name: string
          monthly_divisor?: number | null
          perpetual_multiplier?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_discount?: number | null
          module_key?: string
          module_name?: string
          monthly_divisor?: number | null
          perpetual_multiplier?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      omnichannel_messages: {
        Row: {
          channel: string
          clicked_at: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          cost: number | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          engagement_data: Json | null
          external_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          journey_id: string | null
          journey_step_id: string | null
          message_type: string | null
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string | null
          template_id: string | null
          template_variables: Json | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          engagement_data?: Json | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          engagement_data?: Json | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omnichannel_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      omnichannel_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          category: string | null
          channel: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_text: string | null
          stats: Json | null
          subject: string | null
          updated_at: string | null
          variables: string[] | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category?: string | null
          channel: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_text?: string | null
          stats?: Json | null
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_text?: string | null
          stats?: Json | null
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          actual_time_spent_minutes: number | null
          assigned_to: string | null
          badges_earned: string[] | null
          celebration_triggered: boolean | null
          company_id: string | null
          completed_at: string | null
          completed_steps: Json | null
          created_at: string | null
          current_step_id: string | null
          estimated_completion_date: string | null
          id: string
          last_activity_at: string | null
          progress_percentage: number | null
          skipped_steps: string[] | null
          stall_reason: string | null
          stalled_at: string | null
          started_at: string | null
          status: string | null
          template_id: string | null
          total_points_earned: number | null
          updated_at: string | null
        }
        Insert: {
          actual_time_spent_minutes?: number | null
          assigned_to?: string | null
          badges_earned?: string[] | null
          celebration_triggered?: boolean | null
          company_id?: string | null
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          skipped_steps?: string[] | null
          stall_reason?: string | null
          stalled_at?: string | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          total_points_earned?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_time_spent_minutes?: number | null
          assigned_to?: string | null
          badges_earned?: string[] | null
          celebration_triggered?: boolean | null
          company_id?: string | null
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step_id?: string | null
          estimated_completion_date?: string | null
          id?: string
          last_activity_at?: string | null
          progress_percentage?: number | null
          skipped_steps?: string[] | null
          stall_reason?: string | null
          stalled_at?: string | null
          started_at?: string | null
          status?: string | null
          template_id?: string | null
          total_points_earned?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_total_minutes: number | null
          gamification_config: Json | null
          id: string
          is_active: boolean | null
          product_keys: string[] | null
          segment_type: string
          steps: Json
          template_name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_total_minutes?: number | null
          gamification_config?: Json | null
          id?: string
          is_active?: boolean | null
          product_keys?: string[] | null
          segment_type: string
          steps?: Json
          template_name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_total_minutes?: number | null
          gamification_config?: Json | null
          id?: string
          is_active?: boolean | null
          product_keys?: string[] | null
          segment_type?: string
          steps?: Json
          template_name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      open_banking_audit_log: {
        Row: {
          consent_id: string | null
          created_at: string
          endpoint: string
          id: string
          interaction_id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_status: number | null
          tpp_id: string
          user_id: string | null
        }
        Insert: {
          consent_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          interaction_id: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          tpp_id: string
          user_id?: string | null
        }
        Update: {
          consent_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          interaction_id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          tpp_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      open_banking_consents: {
        Row: {
          authorized_at: string | null
          consent_id: string
          created_at: string
          expiration_date: string
          frequency_per_day: number | null
          id: string
          last_action_date: string | null
          permissions: string[]
          recurring_indicator: boolean | null
          revoked_at: string | null
          sca_status: string | null
          status: string
          tpp_id: string
          transaction_from_date: string | null
          transaction_to_date: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          authorized_at?: string | null
          consent_id: string
          created_at?: string
          expiration_date: string
          frequency_per_day?: number | null
          id?: string
          last_action_date?: string | null
          permissions?: string[]
          recurring_indicator?: boolean | null
          revoked_at?: string | null
          sca_status?: string | null
          status?: string
          tpp_id: string
          transaction_from_date?: string | null
          transaction_to_date?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          authorized_at?: string | null
          consent_id?: string
          created_at?: string
          expiration_date?: string
          frequency_per_day?: number | null
          id?: string
          last_action_date?: string | null
          permissions?: string[]
          recurring_indicator?: boolean | null
          revoked_at?: string | null
          sca_status?: string | null
          status?: string
          tpp_id?: string
          transaction_from_date?: string | null
          transaction_to_date?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_banking_consents_tpp_id_fkey"
            columns: ["tpp_id"]
            isOneToOne: false
            referencedRelation: "registered_tpps"
            referencedColumns: ["tpp_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          actual_close_date: string | null
          company_id: string
          contact_id: string | null
          created_at: string | null
          description: string | null
          estimated_close_date: string | null
          estimated_value: number | null
          id: string
          lost_reason: string | null
          notes: string | null
          owner_id: string | null
          probability: number | null
          products: Json | null
          stage: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          products?: Json | null
          stage?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          products?: Json | null
          stage?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_compliance_documents: {
        Row: {
          acknowledgment_deadline: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          effective_date: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          is_mandatory: boolean | null
          metadata: Json | null
          organization_id: string | null
          parent_document_id: string | null
          regulation_source: string | null
          renewal_frequency: string | null
          requires_acknowledgment: boolean | null
          sector: string | null
          sector_key: string | null
          status: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          acknowledgment_deadline?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          effective_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          parent_document_id?: string | null
          regulation_source?: string | null
          renewal_frequency?: string | null
          requires_acknowledgment?: boolean | null
          sector?: string | null
          sector_key?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          acknowledgment_deadline?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          effective_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          parent_document_id?: string | null
          regulation_source?: string | null
          renewal_frequency?: string | null
          requires_acknowledgment?: boolean | null
          sector?: string | null
          sector_key?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_compliance_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_compliance_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_address: Json | null
          billing_email: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          logo_url: string | null
          max_users: number | null
          name: string
          settings: Json | null
          slug: string
          stripe_customer_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          billing_email?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name: string
          settings?: Json | null
          slug: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          billing_email?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          logo_url?: string | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          api_scopes: string[] | null
          app_key: string
          app_name: string
          banner_url: string | null
          billing_period: string | null
          category: string
          changelog: Json | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          icon_url: string | null
          id: string
          install_count: number | null
          is_certified: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          min_plan: string | null
          partner_company_id: string | null
          price_amount: number | null
          price_currency: string | null
          price_type: string | null
          privacy_policy_url: string | null
          rating_average: number | null
          rating_count: number | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshots: Json | null
          short_description: string | null
          status: string | null
          subcategory: string | null
          submitted_at: string | null
          support_url: string | null
          tags: string[] | null
          terms_url: string | null
          trial_days: number | null
          updated_at: string | null
          version: string | null
          video_url: string | null
          webhook_url: string | null
        }
        Insert: {
          api_scopes?: string[] | null
          app_key: string
          app_name: string
          banner_url?: string | null
          billing_period?: string | null
          category: string
          changelog?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          install_count?: number | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          min_plan?: string | null
          partner_company_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          privacy_policy_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: Json | null
          short_description?: string | null
          status?: string | null
          subcategory?: string | null
          submitted_at?: string | null
          support_url?: string | null
          tags?: string[] | null
          terms_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_scopes?: string[] | null
          app_key?: string
          app_name?: string
          banner_url?: string | null
          billing_period?: string | null
          category?: string
          changelog?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          install_count?: number | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          min_plan?: string | null
          partner_company_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          privacy_policy_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: Json | null
          short_description?: string | null
          status?: string | null
          subcategory?: string | null
          submitted_at?: string | null
          support_url?: string | null
          tags?: string[] | null
          terms_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_companies: {
        Row: {
          approved_by: string | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          contract_expires_at: string | null
          contract_signed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          joined_at: string | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          partner_tier: string | null
          revenue_share_percent: number | null
          status: string | null
          tax_id: string | null
          total_installations: number | null
          total_revenue: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          approved_by?: string | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          joined_at?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          partner_tier?: string | null
          revenue_share_percent?: number | null
          status?: string | null
          tax_id?: string | null
          total_installations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          approved_by?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          joined_at?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          partner_tier?: string | null
          revenue_share_percent?: number | null
          status?: string | null
          tax_id?: string | null
          total_installations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_revenue_transactions: {
        Row: {
          application_id: string | null
          created_at: string | null
          currency: string | null
          external_transaction_id: string | null
          gross_amount: number
          id: string
          installation_id: string | null
          invoice_url: string | null
          metadata: Json | null
          organization_id: string | null
          paid_at: string | null
          partner_amount: number
          partner_company_id: string | null
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          platform_fee: number
          status: string | null
          transaction_type: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_transaction_id?: string | null
          gross_amount: number
          id?: string
          installation_id?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          partner_amount: number
          partner_company_id?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee: number
          status?: string | null
          transaction_type: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_transaction_id?: string | null
          gross_amount?: number
          id?: string
          installation_id?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          partner_amount?: number
          partner_company_id?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_revenue_transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_revenue_transactions_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "marketplace_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_revenue_transactions_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          partner_company_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          partner_company_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          partner_company_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_response_body: string | null
          last_response_code: number | null
          last_triggered_at: string | null
          partner_company_id: string | null
          secret_hash: string
          success_count: number | null
          updated_at: string | null
          webhook_name: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_body?: string | null
          last_response_code?: number | null
          last_triggered_at?: string | null
          partner_company_id?: string | null
          secret_hash: string
          success_count?: number | null
          updated_at?: string | null
          webhook_name: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_body?: string | null
          last_response_code?: number | null
          last_triggered_at?: string | null
          partner_company_id?: string | null
          secret_hash?: string
          success_count?: number | null
          updated_at?: string | null
          webhook_name?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_webhooks_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_value: number
          alert_type: string
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          metric_name: string
          severity: string | null
          threshold_value: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value: number
          alert_type: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          metric_name: string
          severity?: string | null
          threshold_value: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number
          alert_type?: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          metric_name?: string
          severity?: string | null
          threshold_value?: number
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string
          delta: number | null
          device_type: string | null
          id: string
          metadata: Json | null
          metric_name: string
          page_path: string | null
          rating: string | null
          session_id: string | null
          url: string | null
          user_agent: string | null
          value: number
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          delta?: number | null
          device_type?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          page_path?: string | null
          rating?: string | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          value: number
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          delta?: number | null
          device_type?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          page_path?: string | null
          rating?: string | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          value?: number
        }
        Relationships: []
      }
      performance_metrics_history: {
        Row: {
          cls: number | null
          connection_type: string | null
          device_type: string | null
          fcp: number | null
          fid: number | null
          id: string
          inp: number | null
          lcp: number | null
          page_path: string | null
          page_url: string
          recorded_at: string | null
          ttfb: number | null
          user_agent: string | null
        }
        Insert: {
          cls?: number | null
          connection_type?: string | null
          device_type?: string | null
          fcp?: number | null
          fid?: number | null
          id?: string
          inp?: number | null
          lcp?: number | null
          page_path?: string | null
          page_url: string
          recorded_at?: string | null
          ttfb?: number | null
          user_agent?: string | null
        }
        Update: {
          cls?: number | null
          connection_type?: string | null
          device_type?: string | null
          fcp?: number | null
          fid?: number | null
          id?: string
          inp?: number | null
          lcp?: number | null
          page_path?: string | null
          page_url?: string
          recorded_at?: string | null
          ttfb?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      personalized_news_scores: {
        Row: {
          article_id: string
          calculated_at: string
          company_id: string
          id: string
          impact_factors: Json | null
          personalized_score: number
          relevance_reasons: string[] | null
        }
        Insert: {
          article_id: string
          calculated_at?: string
          company_id: string
          id?: string
          impact_factors?: Json | null
          personalized_score: number
          relevance_reasons?: string[] | null
        }
        Update: {
          article_id?: string
          calculated_at?: string
          company_id?: string
          id?: string
          impact_factors?: Json | null
          personalized_score?: number
          relevance_reasons?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "personalized_news_scores_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalized_news_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_snapshots: {
        Row: {
          avg_deal_age_days: number | null
          avg_deal_value: number | null
          by_stage: Json | null
          conversion_rate: number | null
          created_at: string
          gestor_id: string | null
          health_score: number | null
          id: string
          office: string | null
          snapshot_date: string
          total_opportunities: number | null
          total_value: number | null
          velocity_score: number | null
          win_rate: number | null
        }
        Insert: {
          avg_deal_age_days?: number | null
          avg_deal_value?: number | null
          by_stage?: Json | null
          conversion_rate?: number | null
          created_at?: string
          gestor_id?: string | null
          health_score?: number | null
          id?: string
          office?: string | null
          snapshot_date?: string
          total_opportunities?: number | null
          total_value?: number | null
          velocity_score?: number | null
          win_rate?: number | null
        }
        Update: {
          avg_deal_age_days?: number | null
          avg_deal_value?: number | null
          by_stage?: Json | null
          conversion_rate?: number | null
          created_at?: string
          gestor_id?: string | null
          health_score?: number | null
          id?: string
          office?: string | null
          snapshot_date?: string
          total_opportunities?: number | null
          total_value?: number | null
          velocity_score?: number | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_snapshots_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_executions: {
        Row: {
          ai_recommendations: Json | null
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          current_step: number | null
          id: string
          outcome: string | null
          outcome_notes: string | null
          playbook_id: string | null
          started_at: string | null
          status: string | null
          trigger_reason: string | null
          triggered_by: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          ai_recommendations?: Json | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          playbook_id?: string | null
          started_at?: string | null
          status?: string | null
          trigger_reason?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          ai_recommendations?: Json | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          outcome?: string | null
          outcome_notes?: string | null
          playbook_id?: string | null
          started_at?: string | null
          status?: string | null
          trigger_reason?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_executions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_executions_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "retention_playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_executions_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_step_executions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          execution_id: string | null
          id: string
          notes: string | null
          result_data: Json | null
          started_at: string | null
          status: string | null
          step_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          notes?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
          step_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          notes?: string | null
          result_data?: Json | null
          started_at?: string | null
          status?: string | null
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_step_executions_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_executions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "playbook_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "playbook_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_steps: {
        Row: {
          action_config: Json | null
          condition_logic: Json | null
          created_at: string | null
          description: string | null
          id: string
          playbook_id: string | null
          required: boolean | null
          step_number: number
          step_type: string
          title: string
          wait_days: number | null
        }
        Insert: {
          action_config?: Json | null
          condition_logic?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          playbook_id?: string | null
          required?: boolean | null
          step_number: number
          step_type: string
          title: string
          wait_days?: number | null
        }
        Update: {
          action_config?: Json | null
          condition_logic?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          playbook_id?: string | null
          required?: boolean | null
          step_number?: number
          step_type?: string
          title?: string
          wait_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_steps_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "retention_playbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      plg_signals: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          company_id: string | null
          context: Json | null
          converted_to_opportunity: boolean | null
          created_at: string
          detected_at: string
          expansion_opportunity_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          metric_change_percentage: number | null
          metric_name: string | null
          metric_previous_value: number | null
          metric_value: number | null
          opportunity_id: string | null
          recommended_action: string | null
          signal_date: string
          signal_strength: number
          signal_type: string
          threshold_exceeded: number | null
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          company_id?: string | null
          context?: Json | null
          converted_to_opportunity?: boolean | null
          created_at?: string
          detected_at?: string
          expansion_opportunity_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_change_percentage?: number | null
          metric_name?: string | null
          metric_previous_value?: number | null
          metric_value?: number | null
          opportunity_id?: string | null
          recommended_action?: string | null
          signal_date?: string
          signal_strength: number
          signal_type: string
          threshold_exceeded?: number | null
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          company_id?: string | null
          context?: Json | null
          converted_to_opportunity?: boolean | null
          created_at?: string
          detected_at?: string
          expansion_opportunity_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_change_percentage?: number | null
          metric_name?: string | null
          metric_previous_value?: number | null
          metric_value?: number | null
          opportunity_id?: string | null
          recommended_action?: string | null
          signal_date?: string
          signal_strength?: number
          signal_type?: string
          threshold_exceeded?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plg_signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_permissions: {
        Row: {
          application_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          is_sensitive: boolean | null
          permission_key: string
          permission_name: string
          requires_approval: boolean | null
        }
        Insert: {
          application_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          permission_key: string
          permission_name: string
          requires_approval?: boolean | null
        }
        Update: {
          application_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          permission_key?: string
          permission_name?: string
          requires_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_permissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      predicted_nps: {
        Row: {
          actual_nps: number | null
          behavioral_signals: Json | null
          company_id: string
          confidence_level: number
          contact_id: string | null
          created_at: string
          id: string
          predicted_score: number
          prediction_accuracy: number | null
          prediction_date: string
          prediction_model: string
          updated_at: string
          valid_until: string
          validated_at: string | null
        }
        Insert: {
          actual_nps?: number | null
          behavioral_signals?: Json | null
          company_id: string
          confidence_level: number
          contact_id?: string | null
          created_at?: string
          id?: string
          predicted_score: number
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_model?: string
          updated_at?: string
          valid_until?: string
          validated_at?: string | null
        }
        Update: {
          actual_nps?: number | null
          behavioral_signals?: Json | null
          company_id?: string
          confidence_level?: number
          contact_id?: string | null
          created_at?: string
          id?: string
          predicted_score?: number
          prediction_accuracy?: number | null
          prediction_date?: string
          prediction_model?: string
          updated_at?: string
          valid_until?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predicted_nps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predicted_nps_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_api_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          price_monthly: number | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          tier_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_monthly?: number | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          tier_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_monthly?: number | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          tier_name?: string
        }
        Relationships: []
      }
      premium_integrations: {
        Row: {
          category: string
          certification_expires_at: string | null
          certification_level: string | null
          certified_at: string | null
          certified_by: string | null
          config_schema: Json | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          features: Json | null
          id: string
          install_count: number | null
          integration_key: string
          integration_name: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          partner_company_id: string | null
          pricing_info: Json | null
          provider: string
          required_secrets: string[] | null
          setup_guide_url: string | null
          supported_regions: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          certification_expires_at?: string | null
          certification_level?: string | null
          certified_at?: string | null
          certified_by?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          install_count?: number | null
          integration_key: string
          integration_name: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          partner_company_id?: string | null
          pricing_info?: Json | null
          provider: string
          required_secrets?: string[] | null
          setup_guide_url?: string | null
          supported_regions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          certification_expires_at?: string | null
          certification_level?: string | null
          certified_at?: string | null
          certified_by?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          install_count?: number | null
          integration_key?: string
          integration_name?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          partner_company_id?: string | null
          pricing_info?: Json | null
          provider?: string
          required_secrets?: string[] | null
          setup_guide_url?: string | null
          supported_regions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_integrations_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_addons: {
        Row: {
          addon_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          addon_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          addon_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          base_price: number
          billing_period: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_companies: number | null
          max_users: number | null
          name: string
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          tier_key: string | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          billing_period?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_companies?: number | null
          max_users?: number | null
          name: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier_key?: string | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          billing_period?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_companies?: number | null
          max_users?: number | null
          name?: string
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tier_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      process_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          duration_ms: number | null
          entity_id: string
          entity_type: string
          from_state: string | null
          id: string
          metadata: Json | null
          node_id: string | null
          occurred_at: string
          process_definition_id: string | null
          process_instance_id: string | null
          tenant_id: string | null
          to_state: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          duration_ms?: number | null
          entity_id: string
          entity_type: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          occurred_at?: string
          process_definition_id?: string | null
          process_instance_id?: string | null
          tenant_id?: string | null
          to_state?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string
          entity_type?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          occurred_at?: string
          process_definition_id?: string | null
          process_instance_id?: string | null
          tenant_id?: string | null
          to_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      process_mining_snapshots: {
        Row: {
          analysis_results: Json
          created_at: string
          created_by: string | null
          date_from: string | null
          date_to: string | null
          description: string | null
          entity_type: string | null
          id: string
          name: string
          process_definition_id: string | null
        }
        Insert: {
          analysis_results?: Json
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name: string
          process_definition_id?: string | null
        }
        Update: {
          analysis_results?: Json
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name?: string
          process_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_mining_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_mining_snapshots_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_sla_violations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_duration: unknown
          created_at: string
          escalated_to: string[] | null
          escalation_level: number | null
          exceeded_by: unknown
          exceeded_percentage: number | null
          expected_duration: unknown
          id: string
          instance_id: string
          node_id: string
          node_name: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          process_definition_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          violation_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_duration?: unknown
          created_at?: string
          escalated_to?: string[] | null
          escalation_level?: number | null
          exceeded_by?: unknown
          exceeded_percentage?: number | null
          expected_duration?: unknown
          id?: string
          instance_id: string
          node_id: string
          node_name?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          process_definition_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          violation_type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_duration?: unknown
          created_at?: string
          escalated_to?: string[] | null
          escalation_level?: number | null
          exceeded_by?: unknown
          exceeded_percentage?: number | null
          expected_duration?: unknown
          id?: string
          instance_id?: string
          node_id?: string
          node_name?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          process_definition_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_sla_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gestor_number: string | null
          id: string
          oficina: string | null
          organization_id: string | null
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gestor_number?: string | null
          id: string
          oficina?: string | null
          organization_id?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gestor_number?: string | null
          id?: string
          oficina?: string | null
          organization_id?: string | null
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      provisional_balance_sheets: {
        Row: {
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          id: string
          intangible_assets: number | null
          inventory: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_provisions: number | null
          other_creditors: number | null
          provisional_statement_id: string
          real_estate_investments: number | null
          reserves: number | null
          retained_earnings: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_provisions: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          updated_at: string
        }
        Insert: {
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_provisions?: number | null
          other_creditors?: number | null
          provisional_statement_id: string
          real_estate_investments?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_provisions?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string
        }
        Update: {
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_provisions?: number | null
          other_creditors?: number | null
          provisional_statement_id?: string
          real_estate_investments?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_provisions?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_balance_sheets_provisional_statement_id_fkey"
            columns: ["provisional_statement_id"]
            isOneToOne: true
            referencedRelation: "provisional_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      provisional_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          fiscal_year: number
          id: string
          is_approved: boolean
          period_number: number
          period_type: Database["public"]["Enums"]["provisional_period_type"]
          source: Database["public"]["Enums"]["financial_data_source"]
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
          status: Database["public"]["Enums"]["financial_statement_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          id?: string
          is_approved?: boolean
          period_number?: number
          period_type?: Database["public"]["Enums"]["provisional_period_type"]
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          is_approved?: boolean
          period_number?: number
          period_type?: Database["public"]["Enums"]["provisional_period_type"]
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_financial_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provisional_income_statements: {
        Row: {
          capitalized_work: number | null
          corporate_tax: number | null
          created_at: string
          depreciation: number | null
          exchange_differences: number | null
          financial_expenses: number | null
          financial_income: number | null
          id: string
          impairment_financial_instruments: number | null
          impairment_trade_operations: number | null
          inventory_variation: number | null
          net_turnover: number | null
          operating_grants: number | null
          other_financial_results: number | null
          other_operating_expenses: number | null
          other_operating_income: number | null
          other_operating_results: number | null
          personnel_expenses: number | null
          provisional_statement_id: string
          supplies: number | null
          updated_at: string
        }
        Insert: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          provisional_statement_id: string
          supplies?: number | null
          updated_at?: string
        }
        Update: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          provisional_statement_id?: string
          supplies?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_income_statements_provisional_statement_id_fkey"
            columns: ["provisional_statement_id"]
            isOneToOne: true
            referencedRelation: "provisional_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_key?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_key?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      qbr_records: {
        Row: {
          achievements: Json | null
          action_items: Json | null
          actual_date: string | null
          agenda: Json | null
          ai_generated_recommendations: Json | null
          ai_generated_summary: string | null
          ai_risk_assessment: Json | null
          attendees: Json | null
          challenges: Json | null
          company_id: string | null
          conducted_by: string | null
          created_at: string | null
          customer_feedback: string | null
          customer_satisfaction_score: number | null
          decisions_made: Json | null
          duration_minutes: number | null
          expansion_opportunities: Json | null
          health_score_at_review: number | null
          id: string
          metrics_reviewed: Json | null
          next_quarter_goals: Json | null
          notes: string | null
          nps_at_review: number | null
          period_summary: Json | null
          prepared_by: string | null
          quarter: string
          recording_url: string | null
          renewal_discussion: Json | null
          scheduled_date: string | null
          status: string | null
          success_plan_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          achievements?: Json | null
          action_items?: Json | null
          actual_date?: string | null
          agenda?: Json | null
          ai_generated_recommendations?: Json | null
          ai_generated_summary?: string | null
          ai_risk_assessment?: Json | null
          attendees?: Json | null
          challenges?: Json | null
          company_id?: string | null
          conducted_by?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_satisfaction_score?: number | null
          decisions_made?: Json | null
          duration_minutes?: number | null
          expansion_opportunities?: Json | null
          health_score_at_review?: number | null
          id?: string
          metrics_reviewed?: Json | null
          next_quarter_goals?: Json | null
          notes?: string | null
          nps_at_review?: number | null
          period_summary?: Json | null
          prepared_by?: string | null
          quarter: string
          recording_url?: string | null
          renewal_discussion?: Json | null
          scheduled_date?: string | null
          status?: string | null
          success_plan_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          achievements?: Json | null
          action_items?: Json | null
          actual_date?: string | null
          agenda?: Json | null
          ai_generated_recommendations?: Json | null
          ai_generated_summary?: string | null
          ai_risk_assessment?: Json | null
          attendees?: Json | null
          challenges?: Json | null
          company_id?: string | null
          conducted_by?: string | null
          created_at?: string | null
          customer_feedback?: string | null
          customer_satisfaction_score?: number | null
          decisions_made?: Json | null
          duration_minutes?: number | null
          expansion_opportunities?: Json | null
          health_score_at_review?: number | null
          id?: string
          metrics_reviewed?: Json | null
          next_quarter_goals?: Json | null
          notes?: string | null
          nps_at_review?: number | null
          period_summary?: Json | null
          prepared_by?: string | null
          quarter?: string
          recording_url?: string | null
          renewal_discussion?: Json | null
          scheduled_date?: string | null
          status?: string | null
          success_plan_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "qbr_records_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qbr_records_success_plan_id_fkey"
            columns: ["success_plan_id"]
            isOneToOne: false
            referencedRelation: "success_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_proposals: {
        Row: {
          addons: Json | null
          base_price: number | null
          billing_cycle: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          discount_applied: number | null
          discount_percent: number | null
          id: string
          modules: Json
          notes: string | null
          pdf_url: string | null
          status: string | null
          total_price: number | null
          updated_at: string | null
          users_count: number
          valid_until: string | null
        }
        Insert: {
          addons?: Json | null
          base_price?: number | null
          billing_cycle?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_applied?: number | null
          discount_percent?: number | null
          id?: string
          modules?: Json
          notes?: string | null
          pdf_url?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          users_count?: number
          valid_until?: string | null
        }
        Update: {
          addons?: Json | null
          base_price?: number | null
          billing_cycle?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          discount_applied?: number | null
          discount_percent?: number | null
          id?: string
          modules?: Json
          notes?: string | null
          pdf_url?: string | null
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
          users_count?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      registered_tpps: {
        Row: {
          authorization_status: string
          authorized_at: string | null
          contact_email: string | null
          country_code: string | null
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string | null
          qsealc_certificate: string | null
          qwac_certificate: string | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          redirect_uris: string[]
          registration_number: string | null
          regulatory_authority: string | null
          services: string[]
          tpp_id: string
          tpp_name: string
          updated_at: string
        }
        Insert: {
          authorization_status?: string
          authorized_at?: string | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          qsealc_certificate?: string | null
          qwac_certificate?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          redirect_uris?: string[]
          registration_number?: string | null
          regulatory_authority?: string | null
          services?: string[]
          tpp_id: string
          tpp_name: string
          updated_at?: string
        }
        Update: {
          authorization_status?: string
          authorized_at?: string | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          qsealc_certificate?: string | null
          qwac_certificate?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          redirect_uris?: string[]
          registration_number?: string | null
          regulatory_authority?: string | null
          services?: string[]
          tpp_id?: string
          tpp_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      regulation_update_notifications: {
        Row: {
          affected_organizations: string[] | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          notified_users: string[] | null
          read_at: string | null
          regulation_id: string | null
          sector: string
          title: string
        }
        Insert: {
          affected_organizations?: string[] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          notified_users?: string[] | null
          read_at?: string | null
          regulation_id?: string | null
          sector: string
          title: string
        }
        Update: {
          affected_organizations?: string[] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          notified_users?: string[] | null
          read_at?: string | null
          regulation_id?: string | null
          sector?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulation_update_notifications_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      regulation_updates: {
        Row: {
          action_required: boolean | null
          affected_regulations: string[] | null
          ai_analysis: string | null
          created_at: string | null
          id: string
          keywords: string[] | null
          notified_at: string | null
          notified_users: string[] | null
          priority: Database["public"]["Enums"]["impact_level"] | null
          processed: boolean | null
          publication_date: string | null
          relevance_score: number | null
          sector_key: string
          source: string
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean | null
          affected_regulations?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          notified_at?: string | null
          notified_users?: string[] | null
          priority?: Database["public"]["Enums"]["impact_level"] | null
          processed?: boolean | null
          publication_date?: string | null
          relevance_score?: number | null
          sector_key: string
          source: string
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean | null
          affected_regulations?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          notified_at?: string | null
          notified_users?: string[] | null
          priority?: Database["public"]["Enums"]["impact_level"] | null
          processed?: boolean | null
          publication_date?: string | null
          relevance_score?: number | null
          sector_key?: string
          source?: string
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      remote_access_sessions: {
        Row: {
          actions_performed: Json[] | null
          client_acknowledged_at: string | null
          client_notified_at: string | null
          created_at: string
          ended_at: string | null
          id: string
          installation_id: string
          ip_address: unknown
          notes: string | null
          session_status: string
          session_type: string
          started_at: string | null
          support_user_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          actions_performed?: Json[] | null
          client_acknowledged_at?: string | null
          client_notified_at?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          installation_id: string
          ip_address?: unknown
          notes?: string | null
          session_status?: string
          session_type?: string
          started_at?: string | null
          support_user_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          actions_performed?: Json[] | null
          client_acknowledged_at?: string | null
          client_notified_at?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          installation_id?: string
          ip_address?: unknown
          notes?: string | null
          session_status?: string
          session_type?: string
          started_at?: string | null
          support_user_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remote_access_sessions_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "client_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remote_access_sessions_support_user_id_fkey"
            columns: ["support_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_support_sessions: {
        Row: {
          actions_count: number | null
          client_email: string | null
          client_name: string | null
          created_at: string
          duration_ms: number | null
          ended_at: string | null
          high_risk_actions_count: number | null
          id: string
          installation_id: string | null
          metadata: Json | null
          performed_by: string | null
          resolution: string | null
          resolution_notes: string | null
          session_code: string
          started_at: string
          status: string
          support_type: string | null
          updated_at: string
        }
        Insert: {
          actions_count?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          high_risk_actions_count?: number | null
          id?: string
          installation_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          resolution?: string | null
          resolution_notes?: string | null
          session_code: string
          started_at?: string
          status?: string
          support_type?: string | null
          updated_at?: string
        }
        Update: {
          actions_count?: number | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          duration_ms?: number | null
          ended_at?: string | null
          high_risk_actions_count?: number | null
          id?: string
          installation_id?: string | null
          metadata?: Json | null
          performed_by?: string | null
          resolution?: string | null
          resolution_notes?: string | null
          session_code?: string
          started_at?: string
          status?: string
          support_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      renewal_nurturing_activities: {
        Row: {
          activity_type: string
          completed_date: string | null
          created_at: string | null
          id: string
          next_step: string | null
          notes: string | null
          outcome: string | null
          performed_by: string | null
          renewal_id: string | null
          scheduled_date: string | null
          status: string | null
        }
        Insert: {
          activity_type: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          next_step?: string | null
          notes?: string | null
          outcome?: string | null
          performed_by?: string | null
          renewal_id?: string | null
          scheduled_date?: string | null
          status?: string | null
        }
        Update: {
          activity_type?: string
          completed_date?: string | null
          created_at?: string | null
          id?: string
          next_step?: string | null
          notes?: string | null
          outcome?: string | null
          performed_by?: string | null
          renewal_id?: string | null
          scheduled_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_nurturing_activities_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_nurturing_activities_renewal_id_fkey"
            columns: ["renewal_id"]
            isOneToOne: false
            referencedRelation: "renewal_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      renewal_opportunities: {
        Row: {
          ai_insights: Json | null
          assigned_to: string | null
          company_id: string | null
          contract_id: string | null
          created_at: string | null
          current_mrr: number | null
          expansion_opportunities: Json | null
          id: string
          last_contact_date: string | null
          next_action: string | null
          next_action_date: string | null
          nurturing_stage: string | null
          outcome_mrr: number | null
          outcome_notes: string | null
          predicted_outcome: string | null
          renewal_date: string
          renewal_probability: number | null
          risk_factors: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_insights?: Json | null
          assigned_to?: string | null
          company_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_mrr?: number | null
          expansion_opportunities?: Json | null
          id?: string
          last_contact_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          nurturing_stage?: string | null
          outcome_mrr?: number | null
          outcome_notes?: string | null
          predicted_outcome?: string | null
          renewal_date: string
          renewal_probability?: number | null
          risk_factors?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_insights?: Json | null
          assigned_to?: string | null
          company_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          current_mrr?: number | null
          expansion_opportunities?: Json | null
          id?: string
          last_contact_date?: string | null
          next_action?: string | null
          next_action_date?: string | null
          nurturing_stage?: string | null
          outcome_mrr?: number | null
          outcome_notes?: string | null
          predicted_outcome?: string | null
          renewal_date?: string
          renewal_probability?: number | null
          risk_factors?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renewal_opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewal_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resilience_tests: {
        Row: {
          conducted_by: string | null
          created_at: string
          critical_findings_count: number | null
          executive_summary: string | null
          findings: Json | null
          high_findings_count: number | null
          id: string
          low_findings_count: number | null
          medium_findings_count: number | null
          recommendations: string | null
          remediation_deadline: string | null
          remediation_status: string | null
          report_url: string | null
          reviewed_by: string | null
          scope: string
          status: string
          target_systems: string[] | null
          test_date: string
          test_duration_hours: number | null
          test_name: string
          test_type: string
          tester_certification: string | null
          tester_organization: string | null
          updated_at: string
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string
          critical_findings_count?: number | null
          executive_summary?: string | null
          findings?: Json | null
          high_findings_count?: number | null
          id?: string
          low_findings_count?: number | null
          medium_findings_count?: number | null
          recommendations?: string | null
          remediation_deadline?: string | null
          remediation_status?: string | null
          report_url?: string | null
          reviewed_by?: string | null
          scope: string
          status?: string
          target_systems?: string[] | null
          test_date: string
          test_duration_hours?: number | null
          test_name: string
          test_type: string
          tester_certification?: string | null
          tester_organization?: string | null
          updated_at?: string
        }
        Update: {
          conducted_by?: string | null
          created_at?: string
          critical_findings_count?: number | null
          executive_summary?: string | null
          findings?: Json | null
          high_findings_count?: number | null
          id?: string
          low_findings_count?: number | null
          medium_findings_count?: number | null
          recommendations?: string | null
          remediation_deadline?: string | null
          remediation_status?: string | null
          report_url?: string | null
          reviewed_by?: string | null
          scope?: string
          status?: string
          target_systems?: string[] | null
          test_date?: string
          test_duration_hours?: number | null
          test_name?: string
          test_type?: string
          tester_certification?: string | null
          tester_organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      retention_playbooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_duration_days: number | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          success_criteria: Json | null
          target_segment: string | null
          trigger_conditions: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          success_criteria?: Json | null
          target_segment?: string | null
          trigger_conditions?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_duration_days?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          success_criteria?: Json | null
          target_segment?: string | null
          trigger_conditions?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retention_playbooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_simulations: {
        Row: {
          baseline_metrics: Json
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          id: string
          impact_analysis: Json | null
          is_active: boolean | null
          parameters: Json
          projected_metrics: Json
          roi_projection: number | null
          simulation_name: string
          simulation_type: string
          time_horizon_months: number | null
          updated_at: string | null
        }
        Insert: {
          baseline_metrics?: Json
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          impact_analysis?: Json | null
          is_active?: boolean | null
          parameters?: Json
          projected_metrics?: Json
          roi_projection?: number | null
          simulation_name: string
          simulation_type: string
          time_horizon_months?: number | null
          updated_at?: string | null
        }
        Update: {
          baseline_metrics?: Json
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          impact_analysis?: Json | null
          is_active?: boolean | null
          parameters?: Json
          projected_metrics?: Json
          roi_projection?: number | null
          simulation_name?: string
          simulation_type?: string
          time_horizon_months?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_anomaly_alerts: {
        Row: {
          affected_entities: Json | null
          anomaly_type: string
          assigned_to: string | null
          confidence: number
          created_at: string | null
          description: string | null
          detected_at: string | null
          id: string
          indicators: Json | null
          recommended_actions: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          title: string
        }
        Insert: {
          affected_entities?: Json | null
          anomaly_type: string
          assigned_to?: string | null
          confidence: number
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          id?: string
          indicators?: Json | null
          recommended_actions?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          title: string
        }
        Update: {
          affected_entities?: Json | null
          anomaly_type?: string
          assigned_to?: string | null
          confidence?: number
          created_at?: string | null
          description?: string | null
          detected_at?: string | null
          id?: string
          indicators?: Json | null
          recommended_actions?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      revenue_attributions: {
        Row: {
          attributed_revenue: number
          attribution_date: string
          attribution_model: string
          attribution_weight: number | null
          campaign: string | null
          channel: string
          company_id: string | null
          content: string | null
          created_at: string
          customer_journey: Json | null
          days_to_conversion: number | null
          id: string
          medium: string | null
          revenue_event_id: string | null
          revenue_type: string | null
          source: string | null
          total_touchpoints: number | null
          touchpoint_order: number | null
        }
        Insert: {
          attributed_revenue: number
          attribution_date?: string
          attribution_model: string
          attribution_weight?: number | null
          campaign?: string | null
          channel: string
          company_id?: string | null
          content?: string | null
          created_at?: string
          customer_journey?: Json | null
          days_to_conversion?: number | null
          id?: string
          medium?: string | null
          revenue_event_id?: string | null
          revenue_type?: string | null
          source?: string | null
          total_touchpoints?: number | null
          touchpoint_order?: number | null
        }
        Update: {
          attributed_revenue?: number
          attribution_date?: string
          attribution_model?: string
          attribution_weight?: number | null
          campaign?: string | null
          channel?: string
          company_id?: string | null
          content?: string | null
          created_at?: string
          customer_journey?: Json | null
          days_to_conversion?: number | null
          id?: string
          medium?: string | null
          revenue_event_id?: string | null
          revenue_type?: string | null
          source?: string | null
          total_touchpoints?: number | null
          touchpoint_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_attributions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_attributions_revenue_event_id_fkey"
            columns: ["revenue_event_id"]
            isOneToOne: false
            referencedRelation: "revenue_events"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_cohorts: {
        Row: {
          cohort_date: string
          cohort_type: string
          created_at: string | null
          id: string
          initial_customers: number
          initial_mrr: number
          month_1_customers: number | null
          month_1_mrr: number | null
          month_12_customers: number | null
          month_12_mrr: number | null
          month_24_customers: number | null
          month_24_mrr: number | null
          month_3_customers: number | null
          month_3_mrr: number | null
          month_6_customers: number | null
          month_6_mrr: number | null
          nrr_rates: Json | null
          retention_rates: Json | null
          segment: string | null
          updated_at: string | null
        }
        Insert: {
          cohort_date: string
          cohort_type: string
          created_at?: string | null
          id?: string
          initial_customers: number
          initial_mrr: number
          month_1_customers?: number | null
          month_1_mrr?: number | null
          month_12_customers?: number | null
          month_12_mrr?: number | null
          month_24_customers?: number | null
          month_24_mrr?: number | null
          month_3_customers?: number | null
          month_3_mrr?: number | null
          month_6_customers?: number | null
          month_6_mrr?: number | null
          nrr_rates?: Json | null
          retention_rates?: Json | null
          segment?: string | null
          updated_at?: string | null
        }
        Update: {
          cohort_date?: string
          cohort_type?: string
          created_at?: string | null
          id?: string
          initial_customers?: number
          initial_mrr?: number
          month_1_customers?: number | null
          month_1_mrr?: number | null
          month_12_customers?: number | null
          month_12_mrr?: number | null
          month_24_customers?: number | null
          month_24_mrr?: number | null
          month_3_customers?: number | null
          month_3_mrr?: number | null
          month_6_customers?: number | null
          month_6_mrr?: number | null
          nrr_rates?: Json | null
          retention_rates?: Json | null
          segment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      revenue_copilot_sessions: {
        Row: {
          actions_taken: Json | null
          context: Json | null
          id: string
          insights_generated: Json | null
          is_active: boolean | null
          last_message_at: string | null
          messages: Json
          session_type: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          actions_taken?: Json | null
          context?: Json | null
          id?: string
          insights_generated?: Json | null
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          session_type?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          actions_taken?: Json | null
          context?: Json | null
          id?: string
          insights_generated?: Json | null
          is_active?: boolean | null
          last_message_at?: string | null
          messages?: Json
          session_type?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          arr_change: number | null
          company_id: string | null
          contract_length_months: number | null
          created_at: string | null
          discount_percentage: number | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          mrr_after: number | null
          mrr_before: number | null
          mrr_change: number
          plan_from: string | null
          plan_to: string | null
          product_id: string | null
          reason: string | null
          recorded_by: string | null
          updated_at: string | null
        }
        Insert: {
          arr_change?: number | null
          company_id?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          discount_percentage?: number | null
          event_date?: string
          event_type: string
          id?: string
          metadata?: Json | null
          mrr_after?: number | null
          mrr_before?: number | null
          mrr_change: number
          plan_from?: string | null
          plan_to?: string | null
          product_id?: string | null
          reason?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Update: {
          arr_change?: number | null
          company_id?: string | null
          contract_length_months?: number | null
          created_at?: string | null
          discount_percentage?: number | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          mrr_after?: number | null
          mrr_before?: number | null
          mrr_change?: number
          plan_from?: string | null
          plan_to?: string | null
          product_id?: string | null
          reason?: string | null
          recorded_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_forecasts: {
        Row: {
          ai_insights: string | null
          churn_rate_predicted: number | null
          confidence_interval_high: number | null
          confidence_interval_low: number | null
          confidence_level: number | null
          created_at: string
          expansion_rate_predicted: number | null
          forecast_date: string
          forecast_horizon_months: number
          growth_rate_predicted: number | null
          id: string
          key_drivers: Json | null
          model_accuracy: number | null
          model_version: string | null
          predicted_arr: number
          predicted_mrr: number
          risk_factors: Json | null
          scenario: string
          updated_at: string
        }
        Insert: {
          ai_insights?: string | null
          churn_rate_predicted?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          expansion_rate_predicted?: number | null
          forecast_date: string
          forecast_horizon_months?: number
          growth_rate_predicted?: number | null
          id?: string
          key_drivers?: Json | null
          model_accuracy?: number | null
          model_version?: string | null
          predicted_arr: number
          predicted_mrr: number
          risk_factors?: Json | null
          scenario: string
          updated_at?: string
        }
        Update: {
          ai_insights?: string | null
          churn_rate_predicted?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          expansion_rate_predicted?: number | null
          forecast_date?: string
          forecast_horizon_months?: number
          growth_rate_predicted?: number | null
          id?: string
          key_drivers?: Json | null
          model_accuracy?: number | null
          model_version?: string | null
          predicted_arr?: number
          predicted_mrr?: number
          risk_factors?: Json | null
          scenario?: string
          updated_at?: string
        }
        Relationships: []
      }
      revenue_risk_alerts: {
        Row: {
          alert_type: string
          assigned_to: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          expected_impact: number | null
          id: string
          mrr_at_risk: number | null
          probability: number | null
          recommended_actions: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          segment: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          expected_impact?: number | null
          id?: string
          mrr_at_risk?: number | null
          probability?: number | null
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          segment?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          assigned_to?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          expected_impact?: number | null
          id?: string
          mrr_at_risk?: number | null
          probability?: number | null
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          segment?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_risk_alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_scenarios: {
        Row: {
          assumptions: string[] | null
          base_mrr: number
          comparison_baseline_id: string | null
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_baseline: boolean | null
          name: string
          projections: Json
          risks: string[] | null
          scenario_type: string | null
          time_horizon_months: number | null
          updated_at: string | null
          variables: Json
        }
        Insert: {
          assumptions?: string[] | null
          base_mrr?: number
          comparison_baseline_id?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          name: string
          projections?: Json
          risks?: string[] | null
          scenario_type?: string | null
          time_horizon_months?: number | null
          updated_at?: string | null
          variables?: Json
        }
        Update: {
          assumptions?: string[] | null
          base_mrr?: number
          comparison_baseline_id?: string | null
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          name?: string
          projections?: Json
          risks?: string[] | null
          scenario_type?: string | null
          time_horizon_months?: number | null
          updated_at?: string | null
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "revenue_scenarios_comparison_baseline_id_fkey"
            columns: ["comparison_baseline_id"]
            isOneToOne: false
            referencedRelation: "revenue_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_scores: {
        Row: {
          action_priority: number | null
          ai_recommendation: string | null
          company_id: string | null
          created_at: string
          engagement_score: number | null
          expansion_score: number | null
          growth_potential_score: number | null
          health_score: number | null
          id: string
          next_best_action: string | null
          overall_score: number
          prioritization_quadrant: string | null
          recommended_action: string | null
          retention_score: number | null
          risk_score: number | null
          satisfaction_score: number | null
          score_date: string
          score_factors: Json | null
          score_trend: string | null
          trend_velocity: number | null
          updated_at: string
        }
        Insert: {
          action_priority?: number | null
          ai_recommendation?: string | null
          company_id?: string | null
          created_at?: string
          engagement_score?: number | null
          expansion_score?: number | null
          growth_potential_score?: number | null
          health_score?: number | null
          id?: string
          next_best_action?: string | null
          overall_score: number
          prioritization_quadrant?: string | null
          recommended_action?: string | null
          retention_score?: number | null
          risk_score?: number | null
          satisfaction_score?: number | null
          score_date?: string
          score_factors?: Json | null
          score_trend?: string | null
          trend_velocity?: number | null
          updated_at?: string
        }
        Update: {
          action_priority?: number | null
          ai_recommendation?: string | null
          company_id?: string | null
          created_at?: string
          engagement_score?: number | null
          expansion_score?: number | null
          growth_potential_score?: number | null
          health_score?: number | null
          id?: string
          next_best_action?: string | null
          overall_score?: number
          prioritization_quadrant?: string | null
          recommended_action?: string | null
          retention_score?: number | null
          risk_score?: number | null
          satisfaction_score?: number | null
          score_date?: string
          score_factors?: Json | null
          score_trend?: string | null
          trend_velocity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_signals: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          ai_analysis: Json | null
          confidence_score: number | null
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          gestor_id: string | null
          id: string
          is_actioned: boolean | null
          is_read: boolean | null
          office: string | null
          potential_value: number | null
          recommended_action: string | null
          severity: string
          signal_type: string
          title: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          gestor_id?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          office?: string | null
          potential_value?: number | null
          recommended_action?: string | null
          severity?: string
          signal_type: string
          title: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          gestor_id?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          office?: string | null
          potential_value?: number | null
          recommended_action?: string | null
          severity?: string
          signal_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_signals_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_signals_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_workflow_executions: {
        Row: {
          actions_executed: Json | null
          completed_at: string | null
          error_message: string | null
          execution_status: string | null
          id: string
          result: Json | null
          started_at: string | null
          trigger_data: Json | null
          triggered_by: string | null
          workflow_id: string | null
        }
        Insert: {
          actions_executed?: Json | null
          completed_at?: string | null
          error_message?: string | null
          execution_status?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
          workflow_id?: string | null
        }
        Update: {
          actions_executed?: Json | null
          completed_at?: string | null
          error_message?: string | null
          execution_status?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "revenue_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_workflows: {
        Row: {
          actions: Json
          conditions: Json
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          priority: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          priority?: number | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          priority?: number | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assessment_date: string
          assessment_name: string
          assessment_type: string
          assessor_id: string | null
          created_at: string
          id: string
          identified_risks: Json | null
          methodology: string | null
          mitigation_measures: Json | null
          next_review_date: string | null
          residual_risk_score: number | null
          risk_level: string | null
          risk_score: number | null
          scope: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date: string
          assessment_name: string
          assessment_type: string
          assessor_id?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          methodology?: string | null
          mitigation_measures?: Json | null
          next_review_date?: string | null
          residual_risk_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          scope: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date?: string
          assessment_name?: string
          assessment_type?: string
          assessor_id?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          methodology?: string | null
          mitigation_measures?: Json | null
          next_review_date?: string | null
          residual_risk_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          badge_color: string | null
          badge_icon: string | null
          created_at: string
          description: string | null
          gestor_id: string
          id: string
          metadata: Json | null
          points: number
          quota_id: string | null
          unlocked_at: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          gestor_id: string
          id?: string
          metadata?: Json | null
          points?: number
          quota_id?: string | null
          unlocked_at?: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          gestor_id?: string
          id?: string
          metadata?: Json | null
          points?: number
          quota_id?: string | null
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_achievements_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_achievements_quota_id_fkey"
            columns: ["quota_id"]
            isOneToOne: false
            referencedRelation: "sales_quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leaderboard: {
        Row: {
          achievements_count: number | null
          badges: Json | null
          calculated_at: string
          gestor_id: string
          id: string
          period_start: string
          period_type: string
          previous_rank: number | null
          rank_change: number | null
          rank_position: number
          streak_days: number | null
          total_deals_won: number | null
          total_points: number | null
          total_value: number | null
          total_visits: number | null
        }
        Insert: {
          achievements_count?: number | null
          badges?: Json | null
          calculated_at?: string
          gestor_id: string
          id?: string
          period_start: string
          period_type?: string
          previous_rank?: number | null
          rank_change?: number | null
          rank_position: number
          streak_days?: number | null
          total_deals_won?: number | null
          total_points?: number | null
          total_value?: number | null
          total_visits?: number | null
        }
        Update: {
          achievements_count?: number | null
          badges?: Json | null
          calculated_at?: string
          gestor_id?: string
          id?: string
          period_start?: string
          period_type?: string
          previous_rank?: number | null
          rank_change?: number | null
          rank_position?: number
          streak_days?: number | null
          total_deals_won?: number | null
          total_points?: number | null
          total_value?: number | null
          total_visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leaderboard_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_quotas: {
        Row: {
          achievement_percentage: number | null
          actual_new_clients: number | null
          actual_products_sold: number | null
          actual_value: number
          actual_visits: number | null
          created_at: string
          created_by: string | null
          gestor_id: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          target_new_clients: number | null
          target_products_sold: number | null
          target_value: number
          target_visits: number | null
          updated_at: string
        }
        Insert: {
          achievement_percentage?: number | null
          actual_new_clients?: number | null
          actual_products_sold?: number | null
          actual_value?: number
          actual_visits?: number | null
          created_at?: string
          created_by?: string | null
          gestor_id: string
          id?: string
          period_end: string
          period_start: string
          period_type?: string
          target_new_clients?: number | null
          target_products_sold?: number | null
          target_value?: number
          target_visits?: number | null
          updated_at?: string
        }
        Update: {
          achievement_percentage?: number | null
          actual_new_clients?: number | null
          actual_products_sold?: number | null
          actual_value?: number
          actual_visits?: number | null
          created_at?: string
          created_by?: string | null
          gestor_id?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          target_new_clients?: number | null
          target_products_sold?: number | null
          target_value?: number
          target_visits?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_quotas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_quotas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_alert_history: {
        Row: {
          alert_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          notified_users: string[] | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          task_created_id: string | null
          trigger_context: Json | null
          trigger_value: number | null
        }
        Insert: {
          alert_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          notified_users?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_created_id?: string | null
          trigger_context?: Json | null
          trigger_value?: number | null
        }
        Update: {
          alert_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          notified_users?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          task_created_id?: string | null
          trigger_context?: Json | null
          trigger_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "satisfaction_alert_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_alerts: {
        Row: {
          alert_type: string
          auto_create_task: boolean | null
          condition_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          notify_gestor: boolean | null
          notify_manager: boolean | null
          threshold_value: number | null
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          auto_create_task?: boolean | null
          condition_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notify_gestor?: boolean | null
          notify_manager?: boolean | null
          threshold_value?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          auto_create_task?: boolean | null
          condition_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notify_gestor?: boolean | null
          notify_manager?: boolean | null
          threshold_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      satisfaction_surveys: {
        Row: {
          created_at: string | null
          created_by: string | null
          delay_hours: number | null
          description: string | null
          follow_up_question: string | null
          id: string
          is_active: boolean | null
          name: string
          question_text: string
          survey_type: Database["public"]["Enums"]["survey_type"]
          target_segment: string | null
          trigger_config: Json | null
          trigger_type: Database["public"]["Enums"]["survey_trigger"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delay_hours?: number | null
          description?: string | null
          follow_up_question?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          question_text: string
          survey_type: Database["public"]["Enums"]["survey_type"]
          target_segment?: string | null
          trigger_config?: Json | null
          trigger_type?: Database["public"]["Enums"]["survey_trigger"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delay_hours?: number | null
          description?: string | null
          follow_up_question?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          question_text?: string
          survey_type?: Database["public"]["Enums"]["survey_type"]
          target_segment?: string | null
          trigger_config?: Json | null
          trigger_type?: Database["public"]["Enums"]["survey_trigger"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_news: {
        Row: {
          article_id: string
          id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          saved_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scenario_simulations: {
        Row: {
          base_parameters: Json
          best_case_results: Json | null
          constraints: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          monte_carlo_iterations: number | null
          name: string
          recommendations: Json | null
          run_completed_at: string | null
          run_started_at: string | null
          scenario_type: string
          sensitivity_analysis: Json | null
          shared_with: string[] | null
          simulation_results: Json | null
          status: string | null
          updated_at: string
          variables: Json
          worst_case_results: Json | null
        }
        Insert: {
          base_parameters: Json
          best_case_results?: Json | null
          constraints?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          monte_carlo_iterations?: number | null
          name: string
          recommendations?: Json | null
          run_completed_at?: string | null
          run_started_at?: string | null
          scenario_type: string
          sensitivity_analysis?: Json | null
          shared_with?: string[] | null
          simulation_results?: Json | null
          status?: string | null
          updated_at?: string
          variables: Json
          worst_case_results?: Json | null
        }
        Update: {
          base_parameters?: Json
          best_case_results?: Json | null
          constraints?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          monte_carlo_iterations?: number | null
          name?: string
          recommendations?: Json | null
          run_completed_at?: string | null
          run_started_at?: string | null
          scenario_type?: string
          sensitivity_analysis?: Json | null
          shared_with?: string[] | null
          simulation_results?: Json | null
          status?: string | null
          updated_at?: string
          variables?: Json
          worst_case_results?: Json | null
        }
        Relationships: []
      }
      scheduled_health_checks: {
        Row: {
          check_type: string
          created_at: string
          details: Json
          email_sent: boolean | null
          email_sent_at: string | null
          error_modules: number
          healthy_modules: number
          id: string
          overall_status: string
          total_modules: number
          warning_modules: number
        }
        Insert: {
          check_type: string
          created_at?: string
          details: Json
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_modules: number
          healthy_modules: number
          id?: string
          overall_status: string
          total_modules: number
          warning_modules: number
        }
        Update: {
          check_type?: string
          created_at?: string
          details?: Json
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_modules?: number
          healthy_modules?: number
          id?: string
          overall_status?: string
          total_modules?: number
          warning_modules?: number
        }
        Relationships: []
      }
      sector_chart_of_accounts: {
        Row: {
          account_structure: Json
          benchmark_ranges: Json
          cnae_codes: string[]
          compliance_rules: Json | null
          created_at: string | null
          id: string
          ratio_definitions: Json
          sector_key: string
          sector_name: string
          tax_implications: Json | null
          updated_at: string | null
          zscore_coefficients: Json
          zscore_model: string | null
        }
        Insert: {
          account_structure?: Json
          benchmark_ranges?: Json
          cnae_codes?: string[]
          compliance_rules?: Json | null
          created_at?: string | null
          id?: string
          ratio_definitions?: Json
          sector_key: string
          sector_name: string
          tax_implications?: Json | null
          updated_at?: string | null
          zscore_coefficients?: Json
          zscore_model?: string | null
        }
        Update: {
          account_structure?: Json
          benchmark_ranges?: Json
          cnae_codes?: string[]
          compliance_rules?: Json | null
          created_at?: string | null
          id?: string
          ratio_definitions?: Json
          sector_key?: string
          sector_name?: string
          tax_implications?: Json | null
          updated_at?: string | null
          zscore_coefficients?: Json
          zscore_model?: string | null
        }
        Relationships: []
      }
      sector_ratio_benchmarks: {
        Row: {
          average_value: number | null
          cnae_code: string
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number | null
          ratio_category: string
          ratio_name: string
          sample_size: number | null
          sector_key: string
          source: string | null
          standard_deviation: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          average_value?: number | null
          cnae_code: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          ratio_category?: string
          ratio_name: string
          sample_size?: number | null
          sector_key: string
          source?: string | null
          standard_deviation?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          average_value?: number | null
          cnae_code?: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          ratio_category?: string
          ratio_name?: string
          sample_size?: number | null
          sector_key?: string
          source?: string | null
          standard_deviation?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      sector_regulations: {
        Row: {
          authority: string
          created_at: string | null
          effective_date: string | null
          expiration_date: string | null
          full_text_url: string | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory: boolean | null
          iso_codes: string[] | null
          publication_date: string | null
          regulation_code: string
          regulation_name: string
          requirements: Json | null
          sector_key: string
          status: Database["public"]["Enums"]["regulation_status"] | null
          summary: string | null
          superseded_by: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          authority: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          full_text_url?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory?: boolean | null
          iso_codes?: string[] | null
          publication_date?: string | null
          regulation_code: string
          regulation_name: string
          requirements?: Json | null
          sector_key: string
          status?: Database["public"]["Enums"]["regulation_status"] | null
          summary?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          authority?: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          full_text_url?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory?: boolean | null
          iso_codes?: string[] | null
          publication_date?: string | null
          regulation_code?: string
          regulation_name?: string
          requirements?: Json | null
          sector_key?: string
          status?: Database["public"]["Enums"]["regulation_status"] | null
          summary?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sector_regulations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "sector_regulations"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_zscore_coefficients: {
        Row: {
          created_at: string | null
          description: string | null
          gray_zone_min: number | null
          id: string
          safe_zone_min: number | null
          sector_key: string
          sector_name: string
          updated_at: string | null
          x1_coefficient: number | null
          x2_coefficient: number | null
          x3_coefficient: number | null
          x4_coefficient: number | null
          x5_coefficient: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gray_zone_min?: number | null
          id?: string
          safe_zone_min?: number | null
          sector_key: string
          sector_name: string
          updated_at?: string | null
          x1_coefficient?: number | null
          x2_coefficient?: number | null
          x3_coefficient?: number | null
          x4_coefficient?: number | null
          x5_coefficient?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gray_zone_min?: number | null
          id?: string
          safe_zone_min?: number | null
          sector_key?: string
          sector_name?: string
          updated_at?: string | null
          x1_coefficient?: number | null
          x2_coefficient?: number | null
          x3_coefficient?: number | null
          x4_coefficient?: number | null
          x5_coefficient?: number | null
        }
        Relationships: []
      }
      sectors: {
        Row: {
          ai_capabilities: Json | null
          availability_status: string | null
          case_studies: Json | null
          certifications: Json | null
          cnae_codes: string[] | null
          created_at: string
          demo_video_url: string | null
          description: string | null
          features: Json | null
          gradient_from: string | null
          gradient_to: string | null
          icon_name: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          landing_page_url: string | null
          modules_recommended: string[] | null
          name: string
          order_position: number | null
          pricing_tier: string | null
          regulations: Json | null
          short_description: string | null
          slug: string
          stats: Json | null
          target_company_sizes: string[] | null
          updated_at: string
        }
        Insert: {
          ai_capabilities?: Json | null
          availability_status?: string | null
          case_studies?: Json | null
          certifications?: Json | null
          cnae_codes?: string[] | null
          created_at?: string
          demo_video_url?: string | null
          description?: string | null
          features?: Json | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          landing_page_url?: string | null
          modules_recommended?: string[] | null
          name: string
          order_position?: number | null
          pricing_tier?: string | null
          regulations?: Json | null
          short_description?: string | null
          slug: string
          stats?: Json | null
          target_company_sizes?: string[] | null
          updated_at?: string
        }
        Update: {
          ai_capabilities?: Json | null
          availability_status?: string | null
          case_studies?: Json | null
          certifications?: Json | null
          cnae_codes?: string[] | null
          created_at?: string
          demo_video_url?: string | null
          description?: string | null
          features?: Json | null
          gradient_from?: string | null
          gradient_to?: string | null
          icon_name?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          landing_page_url?: string | null
          modules_recommended?: string[] | null
          name?: string
          order_position?: number | null
          pricing_tier?: string | null
          regulations?: Json | null
          short_description?: string | null
          slug?: string
          stats?: Json | null
          target_company_sizes?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_data_types: string[] | null
          affected_systems: string[] | null
          assigned_to: string | null
          authority_reference: string | null
          authority_report_date: string | null
          containment_time: string | null
          created_at: string
          description: string
          detection_time: string
          id: string
          incident_type: string
          lessons_learned: string | null
          remediation_actions: string | null
          reported_by: string | null
          reported_to_authority: boolean | null
          resolution_time: string | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_data_types?: string[] | null
          affected_systems?: string[] | null
          assigned_to?: string | null
          authority_reference?: string | null
          authority_report_date?: string | null
          containment_time?: string | null
          created_at?: string
          description: string
          detection_time: string
          id?: string
          incident_type: string
          lessons_learned?: string | null
          remediation_actions?: string | null
          reported_by?: string | null
          reported_to_authority?: boolean | null
          resolution_time?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_data_types?: string[] | null
          affected_systems?: string[] | null
          assigned_to?: string | null
          authority_reference?: string | null
          authority_report_date?: string | null
          containment_time?: string | null
          created_at?: string
          description?: string
          detection_time?: string
          id?: string
          incident_type?: string
          lessons_learned?: string | null
          remediation_actions?: string | null
          reported_by?: string | null
          reported_to_authority?: boolean | null
          resolution_time?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      segment_management_policies: {
        Row: {
          action_triggers: Json | null
          automated_actions: Json | null
          communication_channel: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          offer_types: string[] | null
          policy_name: string
          priority_level: number | null
          segment_name: string
          target_metrics: Json | null
          updated_at: string
          visit_frequency_days: number | null
        }
        Insert: {
          action_triggers?: Json | null
          automated_actions?: Json | null
          communication_channel?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          offer_types?: string[] | null
          policy_name: string
          priority_level?: number | null
          segment_name: string
          target_metrics?: Json | null
          updated_at?: string
          visit_frequency_days?: number | null
        }
        Update: {
          action_triggers?: Json | null
          automated_actions?: Json | null
          communication_channel?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          offer_types?: string[] | null
          policy_name?: string
          priority_level?: number | null
          segment_name?: string
          target_metrics?: Json | null
          updated_at?: string
          visit_frequency_days?: number | null
        }
        Relationships: []
      }
      segment_members: {
        Row: {
          added_at: string | null
          company_id: string
          contact_id: string | null
          id: string
          is_active: boolean | null
          match_score: number | null
          metadata: Json | null
          removed_at: string | null
          segment_id: string
        }
        Insert: {
          added_at?: string | null
          company_id: string
          contact_id?: string | null
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          metadata?: Json | null
          removed_at?: string | null
          segment_id: string
        }
        Update: {
          added_at?: string | null
          company_id?: string
          contact_id?: string | null
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          metadata?: Json | null
          removed_at?: string | null
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segment_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_rules: {
        Row: {
          auto_enroll_journeys: string[] | null
          condition_logic: string | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          member_count: number | null
          name: string
          refresh_frequency: unknown
          rule_type: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          auto_enroll_journeys?: string[] | null
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          member_count?: number | null
          name: string
          refresh_frequency?: unknown
          rule_type?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          auto_enroll_journeys?: string[] | null
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          member_count?: number | null
          name?: string
          refresh_frequency?: unknown
          rule_type?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sentiment_analysis: {
        Row: {
          action_required: boolean | null
          alert_sent: boolean | null
          analyzed_by: string | null
          company_id: string | null
          confidence: number | null
          content_analyzed: string
          created_at: string | null
          emotions: Json | null
          gestor_id: string | null
          id: string
          key_phrases: string[] | null
          sentiment: Database["public"]["Enums"]["sentiment_type"]
          sentiment_score: number
          source_id: string | null
          source_type: string
          topics: string[] | null
        }
        Insert: {
          action_required?: boolean | null
          alert_sent?: boolean | null
          analyzed_by?: string | null
          company_id?: string | null
          confidence?: number | null
          content_analyzed: string
          created_at?: string | null
          emotions?: Json | null
          gestor_id?: string | null
          id?: string
          key_phrases?: string[] | null
          sentiment: Database["public"]["Enums"]["sentiment_type"]
          sentiment_score: number
          source_id?: string | null
          source_type: string
          topics?: string[] | null
        }
        Update: {
          action_required?: boolean | null
          alert_sent?: boolean | null
          analyzed_by?: string | null
          company_id?: string | null
          confidence?: number | null
          content_analyzed?: string
          created_at?: string | null
          emotions?: Json | null
          gestor_id?: string | null
          id?: string
          key_phrases?: string[] | null
          sentiment?: Database["public"]["Enums"]["sentiment_type"]
          sentiment_score?: number
          source_id?: string | null
          source_type?: string
          topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sepa_instant_payments: {
        Row: {
          amount: number
          created_at: string | null
          creditor_bic: string | null
          creditor_iban: string
          creditor_name: string
          currency: string | null
          debtor_iban: string
          debtor_name: string
          end_to_end_id: string
          id: string
          instruction_id: string | null
          processing_time_ms: number | null
          rejection_reason: string | null
          remittance_info: string | null
          settlement_date: string | null
          status: string | null
          tpp_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creditor_bic?: string | null
          creditor_iban: string
          creditor_name: string
          currency?: string | null
          debtor_iban: string
          debtor_name: string
          end_to_end_id: string
          id?: string
          instruction_id?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          remittance_info?: string | null
          settlement_date?: string | null
          status?: string | null
          tpp_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creditor_bic?: string | null
          creditor_iban?: string
          creditor_name?: string
          currency?: string | null
          debtor_iban?: string
          debtor_name?: string
          end_to_end_id?: string
          id?: string
          instruction_id?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          remittance_info?: string | null
          settlement_date?: string | null
          status?: string | null
          tpp_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_quote_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_status: string
          previous_status: string | null
          quote_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: string
          previous_status?: string | null
          quote_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          previous_status?: string | null
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_quote_history_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "service_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_quote_items: {
        Row: {
          created_at: string
          description: string
          discount_percentage: number | null
          id: string
          item_order: number
          item_type: string
          notes: string | null
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_percentage?: number | null
          id?: string
          item_order?: number
          item_type: string
          notes?: string | null
          quantity?: number
          quote_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_percentage?: number | null
          id?: string
          item_order?: number
          item_type?: string
          notes?: string | null
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "service_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      service_quotes: {
        Row: {
          client_accepted_terms: boolean | null
          client_decision_at: string | null
          client_notes: string | null
          client_signature_data: string | null
          client_signature_ip: unknown
          client_signature_user_agent: string | null
          created_at: string
          created_by: string
          currency: string
          discount_percentage: number | null
          estimated_actions: Json | null
          estimated_duration_minutes: number
          fixed_price: number | null
          hourly_rate: number | null
          id: string
          installation_id: string
          payment_terms: string | null
          quote_number: string
          sent_at: string | null
          service_description: string | null
          service_title: string
          service_type: string
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          terms_and_conditions: string | null
          total_price: number
          updated_at: string
          updated_by: string | null
          valid_until: string
          viewed_at: string | null
        }
        Insert: {
          client_accepted_terms?: boolean | null
          client_decision_at?: string | null
          client_notes?: string | null
          client_signature_data?: string | null
          client_signature_ip?: unknown
          client_signature_user_agent?: string | null
          created_at?: string
          created_by: string
          currency?: string
          discount_percentage?: number | null
          estimated_actions?: Json | null
          estimated_duration_minutes: number
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          installation_id: string
          payment_terms?: string | null
          quote_number: string
          sent_at?: string | null
          service_description?: string | null
          service_title: string
          service_type: string
          status?: string
          subtotal: number
          tax_amount: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_price: number
          updated_at?: string
          updated_by?: string | null
          valid_until: string
          viewed_at?: string | null
        }
        Update: {
          client_accepted_terms?: boolean | null
          client_decision_at?: string | null
          client_notes?: string | null
          client_signature_data?: string | null
          client_signature_ip?: unknown
          client_signature_user_agent?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          discount_percentage?: number | null
          estimated_actions?: Json | null
          estimated_duration_minutes?: number
          fixed_price?: number | null
          hourly_rate?: number | null
          id?: string
          installation_id?: string
          payment_terms?: string | null
          quote_number?: string
          sent_at?: string | null
          service_description?: string | null
          service_title?: string
          service_type?: string
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_price?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_quotes_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "client_installations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_action_logs: {
        Row: {
          action_description: string
          action_type: string
          after_state: Json | null
          approved_at: string | null
          approved_by: string | null
          before_state: Json | null
          component_affected: string | null
          created_at: string
          duration_ms: number | null
          id: string
          metadata: Json | null
          requires_approval: boolean | null
          risk_level: string
          screenshot_url: string | null
          session_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          after_state?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          before_state?: Json | null
          component_affected?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          requires_approval?: boolean | null
          risk_level?: string
          screenshot_url?: string | null
          session_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          after_state?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          before_state?: Json | null
          component_affected?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          requires_approval?: boolean | null
          risk_level?: string
          screenshot_url?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_action_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "remote_access_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_actions: {
        Row: {
          action_type: string
          after_state: Json | null
          approved_at: string | null
          approved_by: string | null
          before_state: Json | null
          component_affected: string | null
          created_at: string
          description: string
          duration_ms: number | null
          id: string
          metadata: Json | null
          performed_by: string | null
          remote_session_id: string | null
          requires_approval: boolean | null
          risk_level: string
          session_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          after_state?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          before_state?: Json | null
          component_affected?: string | null
          created_at?: string
          description: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          remote_session_id?: string | null
          requires_approval?: boolean | null
          risk_level?: string
          session_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          after_state?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          before_state?: Json | null
          component_affected?: string | null
          created_at?: string
          description?: string
          duration_ms?: number | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
          remote_session_id?: string | null
          requires_approval?: boolean | null
          risk_level?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_actions_remote_session_id_fkey"
            columns: ["remote_session_id"]
            isOneToOne: false
            referencedRelation: "remote_support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_export_logs: {
        Row: {
          export_format: string
          exported_at: string
          exported_by: string | null
          file_size_bytes: number | null
          id: string
          includes_actions: boolean | null
          includes_screenshots: boolean | null
          metadata: Json | null
          session_id: string
          verification_code: string
          verification_hash: string
        }
        Insert: {
          export_format?: string
          exported_at?: string
          exported_by?: string | null
          file_size_bytes?: number | null
          id?: string
          includes_actions?: boolean | null
          includes_screenshots?: boolean | null
          metadata?: Json | null
          session_id: string
          verification_code: string
          verification_hash: string
        }
        Update: {
          export_format?: string
          exported_at?: string
          exported_by?: string | null
          file_size_bytes?: number | null
          id?: string
          includes_actions?: boolean | null
          includes_screenshots?: boolean | null
          metadata?: Json | null
          session_id?: string
          verification_code?: string
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_export_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "remote_support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_risk_assessments: {
        Row: {
          created_at: string | null
          device_fingerprint_id: string | null
          id: string
          ip_address: string | null
          location_data: Json | null
          location_id: string | null
          requires_step_up: boolean | null
          risk_factors: Json | null
          risk_level: Database["public"]["Enums"]["auth_risk_level"]
          risk_score: number
          session_id: string
          step_up_completed: boolean | null
          step_up_factor: Database["public"]["Enums"]["auth_factor_type"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          location_id?: string | null
          requires_step_up?: boolean | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["auth_risk_level"]
          risk_score?: number
          session_id: string
          step_up_completed?: boolean | null
          step_up_factor?:
            | Database["public"]["Enums"]["auth_factor_type"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          location_id?: string | null
          requires_step_up?: boolean | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["auth_risk_level"]
          risk_score?: number
          session_id?: string
          step_up_completed?: boolean | null
          step_up_factor?:
            | Database["public"]["Enums"]["auth_factor_type"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_risk_assessments_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "user_device_fingerprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_risk_assessments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "user_location_history"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configs: {
        Row: {
          business_hours_only: boolean | null
          channel: string
          created_at: string | null
          escalation_after_minutes: number | null
          escalation_to: string | null
          first_response_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          priority: string | null
          resolution_hours: number | null
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          channel: string
          created_at?: string | null
          escalation_after_minutes?: number | null
          escalation_to?: string | null
          first_response_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: string | null
          resolution_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          channel?: string
          created_at?: string | null
          escalation_after_minutes?: number | null
          escalation_to?: string | null
          first_response_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string | null
          resolution_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          business_hours_only: boolean | null
          created_at: string | null
          description: string | null
          escalation_enabled: boolean | null
          escalation_hours: number | null
          first_response_hours: number
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          priority: string
          resolution_hours: number
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          first_response_hours: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          priority: string
          resolution_hours: number
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          first_response_hours?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          priority?: string
          resolution_hours?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      sla_tracking: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          escalated_at: string | null
          escalated_to: string | null
          first_response_at: string | null
          first_response_met: boolean | null
          id: string
          resolution_at: string | null
          resolution_met: boolean | null
          sla_config_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          first_response_at?: string | null
          first_response_met?: boolean | null
          id?: string
          resolution_at?: string | null
          resolution_met?: boolean | null
          sla_config_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          first_response_at?: string | null
          first_response_met?: boolean | null
          id?: string
          resolution_at?: string | null
          resolution_met?: boolean | null
          sla_config_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_tracking_sla_config_id_fkey"
            columns: ["sla_config_id"]
            isOneToOne: false
            referencedRelation: "sla_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_delivery_logs: {
        Row: {
          id: string
          logged_at: string
          provider_response: Json | null
          sms_id: string | null
          status: string
          status_code: string | null
        }
        Insert: {
          id?: string
          logged_at?: string
          provider_response?: Json | null
          sms_id?: string | null
          status: string
          status_code?: string | null
        }
        Update: {
          id?: string
          logged_at?: string
          provider_response?: Json | null
          sms_id?: string | null
          status?: string
          status_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_delivery_logs_sms_id_fkey"
            columns: ["sms_id"]
            isOneToOne: false
            referencedRelation: "sms_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_notifications: {
        Row: {
          company_id: string | null
          contact_name: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          phone_number: string
          provider_message_id: string | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      status_colors: {
        Row: {
          color_hex: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          status_name: string
          updated_at: string | null
        }
        Insert: {
          color_hex: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          status_name: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          status_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_bundles: {
        Row: {
          badge: string | null
          bundle_key: string
          bundle_name: string
          bundle_price: number
          created_at: string
          current_uses: number | null
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_uses: number | null
          module_keys: string[]
          original_price: number
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          badge?: string | null
          bundle_key: string
          bundle_name: string
          bundle_price: number
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_uses?: number | null
          module_keys: string[]
          original_price: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          badge?: string | null
          bundle_key?: string
          bundle_name?: string
          bundle_price?: number
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_uses?: number | null
          module_keys?: string[]
          original_price?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      store_cart: {
        Row: {
          added_at: string
          id: string
          license_type: string | null
          module_id: string | null
          module_key: string
          quantity: number
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          license_type?: string | null
          module_id?: string | null
          module_key: string
          quantity?: number
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          license_type?: string | null
          module_id?: string | null
          module_key?: string
          quantity?: number
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_cart_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          license_duration_months: number | null
          module_id: string | null
          module_key: string
          module_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          license_duration_months?: number | null
          module_id?: string | null
          module_key: string
          module_name: string
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          license_duration_months?: number | null
          module_id?: string | null
          module_key?: string
          module_name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          billing_address: string | null
          company_name: string | null
          country: string | null
          created_at: string
          currency: string | null
          customer_email: string
          customer_name: string | null
          discount_amount: number | null
          id: string
          license_type: string | null
          metadata: Json | null
          notes: string | null
          order_number: string
          phone: string | null
          promo_code: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_email: string
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          phone?: string | null
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          phone?: string | null
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_promotions: {
        Row: {
          applicable_modules: string[] | null
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          promo_code: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_modules?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          promo_code: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_modules?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          promo_code?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      strategic_ai_analyses: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          input_data: Json | null
          model_used: string | null
          output_data: Json | null
          user_feedback: string | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          user_feedback?: string | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          input_data?: Json | null
          model_used?: string | null
          output_data?: Json | null
          user_feedback?: string | null
        }
        Relationships: []
      }
      stress_test_executions: {
        Row: {
          created_at: string
          error_message: string | null
          executed_by: string | null
          execution_end: string | null
          execution_start: string
          id: string
          metrics: Json | null
          passed: boolean | null
          results: Json | null
          simulation_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          metrics?: Json | null
          passed?: boolean | null
          results?: Json | null
          simulation_id: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          metrics?: Json | null
          passed?: boolean | null
          results?: Json | null
          simulation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stress_test_executions_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "stress_test_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      stress_test_simulations: {
        Row: {
          created_at: string
          created_by: string | null
          execution_duration_seconds: number | null
          execution_mode: string
          id: string
          last_execution: string | null
          metrics: Json | null
          next_execution: string | null
          passed: boolean | null
          results: Json | null
          scenario_description: string | null
          schedule_cron: string | null
          simulation_name: string
          simulation_type: string
          status: string
          success_criteria: Json | null
          target_systems: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          execution_duration_seconds?: number | null
          execution_mode?: string
          id?: string
          last_execution?: string | null
          metrics?: Json | null
          next_execution?: string | null
          passed?: boolean | null
          results?: Json | null
          scenario_description?: string | null
          schedule_cron?: string | null
          simulation_name: string
          simulation_type: string
          status?: string
          success_criteria?: Json | null
          target_systems?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          execution_duration_seconds?: number | null
          execution_mode?: string
          id?: string
          last_execution?: string | null
          metrics?: Json | null
          next_execution?: string | null
          passed?: boolean | null
          results?: Json | null
          scenario_description?: string | null
          schedule_cron?: string | null
          simulation_name?: string
          simulation_type?: string
          status?: string
          success_criteria?: Json | null
          target_systems?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      success_plan_goals: {
        Row: {
          ai_recommendations: Json | null
          completed_at: string | null
          created_at: string | null
          current_value: number | null
          goal_description: string | null
          goal_title: string
          goal_type: string | null
          id: string
          milestones: Json | null
          owner_id: string | null
          plan_id: string | null
          progress_percentage: number | null
          start_date: string | null
          status: string | null
          target_date: string | null
          target_metric: string | null
          target_value: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          goal_description?: string | null
          goal_title: string
          goal_type?: string | null
          id?: string
          milestones?: Json | null
          owner_id?: string | null
          plan_id?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_value?: number | null
          goal_description?: string | null
          goal_title?: string
          goal_type?: string | null
          id?: string
          milestones?: Json | null
          owner_id?: string | null
          plan_id?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string | null
          target_date?: string | null
          target_metric?: string | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_plan_goals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "success_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      success_plans: {
        Row: {
          actual_completion_date: string | null
          ai_generated: boolean | null
          ai_generation_context: Json | null
          company_id: string | null
          created_at: string | null
          current_health_score: number | null
          id: string
          next_review_date: string | null
          notes: string | null
          objectives: Json | null
          owner_id: string | null
          plan_name: string
          plan_type: string | null
          review_frequency: string | null
          risk_factors: Json | null
          start_date: string | null
          status: string | null
          success_criteria: Json | null
          target_completion_date: string | null
          target_health_score: number | null
          updated_at: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          ai_generated?: boolean | null
          ai_generation_context?: Json | null
          company_id?: string | null
          created_at?: string | null
          current_health_score?: number | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          objectives?: Json | null
          owner_id?: string | null
          plan_name: string
          plan_type?: string | null
          review_frequency?: string | null
          risk_factors?: Json | null
          start_date?: string | null
          status?: string | null
          success_criteria?: Json | null
          target_completion_date?: string | null
          target_health_score?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          ai_generated?: boolean | null
          ai_generation_context?: Json | null
          company_id?: string | null
          created_at?: string | null
          current_health_score?: number | null
          id?: string
          next_review_date?: string | null
          notes?: string | null
          objectives?: Json | null
          owner_id?: string | null
          plan_name?: string
          plan_type?: string | null
          review_frequency?: string | null
          risk_factors?: Json | null
          start_date?: string | null
          status?: string | null
          success_criteria?: Json | null
          target_completion_date?: string | null
          target_health_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "success_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "user_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_approval_requests: {
        Row: {
          action_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string
          id: string
          metadata: Json | null
          rejection_reason: string | null
          request_type: string
          requested_at: string
          requested_by: string | null
          session_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          request_type: string
          requested_at?: string
          requested_by?: string | null
          session_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          request_type?: string
          requested_at?: string
          requested_by?: string | null
          session_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_approval_requests_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "session_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_approval_requests_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "remote_support_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          closed_at: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          first_response_at: string | null
          health_impact: number | null
          id: string
          metadata: Json | null
          priority: string | null
          resolved_at: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          sla_policy_id: string | null
          sla_resolution_due: string | null
          sla_response_due: string | null
          source: string | null
          status: string | null
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          closed_at?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          first_response_at?: string | null
          health_impact?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_policy_id?: string | null
          sla_resolution_due?: string | null
          sla_response_due?: string | null
          source?: string | null
          status?: string | null
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          closed_at?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          first_response_at?: string | null
          health_impact?: number | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          resolved_at?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          sla_policy_id?: string | null
          sla_resolution_due?: string | null
          sla_response_due?: string | null
          source?: string | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_languages: {
        Row: {
          created_at: string | null
          flag_emoji: string | null
          id: string
          is_active: boolean | null
          is_rtl: boolean | null
          locale: string
          name: string
          native_name: string
          tier: number | null
          translation_progress: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          locale: string
          name: string
          native_name: string
          tier?: number | null
          translation_progress?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          is_rtl?: boolean | null
          locale?: string
          name?: string
          native_name?: string
          tier?: number | null
          translation_progress?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      survey_campaigns: {
        Row: {
          avg_score: number | null
          channel: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          response_rate: number | null
          scheduled_at: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["survey_status"] | null
          survey_id: string
          target_companies: string[] | null
          target_segments: string[] | null
          total_responses: number | null
          total_sent: number | null
          updated_at: string | null
        }
        Insert: {
          avg_score?: number | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          response_rate?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          survey_id: string
          target_companies?: string[] | null
          target_segments?: string[] | null
          total_responses?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_score?: number | null
          channel?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          response_rate?: number | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["survey_status"] | null
          survey_id?: string
          target_companies?: string[] | null
          target_segments?: string[] | null
          total_responses?: number | null
          total_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_campaigns_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          campaign_id: string | null
          channel: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          feedback_text: string | null
          gestor_id: string | null
          id: string
          product_id: string | null
          responded_at: string | null
          respondent_email: string | null
          respondent_name: string | null
          score: number
          sentiment: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score: number | null
          survey_id: string
          trigger_context: Json | null
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          gestor_id?: string | null
          id?: string
          product_id?: string | null
          responded_at?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          score: number
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score?: number | null
          survey_id: string
          trigger_context?: Json | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          feedback_text?: string | null
          gestor_id?: string | null
          id?: string
          product_id?: string | null
          responded_at?: string | null
          respondent_email?: string | null
          respondent_name?: string | null
          score?: number
          sentiment?: Database["public"]["Enums"]["sentiment_type"] | null
          sentiment_score?: number | null
          survey_id?: string
          trigger_context?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "survey_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "satisfaction_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_throttling: {
        Row: {
          company_id: string
          contact_id: string | null
          created_at: string
          id: string
          last_ces_survey: string | null
          last_csat_survey: string | null
          last_microsurvey: string | null
          last_nps_survey: string | null
          next_survey_allowed: string | null
          opt_out_reason: string | null
          opted_out: boolean | null
          opted_out_at: string | null
          preferred_channel: string | null
          preferred_frequency: string | null
          surveys_completed_30d: number | null
          surveys_received_30d: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_ces_survey?: string | null
          last_csat_survey?: string | null
          last_microsurvey?: string | null
          last_nps_survey?: string | null
          next_survey_allowed?: string | null
          opt_out_reason?: string | null
          opted_out?: boolean | null
          opted_out_at?: string | null
          preferred_channel?: string | null
          preferred_frequency?: string | null
          surveys_completed_30d?: number | null
          surveys_received_30d?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_ces_survey?: string | null
          last_csat_survey?: string | null
          last_microsurvey?: string | null
          last_nps_survey?: string | null
          next_survey_allowed?: string | null
          opt_out_reason?: string | null
          opted_out?: boolean | null
          opted_out_at?: string | null
          preferred_channel?: string | null
          preferred_frequency?: string | null
          surveys_completed_30d?: number | null
          surveys_received_30d?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_throttling_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_throttling_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_tokens: {
        Row: {
          campaign_id: string
          company_id: string
          contact_id: string | null
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          language: string | null
          prefill_data: Json | null
          token: string
          used_at: string | null
        }
        Insert: {
          campaign_id: string
          company_id: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          language?: string | null
          prefill_data?: Json | null
          token: string
          used_at?: string | null
        }
        Update: {
          campaign_id?: string
          company_id?: string
          contact_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          language?: string | null
          prefill_data?: Json | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_tokens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "survey_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_tokens_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      system_diagnostic_logs: {
        Row: {
          checks: Json
          created_at: string
          diagnostic_type: string
          error_details: string | null
          id: string
          module_key: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          checks?: Json
          created_at?: string
          diagnostic_type: string
          error_details?: string | null
          id?: string
          module_key?: string | null
          status: string
          triggered_by?: string | null
        }
        Update: {
          checks?: Json
          created_at?: string
          diagnostic_type?: string
          error_details?: string | null
          id?: string
          module_key?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          author_role: string | null
          company_logo_url: string | null
          company_name: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metrics: Json | null
          quote: string
          rating: number | null
          sector_id: string | null
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name: string
          author_role?: string | null
          company_logo_url?: string | null
          company_name: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metrics?: Json | null
          quote: string
          rating?: number | null
          sector_id?: string | null
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          author_role?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metrics?: Json | null
          quote?: string
          rating?: number | null
          sector_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      third_party_providers: {
        Row: {
          certifications: string[] | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          created_by: string | null
          criticality: string
          data_access_level: string | null
          data_location: string | null
          exit_strategy: string | null
          id: string
          incident_count: number | null
          last_audit_date: string | null
          next_audit_date: string | null
          notes: string | null
          provider_name: string
          provider_type: string
          risk_level: string | null
          risk_score: number | null
          services_provided: string[] | null
          sla_compliance_rate: number | null
          status: string
          substitute_provider: string | null
          updated_at: string
        }
        Insert: {
          certifications?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          criticality: string
          data_access_level?: string | null
          data_location?: string | null
          exit_strategy?: string | null
          id?: string
          incident_count?: number | null
          last_audit_date?: string | null
          next_audit_date?: string | null
          notes?: string | null
          provider_name: string
          provider_type: string
          risk_level?: string | null
          risk_score?: number | null
          services_provided?: string[] | null
          sla_compliance_rate?: number | null
          status?: string
          substitute_provider?: string | null
          updated_at?: string
        }
        Update: {
          certifications?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: string
          data_access_level?: string | null
          data_location?: string | null
          exit_strategy?: string | null
          id?: string
          incident_count?: number | null
          last_audit_date?: string | null
          next_audit_date?: string | null
          notes?: string | null
          provider_name?: string
          provider_type?: string
          risk_level?: string | null
          risk_score?: number | null
          services_provided?: string[] | null
          sla_compliance_rate?: number | null
          status?: string
          substitute_provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_escalation_rules: {
        Row: {
          auto_assign: boolean | null
          created_at: string | null
          escalate_to_role: string | null
          escalate_to_user: string | null
          escalation_level: number | null
          id: string
          is_active: boolean | null
          name: string
          notification_channels: string[] | null
          trigger_condition: string
          trigger_config: Json | null
        }
        Insert: {
          auto_assign?: boolean | null
          created_at?: string | null
          escalate_to_role?: string | null
          escalate_to_user?: string | null
          escalation_level?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_channels?: string[] | null
          trigger_condition: string
          trigger_config?: Json | null
        }
        Update: {
          auto_assign?: boolean | null
          created_at?: string | null
          escalate_to_role?: string | null
          escalate_to_user?: string | null
          escalation_level?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_channels?: string[] | null
          trigger_condition?: string
          trigger_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_escalation_rules_escalate_to_user_fkey"
            columns: ["escalate_to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          ai_suggested: boolean | null
          attachments: Json | null
          author_id: string | null
          author_type: string | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          ticket_id: string | null
        }
        Insert: {
          ai_suggested?: boolean | null
          attachments?: Json | null
          author_id?: string | null
          author_type?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
        }
        Update: {
          ai_suggested?: boolean | null
          attachments?: Json | null
          author_id?: string | null
          author_type?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_to_value_metrics: {
        Row: {
          achieved_at: string | null
          actual_days: number | null
          company_id: string | null
          created_at: string | null
          id: string
          is_achieved: boolean | null
          metric_type: string
          predicted_days: number | null
          prediction_confidence: number | null
          product_key: string | null
          target_days: number | null
          updated_at: string | null
          value_amount: number | null
          value_indicator: string | null
        }
        Insert: {
          achieved_at?: string | null
          actual_days?: number | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_achieved?: boolean | null
          metric_type: string
          predicted_days?: number | null
          prediction_confidence?: number | null
          product_key?: string | null
          target_days?: number | null
          updated_at?: string | null
          value_amount?: number | null
          value_indicator?: string | null
        }
        Update: {
          achieved_at?: string | null
          actual_days?: number | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_achieved?: boolean | null
          metric_type?: string
          predicted_days?: number | null
          prediction_confidence?: number | null
          product_key?: string | null
          target_days?: number | null
          updated_at?: string | null
          value_amount?: number | null
          value_indicator?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_to_value_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tpp_premium_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string | null
          status: string | null
          tier_id: string | null
          tpp_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tier_id?: string | null
          tpp_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tier_id?: string | null
          tpp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tpp_premium_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "premium_api_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tpp_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          tpp_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          tpp_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          tpp_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "tpp_rate_limits_tpp_id_fkey"
            columns: ["tpp_id"]
            isOneToOne: false
            referencedRelation: "registered_tpps"
            referencedColumns: ["tpp_id"]
          },
        ]
      }
      training_certificates: {
        Row: {
          certificate_number: string
          certificate_url: string | null
          course_id: string
          created_at: string
          enrollment_id: string
          expires_at: string | null
          grade: string | null
          id: string
          is_valid: boolean | null
          issued_at: string
          metadata: Json | null
          revoked_at: string | null
          revoked_reason: string | null
          score: number | null
          skills_acquired: string[] | null
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_number: string
          certificate_url?: string | null
          course_id: string
          created_at?: string
          enrollment_id: string
          expires_at?: string | null
          grade?: string | null
          id?: string
          is_valid?: boolean | null
          issued_at?: string
          metadata?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          score?: number | null
          skills_acquired?: string[] | null
          user_id: string
          verification_code: string
        }
        Update: {
          certificate_number?: string
          certificate_url?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string
          expires_at?: string | null
          grade?: string | null
          id?: string
          is_valid?: boolean | null
          issued_at?: string
          metadata?: Json | null
          revoked_at?: string | null
          revoked_reason?: string | null
          score?: number | null
          skills_acquired?: string[] | null
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_chat_history: {
        Row: {
          content: string
          course_id: string
          created_at: string
          id: string
          lesson_id: string | null
          metadata: Json | null
          role: string
          sources: Json | null
          user_id: string
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          role: string
          sources?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          role?: string
          sources?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      training_content: {
        Row: {
          captions: Json | null
          content_type: string
          content_url: string | null
          created_at: string
          description: Json | null
          duration_seconds: number | null
          external_url: string | null
          file_size_bytes: number | null
          file_type: string | null
          id: string
          is_downloadable: boolean | null
          is_preview: boolean | null
          is_required: boolean | null
          metadata: Json | null
          module_id: string
          quiz_data: Json | null
          sort_order: number | null
          thumbnail_url: string | null
          title: Json
          transcript: Json | null
          updated_at: string
        }
        Insert: {
          captions?: Json | null
          content_type: string
          content_url?: string | null
          created_at?: string
          description?: Json | null
          duration_seconds?: number | null
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_preview?: boolean | null
          is_required?: boolean | null
          metadata?: Json | null
          module_id: string
          quiz_data?: Json | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: Json
          transcript?: Json | null
          updated_at?: string
        }
        Update: {
          captions?: Json | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: Json | null
          duration_seconds?: number | null
          external_url?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_preview?: boolean | null
          is_required?: boolean | null
          metadata?: Json | null
          module_id?: string
          quiz_data?: Json | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: Json
          transcript?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_content_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_course_knowledge: {
        Row: {
          chunk_index: number | null
          content_id: string | null
          content_text: string
          content_type: string | null
          course_id: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json | null
          tokens_count: number | null
        }
        Insert: {
          chunk_index?: number | null
          content_id?: string | null
          content_text: string
          content_type?: string | null
          course_id: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tokens_count?: number | null
        }
        Update: {
          chunk_index?: number | null
          content_id?: string | null
          content_text?: string
          content_type?: string | null
          course_id?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          tokens_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_course_knowledge_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "training_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_course_knowledge_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          base_price: number | null
          category: string
          certification_passing_score: number | null
          completion_rate: number | null
          course_key: string
          created_at: string
          currency: string | null
          description: Json | null
          duration_hours: number | null
          enrollment_count: number | null
          id: string
          instructor_avatar: string | null
          instructor_bio: Json | null
          instructor_id: string | null
          instructor_name: string | null
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          language: string | null
          learning_objectives: Json | null
          level: string
          metadata: Json | null
          preview_video_url: string | null
          published_at: string | null
          rating_average: number | null
          rating_count: number | null
          requirements: Json | null
          requires_certification: boolean | null
          sale_price: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: Json | null
          slug: string
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          target_audience: Json | null
          thumbnail_url: string | null
          title: Json
          total_lessons: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          category?: string
          certification_passing_score?: number | null
          completion_rate?: number | null
          course_key: string
          created_at?: string
          currency?: string | null
          description?: Json | null
          duration_hours?: number | null
          enrollment_count?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_bio?: Json | null
          instructor_id?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          language?: string | null
          learning_objectives?: Json | null
          level?: string
          metadata?: Json | null
          preview_video_url?: string | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          requirements?: Json | null
          requires_certification?: boolean | null
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: Json | null
          slug: string
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          thumbnail_url?: string | null
          title?: Json
          total_lessons?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          category?: string
          certification_passing_score?: number | null
          completion_rate?: number | null
          course_key?: string
          created_at?: string
          currency?: string | null
          description?: Json | null
          duration_hours?: number | null
          enrollment_count?: number | null
          id?: string
          instructor_avatar?: string | null
          instructor_bio?: Json | null
          instructor_id?: string | null
          instructor_name?: string | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          language?: string | null
          learning_objectives?: Json | null
          level?: string
          metadata?: Json | null
          preview_video_url?: string | null
          published_at?: string | null
          rating_average?: number | null
          rating_count?: number | null
          requirements?: Json | null
          requires_certification?: boolean | null
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: Json | null
          slug?: string
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          thumbnail_url?: string | null
          title?: Json
          total_lessons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          certificate_id: string | null
          certificate_issued: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string
          currency: string | null
          enrollment_type: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          notes: string | null
          payment_id: string | null
          price_paid: number | null
          progress_percentage: number | null
          promo_code: string | null
          started_at: string | null
          status: string
          time_spent_minutes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          currency?: string | null
          enrollment_type?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          price_paid?: number | null
          progress_percentage?: number | null
          promo_code?: string | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_id?: string | null
          certificate_issued?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          currency?: string | null
          enrollment_type?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          notes?: string | null
          payment_id?: string | null
          price_paid?: number | null
          progress_percentage?: number | null
          promo_code?: string | null
          started_at?: string | null
          status?: string
          time_spent_minutes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_leaderboard: {
        Row: {
          badges_count: number | null
          certificates_earned: number | null
          courses_completed: number | null
          created_at: string | null
          current_streak_days: number | null
          id: string
          last_activity_at: string | null
          level: number | null
          longest_streak_days: number | null
          quizzes_passed: number | null
          rank_position: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          badges_count?: number | null
          certificates_earned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          longest_streak_days?: number | null
          quizzes_passed?: number | null
          rank_position?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          badges_count?: number | null
          certificates_earned?: number | null
          courses_completed?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_activity_at?: string | null
          level?: number | null
          longest_streak_days?: number | null
          quizzes_passed?: number | null
          rank_position?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          course_id: string
          created_at: string
          description: Json | null
          duration_minutes: number | null
          id: string
          is_locked: boolean | null
          is_preview: boolean | null
          lesson_count: number | null
          module_key: string
          sort_order: number | null
          title: Json
          unlock_after_days: number | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: Json | null
          duration_minutes?: number | null
          id?: string
          is_locked?: boolean | null
          is_preview?: boolean | null
          lesson_count?: number | null
          module_key: string
          sort_order?: number | null
          title?: Json
          unlock_after_days?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: Json | null
          duration_minutes?: number | null
          id?: string
          is_locked?: boolean | null
          is_preview?: boolean | null
          lesson_count?: number | null
          module_key?: string
          sort_order?: number | null
          title?: Json
          unlock_after_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          bookmarks: Json | null
          completed_at: string | null
          content_id: string
          created_at: string
          enrollment_id: string
          id: string
          last_position_seconds: number | null
          notes: string | null
          progress_percentage: number | null
          quiz_attempts: number | null
          quiz_score: number | null
          status: string
          updated_at: string
          watch_time_seconds: number | null
        }
        Insert: {
          bookmarks?: Json | null
          completed_at?: string | null
          content_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          last_position_seconds?: number | null
          notes?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          status?: string
          updated_at?: string
          watch_time_seconds?: number | null
        }
        Update: {
          bookmarks?: Json | null
          completed_at?: string | null
          content_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          last_position_seconds?: number | null
          notes?: string | null
          progress_percentage?: number | null
          quiz_attempts?: number | null
          quiz_score?: number | null
          status?: string
          updated_at?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "training_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quiz_attempts: {
        Row: {
          answers: Json | null
          attempt_number: number | null
          completed_at: string | null
          created_at: string | null
          enrollment_id: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          attempt_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "training_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_quizzes: {
        Row: {
          content_id: string | null
          course_id: string | null
          created_at: string | null
          description: Json | null
          id: string
          is_active: boolean | null
          is_required_for_certificate: boolean | null
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          questions: Json
          quiz_key: string
          show_correct_answers: boolean | null
          shuffle_options: boolean | null
          shuffle_questions: boolean | null
          sort_order: number | null
          time_limit_minutes: number | null
          title: Json | null
          updated_at: string | null
        }
        Insert: {
          content_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          is_required_for_certificate?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          questions?: Json
          quiz_key: string
          show_correct_answers?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title?: Json | null
          updated_at?: string | null
        }
        Update: {
          content_id?: string | null
          course_id?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          is_required_for_certificate?: boolean | null
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          questions?: Json
          quiz_key?: string
          show_correct_answers?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          sort_order?: number | null
          time_limit_minutes?: number | null
          title?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_quizzes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "training_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_reviews: {
        Row: {
          cons: string[] | null
          content: string | null
          course_id: string
          created_at: string
          enrollment_id: string | null
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          pros: string[] | null
          rating: number
          response_at: string | null
          response_by_instructor: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cons?: string[] | null
          content?: string | null
          course_id: string
          created_at?: string
          enrollment_id?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          pros?: string[] | null
          rating: number
          response_at?: string | null
          response_by_instructor?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cons?: string[] | null
          content?: string | null
          course_id?: string
          created_at?: string
          enrollment_id?: string | null
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          pros?: string[] | null
          rating?: number
          response_at?: string | null
          response_by_instructor?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_reviews_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_student_badges: {
        Row: {
          badge_color: string | null
          badge_description: Json | null
          badge_icon: string | null
          badge_key: string
          badge_name: Json | null
          category: string | null
          created_at: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          points_awarded: number | null
          user_id: string
        }
        Insert: {
          badge_color?: string | null
          badge_description?: Json | null
          badge_icon?: string | null
          badge_key: string
          badge_name?: Json | null
          category?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          user_id: string
        }
        Update: {
          badge_color?: string | null
          badge_description?: Json | null
          badge_icon?: string | null
          badge_key?: string
          badge_name?: Json | null
          category?: string | null
          created_at?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points_awarded?: number | null
          user_id?: string
        }
        Relationships: []
      }
      training_student_xp: {
        Row: {
          created_at: string | null
          description: string | null
          earned_at: string | null
          id: string
          metadata: Json | null
          points: number
          source_id: string | null
          source_type: string | null
          user_id: string
          xp_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points: number
          source_id?: string | null
          source_type?: string | null
          user_id: string
          xp_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          source_id?: string | null
          source_type?: string | null
          user_id?: string
          xp_type?: string
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint_id: string | null
          device_name: string | null
          id: string
          is_active: boolean | null
          trusted_at: string
          trusted_by: string | null
          trusted_until: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          trusted_at?: string
          trusted_by?: string | null
          trusted_until?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          trusted_at?: string
          trusted_by?: string | null
          trusted_until?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "user_device_fingerprints"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alert_channels: {
        Row: {
          alert_levels: string[] | null
          channel_config: Json
          channel_type: string
          cnae_filter: string[] | null
          created_at: string
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sector_filter: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_levels?: string[] | null
          channel_config?: Json
          channel_type: string
          cnae_filter?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sector_filter?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_levels?: string[] | null
          channel_config?: Json
          channel_type?: string
          cnae_filter?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sector_filter?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_alert_channels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_patterns: {
        Row: {
          avg_session_duration: number | null
          created_at: string | null
          id: string
          last_analyzed_at: string | null
          typical_actions_per_session: number | null
          typical_devices: Json | null
          typical_locations: Json | null
          typical_login_hours: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_session_duration?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          typical_actions_per_session?: number | null
          typical_devices?: Json | null
          typical_locations?: Json | null
          typical_login_hours?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_session_duration?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          typical_actions_per_session?: number | null
          typical_devices?: Json | null
          typical_locations?: Json | null
          typical_login_hours?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_device_fingerprints: {
        Row: {
          browser_info: Json | null
          created_at: string | null
          device_hash: string
          first_seen_at: string | null
          id: string
          is_trusted: boolean | null
          language: string | null
          last_ip: string | null
          last_location: string | null
          last_seen_at: string | null
          login_count: number | null
          os_info: Json | null
          screen_resolution: string | null
          timezone: string | null
          trust_expires_at: string | null
          user_id: string
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string | null
          device_hash: string
          first_seen_at?: string | null
          id?: string
          is_trusted?: boolean | null
          language?: string | null
          last_ip?: string | null
          last_location?: string | null
          last_seen_at?: string | null
          login_count?: number | null
          os_info?: Json | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_expires_at?: string | null
          user_id: string
        }
        Update: {
          browser_info?: Json | null
          created_at?: string | null
          device_hash?: string
          first_seen_at?: string | null
          id?: string
          is_trusted?: boolean | null
          language?: string | null
          last_ip?: string | null
          last_location?: string | null
          last_seen_at?: string | null
          login_count?: number | null
          os_info?: Json | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_location_history: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          is_vpn: boolean | null
          latitude: number | null
          longitude: number | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          latitude?: number | null
          longitude?: number | null
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          latitude?: number | null
          longitude?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_login_locations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_proxy: boolean | null
          is_vpn: boolean | null
          isp: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_passkeys: {
        Row: {
          active: boolean
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_suggestions: {
        Row: {
          admin_notes: string | null
          ai_response: string | null
          category: string | null
          context: string | null
          created_at: string
          id: string
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string | null
          suggestion_text: string
          updated_at: string
          user_id: string | null
          votes_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          ai_response?: string | null
          category?: string | null
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          suggestion_text: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          ai_response?: string | null
          category?: string | null
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          suggestion_text?: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number | null
        }
        Relationships: []
      }
      vertical_bpmn_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          process_definition: Json | null
          template_key: string
          template_name: string
          vertical_pack_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          process_definition?: Json | null
          template_key: string
          template_name: string
          vertical_pack_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          process_definition?: Json | null
          template_key?: string
          template_name?: string
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_bpmn_templates_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_dashboards: {
        Row: {
          created_at: string | null
          dashboard_key: string
          dashboard_name: string
          id: string
          is_default: boolean | null
          layout: Json | null
          vertical_pack_id: string | null
          widgets: Json | null
        }
        Insert: {
          created_at?: string | null
          dashboard_key: string
          dashboard_name: string
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          vertical_pack_id?: string | null
          widgets?: Json | null
        }
        Update: {
          created_at?: string | null
          dashboard_key?: string
          dashboard_name?: string
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          vertical_pack_id?: string | null
          widgets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_dashboards_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_integrations: {
        Row: {
          api_type: string | null
          config_schema: Json | null
          created_at: string | null
          documentation_url: string | null
          id: string
          integration_key: string
          integration_name: string
          is_active: boolean | null
          is_required: boolean | null
          provider: string | null
          vertical_pack_id: string | null
        }
        Insert: {
          api_type?: string | null
          config_schema?: Json | null
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          integration_key: string
          integration_name: string
          is_active?: boolean | null
          is_required?: boolean | null
          provider?: string | null
          vertical_pack_id?: string | null
        }
        Update: {
          api_type?: string | null
          config_schema?: Json | null
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          integration_key?: string
          integration_name?: string
          is_active?: boolean | null
          is_required?: boolean | null
          provider?: string | null
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_integrations_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_modules: {
        Row: {
          component_path: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_core: boolean | null
          module_key: string
          module_name: string
          updated_at: string | null
          vertical_pack_id: string | null
        }
        Insert: {
          component_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          module_key: string
          module_name: string
          updated_at?: string | null
          vertical_pack_id?: string | null
        }
        Update: {
          component_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          module_key?: string
          module_name?: string
          updated_at?: string | null
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_modules_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_packs: {
        Row: {
          bpmn_templates: Json | null
          cnae_codes: string[]
          color_scheme: Json | null
          created_at: string | null
          dashboard_templates: Json | null
          demo_config: Json | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          included_integrations: string[] | null
          included_modules: string[]
          is_active: boolean | null
          pricing_config: Json | null
          updated_at: string | null
          vertical_key: string
          vertical_name: string
        }
        Insert: {
          bpmn_templates?: Json | null
          cnae_codes?: string[]
          color_scheme?: Json | null
          created_at?: string | null
          dashboard_templates?: Json | null
          demo_config?: Json | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          included_integrations?: string[] | null
          included_modules?: string[]
          is_active?: boolean | null
          pricing_config?: Json | null
          updated_at?: string | null
          vertical_key: string
          vertical_name: string
        }
        Update: {
          bpmn_templates?: Json | null
          cnae_codes?: string[]
          color_scheme?: Json | null
          created_at?: string | null
          dashboard_templates?: Json | null
          demo_config?: Json | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          included_integrations?: string[] | null
          included_modules?: string[]
          is_active?: boolean | null
          pricing_config?: Json | null
          updated_at?: string | null
          vertical_key?: string
          vertical_name?: string
        }
        Relationships: []
      }
      visit_participants: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_participants_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reminder_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          minutes_before: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          minutes_before?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          minutes_before?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_sheet_audit: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
          visit_sheet_id: string
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
          visit_sheet_id: string
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
          visit_sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheet_audit_visit_sheet_id_fkey"
            columns: ["visit_sheet_id"]
            isOneToOne: false
            referencedRelation: "visit_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_sheet_photos: {
        Row: {
          created_at: string
          id: string
          photo_caption: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string | null
          visit_sheet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_caption?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by?: string | null
          visit_sheet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_caption?: string | null
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visit_sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheet_photos_visit_sheet_id_fkey"
            columns: ["visit_sheet_id"]
            isOneToOne: false
            referencedRelation: "visit_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_sheet_templates: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      visit_sheets: {
        Row: {
          acciones_acordadas: Json | null
          actualizacion_kyc: string | null
          ahorro_inversion_disponible: number | null
          ai_generated_at: string | null
          ai_next_steps: string[] | null
          ai_risks: string[] | null
          ai_summary: string | null
          canal: string | null
          cargo_contacto: string | null
          company_id: string
          created_at: string
          diagnostico_inicial: Json | null
          documentacion_pendiente: string | null
          duracion: number | null
          ebitda_estimado: number | null
          email_contacto: string | null
          endeudamiento_particular: number | null
          endeudamiento_total: number | null
          facturacion_anual: number | null
          fecha: string
          firma_digital: string | null
          firma_fecha: string | null
          firma_nombre_firmante: string | null
          gestor_id: string
          hora: string | null
          id: string
          ingresos_netos_mensuales: number | null
          liquidez_disponible: number | null
          necesidades_detectadas: Json | null
          nivel_vinculacion_recomendado: string | null
          notas_gestor: string | null
          oportunidades_futuras: string | null
          persona_contacto: string | null
          potencial_anual_estimado: number | null
          probabilidad_cierre: number | null
          productos_actuales: Json | null
          productos_ofrecidos: Json | null
          productos_servicios: Json | null
          propuesta_valor: Json | null
          proxima_cita: string | null
          proxima_llamada: string | null
          renovaciones: string | null
          responsable_seguimiento: string | null
          resultado_oferta: string | null
          revision_cartera: string | null
          riesgos_cumplimiento: Json | null
          situacion_laboral: string | null
          telefono_contacto: string | null
          template_id: string | null
          tipo_cliente: string | null
          tipo_visita: string | null
          tpv_volumen_mensual: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          validation_status: string | null
          visit_id: string
        }
        Insert: {
          acciones_acordadas?: Json | null
          actualizacion_kyc?: string | null
          ahorro_inversion_disponible?: number | null
          ai_generated_at?: string | null
          ai_next_steps?: string[] | null
          ai_risks?: string[] | null
          ai_summary?: string | null
          canal?: string | null
          cargo_contacto?: string | null
          company_id: string
          created_at?: string
          diagnostico_inicial?: Json | null
          documentacion_pendiente?: string | null
          duracion?: number | null
          ebitda_estimado?: number | null
          email_contacto?: string | null
          endeudamiento_particular?: number | null
          endeudamiento_total?: number | null
          facturacion_anual?: number | null
          fecha: string
          firma_digital?: string | null
          firma_fecha?: string | null
          firma_nombre_firmante?: string | null
          gestor_id: string
          hora?: string | null
          id?: string
          ingresos_netos_mensuales?: number | null
          liquidez_disponible?: number | null
          necesidades_detectadas?: Json | null
          nivel_vinculacion_recomendado?: string | null
          notas_gestor?: string | null
          oportunidades_futuras?: string | null
          persona_contacto?: string | null
          potencial_anual_estimado?: number | null
          probabilidad_cierre?: number | null
          productos_actuales?: Json | null
          productos_ofrecidos?: Json | null
          productos_servicios?: Json | null
          propuesta_valor?: Json | null
          proxima_cita?: string | null
          proxima_llamada?: string | null
          renovaciones?: string | null
          responsable_seguimiento?: string | null
          resultado_oferta?: string | null
          revision_cartera?: string | null
          riesgos_cumplimiento?: Json | null
          situacion_laboral?: string | null
          telefono_contacto?: string | null
          template_id?: string | null
          tipo_cliente?: string | null
          tipo_visita?: string | null
          tpv_volumen_mensual?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          visit_id: string
        }
        Update: {
          acciones_acordadas?: Json | null
          actualizacion_kyc?: string | null
          ahorro_inversion_disponible?: number | null
          ai_generated_at?: string | null
          ai_next_steps?: string[] | null
          ai_risks?: string[] | null
          ai_summary?: string | null
          canal?: string | null
          cargo_contacto?: string | null
          company_id?: string
          created_at?: string
          diagnostico_inicial?: Json | null
          documentacion_pendiente?: string | null
          duracion?: number | null
          ebitda_estimado?: number | null
          email_contacto?: string | null
          endeudamiento_particular?: number | null
          endeudamiento_total?: number | null
          facturacion_anual?: number | null
          fecha?: string
          firma_digital?: string | null
          firma_fecha?: string | null
          firma_nombre_firmante?: string | null
          gestor_id?: string
          hora?: string | null
          id?: string
          ingresos_netos_mensuales?: number | null
          liquidez_disponible?: number | null
          necesidades_detectadas?: Json | null
          nivel_vinculacion_recomendado?: string | null
          notas_gestor?: string | null
          oportunidades_futuras?: string | null
          persona_contacto?: string | null
          potencial_anual_estimado?: number | null
          probabilidad_cierre?: number | null
          productos_actuales?: Json | null
          productos_ofrecidos?: Json | null
          productos_servicios?: Json | null
          propuesta_valor?: Json | null
          proxima_cita?: string | null
          proxima_llamada?: string | null
          renovaciones?: string | null
          responsable_seguimiento?: string | null
          resultado_oferta?: string | null
          revision_cartera?: string | null
          riesgos_cumplimiento?: Json | null
          situacion_laboral?: string | null
          telefono_contacto?: string | null
          template_id?: string | null
          tipo_cliente?: string | null
          tipo_visita?: string | null
          tpv_volumen_mensual?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_responsable_seguimiento_fkey"
            columns: ["responsable_seguimiento"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "visit_sheet_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_questions: {
        Row: {
          confidence_score: number | null
          converted_to_faq: boolean | null
          created_at: string | null
          id: string
          ip_country: string | null
          matched_faq_id: string | null
          question: string
          resolved: boolean | null
          response: string | null
          sentiment: string | null
          session_id: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          confidence_score?: number | null
          converted_to_faq?: boolean | null
          created_at?: string | null
          id?: string
          ip_country?: string | null
          matched_faq_id?: string | null
          question: string
          resolved?: boolean | null
          response?: string | null
          sentiment?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          confidence_score?: number | null
          converted_to_faq?: boolean | null
          created_at?: string | null
          id?: string
          ip_country?: string | null
          matched_faq_id?: string | null
          question?: string
          resolved?: boolean | null
          response?: string | null
          sentiment?: string | null
          session_id?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_questions_matched_faq_id_fkey"
            columns: ["matched_faq_id"]
            isOneToOne: false
            referencedRelation: "faqs"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          company_id: string
          created_at: string | null
          gestor_id: string
          id: string
          notes: string | null
          pactos_realizados: string | null
          porcentaje_vinculacion: number | null
          productos_ofrecidos: string[] | null
          result: string | null
          visit_date: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          gestor_id: string
          id?: string
          notes?: string | null
          pactos_realizados?: string | null
          porcentaje_vinculacion?: number | null
          productos_ofrecidos?: string[] | null
          result?: string | null
          visit_date: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          gestor_id?: string
          id?: string
          notes?: string | null
          pactos_realizados?: string | null
          porcentaje_vinculacion?: number | null
          productos_ofrecidos?: string[] | null
          result?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voc_analytics_cache: {
        Row: {
          avg_resolution_hours: number | null
          calculated_at: string
          ces_avg: number | null
          csat_avg: number | null
          detractors_count: number | null
          emotion_distribution: Json | null
          feedback_loops_closed: number | null
          feedback_loops_total: number | null
          gestor_id: string | null
          id: string
          nps_responses: number | null
          nps_score: number | null
          office: string | null
          passives_count: number | null
          period_end: string
          period_start: string
          predicted_nps_avg: number | null
          prediction_accuracy_avg: number | null
          prediction_coverage: number | null
          promoters_count: number | null
          recovery_rate: number | null
          segment: string | null
          sentiment_avg: number | null
          top_topics: Json | null
        }
        Insert: {
          avg_resolution_hours?: number | null
          calculated_at?: string
          ces_avg?: number | null
          csat_avg?: number | null
          detractors_count?: number | null
          emotion_distribution?: Json | null
          feedback_loops_closed?: number | null
          feedback_loops_total?: number | null
          gestor_id?: string | null
          id?: string
          nps_responses?: number | null
          nps_score?: number | null
          office?: string | null
          passives_count?: number | null
          period_end: string
          period_start: string
          predicted_nps_avg?: number | null
          prediction_accuracy_avg?: number | null
          prediction_coverage?: number | null
          promoters_count?: number | null
          recovery_rate?: number | null
          segment?: string | null
          sentiment_avg?: number | null
          top_topics?: Json | null
        }
        Update: {
          avg_resolution_hours?: number | null
          calculated_at?: string
          ces_avg?: number | null
          csat_avg?: number | null
          detractors_count?: number | null
          emotion_distribution?: Json | null
          feedback_loops_closed?: number | null
          feedback_loops_total?: number | null
          gestor_id?: string | null
          id?: string
          nps_responses?: number | null
          nps_score?: number | null
          office?: string | null
          passives_count?: number | null
          period_end?: string
          period_start?: string
          predicted_nps_avg?: number | null
          prediction_accuracy_avg?: number | null
          prediction_coverage?: number | null
          promoters_count?: number | null
          recovery_rate?: number | null
          segment?: string | null
          sentiment_avg?: number | null
          top_topics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voc_analytics_cache_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vrp_mandates: {
        Row: {
          consent_id: string | null
          created_at: string | null
          creditor_account: string
          creditor_name: string
          currency: string | null
          debtor_account: string
          frequency: string
          id: string
          max_amount: number
          max_per_period: number | null
          reference: string | null
          status: string | null
          tpp_id: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          consent_id?: string | null
          created_at?: string | null
          creditor_account: string
          creditor_name: string
          currency?: string | null
          debtor_account: string
          frequency: string
          id?: string
          max_amount: number
          max_per_period?: number | null
          reference?: string | null
          status?: string | null
          tpp_id: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          consent_id?: string | null
          created_at?: string | null
          creditor_account?: string
          creditor_name?: string
          currency?: string | null
          debtor_account?: string
          frequency?: string
          id?: string
          max_amount?: number
          max_per_period?: number | null
          reference?: string | null
          status?: string | null
          tpp_id?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrp_mandates_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "open_banking_consents"
            referencedColumns: ["id"]
          },
        ]
      }
      vrp_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          end_to_end_id: string
          execution_date: string | null
          failure_reason: string | null
          id: string
          mandate_id: string | null
          payment_reference: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          end_to_end_id: string
          execution_date?: string | null
          failure_reason?: string | null
          id?: string
          mandate_id?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          end_to_end_id?: string
          execution_date?: string | null
          failure_reason?: string | null
          id?: string
          mandate_id?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrp_payments_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "vrp_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          notification_id: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_delivery_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "notification_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_campaign_participants: {
        Row: {
          ab_variant: string | null
          campaign_id: string | null
          company_id: string | null
          contact_email: string | null
          contact_name: string | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string | null
          enrolled_at: string | null
          first_contact_at: string | null
          id: string
          last_contact_at: string | null
          response_data: Json | null
          status: string | null
          touchpoints: number | null
          updated_at: string | null
        }
        Insert: {
          ab_variant?: string | null
          campaign_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          response_data?: Json | null
          status?: string | null
          touchpoints?: number | null
          updated_at?: string | null
        }
        Update: {
          ab_variant?: string | null
          campaign_id?: string | null
          company_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          first_contact_at?: string | null
          id?: string
          last_contact_at?: string | null
          response_data?: Json | null
          status?: string | null
          touchpoints?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "winback_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_campaign_participants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_campaigns: {
        Row: {
          ab_variants: Json | null
          budget: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_ab_test: boolean | null
          name: string
          offer_details: Json | null
          offer_type: string | null
          start_date: string | null
          status: string | null
          target_segment: Json | null
          updated_at: string | null
        }
        Insert: {
          ab_variants?: Json | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_ab_test?: boolean | null
          name: string
          offer_details?: Json | null
          offer_type?: string | null
          start_date?: string | null
          status?: string | null
          target_segment?: Json | null
          updated_at?: string | null
        }
        Update: {
          ab_variants?: Json | null
          budget?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_ab_test?: boolean | null
          name?: string
          offer_details?: Json | null
          offer_type?: string | null
          start_date?: string | null
          status?: string | null
          target_segment?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      winback_conversions: {
        Row: {
          campaign_id: string | null
          company_id: string | null
          conversion_date: string | null
          created_at: string | null
          id: string
          lifetime_value_recovered: number | null
          notes: string | null
          offer_applied: Json | null
          participant_id: string | null
          previous_mrr: number | null
          recovered_mrr: number | null
          retention_months: number | null
        }
        Insert: {
          campaign_id?: string | null
          company_id?: string | null
          conversion_date?: string | null
          created_at?: string | null
          id?: string
          lifetime_value_recovered?: number | null
          notes?: string | null
          offer_applied?: Json | null
          participant_id?: string | null
          previous_mrr?: number | null
          recovered_mrr?: number | null
          retention_months?: number | null
        }
        Update: {
          campaign_id?: string | null
          company_id?: string | null
          conversion_date?: string | null
          created_at?: string | null
          id?: string
          lifetime_value_recovered?: number | null
          notes?: string | null
          offer_applied?: Json | null
          participant_id?: string | null
          previous_mrr?: number | null
          recovered_mrr?: number | null
          retention_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "winback_conversions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "winback_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_conversions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winback_conversions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "winback_campaign_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_service_quote: {
        Args: {
          p_client_notes?: string
          p_quote_id: string
          p_signature_data: string
        }
        Returns: Json
      }
      anonymize_financial_data_for_training: {
        Args: {
          p_data_type: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      calculate_adoption_score: {
        Args: { p_company_id: string }
        Returns: Json
      }
      calculate_cnae_price: {
        Args: {
          p_cnae_code: string
          p_company_turnover?: number
          p_existing_cnaes?: number
        }
        Returns: Json
      }
      calculate_customer_360: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      calculate_nps: {
        Args: { p_detractors: number; p_passives: number; p_promoters: number }
        Returns: number
      }
      calculate_quote_totals: {
        Args: { p_quote_id: string }
        Returns: {
          subtotal: number
          tax_amount: number
          total: number
        }[]
      }
      calculate_student_level: { Args: { xp_points: number }; Returns: number }
      can_send_survey: {
        Args: {
          p_company_id: string
          p_contact_id: string
          p_survey_type: string
        }
        Returns: boolean
      }
      can_view_alert: {
        Args: { _alert_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_alert_history: {
        Args: { _alert_history_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_visit_sheet: {
        Args: { _user_id: string; _visit_sheet_id: string }
        Returns: boolean
      }
      check_expiring_acknowledgments: { Args: never; Returns: undefined }
      check_low_usage_alerts: { Args: never; Returns: undefined }
      check_pending_acknowledgments: { Args: never; Returns: undefined }
      check_tpp_rate_limit: {
        Args: { p_endpoint: string; p_tpp_id: string }
        Returns: boolean
      }
      cleanup_expired_training_data: { Args: never; Returns: number }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_tpp_rate_limits: { Args: never; Returns: undefined }
      detect_process_bottlenecks: {
        Args: { p_date_from?: string; p_process_definition_id?: string }
        Returns: {
          avg_duration_ms: number
          bottleneck_score: number
          event_count: number
          max_duration_ms: number
          min_duration_ms: number
          node_id: string
        }[]
      }
      emit_process_event: {
        Args: {
          p_action: string
          p_actor_type?: string
          p_entity_id: string
          p_entity_type: string
          p_from_state?: string
          p_metadata?: Json
          p_to_state?: string
        }
        Returns: string
      }
      expire_open_banking_consents: { Args: never; Returns: undefined }
      expire_pending_approval_requests: { Args: never; Returns: undefined }
      find_applicable_bundles: {
        Args: { p_cnae_codes: string[] }
        Returns: {
          bundle_id: string
          bundle_name: string
          discount_percentage: number
          match_count: number
          matching_cnaes: string[]
        }[]
      }
      generate_remote_access_pin: {
        Args: { p_installation_id: string; p_valid_hours?: number }
        Returns: string
      }
      get_company_chart_of_accounts: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_customer_quote_by_token: {
        Args: { p_email: string; p_quote_id: string }
        Returns: {
          customer_company: string
          customer_email: string
          customer_name: string
          items: Json
          quote_id: string
          status: string
          valid_until: string
        }[]
      }
      get_installed_modules: {
        Args: { _organization_id?: string }
        Returns: {
          category: Database["public"]["Enums"]["module_category"]
          license_type: Database["public"]["Enums"]["license_type"]
          module_key: string
          module_name: string
          sector: Database["public"]["Enums"]["sector_type"]
          settings: Json
          valid_until: string
        }[]
      }
      get_process_mining_stats: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_entity_type?: string
        }
        Returns: Json
      }
      get_sector_ratios: { Args: { p_cnae_code: string }; Returns: Json }
      get_sector_regulations: {
        Args: { _sector_key: string }
        Returns: {
          authority: string
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          regulation_code: string
          regulation_name: string
          requirements: Json
          summary: string
        }[]
      }
      get_turnover_tier: { Args: { p_turnover: number }; Returns: string }
      get_volume_discount: { Args: { p_cnae_count: number }; Returns: number }
      get_zscore_coefficients: { Args: { p_sector_key: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_read_count: { Args: { article_id: string }; Returns: undefined }
      is_admin_or_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_mfa_required_for_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_module_installed: {
        Args: { _module_key: string; _organization_id?: string }
        Returns: boolean
      }
      is_partner_member: {
        Args: { _partner_company_id: string; _user_id: string }
        Returns: boolean
      }
      is_visit_gestor: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
      }
      is_visit_participant: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
      }
      load_sector_compliance: {
        Args: { p_organization_id: string; p_sector: string }
        Returns: number
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_category?: string
          p_ip_address?: unknown
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_severity?: string
          p_table_name: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_cms_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_name?: string
          p_entity_type: string
          p_new_value?: Json
          p_old_value?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
          _severity?: string
        }
        Returns: undefined
      }
      publish_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_channel_name: string
          p_event_type?: string
          p_message: string
          p_metadata?: Json
          p_priority?: number
          p_severity?: string
          p_target_roles?: string[]
          p_target_user_ids?: string[]
          p_title: string
        }
        Returns: string[]
      }
      search_financial_embeddings: {
        Args: {
          filter_company_id?: string
          filter_fiscal_year?: number
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          company_id: string
          content: string
          document_type: string
          fiscal_year: number
          id: string
          metadata: Json
          similarity: number
          statement_id: string
        }[]
      }
      subscribe_to_channel: {
        Args: {
          p_channel_name: string
          p_delivery_methods?: string[]
          p_user_id: string
        }
        Returns: string
      }
      update_leaderboard_counters: {
        Args: { p_counter: string; p_increment?: number; p_user_id: string }
        Returns: undefined
      }
      update_translation_progress_for_locale: {
        Args: { p_locale: string }
        Returns: undefined
      }
      validate_accounting_sync: {
        Args: { p_company_id: string }
        Returns: Json
      }
      validate_remote_access_pin: {
        Args: { p_installation_id: string; p_pin: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin"
        | "user"
        | "auditor"
        | "director_comercial"
        | "director_oficina"
        | "responsable_comercial"
      auth_factor_type:
        | "password"
        | "otp_email"
        | "otp_sms"
        | "device_trust"
        | "biometric"
        | "security_question"
      auth_risk_level: "low" | "medium" | "high" | "critical"
      financial_data_source: "manual" | "pdf_import"
      financial_statement_status: "draft" | "submitted" | "approved"
      financial_statement_type: "normal" | "abreujat" | "simplificat"
      impact_level: "critical" | "high" | "medium" | "low" | "informative"
      license_type: "perpetual" | "subscription" | "trial" | "free"
      module_category: "core" | "horizontal" | "vertical" | "addon"
      provisional_period_type: "quarterly" | "semiannual" | "annual"
      regulation_status:
        | "active"
        | "pending"
        | "superseded"
        | "expired"
        | "draft"
      sector_type:
        | "banking"
        | "health"
        | "industry"
        | "retail"
        | "realestate"
        | "technology"
        | "education"
        | "hospitality"
        | "logistics"
        | "energy"
        | "agriculture"
        | "professional"
        | "government"
      sentiment_type: "positive" | "neutral" | "negative" | "mixed"
      survey_status: "draft" | "active" | "paused" | "completed"
      survey_trigger:
        | "manual"
        | "post_visit"
        | "post_ticket"
        | "milestone"
        | "periodic"
        | "post_onboarding"
      survey_type: "nps" | "csat" | "ces"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "superadmin",
        "admin",
        "user",
        "auditor",
        "director_comercial",
        "director_oficina",
        "responsable_comercial",
      ],
      auth_factor_type: [
        "password",
        "otp_email",
        "otp_sms",
        "device_trust",
        "biometric",
        "security_question",
      ],
      auth_risk_level: ["low", "medium", "high", "critical"],
      financial_data_source: ["manual", "pdf_import"],
      financial_statement_status: ["draft", "submitted", "approved"],
      financial_statement_type: ["normal", "abreujat", "simplificat"],
      impact_level: ["critical", "high", "medium", "low", "informative"],
      license_type: ["perpetual", "subscription", "trial", "free"],
      module_category: ["core", "horizontal", "vertical", "addon"],
      provisional_period_type: ["quarterly", "semiannual", "annual"],
      regulation_status: [
        "active",
        "pending",
        "superseded",
        "expired",
        "draft",
      ],
      sector_type: [
        "banking",
        "health",
        "industry",
        "retail",
        "realestate",
        "technology",
        "education",
        "hospitality",
        "logistics",
        "energy",
        "agriculture",
        "professional",
        "government",
      ],
      sentiment_type: ["positive", "neutral", "negative", "mixed"],
      survey_status: ["draft", "active", "paused", "completed"],
      survey_trigger: [
        "manual",
        "post_visit",
        "post_ticket",
        "milestone",
        "periodic",
        "post_onboarding",
      ],
      survey_type: ["nps", "csat", "ces"],
    },
  },
} as const
