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
  BatchDeduction,
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
  }) => Purchase;

  addTemplate: (data: {
    name: string;
    price: number;
    description: string;
    items: BouquetItem[];
  }) => BouquetTemplate;

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

  cancelOrder: (orderId: string) => { success: boolean; message: string };

  addWastage: (data: {
    purchaseId: string;
    quantity: number;
    reason: string;
    date: string;
  }) => { success: boolean; message: string; wastage?: Wastage };

  setSale: (purchaseId: string, salePrice: number, saleReason: string, saleEndDate: string) => { success: boolean; message: string; purchase?: Purchase };

  cancelSale: (purchaseId: string) => { success: boolean; message: string; purchase?: Purchase };

  getSalePurchases: () => Purchase[];

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
        if (!flower) {
          throw new Error('花材不存在');
        }

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
          isOnSale: false,
          salePrice: null,
          saleReason: '',
          saleEndDate: null,
        };

        set((state) => ({
          purchases: [...state.purchases, newPurchase],
        }));

        return newPurchase;
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

        return newTemplate;
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

        const mergedItems = template.items.reduce((acc, item) => {
          const existing = acc.find((i) => i.flowerId === item.flowerId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            acc.push({ ...item });
          }
          return acc;
        }, [] as BouquetItem[]);

        const flowerUsage = mergedItems.map((item) => {
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

      setSale: (purchaseId, salePrice, saleReason, saleEndDate) => {
        const purchase = get().purchases.find((p) => p.id === purchaseId);
        if (!purchase) {
          return { success: false, message: '批次不存在' };
        }

        if (purchase.remainingStems <= 0) {
          return { success: false, message: '该批次已无库存' };
        }

        if (salePrice <= 0) {
          return { success: false, message: '特价必须大于0' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(saleEndDate);
        endDate.setHours(0, 0, 0, 0);

        if (endDate < today) {
          return { success: false, message: '特价结束日期不能早于今天' };
        }

        const updatedPurchase: Purchase = {
          ...purchase,
          isOnSale: true,
          salePrice,
          saleReason,
          saleEndDate,
        };

        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === purchaseId ? updatedPurchase : p
          ),
        }));

        return { success: true, message: '设置特价成功', purchase: updatedPurchase };
      },

      cancelSale: (purchaseId) => {
        const purchase = get().purchases.find((p) => p.id === purchaseId);
        if (!purchase) {
          return { success: false, message: '批次不存在' };
        }

        const updatedPurchase: Purchase = {
          ...purchase,
          isOnSale: false,
          salePrice: null,
          saleReason: '',
          saleEndDate: null,
        };

        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === purchaseId ? updatedPurchase : p
          ),
        }));

        return { success: true, message: '取消特价成功', purchase: updatedPurchase };
      },

      getSalePurchases: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return get().purchases.filter((p) => {
          if (!p.isOnSale || p.remainingStems <= 0) return false;
          if (!p.saleEndDate) return true;
          const endDate = new Date(p.saleEndDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate >= today;
        });
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

        const mergedItems = template.items.reduce((acc, item) => {
          const existing = acc.find((i) => i.flowerId === item.flowerId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            acc.push({ ...item });
          }
          return acc;
        }, [] as BouquetItem[]);

        const updatedPurchases = [...get().purchases];
        const flowerUsageDetailed: { flowerId: string; flowerName: string; quantity: number }[] = [];
        const allBatchDeductions: BatchDeduction[] = [];
        let saleAmount = 0;
        let normalAmount = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const item of mergedItems) {
          let remainingToDeduct = item.quantity * data.quantity;
          const flower = get().getFlowerById(item.flowerId);

          const flowerPurchases = updatedPurchases
            .filter((p) => p.flowerId === item.flowerId && p.remainingStems > 0);

          const salePurchases = flowerPurchases
            .filter((p) => p.isOnSale && p.salePrice !== null && (p.saleEndDate === null || new Date(p.saleEndDate) >= today))
            .sort((a, b) => {
              if (a.saleEndDate && b.saleEndDate) {
                return new Date(a.saleEndDate).getTime() - new Date(b.saleEndDate).getTime();
              }
              if (a.saleEndDate) return -1;
              if (b.saleEndDate) return 1;
              return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
            });

          const normalPurchases = flowerPurchases
            .filter((p) => !p.isOnSale || p.salePrice === null || (p.saleEndDate !== null && new Date(p.saleEndDate) < today))
            .sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

          const sortedPurchases = [...salePurchases, ...normalPurchases];

          for (const purchase of sortedPurchases) {
            if (remainingToDeduct <= 0) break;

            const deduct = Math.min(purchase.remainingStems, remainingToDeduct);
            const isOnSale = purchase.isOnSale && purchase.salePrice !== null &&
              (purchase.saleEndDate === null || new Date(purchase.saleEndDate) >= today);
            const unitPrice = isOnSale && purchase.salePrice !== null
              ? purchase.salePrice
              : purchase.totalCost / purchase.quantity;

            if (isOnSale && purchase.salePrice !== null) {
              saleAmount += purchase.salePrice * deduct;
            } else {
              normalAmount += unitPrice * deduct;
            }

            allBatchDeductions.push({
              purchaseId: purchase.id,
              flowerId: item.flowerId,
              flowerName: flower?.name || item.flowerName,
              quantity: deduct,
              unitPrice: Math.round(unitPrice * 100) / 100,
              isOnSale,
            });

            purchase.remainingStems -= deduct;
            remainingToDeduct -= deduct;
          }

          flowerUsageDetailed.push({
            flowerId: item.flowerId,
            flowerName: flower?.name || item.flowerName,
            quantity: item.quantity * data.quantity,
          });
        }

        const orderItem: OrderItem = {
          templateId: template.id,
          templateName: template.name,
          quantity: data.quantity,
          subtotal: template.price * data.quantity,
          flowerUsage: flowerUsageDetailed,
          batchDeductions: allBatchDeductions,
        };

        const totalAmount = Math.round((saleAmount + normalAmount) * 100) / 100;

        const newOrder: Order = {
          id: generateId('ord'),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          orderDate: new Date().toISOString().split('T')[0],
          totalAmount,
          items: [orderItem],
          status: 'completed',
          saleAmount: Math.round(saleAmount * 100) / 100,
          normalAmount: Math.round(normalAmount * 100) / 100,
        };

        set((state) => ({
          purchases: updatedPurchases,
          orders: [newOrder, ...state.orders],
        }));

        return { success: true, message: '订单创建成功', order: newOrder };
      },

      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) {
          return { success: false, message: '订单不存在' };
        }

        if (order.status === 'cancelled') {
          return { success: false, message: '订单已取消' };
        }

        const updatedPurchases = [...get().purchases];

        for (const item of order.items) {
          for (const deduction of item.batchDeductions) {
            const purchase = updatedPurchases.find((p) => p.id === deduction.purchaseId);
            if (purchase) {
              purchase.remainingStems = Math.min(
                purchase.remainingStems + deduction.quantity,
                purchase.quantity
              );
            }
          }
        }

        set((state) => ({
          purchases: updatedPurchases,
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' } : o
          ),
        }));

        return { success: true, message: '订单取消成功' };
      },

      addWastage: (data) => {
        const purchase = get().purchases.find((p) => p.id === data.purchaseId);
        if (!purchase) {
          return { success: false, message: '批次不存在' };
        }

        if (purchase.remainingStems < data.quantity) {
          return { success: false, message: '该批次剩余库存不足' };
        }

        if (data.quantity <= 0) {
          return { success: false, message: '报损数量必须大于0' };
        }

        const updatedPurchases = [...get().purchases];
        const purchaseIndex = updatedPurchases.findIndex((p) => p.id === data.purchaseId);

        if (purchaseIndex === -1) {
          return { success: false, message: '批次不存在' };
        }

        const targetPurchase = updatedPurchases[purchaseIndex];
        targetPurchase.remainingStems -= data.quantity;

        const costPerStem = targetPurchase.totalCost / targetPurchase.quantity;
        const totalCost = costPerStem * data.quantity;

        const flower = get().getFlowerById(targetPurchase.flowerId);

        const wastage: Wastage = {
          id: generateId('wst'),
          flowerId: targetPurchase.flowerId,
          flowerName: flower?.name || targetPurchase.flowerName,
          purchaseId: data.purchaseId,
          quantity: data.quantity,
          reason: data.reason,
          date: data.date,
          cost: Math.round(totalCost * 100) / 100,
        };

        set((state) => ({
          purchases: updatedPurchases,
          wastages: [wastage, ...state.wastages],
        }));

        return { success: true, message: '报损成功', wastage };
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
      version: 2,
      migrate: (state: any, version: number) => {
        if (version < 2) {
          const migrated = { ...state };
          
          migrated.purchases = (migrated.purchases || []).map((p: any) => ({
            ...p,
            isOnSale: p.isOnSale ?? false,
            salePrice: p.salePrice ?? null,
            saleReason: p.saleReason ?? '',
            saleEndDate: p.saleEndDate ?? null,
          }));
          
          migrated.orders = (migrated.orders || []).map((o: any) => ({
            ...o,
            saleAmount: o.saleAmount ?? 0,
            normalAmount: o.normalAmount ?? o.totalAmount ?? 0,
            items: (o.items || []).map((item: any) => ({
              ...item,
              batchDeductions: item.batchDeductions ?? [],
            })),
          }));
          
          migrated.wastages = (migrated.wastages || []).map((w: any) => ({
            ...w,
            purchaseId: w.purchaseId ?? '',
          }));
          
          return migrated;
        }
        return state;
      },
    }
  )
);
