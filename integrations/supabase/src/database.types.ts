/**
 * Supabase database type definitions.
 *
 * These types mirror the Postgres schema in supabase/migrations/00001_initial_schema.sql.
 * Column names are snake_case (matching the DB). Use the @repo/shared domain types in
 * application code — these types are only for the Supabase client layer.
 *
 * Convenience helpers at the bottom of this file let callers reference row types
 * without spelling out the full Database path:
 *   type PartRow = Tables<'parts'>
 *   type OrderInsert = TablesInsert<'orders'>
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      // 1. user_profiles
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: Database["public"]["Enums"]["user_role"];
          company_id: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: Database["public"]["Enums"]["user_role"];
          company_id?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          company_id?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 2. companies
      companies: {
        Row: {
          id: string;
          name: string;
          billing_line1: string;
          billing_line2: string | null;
          billing_city: string;
          billing_state: string;
          billing_postal: string;
          billing_country: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          billing_line1: string;
          billing_line2?: string | null;
          billing_city: string;
          billing_state: string;
          billing_postal: string;
          billing_country?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          billing_line1?: string;
          billing_line2?: string | null;
          billing_city?: string;
          billing_state?: string;
          billing_postal?: string;
          billing_country?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 3. models
      models: {
        Row: {
          id: string;
          name: string;
          manufacturer: string;
          sensor_type: Database["public"]["Enums"]["sensor_type"];
          description: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          manufacturer: string;
          sensor_type: Database["public"]["Enums"]["sensor_type"];
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          manufacturer?: string;
          sensor_type?: Database["public"]["Enums"]["sensor_type"];
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 4. parts
      parts: {
        Row: {
          id: string;
          sku: string;
          name: string;
          manufacturer: string;
          sensor_type: Database["public"]["Enums"]["sensor_type"];
          description: string | null;
          image_url: string | null;
          datasheet_url: string | null;
          base_price_cents: number;
          stock_quantity: number;
          lead_time_days: number;
          safety_stock: number;
          uom: string;
          weight_grams: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          manufacturer: string;
          sensor_type: Database["public"]["Enums"]["sensor_type"];
          description?: string | null;
          image_url?: string | null;
          datasheet_url?: string | null;
          base_price_cents: number;
          stock_quantity?: number;
          lead_time_days?: number;
          safety_stock?: number;
          uom?: string;
          weight_grams?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          manufacturer?: string;
          sensor_type?: Database["public"]["Enums"]["sensor_type"];
          description?: string | null;
          image_url?: string | null;
          datasheet_url?: string | null;
          base_price_cents?: number;
          stock_quantity?: number;
          lead_time_days?: number;
          safety_stock?: number;
          uom?: string;
          weight_grams?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 5. compatibility
      compatibility: {
        Row: {
          id: string;
          model_id: string;
          part_id: string;
          fit_type: Database["public"]["Enums"]["fit_type"];
          notes: string | null;
        };
        Insert: {
          id?: string;
          model_id: string;
          part_id: string;
          fit_type: Database["public"]["Enums"]["fit_type"];
          notes?: string | null;
        };
        Update: {
          id?: string;
          model_id?: string;
          part_id?: string;
          fit_type?: Database["public"]["Enums"]["fit_type"];
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "compatibility_model_id_fkey";
            columns: ["model_id"];
            referencedRelation: "models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "compatibility_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
        ];
      };

      // 6. contracts
      contracts: {
        Row: {
          id: string;
          company_id: string;
          tier: Database["public"]["Enums"]["contract_tier_name"];
          discount_percent: number;
          starts_at: string;
          expires_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          tier?: Database["public"]["Enums"]["contract_tier_name"];
          discount_percent?: number;
          starts_at: string;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          tier?: Database["public"]["Enums"]["contract_tier_name"];
          discount_percent?: number;
          starts_at?: string;
          expires_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };

      // 7. contract_tiers
      contract_tiers: {
        Row: {
          id: string;
          contract_id: string;
          min_quantity: number;
          additional_discount_percent: number;
        };
        Insert: {
          id?: string;
          contract_id: string;
          min_quantity: number;
          additional_discount_percent?: number;
        };
        Update: {
          id?: string;
          contract_id?: string;
          min_quantity?: number;
          additional_discount_percent?: number;
        };
        Relationships: [
          {
            foreignKeyName: "contract_tiers_contract_id_fkey";
            columns: ["contract_id"];
            referencedRelation: "contracts";
            referencedColumns: ["id"];
          },
        ];
      };

      // 8. orders (shipping address stored as flat columns, not JSONB)
      orders: {
        Row: {
          id: string;
          order_number: string;
          company_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["order_status"];
          sla_tier: Database["public"]["Enums"]["sla_tier"];
          sla_deadline: string;
          sla_status: Database["public"]["Enums"]["sla_status"];
          shipping_line1: string;
          shipping_line2: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_postal: string;
          shipping_country: string;
          shipping_method: Database["public"]["Enums"]["shipping_method"];
          subtotal_cents: number;
          discount_cents: number;
          shipping_cents: number;
          tax_cents: number;
          total_cents: number;
          payment_ref: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          notes: string | null;
          placed_at: string;
          fulfilled_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          company_id: string;
          user_id: string;
          status?: Database["public"]["Enums"]["order_status"];
          sla_tier: Database["public"]["Enums"]["sla_tier"];
          sla_deadline: string;
          sla_status?: Database["public"]["Enums"]["sla_status"];
          shipping_line1: string;
          shipping_line2?: string | null;
          shipping_city: string;
          shipping_state: string;
          shipping_postal: string;
          shipping_country?: string;
          shipping_method: Database["public"]["Enums"]["shipping_method"];
          subtotal_cents: number;
          discount_cents?: number;
          shipping_cents?: number;
          tax_cents?: number;
          total_cents: number;
          payment_ref?: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          placed_at?: string;
          fulfilled_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          company_id?: string;
          user_id?: string;
          status?: Database["public"]["Enums"]["order_status"];
          sla_tier?: Database["public"]["Enums"]["sla_tier"];
          sla_deadline?: string;
          sla_status?: Database["public"]["Enums"]["sla_status"];
          shipping_line1?: string;
          shipping_line2?: string | null;
          shipping_city?: string;
          shipping_state?: string;
          shipping_postal?: string;
          shipping_country?: string;
          shipping_method?: Database["public"]["Enums"]["shipping_method"];
          subtotal_cents?: number;
          discount_cents?: number;
          shipping_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          payment_ref?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          notes?: string | null;
          placed_at?: string;
          fulfilled_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };

      // 9. order_lines
      order_lines: {
        Row: {
          id: string;
          order_id: string;
          part_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          discount_percent: number;
          status: Database["public"]["Enums"]["order_line_status"];
        };
        Insert: {
          id?: string;
          order_id: string;
          part_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          discount_percent?: number;
          status?: Database["public"]["Enums"]["order_line_status"];
        };
        Update: {
          id?: string;
          order_id?: string;
          part_id?: string;
          quantity?: number;
          unit_price_cents?: number;
          line_total_cents?: number;
          discount_percent?: number;
          status?: Database["public"]["Enums"]["order_line_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_lines_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
        ];
      };

      // 10. sla_events
      sla_events: {
        Row: {
          id: string;
          order_id: string;
          previous_status: Database["public"]["Enums"]["sla_status"] | null;
          new_status: Database["public"]["Enums"]["sla_status"];
          triggered_by: string;
          note: string | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          previous_status?: Database["public"]["Enums"]["sla_status"] | null;
          new_status: Database["public"]["Enums"]["sla_status"];
          triggered_by?: string;
          note?: string | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          previous_status?: Database["public"]["Enums"]["sla_status"] | null;
          new_status?: Database["public"]["Enums"]["sla_status"];
          triggered_by?: string;
          note?: string | null;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sla_events_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      // 11. shipments
      shipments: {
        Row: {
          id: string;
          order_id: string;
          carrier: string;
          tracking_number: string | null;
          shipping_method: Database["public"]["Enums"]["shipping_method"];
          status: Database["public"]["Enums"]["shipment_status"];
          label_url: string | null;
          cost_cents: number;
          estimated_delivery: string | null;
          actual_delivery: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          carrier: string;
          tracking_number?: string | null;
          shipping_method: Database["public"]["Enums"]["shipping_method"];
          status?: Database["public"]["Enums"]["shipment_status"];
          label_url?: string | null;
          cost_cents?: number;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          carrier?: string;
          tracking_number?: string | null;
          shipping_method?: Database["public"]["Enums"]["shipping_method"];
          status?: Database["public"]["Enums"]["shipment_status"];
          label_url?: string | null;
          cost_cents?: number;
          estimated_delivery?: string | null;
          actual_delivery?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };

      // 12. suppliers
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_email: string | null;
          contact_phone: string | null;
          lead_time_days: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          lead_time_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          lead_time_days?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // 13. supplier_parts
      supplier_parts: {
        Row: {
          id: string;
          supplier_id: string;
          part_id: string;
          cost_cents: number;
          lead_time_days: number;
          is_primary: boolean;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          part_id: string;
          cost_cents: number;
          lead_time_days?: number;
          is_primary?: boolean;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          part_id?: string;
          cost_cents?: number;
          lead_time_days?: number;
          is_primary?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_parts_supplier_id_fkey";
            columns: ["supplier_id"];
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "supplier_parts_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
        ];
      };

      // 14. quotes
      quotes: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["quote_status"];
          subtotal_cents: number;
          discount_cents: number;
          tax_cents: number;
          total_cents: number;
          expires_at: string;
          converted_order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal_cents?: number;
          discount_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          expires_at: string;
          converted_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          user_id?: string;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal_cents?: number;
          discount_cents?: number;
          tax_cents?: number;
          total_cents?: number;
          expires_at?: string;
          converted_order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey";
            columns: ["company_id"];
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };

      // 15. quote_lines
      quote_lines: {
        Row: {
          id: string;
          quote_id: string;
          part_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          discount_percent: number;
        };
        Insert: {
          id?: string;
          quote_id: string;
          part_id: string;
          quantity: number;
          unit_price_cents: number;
          line_total_cents: number;
          discount_percent?: number;
        };
        Update: {
          id?: string;
          quote_id?: string;
          part_id?: string;
          quantity?: number;
          unit_price_cents?: number;
          line_total_cents?: number;
          discount_percent?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey";
            columns: ["quote_id"];
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_lines_part_id_fkey";
            columns: ["part_id"];
            referencedRelation: "parts";
            referencedColumns: ["id"];
          },
        ];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;

    Enums: {
      sensor_type:
        | "pressure"
        | "temperature"
        | "flow"
        | "level"
        | "vibration"
        | "humidity"
        | "gas"
        | "proximity";
      fit_type: "exact" | "equivalent" | "aftermarket";
      contract_tier_name: "standard" | "silver" | "gold" | "platinum";
      user_role: "buyer" | "admin" | "ops";
      order_status:
        | "pending"
        | "confirmed"
        | "picking"
        | "packed"
        | "shipped"
        | "delivered"
        | "fulfilled"
        | "cancelled";
      order_line_status:
        | "pending"
        | "picking"
        | "packed"
        | "shipped"
        | "delivered";
      sla_tier: "emergency" | "standard" | "economy";
      sla_status:
        | "on_track"
        | "warning"
        | "breach"
        | "breached"
        | "fulfilled";
      payment_method: "ach" | "invoice_net30" | "card";
      shipping_method:
        | "ups_overnight"
        | "ups_ground"
        | "fedex_overnight"
        | "fedex_ground"
        | "usps_priority"
        | "own_courier"
        | "pickup";
      shipment_status:
        | "pending"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "returned";
      quote_status:
        | "draft"
        | "sent"
        | "accepted"
        | "expired"
        | "converted";
    };

    CompositeTypes: Record<string, never>;
  };
};

// ─────────────────────────────────────────────
// Convenience helpers — use these in calling code
// ─────────────────────────────────────────────

/** Full row type for a table */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

/** Insert type for a table (generated/optional fields omitted) */
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

/** Update type for a table (all fields optional) */
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/** Enum value type */
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
