import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { formatDateCN } from '../utils/date';
import type { BouquetTemplate, BatchDeduction } from '../types';

type OrderStep = 1 | 2 | 3;

export default function Orders() {
  const { orders, templates, flowers, purchases, checkStockForOrder, createOrder, cancelOrder, isPurchaseSaleActive } =
    useFlowerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<OrderStep>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<BouquetTemplate | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }, [orders]);

  const stockCheck = useMemo(() => {
    if (!selectedTemplate || !quantity || parseInt(quantity) <= 0) {
      return null;
    }
    return checkStockForOrder(selectedTemplate.id, parseInt(quantity));
  }, [selectedTemplate, quantity, checkStockForOrder]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setStep(1);
    setSelectedTemplate(null);
    setQuantity('1');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setStep(1);
    setSelectedTemplate(null);
    setQuantity('1');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleSelectTemplate = (template: BouquetTemplate) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (!quantity || parseInt(quantity) <= 0 || !customerName.trim() || !customerPhone.trim()) {
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((step - 1) as OrderStep);
    }
  };

  const handleSubmit = () => {
    if (!selectedTemplate || !customerName.trim() || !customerPhone.trim()) {
      return;
    }

    const result = createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      templateId: selectedTemplate.id,
      quantity: parseInt(quantity),
    });

    if (result.success) {
      handleClose();
    } else {
      alert(result.message);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('确定要撤销这个订单吗？撤销后库存将自动恢复。')) {
      const result = cancelOrder(orderId);
      if (result.success) {
        alert('已按原批次恢复库存');
      }
    }
  };

  const isStep2Valid =
    quantity !== '' &&
    parseInt(quantity) > 0 &&
    customerName.trim() !== '' &&
    customerPhone.trim() !== '';

  const canSubmit = stockCheck?.sufficient ?? false;

  const getPurchaseById = (purchaseId: string) => {
    return purchases.find((p) => p.id === purchaseId);
  };

  const getFlowerSaleInfo = (flowerId: string) => {
    return purchases.find(
      (p) =>
        p.flowerId === flowerId &&
        p.salePrice !== null &&
        isPurchaseSaleActive(p)
    );
  };

  const formatBatchDeduction = (deduction: BatchDeduction) => {
    const purchase = getPurchaseById(deduction.purchaseId);
    const purchaseDate = purchase ? formatDateCN(purchase.purchaseDate) : '';
    const priceType = deduction.isOnSale ? '特价' : '正常';
    return {
      ...deduction,
      purchaseDate,
      priceType,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">订单销售</h1>
          <p className="text-stone-500 text-sm mt-1">管理所有订单和销售记录</p>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenModal}>
          <span>+</span>
          新建订单
        </Button>
      </div>

      {sortedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-stone-500">暂无订单记录</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={handleOpenModal}
          >
            创建第一个订单
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const firstItem = order.items[0];

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
                        {isCancelled && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 text-xs">
                            已取消
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

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-rose-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    className="text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                  >
                    <span>{expandedOrderId === order.id ? '收起' : '查看'}批次扣减</span>
                    <span
                      className={cn(
                        'transition-transform duration-200',
                        expandedOrderId === order.id && 'rotate-180'
                      )}
                    >
                      ▼
                    </span>
                  </Button>
                  {!isCancelled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      撤销订单
                    </Button>
                  )}
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
                                  ({formatted.priceType} ¥{deduction.unitPrice.toFixed(1)}/支)
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="新建订单"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    step === s
                      ? 'bg-rose-400 text-white'
                      : step > s
                      ? 'bg-sage-400 text-white'
                      : 'bg-stone-200 text-stone-400'
                  )}
                >
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-12 h-1 mx-1 rounded transition-all duration-300',
                      step > s ? 'bg-sage-400' : 'bg-stone-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-stone-500 text-center">请选择花束模板</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all duration-200',
                      'hover:border-rose-300 hover:shadow-md',
                      'bg-white border-rose-100'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-stone-800">{template.name}</h4>
                      <span className="text-xl">💐</span>
                    </div>
                    <p className="text-lg font-bold text-rose-400 font-serif">
                      ¥{template.price}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.items.slice(0, 3).map((item, i) => {
                        const flower = flowers.find((f) => f.id === item.flowerId);
                        return (
                          <span
                            key={i}
                            className="text-xs text-stone-500"
                          >
                            {flower?.emoji}
                            {item.flowerName}
                          </span>
                        );
                      })}
                      {template.items.length > 3 && (
                        <span className="text-xs text-stone-400">+{template.items.length - 3}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedTemplate && (
            <div className="space-y-4">
              <div className="bg-rose-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-500">已选花束</p>
                    <p className="font-semibold text-stone-800">{selectedTemplate.name}</p>
                  </div>
                  <p className="text-xl font-bold text-rose-400 font-serif">
                    ¥{selectedTemplate.price}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  订购数量
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  客户姓名
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="请输入客户姓名"
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  联系电话
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="请输入联系电话"
                  className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                />
              </div>

              {isStep2Valid && (
                <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
                  <p>
                    预计总金额：
                    <span className="font-semibold text-lg">
                      ¥{(selectedTemplate.price * parseInt(quantity || '0')).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && selectedTemplate && stockCheck && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-stone-500">订单确认</p>
                <h3 className="text-xl font-semibold text-stone-800 font-serif mt-1">
                  {selectedTemplate.name}
                </h3>
                <p className="text-2xl font-bold text-rose-400 font-serif mt-2">
                  ¥{(selectedTemplate.price * parseInt(quantity || '0')).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">客户姓名</span>
                  <span className="text-stone-700 font-medium">{customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">联系电话</span>
                  <span className="text-stone-700 font-medium">{customerPhone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">订购数量</span>
                  <span className="text-stone-700 font-medium">{quantity} 束</span>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-4">
                <p className="text-sm font-medium text-stone-700 mb-3">花材库存校验</p>
                <div className="space-y-2">
                  {stockCheck.flowerUsage.map((usage, index) => {
                    const isSufficient = usage.available >= usage.required;
                    const flower = flowers.find((f) => f.id === usage.flowerId);
                    const saleInfo = getFlowerSaleInfo(usage.flowerId);
                    return (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl',
                          isSufficient ? 'bg-sage-50' : 'bg-red-50'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{flower?.emoji || '🌸'}</span>
                          <div>
                            <span className="text-sm text-stone-700">{usage.flowerName}</span>
                            {saleInfo && saleInfo.salePrice !== null && (
                              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full font-medium">
                                有特价¥{saleInfo.salePrice.toFixed(1)}/支
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isSufficient ? 'text-sage-600' : 'text-red-500'
                            )}
                          >
                            {usage.required} 支 / {usage.available} 支
                          </p>
                          <p
                            className={cn(
                              'text-xs',
                              isSufficient ? 'text-sage-400' : 'text-red-400'
                            )}
                          >
                            {isSufficient ? '库存充足' : `缺 ${usage.required - usage.available} 支`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {stockCheck.sufficient ? (
                <div className="bg-sage-100 rounded-xl p-4 text-center">
                  <p className="text-sage-700 font-medium">✓ 库存充足，可以提交订单</p>
                </div>
              ) : (
                <div className="bg-red-100 rounded-xl p-4 text-center animate-pulse-soft">
                  <p className="text-red-600 font-medium">✗ 库存不足，无法提交订单</p>
                  <p className="text-red-400 text-sm mt-1">请先补充花材库存</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 ? (
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={handlePrevStep}
              >
                上一步
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={handleClose}
              >
                取消
              </Button>
            )}

            {step < 3 ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleNextStep}
                disabled={step === 2 && !isStep2Valid}
              >
                下一步
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                确认下单
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
