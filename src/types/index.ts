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

export interface OrderItem {
  templateId: string;
  templateName: string;
  quantity: number;
  subtotal: number;
  flowerUsage: { flowerId: string; flowerName: string; quantity: number }[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  orderDate: string;
  totalAmount: number;
  items: OrderItem[];
  status: 'completed' | 'cancelled';
}

export interface Wastage {
  id: string;
  flowerId: string;
  flowerName: string;
  quantity: number;
  reason: string;
  date: string;
  cost: number;
}

export type PageName = 'dashboard' | 'purchase' | 'templates' | 'orders' | 'stats';
