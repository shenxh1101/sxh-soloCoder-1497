export interface Flower {
  id: string;
  name: string;
  emoji: string;
  shelfLife: number;
  safetyStock: number;
}

export interface Purchase {
  id: string;
  flowerId: string;
  flowerName: string;
  quantity: number;
  pricePerBunch: number;
  stemsPerBunch: number;
  purchaseDate: string;
  remainingStems: number;
  totalCost: number;
  isOnSale: boolean;
  salePrice: number | null;
  saleReason: string;
  saleEndDate: string | null;
}

export interface BouquetItem {
  flowerId: string;
  flowerName: string;
  quantity: number;
}

export interface BouquetTemplate {
  id: string;
  name: string;
  price: number;
  description: string;
  items: BouquetItem[];
}

export interface BatchDeduction {
  purchaseId: string;
  flowerId: string;
  flowerName: string;
  quantity: number;
  unitPrice: number;
  isOnSale: boolean;
}

export interface OrderItem {
  templateId: string;
  templateName: string;
  quantity: number;
  subtotal: number;
  flowerUsage: { flowerId: string; flowerName: string; quantity: number }[];
  batchDeductions: BatchDeduction[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  totalAmount: number;
  items: OrderItem[];
  status: 'completed' | 'cancelled';
  saleAmount: number;
  normalAmount: number;
}

export interface Wastage {
  id: string;
  flowerId: string;
  flowerName: string;
  purchaseId: string;
  quantity: number;
  reason: string;
  date: string;
  cost: number;
}

export type PageName = 'dashboard' | 'purchase' | 'templates' | 'orders' | 'stats';
