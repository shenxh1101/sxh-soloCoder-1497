import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { formatDateCN, getCurrentMonth } from '../utils/date';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#D4A5A5', '#9CAF88', '#E8D4A8', '#E8BFB4', '#B5C4A3', '#F0E3CA'];

const isInMonth = (dateStr: string, monthStr: string): boolean => {
  const date = new Date(dateStr);
  const [year, month] = monthStr.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() === month - 1;
};

export default function Stats() {
  const { orders, wastages } = useFlowerStore();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const monthOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'completed' && isInMonth(o.orderDate, selectedMonth)
    );
  }, [orders, selectedMonth]);

  const monthWastages = useMemo(() => {
    return wastages.filter((w) => isInMonth(w.date, selectedMonth));
  }, [wastages, selectedMonth]);

  const totalSales = useMemo(() => {
    return monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [monthOrders]);

  const totalOrders = monthOrders.length;

  const avgOrderValue = useMemo(() => {
    if (totalOrders === 0) return 0;
    return totalSales / totalOrders;
  }, [totalSales, totalOrders]);

  const salesRankingData = useMemo(() => {
    const flowerUsageMap = new Map<string, { name: string; quantity: number }>();

    for (const order of monthOrders) {
      for (const item of order.items) {
        for (const usage of item.flowerUsage) {
          const existing = flowerUsageMap.get(usage.flowerId);
          if (existing) {
            existing.quantity += usage.quantity;
          } else {
            flowerUsageMap.set(usage.flowerId, {
              name: usage.flowerName,
              quantity: usage.quantity,
            });
          }
        }
      }
    }

    return Array.from(flowerUsageMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [monthOrders]);

  const wastageStatsData = useMemo(() => {
    const flowerWastageMap = new Map<string, { name: string; quantity: number; cost: number }>();

    for (const wastage of monthWastages) {
      const existing = flowerWastageMap.get(wastage.flowerId);
      if (existing) {
        existing.quantity += wastage.quantity;
        existing.cost += wastage.cost;
      } else {
        flowerWastageMap.set(wastage.flowerId, {
          name: wastage.flowerName,
          quantity: wastage.quantity,
          cost: wastage.cost,
        });
      }
    }

    return Array.from(flowerWastageMap.values()).sort((a, b) => b.cost - a.cost);
  }, [monthWastages]);

  const totalWastageCost = useMemo(() => {
    return monthWastages.reduce((sum, w) => sum + w.cost, 0);
  }, [monthWastages]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">月度统计</h1>
          <p className="text-stone-500 text-sm mt-1">查看月度销售与损耗数据</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">选择月份：</label>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="总销售额"
          value={`¥${totalSales.toFixed(2)}`}
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          title="总订单数"
          value={`${totalOrders} 单`}
          icon={<span className="text-2xl">📋</span>}
        />
        <StatCard
          title="平均客单价"
          value={`¥${avgOrderValue.toFixed(2)}`}
          icon={<span className="text-2xl">📊</span>}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5">
        <h2 className="text-lg font-semibold text-stone-800 font-serif mb-4 flex items-center gap-2">
          <span>📊</span>
          销量排行
        </h2>
        {salesRankingData.length === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p className="text-4xl mb-2">🌸</p>
            <p>本月暂无销售数据</p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesRankingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  axisLine={{ stroke: '#F2D8D0' }}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#78716c', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #F2D8D0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(212, 165, 165, 0.15)',
                  }}
                  formatter={(value: number) => [`${value} 支`, '销量']}
                />
                <defs>
                  <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A5A5" />
                    <stop offset="100%" stopColor="#E8BFB4" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="quantity"
                  fill="url(#roseGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5">
          <h2 className="text-lg font-semibold text-stone-800 font-serif mb-4 flex items-center gap-2">
            <span>🗑️</span>
            损耗统计
          </h2>
          {wastageStatsData.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-4xl mb-2">🌿</p>
              <p>本月暂无损耗记录</p>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wastageStatsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="cost"
                      animationDuration={800}
                      animationBegin={0}
                    >
                      {wastageStatsData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #F2D8D0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(212, 165, 165, 0.15)',
                      }}
                      formatter={(value: number, name: string) => [
                        `¥${value.toFixed(2)}`,
                        name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {wastageStatsData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-stone-600">
                      {item.name} ({item.quantity}支)
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-rose-100 text-center">
                <p className="text-sm text-stone-500">总损耗金额</p>
                <p className="text-xl font-bold text-rose-400 font-serif mt-1">
                  ¥{totalWastageCost.toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-100">
            <h2 className="text-lg font-semibold text-stone-800 font-serif flex items-center gap-2">
              <span>📝</span>
              损耗明细
            </h2>
          </div>
          {monthWastages.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <p className="text-4xl mb-2">🌱</p>
              <p>本月暂无损耗记录</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {monthWastages.map((wastage) => (
                <div
                  key={wastage.id}
                  className="px-5 py-4 border-b border-rose-50 last:border-b-0 hover:bg-rose-50/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🌸</span>
                      <span className="font-medium text-stone-700">
                        {wastage.flowerName}
                      </span>
                    </div>
                    <span className="text-rose-400 font-semibold font-serif">
                      ¥{wastage.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-stone-500">
                    <span>数量：{wastage.quantity} 支</span>
                    <span>{formatDateCN(wastage.date)}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">原因：{wastage.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
