import { useState, useMemo } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { formatDateCN } from '../utils/date';
import type { BouquetTemplate, Purchase } from '../types';

type QuickOrderStep = 1 | 2 | 3;
type SaleReason = '快蔫了' | '尾货清仓' | '节日促销' | '其他';

const saleReasons: SaleReason[] = ['快蔫了', '尾货清仓', '节日促销', '其他'];

export default function Dashboard() {
  const {
    flowers,
    purchases,
    templates,
    getStockByFlowerId,
    getExpiringPurchases,
    getSalePurchases,
    getExpiredSalePurchases,
    isPurchaseSaleActive,
    addPurchase,
    addWastage,
    setSale,
    cancelSale,
    checkStockForOrder,
    createOrder,
  } = useFlowerStore();
  const expiringPurchases = getExpiringPurchases(3);
  const salePurchases = getSalePurchases();
  const expiredSalePurchases = getExpiredSalePurchases();

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

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleReason, setSaleReason] = useState<SaleReason>('快蔫了');
  const [saleNote, setSaleNote] = useState<string>('');
  const [saleEndDate, setSaleEndDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  });

  const stockCheck = useMemo(() => {
    if (!selectedTemplate || !orderQuantity || parseInt(orderQuantity) <= 0) {
      return null;
    }
    return checkStockForOrder(selectedTemplate.id, parseInt(orderQuantity));
  }, [selectedTemplate, orderQuantity, checkStockForOrder]);

  const getSaleStemsByFlowerId = (flowerId: string): number => {
    return purchases
      .filter((p) => p.flowerId === flowerId && isPurchaseSaleActive(p))
      .reduce((sum, p) => sum + p.remainingStems, 0);
  };

  const hasActiveSaleByFlowerId = (flowerId: string): boolean => {
    return purchases.some((p) => 
      p.flowerId === flowerId && isPurchaseSaleActive(p)
    );
  };

  const getOriginalPricePerStem = (purchase: Purchase): number => {
    return purchase.totalCost / purchase.quantity;
  };

  const getDiscountPercent = (originalPrice: number, salePrice: number): number => {
    return Math.round((1 - salePrice / originalPrice) * 100);
  };

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

  const handleOpenSaleModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    const originalPrice = getOriginalPricePerStem(purchase);
    setSalePrice((originalPrice * 0.7).toFixed(2));
    setSaleReason('快蔫了');
    setSaleNote('');
    const date = new Date();
    date.setDate(date.getDate() + 3);
    setSaleEndDate(date.toISOString().split('T')[0]);
    setIsSaleModalOpen(true);
  };

  const handleCloseSaleModal = () => {
    setIsSaleModalOpen(false);
    setSelectedPurchase(null);
    setSalePrice('');
    setSaleNote('');
  };

  const handleSubmitSale = () => {
    if (!selectedPurchase || !salePrice || parseFloat(salePrice) <= 0) {
      return;
    }

    const fullReason = saleNote ? `${saleReason}：${saleNote}` : saleReason;
    const result = setSale(
      selectedPurchase.id,
      parseFloat(salePrice),
      fullReason,
      saleEndDate
    );

    if (result.success) {
      handleCloseSaleModal();
    } else {
      alert(result.message);
    }
  };

  const isSaleFormValid =
    selectedPurchase &&
    salePrice &&
    parseFloat(salePrice) > 0 &&
    saleEndDate;

  const handleCancelSale = (purchaseId: string) => {
    if (window.confirm('确定要取消该批次的特价吗？')) {
      cancelSale(purchaseId);
    }
  };

  const handleContinueSale = (purchase: Purchase) => {
    handleOpenSaleModal(purchase);
  };

  const handleExpiredWastage = (purchase: Purchase) => {
    handleWastage(purchase.id, purchase.flowerId, purchase.remainingStems);
  };

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
        purchaseId,
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
          const saleStems = getSaleStemsByFlowerId(flower.id);
          const hasActiveSale = hasActiveSaleByFlowerId(flower.id);
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-stone-700">{flower.name}</h3>
                    {hasActiveSale && (
                      <span className="px-2 py-0.5 text-xs font-medium text-white rounded-full bg-gradient-to-r from-orange-400 to-amber-500">
                        🔥 特价中
                      </span>
                    )}
                  </div>
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
                {saleStems > 0 && (
                  <p className="text-xs text-orange-500 mt-1">
                    🔥 {saleStems} 支特价中
                  </p>
                )}
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

      {salePurchases.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-orange-100/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
            <h2 className="text-lg font-semibold text-stone-800 font-serif flex items-center gap-2">
              <span>🔥</span>
              特价专区
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {salePurchases.map((purchase) => {
                const flower = flowers.find((f) => f.id === purchase.flowerId);
                const originalPrice = getOriginalPricePerStem(purchase);
                const discount = purchase.salePrice ? getDiscountPercent(originalPrice, purchase.salePrice) : 0;

                return (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/80 to-amber-50/50 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{flower?.emoji || '🌸'}</span>
                        <h4 className="font-semibold text-stone-700">{purchase.flowerName}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-bold text-white rounded-full bg-gradient-to-r from-orange-500 to-amber-500">
                        -{discount}%
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">原单价</span>
                        <span className="text-stone-400 line-through">¥{originalPrice.toFixed(2)}/支</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-stone-600">特价</span>
                        <span className="text-xl font-bold text-orange-500 font-serif">
                          ¥{purchase.salePrice?.toFixed(2)}/支
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">剩余支数</span>
                        <span className="font-medium text-stone-700">{purchase.remainingStems} 支</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">截止日期</span>
                        <span className="font-medium text-stone-700">
                          {purchase.saleEndDate && formatDateCN(purchase.saleEndDate)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-orange-100">
                        <p className="text-xs text-stone-500">
                          <span className="font-medium">原因：</span>
                          {purchase.saleReason}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-100/50"
                      onClick={() => handleCancelSale(purchase.id)}
                    >
                      取消特价
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {expiredSalePurchases.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-stone-200/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 bg-gradient-to-r from-stone-50/50 to-stone-100/30">
            <h2 className="text-lg font-semibold text-stone-700 font-serif flex items-center gap-2">
              <span>⏰</span>
              特价已结束
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {expiredSalePurchases.map((purchase) => {
                const flower = flowers.find((f) => f.id === purchase.flowerId);
                const originalPrice = getOriginalPricePerStem(purchase);

                return (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-xl border-2 border-stone-200 bg-gradient-to-br from-stone-50/60 to-stone-100/30 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl opacity-60">{flower?.emoji || '🌸'}</span>
                        <h4 className="font-semibold text-stone-600">{purchase.flowerName}</h4>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-medium text-stone-500 rounded-full bg-stone-200">
                        已结束
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">剩余支数</span>
                        <span className="font-medium text-stone-600">{purchase.remainingStems} 支</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">原特价</span>
                        <span className="font-medium text-stone-500 line-through">
                          ¥{purchase.salePrice?.toFixed(2)}/支
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500">过期日期</span>
                        <span className="font-medium text-stone-600">
                          {purchase.saleEndDate && formatDateCN(purchase.saleEndDate)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-stone-200">
                        <p className="text-xs text-stone-500">
                          <span className="font-medium">特价原因：</span>
                          {purchase.saleReason}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleContinueSale(purchase)}
                      >
                        继续特价
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-stone-600 hover:text-stone-700 hover:bg-stone-100"
                        onClick={() => handleExpiredWastage(purchase)}
                      >
                        报损处理
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                const isOnSale = isPurchaseSaleActive(purchase);

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
                        {isOnSale ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => handleCancelSale(purchase.id)}
                          >
                            取消特价
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenSaleModal(purchase)}
                          >
                            特价
                          </Button>
                        )}
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
        isOpen={isSaleModalOpen}
        onClose={handleCloseSaleModal}
        title="设置特价"
      >
        {selectedPurchase && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {flowers.find((f) => f.id === selectedPurchase.flowerId)?.emoji || '🌸'}
                </span>
                <div>
                  <p className="font-medium text-stone-700">{selectedPurchase.flowerName}</p>
                  <p className="text-sm text-stone-500">
                    剩余 {selectedPurchase.remainingStems} 支 · 原单价 ¥
                    {getOriginalPricePerStem(selectedPurchase).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                折扣价（元/支）<span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="请输入特价"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                特价原因 <span className="text-red-400">*</span>
              </label>
              <select
                value={saleReason}
                onChange={(e) => setSaleReason(e.target.value as SaleReason)}
                className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all mb-2"
              >
                {saleReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                placeholder="备注（可选）"
                className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                截止日期 <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={saleEndDate}
                onChange={(e) => setSaleEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 transition-all"
              />
            </div>

            {isSaleFormValid && (
              <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
                <p>
                  折扣力度：
                  <span className="font-semibold text-orange-500">
                    {getDiscountPercent(getOriginalPricePerStem(selectedPurchase), parseFloat(salePrice || '0'))}% OFF
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={handleCloseSaleModal}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 shadow-sm shadow-orange-200"
                onClick={handleSubmitSale}
                disabled={!isSaleFormValid}
              >
                确认设置特价
              </Button>
            </div>
          </div>
        )}
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
