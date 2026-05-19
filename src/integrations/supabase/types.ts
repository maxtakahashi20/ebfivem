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
      discord_membros: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_user_id: string
          display_name: string
          global_name: string | null
          inscricao_id: string | null
          nick: string | null
          roles_json: Json
          ultimo_login: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id: string
          display_name: string
          global_name?: string | null
          inscricao_id?: string | null
          nick?: string | null
          roles_json?: Json
          ultimo_login?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_user_id?: string
          display_name?: string
          global_name?: string | null
          inscricao_id?: string | null
          nick?: string | null
          roles_json?: Json
          ultimo_login?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_membros_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_emitidos: {
        Row: {
          created_at: string
          destinatario: string | null
          emitido_por_discord_id: string | null
          id: string
          inscricao_id: string | null
          metadata: Json | null
          referencia: string | null
          tipo: string
          titulo: string | null
        }
        Insert: {
          created_at?: string
          destinatario?: string | null
          emitido_por_discord_id?: string | null
          id?: string
          inscricao_id?: string | null
          metadata?: Json | null
          referencia?: string | null
          tipo: string
          titulo?: string | null
        }
        Update: {
          created_at?: string
          destinatario?: string | null
          emitido_por_discord_id?: string | null
          id?: string
          inscricao_id?: string | null
          metadata?: Json | null
          referencia?: string | null
          tipo?: string
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_emitidos_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: false
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      identidades_militares: {
        Row: {
          ativa: boolean
          created_at: string
          discord_user_id: string | null
          foto_url: string | null
          id: string
          inscricao_id: string
          matricula: string
          patente: string
          qr_payload: Json | null
          updated_at: string
          validade_ate: string
          validade_de: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          discord_user_id?: string | null
          foto_url?: string | null
          id?: string
          inscricao_id: string
          matricula: string
          patente?: string
          qr_payload?: Json | null
          updated_at?: string
          validade_ate: string
          validade_de: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          discord_user_id?: string | null
          foto_url?: string | null
          id?: string
          inscricao_id?: string
          matricula?: string
          patente?: string
          qr_payload?: Json | null
          updated_at?: string
          validade_ate?: string
          validade_de?: string
        }
        Relationships: [
          {
            foreignKeyName: "identidades_militares_discord_user_id_fkey"
            columns: ["discord_user_id"]
            isOneToOne: false
            referencedRelation: "discord_membros"
            referencedColumns: ["discord_user_id"]
          },
          {
            foreignKeyName: "identidades_militares_inscricao_id_fkey"
            columns: ["inscricao_id"]
            isOneToOne: true
            referencedRelation: "inscricoes"
            referencedColumns: ["id"]
          },
        ]
      }
      inscricoes: {
        Row: {
          created_at: string
          discord_id: string
          discord_user_id: string | null
          id: string
          motivacao: string
          nome: string
          observacoes_instrutor: string | null
          protocolo: string
          rg: string
          sobrenome: string
          status: Database["public"]["Enums"]["status_inscricao"]
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_id: string
          discord_user_id?: string | null
          id?: string
          motivacao: string
          nome: string
          observacoes_instrutor?: string | null
          protocolo?: string
          rg: string
          sobrenome: string
          status?: Database["public"]["Enums"]["status_inscricao"]
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_id?: string
          discord_user_id?: string | null
          id?: string
          motivacao?: string
          nome?: string
          observacoes_instrutor?: string | null
          protocolo?: string
          rg?: string
          sobrenome?: string
          status?: Database["public"]["Enums"]["status_inscricao"]
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      status_inscricao: "pendente" | "em_analise" | "aprovado" | "reprovado"
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
      status_inscricao: ["pendente", "em_analise", "aprovado", "reprovado"],
    },
  },
} as const
