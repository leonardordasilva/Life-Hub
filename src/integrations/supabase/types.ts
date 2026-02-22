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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ent_animes: {
        Row: {
          created_at: string
          external_id: string | null
          finished_at: string | null
          genres: string[] | null
          id: string
          poster_url: string | null
          rating: number | null
          status: string
          synopsis: string | null
          title: string
          total_episodes: number | null
          user_id: string
          watched_episodes: number | null
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title: string
          total_episodes?: number | null
          user_id?: string
          watched_episodes?: number | null
        }
        Update: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title?: string
          total_episodes?: number | null
          user_id?: string
          watched_episodes?: number | null
        }
        Relationships: []
      }
      ent_books: {
        Row: {
          author: string | null
          created_at: string
          external_id: string | null
          finished_at: string | null
          genres: string[] | null
          id: string
          isbn: string | null
          poster_url: string | null
          rating: number | null
          release_date: string | null
          status: string
          synopsis: string | null
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          isbn?: string | null
          poster_url?: string | null
          rating?: number | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title: string
          user_id?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          isbn?: string | null
          poster_url?: string | null
          rating?: number | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ent_games: {
        Row: {
          created_at: string
          external_id: string | null
          finished_at: string | null
          genres: string[] | null
          id: string
          platform: string | null
          poster_url: string | null
          rating: number | null
          status: string
          synopsis: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          platform?: string | null
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          platform?: string | null
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ent_movies: {
        Row: {
          created_at: string
          external_id: string | null
          finished_at: string | null
          genres: string[] | null
          id: string
          poster_url: string | null
          rating: number | null
          release_date: string | null
          status: string
          synopsis: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          poster_url?: string | null
          rating?: number | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          poster_url?: string | null
          rating?: number | null
          release_date?: string | null
          status?: string
          synopsis?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ent_series: {
        Row: {
          created_at: string
          current_season: number | null
          current_season_episodes: number | null
          current_season_watched: number | null
          external_id: string | null
          finished_at: string | null
          genres: string[] | null
          id: string
          platform: string | null
          poster_url: string | null
          rating: number | null
          status: string
          synopsis: string | null
          title: string
          total_seasons: number | null
          user_id: string
          watched_seasons: number | null
        }
        Insert: {
          created_at?: string
          current_season?: number | null
          current_season_episodes?: number | null
          current_season_watched?: number | null
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          platform?: string | null
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title: string
          total_seasons?: number | null
          user_id?: string
          watched_seasons?: number | null
        }
        Update: {
          created_at?: string
          current_season?: number | null
          current_season_episodes?: number | null
          current_season_watched?: number | null
          external_id?: string | null
          finished_at?: string | null
          genres?: string[] | null
          id?: string
          platform?: string | null
          poster_url?: string | null
          rating?: number | null
          status?: string
          synopsis?: string | null
          title?: string
          total_seasons?: number | null
          user_id?: string
          watched_seasons?: number | null
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          user_id?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_reserves: {
        Row: {
          initial_amount: number
          user_id: string
          year: number
        }
        Insert: {
          initial_amount?: number
          user_id?: string
          year: number
        }
        Update: {
          initial_amount?: number
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          amount: number
          category_id: string
          description: string | null
          id: string
          month: number
          user_id: string
          year: number
        }
        Insert: {
          amount?: number
          category_id: string
          description?: string | null
          id?: string
          month: number
          user_id?: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string
          description?: string | null
          id?: string
          month?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          community_animes: boolean
          community_books: boolean
          community_finance: boolean
          community_games: boolean
          community_movies: boolean
          community_series: boolean
          community_vacation: boolean
          created_at: string
          date_of_birth: string | null
          display_name: string
          email: string | null
          ent_animes: boolean
          ent_books: boolean
          ent_movies: boolean
          ent_series: boolean
          id: string
          module_entertainment: boolean
          module_finance: boolean
          module_games: boolean
          module_vacation: boolean
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          community_animes?: boolean
          community_books?: boolean
          community_finance?: boolean
          community_games?: boolean
          community_movies?: boolean
          community_series?: boolean
          community_vacation?: boolean
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string | null
          ent_animes?: boolean
          ent_books?: boolean
          ent_movies?: boolean
          ent_series?: boolean
          id?: string
          module_entertainment?: boolean
          module_finance?: boolean
          module_games?: boolean
          module_vacation?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          community_animes?: boolean
          community_books?: boolean
          community_finance?: boolean
          community_games?: boolean
          community_movies?: boolean
          community_series?: boolean
          community_vacation?: boolean
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          email?: string | null
          ent_animes?: boolean
          ent_books?: boolean
          ent_movies?: boolean
          ent_series?: boolean
          id?: string
          module_entertainment?: boolean
          module_finance?: boolean
          module_games?: boolean
          module_vacation?: boolean
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      vacation_flights: {
        Row: {
          airline: string
          arrival_time: string
          departure: string
          departure_time: string
          destination: string
          duration: string
          id: string
          pnr: string
          price: number
          return_arrival_time: string | null
          return_departure_time: string | null
          return_duration: string | null
          trip_id: string | null
          trip_type: string | null
          user_id: string
          year: number
        }
        Insert: {
          airline: string
          arrival_time: string
          departure: string
          departure_time: string
          destination: string
          duration: string
          id?: string
          pnr: string
          price?: number
          return_arrival_time?: string | null
          return_departure_time?: string | null
          return_duration?: string | null
          trip_id?: string | null
          trip_type?: string | null
          user_id?: string
          year?: number
        }
        Update: {
          airline?: string
          arrival_time?: string
          departure?: string
          departure_time?: string
          destination?: string
          duration?: string
          id?: string
          pnr?: string
          price?: number
          return_arrival_time?: string | null
          return_departure_time?: string | null
          return_duration?: string | null
          trip_id?: string | null
          trip_type?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacation_flights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "vacation_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_hotels: {
        Row: {
          check_in: string
          check_out: string
          id: string
          name: string
          price: number
          trip_id: string | null
          user_id: string
          year: number
        }
        Insert: {
          check_in: string
          check_out: string
          id?: string
          name: string
          price?: number
          trip_id?: string | null
          user_id?: string
          year?: number
        }
        Update: {
          check_in?: string
          check_out?: string
          id?: string
          name?: string
          price?: number
          trip_id?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacation_hotels_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "vacation_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_tours: {
        Row: {
          company: string
          date: string
          id: string
          name: string
          price: number
          time: string
          trip_id: string | null
          type: string
          user_id: string
          year: number
        }
        Insert: {
          company: string
          date: string
          id?: string
          name: string
          price?: number
          time: string
          trip_id?: string | null
          type: string
          user_id?: string
          year?: number
        }
        Update: {
          company?: string
          date?: string
          id?: string
          name?: string
          price?: number
          time?: string
          trip_id?: string | null
          type?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacation_tours_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "vacation_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_trips: {
        Row: {
          cover_url: string | null
          created_at: string
          destination: string
          end_date: string | null
          id: string
          start_date: string | null
          user_id: string
          year: number
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          destination: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          user_id?: string
          year?: number
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          destination?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          user_id?: string
          year?: number
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
      app_role: "admin" | "visitor"
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
      app_role: ["admin", "visitor"],
    },
  },
} as const
