import { Flower, BouquetTemplate, Purchase, Order, Wastage } from '../types';

export const defaultFlowers: Flower[] = [
  {
    id: 'rose',
    name: '红玫瑰',
    emoji: '🌹',
    shelfLife: 7,
    safetyStock: 30,
  },
  {
    id: 'lily',
    name: '百合',
    emoji: '🌸',
    shelfLife: 10,
    safetyStock: 20,
  },
  {
    id: 'gypsophila',
    name: '满天星',
    emoji: '🌼',
    shelfLife: 14,
    safetyStock: 50,
  },
  {
    id: 'carnation',
    name: '康乃馨',
    emoji: '🌷',
    shelfLife: 12,
    safetyStock: 30,
  },
];

export const defaultTemplates: BouquetTemplate[] = [
  {
    id: 'tpl-1',
    name: '99朵红玫瑰',
    price: 520,
    description: '经典浪漫，长长久久的爱',
    items: [
      { flowerId: 'rose', flowerName: '红玫瑰', quantity: 99 },
    ],
  },
  {
    id: 'tpl-2',
    name: '温馨百合束',
    price: 188,
    description: '清新淡雅，祝福满满',
    items: [
      { flowerId: 'lily', flowerName: '百合', quantity: 11 },
      { flowerId: 'gypsophila', flowerName: '满天星', quantity: 5 },
    ],
  },
  {
    id: 'tpl-3',
    name: '康乃馨祝福',
    price: 168,
    description: '感恩之心，献给最爱的人',
    items: [
      { flowerId: 'carnation', flowerName: '康乃馨', quantity: 33 },
      { flowerId: 'gypsophila', flowerName: '满天星', quantity: 8 },
    ],
  },
  {
    id: 'tpl-4',
    name: '混搭花束',
    price: 299,
    description: '缤纷多彩，满满的幸福',
    items: [
      { flowerId: 'rose', flowerName: '红玫瑰', quantity: 19 },
      { flowerId: 'lily', flowerName: '百合', quantity: 5 },
      { flowerId: 'gypsophila', flowerName: '满天星', quantity: 10 },
    ],
  },
];

export const defaultPurchases: Purchase[] = [
  {
    id: 'pur-1',
    flowerId: 'rose',
    flowerName: '红玫瑰',
    quantity: 100,
    pricePerBunch: 35,
    stemsPerBunch: 20,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remainingStems: 100,
    totalCost: 175,
    isOnSale: false,
    salePrice: null,
    saleReason: '',
    saleEndDate: null,
  },
  {
    id: 'pur-2',
    flowerId: 'lily',
    flowerName: '百合',
    quantity: 30,
    pricePerBunch: 45,
    stemsPerBunch: 10,
    purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remainingStems: 30,
    totalCost: 135,
    isOnSale: false,
    salePrice: null,
    saleReason: '',
    saleEndDate: null,
  },
  {
    id: 'pur-3',
    flowerId: 'gypsophila',
    flowerName: '满天星',
    quantity: 100,
    pricePerBunch: 25,
    stemsPerBunch: 50,
    purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remainingStems: 100,
    totalCost: 50,
    isOnSale: false,
    salePrice: null,
    saleReason: '',
    saleEndDate: null,
  },
  {
    id: 'pur-4',
    flowerId: 'carnation',
    flowerName: '康乃馨',
    quantity: 60,
    pricePerBunch: 28,
    stemsPerBunch: 20,
    purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remainingStems: 60,
    totalCost: 84,
    isOnSale: false,
    salePrice: null,
    saleReason: '',
    saleEndDate: null,
  },
];

export const defaultOrders: Order[] = [];
export const defaultWastages: Wastage[] = [];
