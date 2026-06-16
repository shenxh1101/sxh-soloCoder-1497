import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Flower,
  Purchase,
  BouquetTemplate,
  Order,
  OrderItem,
  Wastage,
  BouquetItem,
} from '../types';
import {
  defaultFlowers,
  defaultTemplates,
  defaultPurchases,
  defaultOrders,
  defaultWastages,
} from '../data/seedData';
import { generateId } from '../utils/storage';
import { daysRemaining } from '../utils/date';

interface FlowerStore {
  flowers: Flower[];
  purchases: Purchase[];
  templates: BouquetTemplate[];
  orders: Order[];
  wastages: Wastage[];

  getFlowerById: (id: string) => Flower | undefined;
  getStockByFlowerId: (flowerId: string) => number;
  getPurchasesByFlowerId: (flowerId: string) => Purchase[];

  addPurchase: (data: {
    flowerId: string;
    quantity: number;
    pricePerBunch: number;
    stemsPerBunch: number;
    purchaseDate: string;
  }) => void;

  addTemplate: (data: {
    name: string;
    price: number;
    description: string;
    items: BouquetItem[];
  }) => void;

  updateTemplate: (id: string, data: Partial<BouquetTemplate>) => void;

  deleteTemplate: (id: string) => void;

  checkStockForOrder: (templateId: string, quantity: number) => {
    sufficient: boolean;
    flowerUsage: { flowerId: string; flowerName: string; required: number; available: number }[];
  };

  createOrder: (data: {
    customerName: string;
    customerPhone: string;
    templateId: string;
    quantity: number;
  }) => { success: boolean; message: string; order?: Order };

  cancelOrder: (orderId: string) => void;

  addWastage: (data: {
    flowerId: string;
    quantity: number;
    reason: string;
    date: string;
  }) => void;

  getLowStockFlowers: () => Flower[];

  getExpiringPurchases: (daysThreshold?: number) => (Purchase & {
    daysLeft: number;
    flower: Flower;
  })[];

  getTemplateById: (id: string) => BouquetTemplate | undefined;

  getOrderById: (id: string) => Order | undefined;
}

export const useFlowerStore = create<FlowerStore>()(
  persist(
    (set, get) => ({
      flowers: defaultFlowers,
      purchases: defaultPurchases,
      templates: defaultTemplates,
      orders: defaultOrders,
      wastages: defaultWastages,

      getFlowerById: (id) => {
        return get().flowers.find((f) => f.id === id);
      },

      getStockByFlowerId: (flowerId) => {
        return get()
          .purchases.filter((p) => p.flowerId === flowerId)
          .reduce((sum, p) => sum + p.remainingStems, 0);
      },

      getPurchasesByFlowerId: (flowerId) => {
        return get()
          .purchases.filter((p) => p.flowerId === flowerId)
          .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());
      },

      addPurchase: (data) => {
        const flower = get().getFlowerById(data.flowerId);
        if (!flower) return;

        const totalCost = (data.quantity / data.stemsPerBunch) * data.pricePerBunch;

        const newPurchase: Purchase = {
          id: generateId('pur'),
          flowerId: data.flowerId,
          flowerName: flower.name,
          quantity: data.quantity,
          pricePerBunch: data.pricePerBunch,
          stemsPerBunch: data.stemsPerBunch,
          purchaseDate: data.purchaseDate,
          remainingStems: data.quantity,
          totalCost: Math.round(totalCost * 100) / 100,
        };

        set((state) => ({
          purchases: [...state.purchases, newPurchase],
        }));
      },

      addTemplate: (data) => {
        const newTemplate: BouquetTemplate = {
          id: generateId('tpl'),
          name: data.name,
          price: data.price,
          description: data.description,
          items: data.items,
        };

        set((state) => ({
          templates: [...state.templates, newTemplate],
        }));
      },

      updateTemplate: (id, data) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...data } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },

      checkStockForOrder: (templateId, quantity) => {
        const template = get().templates.find((t) => t.id === templateId);
        if (!template) {
          return { sufficient: false, flowerUsage: [] };
        }

        const flowerUsage = template.items.map((item) => {
          const required = item.quantity * quantity;
          const available = get().getStockByFlowerId(item.flowerId);
          const flower = get().getFlowerById(item.flowerId);
          return {
            flowerId: item.flowerId,
            flowerName: flower?.name || item.flowerName,
            required,
            available,
          };
        });

        const sufficient = flowerUsage.every((u) => u.available >= u.required);

        return { sufficient, flowerUsage };
      },

      createOrder: (data) => {
        const template = get().templates.find((t) => t.id === data.templateId);
        if (!template) {
          return { success: false, message: '花束模板不存在' };
        }

        const { sufficient, flowerUsage } = get().checkStockForOrder(
          data.templateId,
          data.quantity
        );

        if (!sufficient) {
          const shortage = flowerUsage.filter((u) => u.available < u.required);
          const shortageNames = shortage.map((u) => `${u.flowerName}缺${u.required - u.available}支`).join('，');
          return {
            success: false,
            message: `库存不足：${shortageNames}`,
          };
        }

        const updatedPurchases = [...get().purchases];
        const flowerUsageDetailed: { flowerId: string; flowerName: string; quantity: number }[] = [];

        for (const item of template.items) {
          let remainingToDeduct = item.quantity * data.quantity;
          const flowerPurchases = updatedPurchases
            .filter((p) => p.flowerId === item.flowerId && p.remainingStems > 0)
            .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

          for (const purchase of flowerPurchases) {
            if (remainingToDeduct <= 0) break;
            const deduct = Math.min(purchase.remainingStems, remainingToDeduct);
            purchase.remainingStems -= deduct;
            remainingToDeduct -= deduct;
          }

          flowerUsageDetailed.push({
            flowerId: item.flowerId,
            flowerName: item.flowerName,
            quantity: item.quantity * data.quantity,
          });
        }

        const orderItem: OrderItem = {
          templateId: template.id,
          templateName: template.name,
          quantity: data.quantity,
          subtotal: template.price * data.quantity,
          flowerUsage: flowerUsageDetailed,
        };

        const newOrder: Order = {
          id: generateId('ord'),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          orderDate: new Date().toISOString().split('T')[0],
          totalAmount: template.price * data.quantity,
          items: [orderItem],
          status: 'completed',
        };

        set((state) => ({
          purchases: updatedPurchases,
          orders: [newOrder, ...state.orders],
        }));

        return { success: true, message: '订单创建成功', order: newOrder };
      },

      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status === 'cancelled') return;

        const updatedPurchases = [...get().purchases];

        for (const item of order.items) {
          for (const usage of item.flowerUsage) {
            let remainingToAdd = usage.quantity;
            const flowerPurchases = updatedPurchases
              .filter((p) => p.flowerId === usage.flowerId)
              .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());

            for (const purchase of flowerPurchases) {
              if (remainingToAdd <= 0) break;
              const add = Math.min(
                purchase.quantity - purchase.remainingStems,
                remainingToAdd
              );
              purchase.remainingStems += add;
              remainingToAdd -= add;
            }
          }
        }

        set((state) => ({
          purchases: updatedPurchases,
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' } : o
          ),
        }));
      },

      addWastage: (data) => {
        const flower = get().getFlowerById(data.flowerId);
        if (!flower) return;

        const updatedPurchases = [...get().purchases];
        let remainingToDeduct = data.quantity;
        let totalCost = 0;

        const flowerPurchases = updatedPurchases
          .filter((p) => p.flowerId === data.flowerId && p.remainingStems > 0)
          .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

        for (const purchase of flowerPurchases) {
          if (remainingToDeduct <= 0) break;
          const deduct = Math.min(purchase.remainingStems, remainingToDeduct);
          const costPerStem = purchase.totalCost / purchase.quantity;
          totalCost += costPerStem * deduct;
          purchase.remainingStems -= deduct;
          remainingToDeduct -= deduct;
        }

        const wastage: Wastage = {
          id: generateId('wst'),
          flowerId: data.flowerId,
          flowerName: flower.name,
          quantity: data.quantity,
          reason: data.reason,
          date: data.date,
          cost: Math.round(totalCost * 100) / 100,
        };

        set((state) => ({
          purchases: updatedPurchases,
          wastages: [wastage, ...state.wastages],
        }));
      },

      getLowStockFlowers: () => {
        const { flowers, getStockByFlowerId } = get();
        return flowers.filter((f) => getStockByFlowerId(f.id) < f.safetyStock);
      },

      getExpiringPurchases: (daysThreshold = 3) => {
        const { purchases, flowers } = get();
        const result: (Purchase & { daysLeft: number; flower: Flower })[] = [];

        for (const purchase of purchases) {
          if (purchase.remainingStems <= 0) continue;
          const flower = flowers.find((f) => f.id === purchase.flowerId);
          if (!flower) continue;

          const daysLeft = daysRemaining(purchase.purchaseDate, flower.shelfLife);
          if (daysLeft <= daysThreshold) {
            result.push({
              ...purchase,
              daysLeft,
              flower,
            });
          }
        }

        return result.sort((a, b) => a.daysLeft - b.daysLeft);
      },

      getTemplateById: (id) => {
        return get().templates.find((t) => t.id === id);
      },

      getOrderById: (id) => {
        return get().orders.find((o) => o.id === id);
      },
    }),
    {
      name: 'flower-shop-storage',
    }
  )
);
