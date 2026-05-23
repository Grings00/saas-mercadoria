import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    company?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      company?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    company?: string;
  }
}

export type MovementType = "ENTRADA" | "SAIDA";

export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  monthEntries: number;
  monthExits: number;
  totalStockValue: number;
  monthEntriesValue: number;
  monthExitsValue: number;
}

export interface ProductWithCategory {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; name: string } | null;
}

export interface MovementWithProduct {
  id: string;
  type: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  notes: string | null;
  createdAt: Date;
  product: { id: string; name: string; unit: string };
}
