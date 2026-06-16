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
  Legend,
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

  const totalSaleAmount = useMemo(() => {
    return monthOrders.reduce((sum, o) => sum + (o.saleAmount || 0), 0);
  }, [monthOrders]);

  const saleStats = useMemo(() => {
    const flowerSaleMap = new Map<string, { name: string; normalQuantity: number; saleQuantity: number; saleAmount: number; costAmount: number }>();

    for (const order of monthOrders) {
      for (const item of order.items) {
        const deductionsList = item.batchDeductions ?? [];
        for (const deduction of deductionsList) {
          const existing = flowerSaleMap.get(deduction.flowerId);
          if (existing) {
            if (deduction.isOnSale) {
              existing.saleQuantity += deduction.quantity;
              existing.saleAmount += deduction.unitPrice * deduction.quantity;
            } else {
              existing.normalQuantity += deduction.quantity;
            }
          } else {
            flowerSaleMap.set(deduction.flowerId, {
              name: deduction.flowerName,
              normalQuantity: deduction.isOnSale ? 0 : deduction.quantity,
              saleQuantity: deduction.isOnSale ? deduction.quantity : 0,
              saleAmount: deduction.isOnSale ? deduction.unitPrice * deduction.quantity : 0,
              costAmount: 0,
            });
          }
        }
      }
    }

    return Array.from(flowerSaleMap.values());
  }, [monthOrders]);

  const totalSaleQuantity = useMemo(() => {
    return saleStats.reduce((sum, s) => sum + s.saleQuantity, 0);
  }, [saleStats]);

  const totalNormalQuantity = useMemo(() => {
    return saleStats.reduce((sum, s) => sum + s.normalQuantity, 0);
  }, [saleStats]);

  const savedLossAmount = totalSaleAmount;

  const salePieData = useMemo(() => {
    const saleTotal = totalSaleQuantity;
    const normalTotal = totalNormalQuantity;
    return [
      { name: '特价销量', value: saleTotal, color: '#F59E0B' },
      { name: '正常销量', value: normalTotal, color: '#D4A5A5' },
    ];
  }, [totalSaleQuantity, totalNormalQuantity]);

  const salesRankingData = useMemo(() => {
    return saleStats
      .map((s) => ({
        name: s.name,
        normalQuantity: s.normalQuantity,
        saleQuantity: s.saleQuantity,
        total: s.normalQuantity + s.saleQuantity,
      }))
      .sort((a, b) => b.total - a.total);
  }, [saleStats]);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        <StatCard
          title="特价销售额"
          value={`¥${totalSaleAmount.toFixed(2)}`}
          icon={<span className="text-2xl">🔥</span>}
          highlight="orange"
        />
        <StatCard
          title="挽回损耗金额"
          value={`¥${savedLossAmount.toFixed(2)}`}
          icon={<span className="text-2xl">💚</span>}
          highlight="sage"
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
                  formatter={(value: number, name: string) => {
                    const label = name === 'normalQuantity' ? '正常销量' : name === 'saleQuantity' ? '特价销量' : name;
                    return [`${value} 支`, label];
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value: string) => {
                    return value === 'normalQuantity' ? '正常销量' : value === 'saleQuantity' ? '特价销量' : value;
                  }}
                />
                <defs>
                  <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A5A5" />
                    <stop offset="100%" stopColor="#E8BFB4" />
                  </linearGradient>
                  <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                </defs>
                <Bar
                  dataKey="normalQuantity"
                  stackId="a"
                  fill="url(#roseGradient)"
                  radius={[0, 0, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
                <Bar
                  dataKey="saleQuantity"
                  stackId="a"
                  fill="url(#orangeGradient)"
                  radius={[8, 8, 0, 0]}
                  animationDuration={800}
                  animationBegin={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-orange-100/50 p-5">
        <h2 className="text-lg font-semibold text-stone-800 font-serif mb-4 flex items-center gap-2">
          <span>💰</span>
          特价效果
        </h2>
        {totalSaleQuantity === 0 ? (
          <div className="text-center py-12 text-stone-400">
            <p className="text-4xl mb-2">🔥</p>
            <p>本月暂无特价销售数据</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-sm text-orange-600 mb-1">特价卖出数量</p>
                <p className="text-2xl font-bold text-orange-500 font-serif">
                  {totalSaleQuantity} 支
                </p>
                <div className="mt-2 space-y-1">
                  {saleStats.filter(s => s.saleQuantity > 0).map((s) => (
                    <div key={s.name} className="flex justify-between text-xs text-orange-700">
                      <span>{s.name}</span>
                      <span>{s.saleQuantity} 支</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-sage-50 rounded-xl p-4">
                <p className="text-sm text-sage-600 mb-1">挽回损耗金额</p>
                <p className="text-2xl font-bold text-sage-500 font-serif">
                  ¥{savedLossAmount.toFixed(2)}
                </p>
                <p className="text-xs text-sage-600 mt-2">
                  通过特价销售减少了库存损耗
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-stone-700 mb-3">正常销量 vs 特价销量</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: '正常销售', 数量: totalNormalQuantity, fill: '#D4A5A5' },
                        { name: '特价销售', 数量: totalSaleQuantity, fill: '#F59E0B' },
                      ]}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                    >
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
                        <linearGradient id="roseGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#D4A5A5" />
                          <stop offset="100%" stopColor="#E8BFB4" />
                        </linearGradient>
                        <linearGradient id="orangeGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#FBBF24" />
                        </linearGradient>
                      </defs>
                      <Bar
                        dataKey="数量"
                        fill="#D4A5A5"
                        radius={[8, 8, 0, 0]}
                        animationDuration={800}
                        animationBegin={0}
                      >
                        {[
                          <Cell key="normal" fill="url(#roseGradient2)" />,
                          <Cell key="sale" fill="url(#orangeGradient2)" />,
                        ]}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-stone-700 mb-3">特价销售占比</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        animationDuration={800}
                        animationBegin={0}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={{ stroke: '#A8A29E', strokeWidth: 1 }}
                      >
                        {salePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #F2D8D0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(212, 165, 165, 0.15)',
                        }}
                        formatter={(value: number) => [`${value} 支`, '销量']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
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
