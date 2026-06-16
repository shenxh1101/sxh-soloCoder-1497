import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { formatDateCN } from '../utils/date';

export default function RestockSuggestion() {
  const { flowers, purchases, orders } = useFlowerStore();
  const [historyDays, setHistoryDays] = useState<number>(30);
  const [wastageRate, setWastageRate] = useState<number>(10);
  const [forecastDays, setForecastDays] = useState<number>(14);

  const getDateDaysAgo = (days: number): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date;
  };

  const isDateInRange = (dateStr: string, days: number): boolean => {
    const date = new Date(dateStr);
    const startDate = getDateDaysAgo(days);
    return date >= startDate;
  };

  const getFlowerSales = (flowerId: string, days: number): number => {
    let total = 0;
    for (const order of orders) {
      if (order.status !== 'completed') continue;
      if (!isDateInRange(order.orderDate, days)) continue;
      for (const item of order.items) {
        for (const deduction of item.batchDeductions) {
          if (deduction.flowerId === flowerId) {
            total += deduction.quantity;
          }
        }
      }
    }
    return total;
  };

  const getLatestPurchase = (flowerId: string) => {
    const flowerPurchases = purchases
      .filter((p) => p.flowerId === flowerId)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    return flowerPurchases[0];
  };

  const getCurrentStock = (flowerId: string): number => {
    return purchases
      .filter((p) => p.flowerId === flowerId)
      .reduce((sum, p) => sum + p.remainingStems, 0);
  };

  const getTotalStockCost = (): number => {
    return purchases.reduce((sum, p) => {
      const costPerStem = p.totalCost / p.quantity;
      return sum + costPerStem * p.remainingStems;
    }, 0);
  };

  const suggestions = useMemo(() => {
    return flowers.map((flower) => {
      const currentStock = getCurrentStock(flower.id);
      const totalSales = getFlowerSales(flower.id, historyDays);
      const avgDailySales = totalSales / historyDays;
      const latestPurchase = getLatestPurchase(flower.id);
      const stemsPerBunch = latestPurchase?.stemsPerBunch || 20;
      const pricePerBunch = latestPurchase?.pricePerBunch || 0;

      const wastageEstimate = avgDailySales * forecastDays * (wastageRate / 100);
      const suggestedQuantity = avgDailySales * forecastDays * (1 + wastageRate / 100) + flower.safetyStock - currentStock;
      const suggestedBunches = suggestedQuantity > 0 ? Math.ceil(suggestedQuantity / stemsPerBunch) : 0;
      const estimatedCost = suggestedBunches * pricePerBunch;

      let status: 'sufficient' | 'suggested' | 'urgent';
      if (currentStock < flower.safetyStock) {
        status = 'urgent';
      } else if (suggestedQuantity > 0) {
        status = 'suggested';
      } else {
        status = 'sufficient';
      }

      const estimatedSalesDays = avgDailySales > 0 ? currentStock / avgDailySales : 0;

      return {
        flower,
        currentStock,
        totalSales,
        avgDailySales,
        safetyStock: flower.safetyStock,
        wastageEstimate,
        suggestedQuantity,
        suggestedBunches,
        stemsPerBunch,
        pricePerBunch,
        estimatedCost,
        status,
        estimatedSalesDays,
      };
    });
  }, [flowers, purchases, orders, historyDays, wastageRate, forecastDays]);

  const totalRestockCost = useMemo(() => {
    return suggestions.reduce((sum, s) => sum + s.estimatedCost, 0);
  }, [suggestions]);

  const avgEstimatedSalesDays = useMemo(() => {
    const withSales = suggestions.filter((s) => s.avgDailySales > 0);
    if (withSales.length === 0) return 0;
    return withSales.reduce((sum, s) => sum + s.estimatedSalesDays, 0) / withSales.length;
  }, [suggestions]);

  const statusConfig = {
    sufficient: { label: '库存充足', bg: 'bg-sage-100', text: 'text-sage-600' },
    suggested: { label: '建议补货', bg: 'bg-orange-100', text: 'text-orange-600' },
    urgent: { label: '急需补货', bg: 'bg-rose-100', text: 'text-rose-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 font-serif">补货建议</h1>
        <p className="text-stone-500 text-sm mt-1">智能分析销量与损耗，科学补货</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5">
        <h2 className="text-lg font-semibold text-stone-800 font-serif mb-4 flex items-center gap-2">
          <span>⚙️</span>
          参数配置
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-stone-600 mb-2">历史销量天数</label>
            <select
              value={historyDays}
              onChange={(e) => setHistoryDays(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            >
              <option value={7}>7天</option>
              <option value={14}>14天</option>
              <option value={30}>30天</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-2">花期损耗率 (%)</label>
            <input
              type="number"
              value={wastageRate}
              onChange={(e) => setWastageRate(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              min="0"
              max="100"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-600 mb-2">预计销售天数 (天)</label>
            <input
              type="number"
              value={forecastDays}
              onChange={(e) => setForecastDays(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="当前库存总支出"
          value={`¥${getTotalStockCost().toFixed(2)}`}
          icon={<span className="text-2xl">💵</span>}
          highlight="rose"
        />
        <StatCard
          title="建议补货总金额"
          value={`¥${totalRestockCost.toFixed(2)}`}
          icon={<span className="text-2xl">📦</span>}
          highlight="orange"
        />
        <StatCard
          title="预计可销售天数"
          value={`${avgEstimatedSalesDays.toFixed(1)} 天`}
          icon={<span className="text-2xl">📅</span>}
          highlight="sage"
        />
      </div>

      {suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
          <p className="text-5xl mb-4">🌸</p>
          <p className="text-stone-500 text-lg font-medium">暂无花材数据</p>
          <p className="text-stone-400 text-sm mt-2">请先添加花材和采购记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((item) => {
            const config = statusConfig[item.status];
            return (
              <div
                key={item.flower.id}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5 hover:shadow-hover hover:border-rose-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.flower.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-stone-800 font-serif text-lg">
                        {item.flower.name}
                      </h3>
                      <p className="text-sm text-stone-500">当前库存：{item.currentStock} 支</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-medium ${config.bg} ${config.text}`}
                  >
                    {config.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-rose-50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">日均销量</p>
                    <p className="text-lg font-bold text-rose-400 font-serif tabular-nums">
                      {item.avgDailySales.toFixed(1)} 支
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      近{historyDays}天共 {item.totalSales} 支
                    </p>
                  </div>
                  <div className="bg-sage-50 rounded-xl p-3">
                    <p className="text-xs text-stone-500 mb-1">安全库存</p>
                    <p className="text-lg font-bold text-sage-600 font-serif tabular-nums">
                      {item.safetyStock} 支
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      预计可售 {item.estimatedSalesDays.toFixed(1)} 天
                    </p>
                  </div>
                </div>

                {item.suggestedQuantity <= 0 ? (
                  <div className="bg-sage-50 rounded-xl p-4 text-center">
                    <p className="text-sage-600 font-medium">✨ 库存充足，无需补货</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">花期损耗预估</span>
                        <span className="text-stone-700 font-medium tabular-nums">
                          {item.wastageEstimate.toFixed(1)} 支
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">建议补货量</span>
                        <span className="text-stone-700 font-medium tabular-nums">
                          {Math.ceil(item.suggestedQuantity)} 支
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">每扎支数</span>
                        <span className="text-stone-700 font-medium tabular-nums">
                          {item.stemsPerBunch} 支/扎
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-500">每扎价格</span>
                        <span className="text-stone-700 font-medium tabular-nums">
                          ¥{item.pricePerBunch.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-rose-50 to-orange-50 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-stone-600">建议补货扎数</p>
                          <p className="text-2xl font-bold text-orange-500 font-serif tabular-nums">
                            {item.suggestedBunches} 扎
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-stone-600">预计金额</p>
                          <p className="text-2xl font-bold text-rose-400 font-serif tabular-nums">
                            ¥{item.estimatedCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
