import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { formatDateCN } from '../utils/date';
import { Purchase } from '../types';

const FLOWER_FILTERS = ['全部', '红玫瑰', '百合', '满天星', '康乃馨'];
const STATUS_FILTERS = ['全部', '有库存', '已售罄'];

interface BatchProfitData {
  purchase: Purchase;
  purchaseCost: number;
  normalIncome: number;
  saleIncome: number;
  wastageAmount: number;
  remainingValue: number;
  profit: number;
  soldQuantity: number;
  wastageQuantity: number;
}

export default function BatchProfit() {
  const { orders, purchases, wastages } = useFlowerStore();
  const [selectedFlower, setSelectedFlower] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');

  const batchDataMap = useMemo(() => {
    const map = new Map<string, BatchProfitData>();

    for (const purchase of purchases) {
      map.set(purchase.id, {
        purchase,
        purchaseCost: purchase.totalCost,
        normalIncome: 0,
        saleIncome: 0,
        wastageAmount: 0,
        remainingValue: 0,
        profit: 0,
        soldQuantity: 0,
        wastageQuantity: 0,
      });
    }

    for (const order of orders) {
      if (order.status !== 'completed') continue;
      for (const item of order.items) {
        const deductions = item.batchDeductions ?? [];
        for (const deduction of deductions) {
          const data = map.get(deduction.purchaseId);
          if (!data) continue;
          const amount = deduction.unitPrice * deduction.quantity;
          if (deduction.isOnSale) {
            data.saleIncome += amount;
          } else {
            data.normalIncome += amount;
          }
          data.soldQuantity += deduction.quantity;
        }
      }
    }

    for (const wastage of wastages) {
      const data = map.get(wastage.purchaseId);
      if (!data) continue;
      data.wastageAmount -= wastage.cost;
      data.wastageQuantity += wastage.quantity;
    }

    for (const data of map.values()) {
      const { purchase } = data;
      const costPerStem = purchase.totalCost / purchase.quantity;
      data.remainingValue = purchase.remainingStems * costPerStem;
      data.profit = data.normalIncome + data.saleIncome - data.purchaseCost + data.wastageAmount;
    }

    return map;
  }, [orders, purchases, wastages]);

  const filteredBatches = useMemo(() => {
    return Array.from(batchDataMap.values()).filter((data) => {
      if (selectedFlower !== '全部' && data.purchase.flowerName !== selectedFlower) {
        return false;
      }
      if (selectedStatus === '有库存' && data.purchase.remainingStems <= 0) {
        return false;
      }
      if (selectedStatus === '已售罄' && data.purchase.remainingStems > 0) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.purchase.purchaseDate).getTime() - new Date(a.purchase.purchaseDate).getTime());
  }, [batchDataMap, selectedFlower, selectedStatus]);

  const summaryStats = useMemo(() => {
    const totalBatches = filteredBatches.length;
    const totalPurchaseCost = filteredBatches.reduce((sum, d) => sum + d.purchaseCost, 0);
    const totalIncome = filteredBatches.reduce((sum, d) => sum + d.normalIncome + d.saleIncome, 0);
    const totalWastage = filteredBatches.reduce((sum, d) => sum + d.wastageAmount, 0);
    const totalProfit = filteredBatches.reduce((sum, d) => sum + d.profit, 0);
    const profitRate = totalPurchaseCost > 0 ? (totalProfit / totalPurchaseCost) * 100 : 0;

    return {
      totalBatches,
      totalPurchaseCost,
      totalIncome,
      totalWastage,
      totalProfit,
      profitRate,
    };
  }, [filteredBatches]);

  const getProfitLabel = (profit: number) => {
    if (profit > 0) {
      return { text: `盈利¥${profit.toFixed(2)}`, className: 'bg-sage-100 text-sage-600' };
    } else if (profit < 0) {
      return { text: `亏损¥${Math.abs(profit).toFixed(2)}`, className: 'bg-rose-100 text-rose-500' };
    }
    return { text: '持平', className: 'bg-stone-100 text-stone-500' };
  };

  const getProgressPercentages = (data: BatchProfitData) => {
    const { purchase, soldQuantity, wastageQuantity } = data;
    const total = purchase.quantity;
    return {
      sold: (soldQuantity / total) * 100,
      wastage: (wastageQuantity / total) * 100,
      remaining: (purchase.remainingStems / total) * 100,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">批次利润分析</h1>
          <p className="text-stone-500 text-sm mt-1">每批花的收支盈亏明细</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">花材：</label>
          <div className="flex flex-wrap gap-2">
            {FLOWER_FILTERS.map((flower) => (
              <button
                key={flower}
                onClick={() => setSelectedFlower(flower)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedFlower === flower
                    ? 'bg-gradient-to-r from-rose-400 to-orange-400 text-white shadow-md'
                    : 'bg-white text-stone-600 border border-rose-200 hover:border-rose-300'
                }`}
              >
                {flower}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">状态：</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="总批次"
          value={`${summaryStats.totalBatches} 批`}
          icon={<span className="text-2xl">📦</span>}
        />
        <StatCard
          title="总进货成本"
          value={`¥${summaryStats.totalPurchaseCost.toFixed(2)}`}
          icon={<span className="text-2xl">💰</span>}
          highlight="rose"
        />
        <StatCard
          title="总收入"
          value={`¥${summaryStats.totalIncome.toFixed(2)}`}
          icon={<span className="text-2xl">💵</span>}
          highlight="sage"
        />
        <StatCard
          title="总报损"
          value={`¥${Math.abs(summaryStats.totalWastage).toFixed(2)}`}
          icon={<span className="text-2xl">🗑️</span>}
          highlight="rose"
        />
        <StatCard
          title="总利润"
          value={`¥${summaryStats.totalProfit.toFixed(2)}`}
          icon={<span className="text-2xl">📈</span>}
          highlight={summaryStats.totalProfit >= 0 ? 'sage' : 'rose'}
        />
        <StatCard
          title="利润率"
          value={`${summaryStats.profitRate.toFixed(1)}%`}
          icon={<span className="text-2xl">📊</span>}
          highlight="orange"
        />
      </div>

      <div className="space-y-4">
        {filteredBatches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center text-stone-400">
            <p className="text-4xl mb-2">🌸</p>
            <p>暂无符合条件的批次数据</p>
          </div>
        ) : (
          filteredBatches.map((data) => {
            const profitLabel = getProfitLabel(data.profit);
            const progress = getProgressPercentages(data);
            const hasStock = data.purchase.remainingStems > 0;

            return (
              <div
                key={data.purchase.id}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5 hover:shadow-hover transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                      <span className="text-2xl">🌸</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-stone-800 font-serif">
                        {data.purchase.flowerName}
                      </h3>
                      <p className="text-sm text-stone-500">
                        批次 {data.purchase.id} · {formatDateCN(data.purchase.purchaseDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        hasStock
                          ? 'bg-sage-100 text-sage-600'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {hasStock ? '有库存' : '已售罄'}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${profitLabel.className}`}>
                      {profitLabel.text}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                  <div className="bg-rose-50/50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">进货成本</p>
                    <p className="text-lg font-bold text-rose-400 font-serif">
                      ¥{data.purchaseCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-sage-50/50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">正常收入</p>
                    <p className="text-lg font-bold text-sage-600 font-serif">
                      ¥{data.normalIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50/50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">特价收入</p>
                    <p className="text-lg font-bold text-orange-500 font-serif">
                      ¥{data.saleIncome.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-rose-50/50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">报损金额</p>
                    <p className="text-lg font-bold text-rose-400 font-serif">
                      ¥{data.wastageAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">剩余价值</p>
                    <p className="text-lg font-bold text-stone-600 font-serif">
                      ¥{data.remainingValue.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-stone-500 mb-1">
                    <span>已售 {progress.sold.toFixed(1)}%</span>
                    <span>报损 {progress.wastage.toFixed(1)}%</span>
                    <span>剩余 {progress.remaining.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-sage-400 to-sage-500 transition-all duration-500"
                      style={{ width: `${progress.sold}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
                      style={{ width: `${progress.wastage}%` }}
                    />
                    <div
                      className="h-full bg-gradient-to-r from-orange-300 to-orange-400 transition-all duration-500"
                      style={{ width: `${progress.remaining}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs text-stone-400 mt-2">
                  <span>共 {data.purchase.quantity} 支</span>
                  <span>已售 {data.soldQuantity} 支 · 报损 {data.wastageQuantity} 支 · 剩余 {data.purchase.remainingStems} 支</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
