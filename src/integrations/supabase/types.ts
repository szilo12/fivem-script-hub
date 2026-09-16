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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      asset_grants: {
        Row: {
          asset_name: string | null
          cfx_id: string | null
          created_at: string
          granted_at: string | null
          id: string
          license_id: string | null
          note: string | null
          product_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name?: string | null
          cfx_id?: string | null
          created_at?: string
          granted_at?: string | null
          id?: string
          license_id?: string | null
          note?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string | null
          cfx_id?: string | null
          created_at?: string
          granted_at?: string | null
          id?: string
          license_id?: string | null
          note?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_grants_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: true
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_grants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cfx_accounts: {
        Row: {
          cfx_id: string
          connected_at: string | null
          created_at: string
          forum_name: string | null
          id: string
          is_seller: boolean
          status: string
          updated_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          cfx_id: string
          connected_at?: string | null
          created_at?: string
          forum_name?: string | null
          id?: string
          is_seller?: boolean
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string
        }
        Update: {
          cfx_id?: string
          connected_at?: string | null
          created_at?: string
          forum_name?: string | null
          id?: string
          is_seller?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: []
      }
      cfx_assets: {
        Row: {
          asset_name: string
          created_at: string
          display_name: string | null
          id: string
          imported_at: string
          owner_id: string
          product_id: string | null
          source: string
          updated_at: string
          version: string | null
        }
        Insert: {
          asset_name: string
          created_at?: string
          display_name?: string | null
          id?: string
          imported_at?: string
          owner_id: string
          product_id?: string | null
          source?: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          asset_name?: string
          created_at?: string
          display_name?: string | null
          id?: string
          imported_at?: string
          owner_id?: string
          product_id?: string | null
          source?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cfx_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activations: number
          cfx_id: string | null
          created_at: string
          id: string
          last_check_at: string | null
          license_key: string
          order_id: string | null
          product_id: string
          server_ip: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activations?: number
          cfx_id?: string | null
          created_at?: string
          id?: string
          last_check_at?: string | null
          license_key: string
          order_id?: string | null
          product_id: string
          server_ip?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activations?: number
          cfx_id?: string | null
          created_at?: string
          id?: string
          last_check_at?: string | null
          license_key?: string
          order_id?: string | null
          product_id?: string
          server_ip?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount_cents: number
          cfx_id: string | null
          created_at: string
          currency: string
          id: string
          product_id: string
          provider: string | null
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          cfx_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          product_id: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          cfx_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          product_id?: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          cover_url: string | null
          created_at: string
          currency: string
          description: string
          download_path: string | null
          escrow_asset_name: string | null
          features: string[]
          framework: string
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          price_cents: number
          slug: string
          tagline: string
          updated_at: string
          version: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          download_path?: string | null
          escrow_asset_name?: string | null
          features?: string[]
          framework?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          price_cents?: number
          slug: string
          tagline?: string
          updated_at?: string
          version?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          download_path?: string | null
          escrow_asset_name?: string | null
          features?: string[]
          framework?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          price_cents?: number
          slug?: string
          tagline?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cfx_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          cfx_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          cfx_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
