import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { StatCard } from '../components/ui/StatCard';
import { formatDateCN } from '../utils/date';
import { cn } from '../lib/utils';
import type { Order } from '../types';

type CustomerStatus = 'all' | 'new' | 'returning' | 'loyal';
type SortField = 'totalSpent' | 'orderCount' | 'lastOrderDate';

interface CustomerData {
  customerName: string;
  customerPhone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  templates: string[];
  orders: Order[];
}

const getCustomerStatus = (orderCount: number): { label: string; className: string } => {
  if (orderCount === 1) {
    return { label: '新客户', className: 'bg-stone-100 text-stone-500' };
  } else if (orderCount >= 2 && orderCount <= 3) {
    return { label: '回头客', className: 'bg-orange-100 text-orange-600' };
  } else {
    return { label: '老客户', className: 'bg-sage-100 text-sage-600' };
  }
};

const getOrderStatusDisplay = (status: Order['status']): { label: string; className: string } => {
  if (status === 'completed') {
    return { label: '已完成', className: 'bg-sage-100 text-sage-600' };
  } else {
    return { label: '已取消', className: 'bg-stone-100 text-stone-500' };
  }
};

export default function CustomerAnalysis() {
  const { orders } = useFlowerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus>('all');
  const [sortField, setSortField] = useState<SortField>('totalSpent');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);

  const customers = useMemo((): CustomerData[] => {
    const customerMap = new Map<string, CustomerData>();

    for (const order of orders) {
      const phone = order.customerPhone;
      const existing = customerMap.get(phone);

      const templateNames = order.items.map((item) => item.templateName);

      if (existing) {
        existing.orderCount += 1;
        if (order.status === 'completed') {
          existing.totalSpent += order.totalAmount;
        }
        if (new Date(order.orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.orderDate;
        }
        for (const tpl of templateNames) {
          if (!existing.templates.includes(tpl)) {
            existing.templates.push(tpl);
          }
        }
        existing.orders.push(order);
      } else {
        customerMap.set(phone, {
          customerName: order.customerName,
          customerPhone: phone,
          orderCount: 1,
          totalSpent: order.status === 'completed' ? order.totalAmount : 0,
          lastOrderDate: order.orderDate,
          templates: [...new Set(templateNames)],
          orders: [order],
        });
      }
    }

    return Array.from(customerMap.values());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.customerName.toLowerCase().includes(query) ||
          c.customerPhone.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((c) => {
        if (statusFilter === 'new') return c.orderCount === 1;
        if (statusFilter === 'returning') return c.orderCount >= 2 && c.orderCount <= 3;
        if (statusFilter === 'loyal') return c.orderCount >= 4;
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortField === 'totalSpent') {
        return b.totalSpent - a.totalSpent;
      } else if (sortField === 'orderCount') {
        return b.orderCount - a.orderCount;
      } else {
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      }
    });

    return result;
  }, [customers, searchQuery, statusFilter, sortField]);

  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const returningCustomers = customers.filter((c) => c.orderCount >= 2).length;
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    return {
      totalCustomers,
      returningCustomers,
      totalSpent,
      avgOrderValue,
    };
  }, [customers]);

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'totalSpent', label: '累计消费' },
    { value: 'orderCount', label: '订单数' },
    { value: 'lastOrderDate', label: '最近下单' },
  ];

  const statusOptions: { value: CustomerStatus; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'new', label: '新客户' },
    { value: 'returning', label: '回头客' },
    { value: 'loyal', label: '老客户' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">客户分析</h1>
          <p className="text-stone-500 text-sm mt-1">查看客户复购行为和消费数据</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总客户数"
          value={`${stats.totalCustomers} 人`}
          icon={<span className="text-2xl">👥</span>}
        />
        <StatCard
          title="回头客数"
          value={`${stats.returningCustomers} 人`}
          icon={<span className="text-2xl">💝</span>}
          highlight="orange"
        />
        <StatCard
          title="累计消费总额"
          value={`¥${stats.totalSpent.toFixed(2)}`}
          icon={<span className="text-2xl">💰</span>}
        />
        <StatCard
          title="平均客单价"
          value={`¥${stats.avgOrderValue.toFixed(2)}`}
          icon={<span className="text-2xl">📊</span>}
          highlight="sage"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索客户姓名或手机号..."
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CustomerStatus)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ↓
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-stone-500">暂无匹配的客户数据</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => {
            const status = getCustomerStatus(customer.orderCount);
            const isExpanded = expandedPhone === customer.customerPhone;
            const sortedOrders = [...customer.orders].sort(
              (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
            );

            return (
              <div
                key={customer.customerPhone}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 overflow-hidden transition-all duration-300 hover:shadow-hover hover:border-rose-200"
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedPhone(isExpanded ? null : customer.customerPhone)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-3xl">
                        👤
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-stone-800 text-lg">
                            {customer.customerName}
                          </h3>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-stone-400 mt-0.5">{customer.customerPhone}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {customer.templates.map((tpl, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-rose-50 text-rose-500 rounded-full"
                            >
                              💐 {tpl}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold font-serif text-rose-400">
                        ¥{customer.totalSpent.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
                        <span>{customer.orderCount} 单</span>
                        <span>·</span>
                        <span>最近 {formatDateCN(customer.lastOrderDate)}</span>
                      </div>
                      <div className="mt-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-sm text-stone-400 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        >
                          {isExpanded ? '收起' : '展开订单'}
                          <span>▼</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-rose-100 bg-rose-50/30">
                    <div className="p-4 space-y-3">
                      <p className="text-sm font-medium text-stone-600 px-1">订单记录：</p>
                      {sortedOrders.map((order) => {
                        const orderStatus = getOrderStatusDisplay(order.status);
                        const firstItem = order.items[0];

                        return (
                          <div
                            key={order.id}
                            className={cn(
                              'bg-white rounded-xl p-4 border',
                              order.status === 'cancelled'
                                ? 'border-stone-200 opacity-60'
                                : 'border-rose-100'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">💐</span>
                                <div>
                                  <p className="font-medium text-stone-700">
                                    {firstItem?.templateName} ×{firstItem?.quantity}
                                  </p>
                                  <p className="text-xs text-stone-400">
                                    {formatDateCN(order.orderDate)} · {order.id}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={cn(
                                    'font-bold font-serif',
                                    order.status === 'cancelled'
                                      ? 'text-stone-400'
                                      : 'text-rose-400'
                                  )}
                                >
                                  ¥{order.totalAmount.toFixed(2)}
                                </p>
                                <span
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    orderStatus.className
                                  )}
                                >
                                  {orderStatus.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
