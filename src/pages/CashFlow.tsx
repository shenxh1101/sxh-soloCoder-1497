import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { formatDateCN } from '../utils/date';
import { Order, Purchase, Wastage } from '../types';

interface MonthSummary {
  month: string;
  orderIncome: number;
  saleIncome: number;
  purchaseCost: number;
  wastageCost: number;
  netCashFlow: number;
  orders: Order[];
  purchases: Purchase[];
  wastages: Wastage[];
}

const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthCN = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
};

export default function CashFlow() {
  const { orders, purchases, wastages } = useFlowerStore();
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const monthDataMap = useMemo(() => {
    const map = new Map<string, MonthSummary>();

    const initMonth = (month: string): MonthSummary => {
      if (!map.has(month)) {
        map.set(month, {
          month,
          orderIncome: 0,
          saleIncome: 0,
          purchaseCost: 0,
          wastageCost: 0,
          netCashFlow: 0,
          orders: [],
          purchases: [],
          wastages: [],
        });
      }
      return map.get(month)!;
    };

    for (const order of orders) {
      if (order.status !== 'completed') continue;
      const month = getMonthKey(order.orderDate);
      const data = initMonth(month);
      data.orderIncome += order.totalAmount;
      data.orders.push(order);

      for (const item of order.items) {
        const deductions = item.batchDeductions ?? [];
        if (deductions.length === 0) continue;

        const itemTotalCost = deductions.reduce(
          (sum, d) => sum + d.unitPrice * d.quantity,
          0
        );

        if (itemTotalCost === 0) continue;

        for (const deduction of deductions) {
          const deductionCost = deduction.unitPrice * deduction.quantity;
          const allocationRatio = deductionCost / itemTotalCost;
          const allocatedIncome = item.subtotal * allocationRatio;

          if (deduction.isOnSale) {
            data.saleIncome += allocatedIncome;
          }
        }
      }
    }

    for (const purchase of purchases) {
      const month = getMonthKey(purchase.purchaseDate);
      const data = initMonth(month);
      data.purchaseCost += purchase.totalCost;
      data.purchases.push(purchase);
    }

    for (const wastage of wastages) {
      const month = getMonthKey(wastage.date);
      const data = initMonth(month);
      data.wastageCost += wastage.cost;
      data.wastages.push(wastage);
    }

    for (const data of map.values()) {
      data.netCashFlow = data.orderIncome - data.purchaseCost - data.wastageCost;
      data.orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      data.purchases.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      data.wastages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return map;
  }, [orders, purchases, wastages]);

  const sortedMonths = useMemo(() => {
    return Array.from(monthDataMap.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [monthDataMap]);

  const summaryStats = useMemo(() => {
    const totalOrderIncome = sortedMonths.reduce((sum, d) => sum + d.orderIncome, 0);
    const totalSaleIncome = sortedMonths.reduce((sum, d) => sum + d.saleIncome, 0);
    const totalPurchaseCost = sortedMonths.reduce((sum, d) => sum + d.purchaseCost, 0);
    const totalWastageCost = sortedMonths.reduce((sum, d) => sum + d.wastageCost, 0);
    const totalNetCashFlow = sortedMonths.reduce((sum, d) => sum + d.netCashFlow, 0);

    return {
      totalOrderIncome,
      totalSaleIncome,
      totalPurchaseCost,
      totalWastageCost,
      totalNetCashFlow,
    };
  }, [sortedMonths]);

  const toggleMonth = (month: string) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return <span className="px-2 py-0.5 rounded-full bg-sage-100 text-sage-600 text-xs">已完成</span>;
    }
    return <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 text-xs">已取消</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">现金流水</h1>
          <p className="text-stone-500 text-sm mt-1">按月统计收支明细和现金流</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="累计订单收入"
          value={`¥${summaryStats.totalOrderIncome.toFixed(2)}`}
          icon={<span className="text-2xl">💵</span>}
          highlight="sage"
        />
        <StatCard
          title="累计特价收入"
          value={`¥${summaryStats.totalSaleIncome.toFixed(2)}`}
          icon={<span className="text-2xl">🔥</span>}
          highlight="orange"
        />
        <StatCard
          title="累计进货支出"
          value={`¥${summaryStats.totalPurchaseCost.toFixed(2)}`}
          icon={<span className="text-2xl">💰</span>}
          highlight="rose"
        />
        <StatCard
          title="累计报损损失"
          value={`¥${summaryStats.totalWastageCost.toFixed(2)}`}
          icon={<span className="text-2xl">🗑️</span>}
          highlight="rose"
        />
        <StatCard
          title="累计净现金流"
          value={`¥${summaryStats.totalNetCashFlow.toFixed(2)}`}
          icon={<span className="text-2xl">📈</span>}
          highlight={summaryStats.totalNetCashFlow >= 0 ? 'sage' : 'rose'}
        />
      </div>

      <div className="space-y-4">
        {sortedMonths.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center text-stone-400">
            <p className="text-4xl mb-2">📊</p>
            <p>暂无现金流水数据</p>
          </div>
        ) : (
          sortedMonths.map((data) => {
            const isExpanded = expandedMonth === data.month;
            return (
              <div
                key={data.month}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 overflow-hidden transition-all duration-300"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-rose-50/30 transition-colors"
                  onClick={() => toggleMonth(data.month)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-stone-800 font-serif">
                          {formatMonthCN(data.month)}
                        </h3>
                        <p className="text-sm text-stone-500">
                          {data.orders.length} 单 · {data.purchases.length} 批进货 · {data.wastages.length} 次报损
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                    <div className="bg-sage-50/50 rounded-xl p-3">
                      <p className="text-xs text-stone-500 mb-1">订单收入</p>
                      <p className="text-lg font-bold text-sage-600 font-serif">
                        ¥{data.orderIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-orange-50/50 rounded-xl p-3">
                      <p className="text-xs text-stone-500 mb-1">特价收入</p>
                      <p className="text-lg font-bold text-orange-500 font-serif">
                        ¥{data.saleIncome.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-rose-50/50 rounded-xl p-3">
                      <p className="text-xs text-stone-500 mb-1">进货支出</p>
                      <p className="text-lg font-bold text-rose-400 font-serif">
                        ¥{data.purchaseCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-rose-50/50 rounded-xl p-3">
                      <p className="text-xs text-stone-500 mb-1">报损损失</p>
                      <p className="text-lg font-bold text-rose-400 font-serif">
                        ¥{data.wastageCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                      <p className="text-xs text-stone-500 mb-1">净现金流</p>
                      <p className={`text-lg font-bold font-serif ${data.netCashFlow >= 0 ? 'text-sage-600' : 'text-rose-400'}`}>
                        ¥{data.netCashFlow.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-rose-100 p-5 space-y-6 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                        <span>📋</span>
                        <span>订单明细</span>
                      </h4>
                      {data.orders.length === 0 ? (
                        <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-400 text-sm">
                          本月暂无订单
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-100">
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">日期</th>
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">客户</th>
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">模板</th>
                                <th className="text-right py-2 px-3 text-stone-500 font-medium">金额</th>
                                <th className="text-center py-2 px-3 text-stone-500 font-medium">状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.orders.map((order) => {
                                const templates = order.items.map((i) => i.templateName).join('、');
                                return (
                                  <tr key={order.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                    <td className="py-3 px-3 text-stone-600">{formatDateCN(order.orderDate)}</td>
                                    <td className="py-3 px-3 text-stone-700 font-medium">{order.customerName}</td>
                                    <td className="py-3 px-3 text-stone-600">{templates}</td>
                                    <td className="py-3 px-3 text-right font-semibold text-rose-400">¥{order.totalAmount.toFixed(2)}</td>
                                    <td className="py-3 px-3 text-center">{getStatusBadge(order.status)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                        <span>🌷</span>
                        <span>进货明细</span>
                      </h4>
                      {data.purchases.length === 0 ? (
                        <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-400 text-sm">
                          本月暂无进货
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-100">
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">日期</th>
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">花材</th>
                                <th className="text-right py-2 px-3 text-stone-500 font-medium">数量</th>
                                <th className="text-right py-2 px-3 text-stone-500 font-medium">成本</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.purchases.map((purchase) => (
                                <tr key={purchase.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                  <td className="py-3 px-3 text-stone-600">{formatDateCN(purchase.purchaseDate)}</td>
                                  <td className="py-3 px-3 text-stone-700 font-medium">{purchase.flowerName}</td>
                                  <td className="py-3 px-3 text-right text-stone-600">{purchase.quantity} 支</td>
                                  <td className="py-3 px-3 text-right font-semibold text-rose-400">¥{purchase.totalCost.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                        <span>🗑️</span>
                        <span>报损明细</span>
                      </h4>
                      {data.wastages.length === 0 ? (
                        <div className="bg-stone-50 rounded-xl p-6 text-center text-stone-400 text-sm">
                          本月暂无报损
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-stone-100">
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">日期</th>
                                <th className="text-left py-2 px-3 text-stone-500 font-medium">花材</th>
                                <th className="text-right py-2 px-3 text-stone-500 font-medium">数量</th>
                                <th className="text-right py-2 px-3 text-stone-500 font-medium">损失</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.wastages.map((wastage) => (
                                <tr key={wastage.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                                  <td className="py-3 px-3 text-stone-600">{formatDateCN(wastage.date)}</td>
                                  <td className="py-3 px-3 text-stone-700 font-medium">{wastage.flowerName}</td>
                                  <td className="py-3 px-3 text-right text-stone-600">{wastage.quantity} 支</td>
                                  <td className="py-3 px-3 text-right font-semibold text-rose-400">¥{wastage.cost.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
