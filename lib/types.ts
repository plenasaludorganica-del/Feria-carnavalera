import type { CategorySlug } from "./config";

export type SubscriptionState = "activo" | "vencido" | "sin_pago" | "suspendido";

export interface Profile {
  id: string;
  display_name: string;
  whatsapp: string | null;
  city: string | null;
  role: "seller" | "admin";
  paid_until: string | null;
  suspended: boolean;
  admin_note: string | null;
}

export interface CatalogItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: CategorySlug;
  condition: string;
  cover: string | null;
  city: string | null;
  created_at: string;
  total?: number;
}

export interface CatalogProduct extends Omit<CatalogItem, "cover" | "city" | "total"> {
  description: string;
  images: string[];
  seller_name: string;
  seller_city: string | null;
  whatsapp: string;
}

export interface OwnProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: CategorySlug;
  condition: string;
  images: string[];
  status: "active" | "paused";
  created_at: string;
  updated_at: string;
}

export interface AdminSeller {
  id: string;
  display_name: string;
  email: string;
  whatsapp: string | null;
  city: string | null;
  role: "seller" | "admin";
  paid_until: string | null;
  suspended: boolean;
  admin_note: string | null;
  created_at: string;
  state: SubscriptionState;
  products_count: number;
  last_payment_at: string | null;
}
