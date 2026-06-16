import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { cn } from '../lib/utils';
import { formatDateCN, getCurrentMonth } from '../utils/date';
import type { BatchDeduction } from '../types';

type StatusFilter = 'all' | 'completed' | 'cancelled';

const isInMonth = (dateStr: string, monthStr: string): boolean => {
  const date = new Date(dateStr);
  const [year, month] = monthStr.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1;
};

const formatMonthCN = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
};

const generateMonthOptions = () => {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  return options;
};

const calcSaleRatio = (saleAmount: number, normalAmount: number): number => {
  const total = saleAmount + normalAmount;
  if (total === 0) return 0;
  return saleAmount / total;
};

export default function Reconciliation() {
  const { orders, purchases } = useFlowerStore();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    let result = orders.filter((o) => isInMonth(o.orderDate, selectedMonth));

    if (statusFilter === 'completed') {
      result = result.filter((o) => o.status === 'completed');
    } else if (statusFilter === 'cancelled') {
      result = result.filter((o) => o.status === 'cancelled');
    }

    return result.sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }, [orders, selectedMonth, statusFilter]);

  const stats = useMemo(() => {
    const monthOrders = orders.filter((o) => isInMonth(o.orderDate, selectedMonth));
    const totalOrders = monthOrders.length;
    const totalReceivable = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const completedAmount = monthOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const cancelledAmount = monthOrders
      .filter((o) => o.status === 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalSaleAmount = monthOrders.reduce((sum, o) => sum + (o.saleAmount || 0), 0);
    const totalNormalAmount = monthOrders.reduce((sum, o) => sum + (o.normalAmount || 0), 0);
    const saleRatio = calcSaleRatio(totalSaleAmount, totalNormalAmount);

    return {
      totalOrders,
      totalReceivable,
      completedAmount,
      cancelledAmount,
      saleRatio,
    };
  }, [orders, selectedMonth]);

  const getPurchaseById = (purchaseId: string) => {
    return purchases.find((p) => p.id === purchaseId);
  };

  const formatBatchDeduction = (deduction: BatchDeduction) => {
    const purchase = getPurchaseById(deduction.purchaseId);
    const purchaseDate = purchase ? formatDateCN(purchase.purchaseDate) : '';
    return {
      ...deduction,
      purchaseDate,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">订单对账</h1>
          <p className="text-stone-500 text-sm mt-1">月底核账和订单明细查询</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-600 whitespace-nowrap">月份：</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            >
              {generateMonthOptions().map((month) => (
                <option key={month} value={month}>
                  {formatMonthCN(month)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-stone-600 whitespace-nowrap">订单状态：</label>
            <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
              {(['all', 'completed', 'cancelled'] as StatusFilter[]).map((status) => {
                const labels = {
                  all: '全部',
                  completed: '已完成',
                  cancelled: '已撤销',
                };
                const isActive = statusFilter === status;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white text-rose-500 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    )}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="订单总数"
          value={`${stats.totalOrders} 单`}
          icon={<span className="text-2xl">📋</span>}
        />
        <StatCard
          title="应收总金额"
          value={`¥${stats.totalReceivable.toFixed(2)}`}
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          title="已完成金额"
          value={`¥${stats.completedAmount.toFixed(2)}`}
          icon={<span className="text-2xl">✅</span>}
          highlight="sage"
        />
        <StatCard
          title="已撤销金额"
          value={`¥${stats.cancelledAmount.toFixed(2)}`}
          icon={<span className="text-2xl">❌</span>}
          highlight="orange"
        />
        <StatCard
          title="特价花材占比"
          value={`${(stats.saleRatio * 100).toFixed(1)}%`}
          icon={<span className="text-2xl">🔥</span>}
          highlight="orange"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-stone-500">暂无订单记录</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const firstItem = order.items[0];
            const orderSaleRatio = calcSaleRatio(order.saleAmount || 0, order.normalAmount || 0);

            return (
              <div
                key={order.id}
                className={cn(
                  'bg-white rounded-2xl shadow-card border p-5 transition-all duration-300',
                  'hover:shadow-hover hover:-translate-y-0.5',
                  isCancelled
                    ? 'border-stone-200 opacity-60'
                    : 'border-rose-100/50 hover:border-rose-200'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-3xl',
                        isCancelled ? 'bg-stone-100' : 'bg-rose-50'
                      )}
                    >
                      💐
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-800 text-lg">
                          {order.customerName}
                        </h3>
                        {isCancelled ? (
                          <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 text-xs">
                            已取消
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-sage-100 text-sage-600 text-xs">
                            已完成
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-400">{order.customerPhone}</p>
                      <p className="text-xs text-stone-400 mt-1">
                        {formatDateCN(order.orderDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'text-2xl font-bold font-serif',
                        isCancelled ? 'text-stone-400' : 'text-rose-400'
                      )}
                    >
                      ¥{order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-stone-500">
                      {firstItem?.templateName} ×{firstItem?.quantity}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-rose-100">
                  <button
                    onClick={() =>
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                    }
                    className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    <span>{expandedOrderId === order.id ? '收起' : '查看'}批次扣减详情</span>
                    <span
                      className={cn(
                        'transition-transform duration-200',
                        expandedOrderId === order.id && 'rotate-180'
                      )}
                    >
                      ▼
                    </span>
                  </button>
                </div>

                {expandedOrderId === order.id && (
                  <div className="mt-4 pt-4 border-t border-dashed border-rose-100 animate-fade-in">
                    <p className="text-sm font-medium text-stone-700 mb-3">批次扣减详情：</p>
                    <div className="space-y-2">
                      {order.items.flatMap((item) =>
                        (item.batchDeductions ?? []).map((deduction, idx) => {
                          const formatted = formatBatchDeduction(deduction);
                          return (
                            <div
                              key={`${deduction.purchaseId}-${idx}`}
                              className="flex items-start gap-2 text-sm"
                            >
                              <span className="text-stone-400 mt-0.5">•</span>
                              <div className="flex-1">
                                <span className="text-stone-700">
                                  {deduction.flowerName}
                                </span>
                                <span className="text-stone-400 ml-2">
                                  - 批次 {deduction.purchaseId} ({formatted.purchaseDate}进货)
                                </span>
                                <span className="text-stone-700 ml-2">
                                  - {deduction.quantity}支
                                </span>
                                <span className="text-stone-500 ml-1">
                                  (¥{deduction.unitPrice.toFixed(1)}/支)
                                </span>
                                {deduction.isOnSale && (
                                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                                    🔥 特价
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-rose-50 flex justify-between items-center">
                      <span className="text-sm text-stone-500">特价花材占比</span>
                      <span className="text-sm font-semibold text-orange-500">
                        {(orderSaleRatio * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
