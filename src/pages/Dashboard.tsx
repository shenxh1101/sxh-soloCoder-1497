import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { formatDateCN } from '../utils/date';
import type { BouquetTemplate } from '../types';

type QuickOrderStep = 1 | 2 | 3;

export default function Dashboard() {
  const {
    flowers,
    purchases,
    templates,
    getStockByFlowerId,
    getExpiringPurchases,
    addPurchase,
    addWastage,
    checkStockForOrder,
    createOrder,
  } = useFlowerStore();
  const expiringPurchases = getExpiringPurchases(3);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<string>('');
  const [purchaseQuantity, setPurchaseQuantity] = useState<string>('');
  const [stemsPerBunch, setStemsPerBunch] = useState<string>('20');
  const [pricePerBunch, setPricePerBunch] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderStep, setOrderStep] = useState<QuickOrderStep>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<BouquetTemplate | null>(null);
  const [orderQuantity, setOrderQuantity] = useState('1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const stockCheck = useMemo(() => {
    if (!selectedTemplate || !orderQuantity || parseInt(orderQuantity) <= 0) {
      return null;
    }
    return checkStockForOrder(selectedTemplate.id, parseInt(orderQuantity));
  }, [selectedTemplate, orderQuantity, checkStockForOrder]);

  const handleOpenPurchaseModal = () => {
    setIsPurchaseModalOpen(true);
    setSelectedFlower('');
    setPurchaseQuantity('');
    setStemsPerBunch('20');
    setPricePerBunch('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const handleClosePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
  };

  const handleSubmitPurchase = () => {
    if (!selectedFlower || !purchaseQuantity || !stemsPerBunch || !pricePerBunch || !purchaseDate) {
      return;
    }

    addPurchase({
      flowerId: selectedFlower,
      quantity: parseInt(purchaseQuantity),
      stemsPerBunch: parseInt(stemsPerBunch),
      pricePerBunch: parseFloat(pricePerBunch),
      purchaseDate,
    });

    handleClosePurchaseModal();
  };

  const isPurchaseFormValid =
    selectedFlower &&
    purchaseQuantity &&
    parseInt(purchaseQuantity) > 0 &&
    stemsPerBunch &&
    parseInt(stemsPerBunch) > 0 &&
    pricePerBunch &&
    parseFloat(pricePerBunch) > 0 &&
    purchaseDate;

  const handleOpenOrderModal = () => {
    setIsOrderModalOpen(true);
    setOrderStep(1);
    setSelectedTemplate(null);
    setOrderQuantity('1');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setOrderStep(1);
    setSelectedTemplate(null);
    setOrderQuantity('1');
    setCustomerName('');
    setCustomerPhone('');
  };

  const handleSelectTemplate = (template: BouquetTemplate) => {
    setSelectedTemplate(template);
    setOrderStep(2);
  };

  const handleNextOrderStep = () => {
    if (orderStep === 2) {
      if (!orderQuantity || parseInt(orderQuantity) <= 0 || !customerName.trim() || !customerPhone.trim()) {
        return;
      }
      setOrderStep(3);
    }
  };

  const handlePrevOrderStep = () => {
    if (orderStep > 1) {
      setOrderStep((orderStep - 1) as QuickOrderStep);
    }
  };

  const handleSubmitOrder = () => {
    if (!selectedTemplate || !customerName.trim() || !customerPhone.trim()) {
      return;
    }

    const result = createOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      templateId: selectedTemplate.id,
      quantity: parseInt(orderQuantity),
    });

    if (result.success) {
      handleCloseOrderModal();
    } else {
      alert(result.message);
    }
  };

  const isOrderStep2Valid =
    orderQuantity !== '' &&
    parseInt(orderQuantity) > 0 &&
    customerName.trim() !== '' &&
    customerPhone.trim() !== '';

  const canSubmitOrder = stockCheck?.sufficient ?? false;

  const handleWastage = (purchaseId: string, flowerId: string, quantity: number) => {
    if (window.confirm(`确定要报损 ${quantity} 支花材吗？`)) {
      addWastage({
        flowerId,
        quantity,
        reason: '花期过了',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {flowers.map((flower) => {
          const stock = getStockByFlowerId(flower.id);
          const isLowStock = stock < flower.safetyStock;

          return (
            <div
              key={flower.id}
              className={cn(
                'bg-white rounded-2xl p-5 shadow-card transition-all duration-300',
                'hover:shadow-hover hover:-translate-y-0.5',
                'border',
                isLowStock
                  ? 'border-red-300 animate-pulse-soft shadow-red-100/50'
                  : 'border-rose-100/50 hover:border-rose-200'
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{flower.emoji}</span>
                <div>
                  <h3 className="font-semibold text-stone-700">{flower.name}</h3>
                  <p className="text-xs text-stone-400">安全库存 {flower.safetyStock} 支</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-4xl font-bold font-serif',
                    isLowStock ? 'text-red-500' : 'text-rose-400'
                  )}
                >
                  {stock}
                </p>
                <p className="text-sm text-stone-400 mt-1">支</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="primary"
          size="lg"
          className="w-full py-6 text-xl rounded-2xl"
          onClick={handleOpenPurchaseModal}
        >
          <span className="text-2xl">📦</span>
          新增进货
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full py-6 text-xl rounded-2xl"
          onClick={handleOpenOrderModal}
        >
          <span className="text-2xl">💐</span>
          快速接单
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-rose-100">
          <h2 className="text-lg font-semibold text-stone-800 font-serif flex items-center gap-2">
            <span>🌸</span>
            花期提醒
          </h2>
        </div>
        <div className="p-5">
          {expiringPurchases.length === 0 ? (
            <div className="text-center py-8 text-stone-400">
              <p className="text-4xl mb-2">✨</p>
              <p>暂无即将凋谢的花材</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expiringPurchases.map((purchase) => {
                const shelfLife = purchase.flower.shelfLife;
                const progressPercent = Math.max(0, (purchase.daysLeft / shelfLife) * 100);
                const isUrgent = purchase.daysLeft <= 2;
                const isWarning = purchase.daysLeft <= 3;

                return (
                  <div
                    key={purchase.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all duration-300',
                      'hover:shadow-md',
                      isUrgent
                        ? 'bg-red-50/50 border-red-200'
                        : isWarning
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-sage-50/30 border-sage-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{purchase.flower.emoji}</span>
                        <div>
                          <h4 className="font-medium text-stone-700">{purchase.flowerName}</h4>
                          <p className="text-xs text-stone-400">
                            进货日期：{formatDateCN(purchase.purchaseDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-2xl font-bold font-serif',
                            isUrgent
                              ? 'text-red-500'
                              : isWarning
                              ? 'text-amber-500'
                              : 'text-sage-500'
                          )}
                        >
                          {purchase.daysLeft}
                        </p>
                        <p className="text-xs text-stone-400">剩余天数</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isUrgent
                              ? 'bg-red-400'
                              : isWarning
                              ? 'bg-amber-400'
                              : 'bg-sage-400'
                          )}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-500">
                        剩余 {purchase.remainingStems} 支
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleWastage(purchase.id, purchase.flowerId, purchase.remainingStems)}
                        >
                          报损
                        </Button>
                        <Button variant="secondary" size="sm">
                          特价
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={handleClosePurchaseModal}
        title="新增进货"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              花材种类
            </label>
            <select
              value={selectedFlower}
              onChange={(e) => setSelectedFlower(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            >
              <option value="">请选择花材</option>
              {flowers.map((flower) => (
                <option key={flower.id} value={flower.id}>
                  {flower.emoji} {flower.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              进货数量（支）
            </label>
            <input
              type="number"
              value={purchaseQuantity}
              onChange={(e) => setPurchaseQuantity(e.target.value)}
              placeholder="请输入进货数量"
              min="1"
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                每扎支数
              </label>
              <input
                type="number"
                value={stemsPerBunch}
                onChange={(e) => setStemsPerBunch(e.target.value)}
                placeholder="20"
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                每扎价格（元）
              </label>
              <input
                type="number"
                value={pricePerBunch}
                onChange={(e) => setPricePerBunch(e.target.value)}
                placeholder="请输入价格"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              进货日期
            </label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            />
          </div>

          {isPurchaseFormValid && (
            <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
              <p>
                预计总金额：
                <span className="font-semibold">
                  ¥
                  {(
                    (parseInt(purchaseQuantity || '0') / parseInt(stemsPerBunch || '1')) *
                    parseFloat(pricePerBunch || '0')
                  ).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              size="md"
              className="flex-1"
              onClick={handleClosePurchaseModal}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSubmitPurchase}
              disabled={!isPurchaseFormValid}
            >
              确认入库
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        title="快速接单"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    orderStep === s
                      ? 'bg-rose-400 text-white'
                      : orderStep > s
                      ? 'bg-sage-400 text-white'
                      : 'bg-stone-200 text-stone-400'
                  )}
                >
                  {orderStep > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-12 h-1 mx-1 rounded transition-all duration-300',
                      orderStep > s ? 'bg-sage-400' : 'bg-stone-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {orderStep === 1 && (
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
                          <span key={i} className="text-xs text-stone-500">
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

          {orderStep === 2 && selectedTemplate && (
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
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(e.target.value)}
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

              {isOrderStep2Valid && (
                <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
                  <p>
                    预计总金额：
                    <span className="font-semibold text-lg">
                      ¥{(selectedTemplate.price * parseInt(orderQuantity || '0')).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {orderStep === 3 && selectedTemplate && stockCheck && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-stone-500">订单确认</p>
                <h3 className="text-xl font-semibold text-stone-800 font-serif mt-1">
                  {selectedTemplate.name}
                </h3>
                <p className="text-2xl font-bold text-rose-400 font-serif mt-2">
                  ¥{(selectedTemplate.price * parseInt(orderQuantity || '0')).toFixed(2)}
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
                  <span className="text-stone-700 font-medium">{orderQuantity} 束</span>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-4">
                <p className="text-sm font-medium text-stone-700 mb-3">花材库存校验</p>
                <div className="space-y-2">
                  {stockCheck.flowerUsage.map((usage, index) => {
                    const isSufficient = usage.available >= usage.required;
                    const flower = flowers.find((f) => f.id === usage.flowerId);
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
                          <span className="text-sm text-stone-700">{usage.flowerName}</span>
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
            {orderStep > 1 ? (
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={handlePrevOrderStep}
              >
                上一步
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={handleCloseOrderModal}
              >
                取消
              </Button>
            )}

            {orderStep < 3 ? (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleNextOrderStep}
                disabled={orderStep === 2 && !isOrderStep2Valid}
              >
                下一步
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleSubmitOrder}
                disabled={!canSubmitOrder}
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
