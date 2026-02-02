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
      admin_exports: {
        Row: {
          admin_id: string
          created_at: string
          file_url: string | null
          format: string
          id: string
          params_json: Json
        }
        Insert: {
          admin_id: string
          created_at?: string
          file_url?: string | null
          format: string
          id?: string
          params_json: Json
        }
        Update: {
          admin_id?: string
          created_at?: string
          file_url?: string | null
          format?: string
          id?: string
          params_json?: Json
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          cohort_id: string | null
          coverage_metrics: Json
          created_at: string | null
          id: string
          snapshot_date: string
        }
        Insert: {
          cohort_id?: string | null
          coverage_metrics: Json
          created_at?: string | null
          id?: string
          snapshot_date: string
        }
        Update: {
          cohort_id?: string | null
          coverage_metrics?: Json
          created_at?: string | null
          id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          feedback: string | null
          file_url: string | null
          grade: number | null
          id: string
          student_id: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          student_id?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          id?: string
          student_id?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments_lms"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          attempts_allowed: number | null
          case_id: string | null
          cohort_id: string | null
          created_at: string | null
          deadline_at: string | null
          end_at: string
          id: string
          start_at: string
          time_limit: number | null
        }
        Insert: {
          attempts_allowed?: number | null
          case_id?: string | null
          cohort_id?: string | null
          created_at?: string | null
          deadline_at?: string | null
          end_at: string
          id?: string
          start_at: string
          time_limit?: number | null
        }
        Update: {
          attempts_allowed?: number | null
          case_id?: string | null
          cohort_id?: string | null
          created_at?: string | null
          deadline_at?: string | null
          end_at?: string
          id?: string
          start_at?: string
          time_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments_lms: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          module_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          module_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          module_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_lms_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      case_versions: {
        Row: {
          case_id: string | null
          change_log: string | null
          clinical_json: Json
          created_at: string | null
          id: string
          version: number
        }
        Insert: {
          case_id?: string | null
          change_log?: string | null
          clinical_json: Json
          created_at?: string | null
          id?: string
          version: number
        }
        Update: {
          case_id?: string | null
          change_log?: string | null
          clinical_json?: Json
          created_at?: string | null
          id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_versions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          cbdc_tags: Json | null
          clinical_json: Json
          created_at: string | null
          created_by: string | null
          difficulty: string | null
          id: string
          slug: string
          status: Database["public"]["Enums"]["case_status"] | null
          subject: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cbdc_tags?: Json | null
          clinical_json: Json
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["case_status"] | null
          subject: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cbdc_tags?: Json | null
          clinical_json?: Json
          created_at?: string | null
          created_by?: string | null
          difficulty?: string | null
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["case_status"] | null
          subject?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cbdc_matrix: {
        Row: {
          competency_id: string
          created_at: string | null
          description: string | null
          id: string
          slo_id: string
          source_pdf_reference: string | null
        }
        Insert: {
          competency_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          slo_id: string
          source_pdf_reference?: string | null
        }
        Update: {
          competency_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          slo_id?: string
          source_pdf_reference?: string | null
        }
        Relationships: []
      }
      cohorts: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          faculty_id: string | null
          id: string
          is_published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          id?: string
          is_published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          faculty_id?: string | null
          id?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          cohort_id: string | null
          created_at: string
          id: string
          metrics: Json
          period: string
          snapshot_date: string
        }
        Insert: {
          cohort_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          period: string
          snapshot_date: string
        }
        Update: {
          cohort_id?: string | null
          created_at?: string
          id?: string
          metrics?: Json
          period?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_snapshots_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string
          module_id: string | null
          title: string
          type: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          title: string
          type: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          module_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      mcqs: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          question_json: Json
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          question_json: Json
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          question_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mcqs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          module_id: string | null
          student_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string | null
          student_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          module_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          institution_id?: string | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          quiz_id: string | null
          score: number | null
          student_id: string | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          student_id?: string | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          quiz_id?: string | null
          score?: number | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string | null
          explanation: string | null
          id: string
          options: Json
          question: string
          quiz_id: string | null
        }
        Insert: {
          correct_index: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options: Json
          question: string
          quiz_id?: string | null
        }
        Update: {
          correct_index?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          id: string
          module_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          module_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          module_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          case_id: string | null
          created_at: string | null
          id: string
          rubric_json: Json
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          rubric_json: Json
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          id?: string
          rubric_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          actions: Json | null
          assignment_id: string | null
          created_at: string | null
          end_at: string | null
          id: string
          score_json: Json | null
          start_at: string | null
          status: string | null
          student_id: string | null
          transcript: Json | null
        }
        Insert: {
          actions?: Json | null
          assignment_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          score_json?: Json | null
          start_at?: string | null
          status?: string | null
          student_id?: string | null
          transcript?: Json | null
        }
        Update: {
          actions?: Json | null
          assignment_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          score_json?: Json | null
          start_at?: string | null
          status?: string | null
          student_id?: string | null
          transcript?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_runs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "faculty" | "student" | "admin"
      case_status: "draft" | "pending" | "approved" | "archived"
      miller_level: "Knows" | "KnowsHow" | "ShowsHow" | "Does"
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
      app_role: ["faculty", "student", "admin"],
      case_status: ["draft", "pending", "approved", "archived"],
      miller_level: ["Knows", "KnowsHow", "ShowsHow", "Does"],
    },
  },
} as const
