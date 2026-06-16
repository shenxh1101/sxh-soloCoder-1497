import { useState } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { formatDateCN, daysRemaining } from '../utils/date';
import type { Purchase, Flower } from '../types';

export default function Purchase() {
  const { flowers, purchases, addPurchase, addWastage, setSale, cancelSale, orders, isPurchaseSaleActive } = useFlowerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [stemsPerBunch, setStemsPerBunch] = useState<string>('20');
  const [pricePerBunch, setPricePerBunch] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterFlower, setFilterFlower] = useState<string>('all');

  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [wastagePurchase, setWastagePurchase] = useState<Purchase | null>(null);
  const [wastageQuantity, setWastageQuantity] = useState<string>('');
  const [wastageReason, setWastageReason] = useState<string>('花期过了');

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [salePurchase, setSalePurchase] = useState<Purchase | null>(null);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleReason, setSaleReason] = useState<string>('');
  const [saleEndDate, setSaleEndDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const filteredPurchases =
    filterFlower === 'all'
      ? sortedPurchases
      : sortedPurchases.filter((p) => p.flowerId === filterFlower);

  const getCostPerStem = (purchase: Purchase): number => {
    return purchase.totalCost / purchase.quantity;
  };

  const getDaysLeft = (purchase: Purchase, flower: Flower | undefined): number => {
    if (!flower) return 0;
    return daysRemaining(purchase.purchaseDate, flower.shelfLife);
  };

  const getDeductionHistory = (purchaseId: string) => {
    const deductions: {
      orderId: string;
      orderDate: string;
      customerName: string;
      quantity: number;
      unitPrice: number;
      isOnSale: boolean;
    }[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        const deductionsList = item.batchDeductions ?? [];
        for (const deduction of deductionsList) {
          if (deduction.purchaseId === purchaseId) {
            deductions.push({
              orderId: order.id,
              orderDate: order.orderDate,
              customerName: order.customerName,
              quantity: deduction.quantity,
              unitPrice: deduction.unitPrice,
              isOnSale: deduction.isOnSale,
            });
          }
        }
      }
    }

    return deductions.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  };

  const handleSubmit = () => {
    if (!selectedFlower || !quantity || !stemsPerBunch || !pricePerBunch || !purchaseDate) {
      return;
    }

    addPurchase({
      flowerId: selectedFlower,
      quantity: parseInt(quantity),
      stemsPerBunch: parseInt(stemsPerBunch),
      pricePerBunch: parseFloat(pricePerBunch),
      purchaseDate,
    });

    setIsModalOpen(false);
    setSelectedFlower('');
    setQuantity('');
    setStemsPerBunch('20');
    setPricePerBunch('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedFlower('');
    setQuantity('');
    setStemsPerBunch('20');
    setPricePerBunch('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const handleOpenWastageModal = (purchase: Purchase) => {
    setWastagePurchase(purchase);
    setWastageQuantity('');
    setWastageReason('花期过了');
    setIsWastageModalOpen(true);
  };

  const handleWastageSubmit = () => {
    if (!wastagePurchase || !wastageQuantity || parseInt(wastageQuantity) <= 0) {
      return;
    }

    const qty = parseInt(wastageQuantity);
    if (qty > wastagePurchase.remainingStems) {
      return;
    }

    addWastage({
      purchaseId: wastagePurchase.id,
      quantity: qty,
      reason: wastageReason,
      date: new Date().toISOString().split('T')[0],
    });

    setIsWastageModalOpen(false);
    setWastagePurchase(null);
    setWastageQuantity('');
    setWastageReason('花期过了');
  };

  const handleOpenSaleModal = (purchase: Purchase) => {
    setSalePurchase(purchase);
    setSalePrice('');
    setSaleReason('');
    setSaleEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsSaleModalOpen(true);
  };

  const handleSetSale = () => {
    if (!salePurchase || !salePrice || parseFloat(salePrice) <= 0) {
      return;
    }

    setSale(
      salePurchase.id,
      parseFloat(salePrice),
      saleReason,
      saleEndDate
    );

    setIsSaleModalOpen(false);
    setSalePurchase(null);
    setSalePrice('');
    setSaleReason('');
  };

  const handleCancelSale = (purchaseId: string) => {
    cancelSale(purchaseId);
  };

  const toggleExpand = (purchaseId: string) => {
    setExpandedPurchaseId(expandedPurchaseId === purchaseId ? null : purchaseId);
  };

  const isFormValid =
    selectedFlower &&
    quantity &&
    parseInt(quantity) > 0 &&
    stemsPerBunch &&
    parseInt(stemsPerBunch) > 0 &&
    pricePerBunch &&
    parseFloat(pricePerBunch) > 0 &&
    purchaseDate;

  const isWastageFormValid =
    wastageQuantity &&
    parseInt(wastageQuantity) > 0 &&
    wastagePurchase &&
    parseInt(wastageQuantity) <= wastagePurchase.remainingStems;

  const isSaleFormValid =
    salePrice &&
    parseFloat(salePrice) > 0 &&
    saleEndDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">进货管理</h1>
          <p className="text-stone-500 text-sm mt-1">记录和管理所有花材进货</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setIsModalOpen(true)}
        >
          <span>+</span>
          新增进货
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterFlower('all')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
            filterFlower === 'all'
              ? 'bg-rose-400 text-white shadow-sm'
              : 'bg-white text-stone-600 border border-rose-200 hover:bg-rose-50'
          )}
        >
          全部
        </button>
        {flowers.map((flower) => (
          <button
            key={flower.id}
            onClick={() => setFilterFlower(flower.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              'flex items-center gap-2',
              filterFlower === flower.id
                ? 'bg-rose-400 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-rose-200 hover:bg-rose-50'
            )}
          >
            <span>{flower.emoji}</span>
            {flower.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredPurchases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
            <p className="text-5xl mb-4">🌱</p>
            <p className="text-stone-500">暂无进货记录</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setIsModalOpen(true)}
            >
              添加第一条进货记录
            </Button>
          </div>
        ) : (
          filteredPurchases.map((purchase) => {
            const flower = flowers.find((f) => f.id === purchase.flowerId);
            const daysLeft = getDaysLeft(purchase, flower);
            const costPerStem = getCostPerStem(purchase);
            const progress = (purchase.remainingStems / purchase.quantity) * 100;
            const isExpanded = expandedPurchaseId === purchase.id;
            const deductionHistory = getDeductionHistory(purchase.id);

            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5 transition-all duration-300 hover:shadow-hover hover:border-rose-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-3xl">
                      {flower?.emoji || '🌸'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-stone-800 text-lg">
                          {purchase.flowerName}
                        </h3>
                        {isPurchaseSaleActive(purchase) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                            🔥 特价中 ¥{purchase.salePrice}/支
                          </span>
                        )}
                        {purchase.isOnSale && !isPurchaseSaleActive(purchase) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-500 text-xs font-medium rounded-full">
                            已结束
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-400">
                        {formatDateCN(purchase.purchaseDate)} 进货
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-rose-400 font-serif">
                      {purchase.quantity}
                      <span className="text-sm font-normal text-stone-400 ml-1">支</span>
                    </p>
                    <p className="text-sm text-stone-500">
                      ¥{purchase.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-stone-500">库存进度</span>
                    <span className="font-medium text-stone-700">
                      {purchase.remainingStems} / {purchase.quantity} 支
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-rose-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        progress > 50 ? 'bg-sage-400' : progress > 20 ? 'bg-amber-400' : 'bg-red-400'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-rose-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-stone-400">进货价</p>
                    <p className="font-medium text-stone-700 mt-0.5">
                      ¥{purchase.pricePerBunch}/扎
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">每支成本</p>
                    <p className="font-medium text-stone-700 mt-0.5">
                      ¥{costPerStem.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">每扎支数</p>
                    <p className="font-medium text-stone-700 mt-0.5">
                      {purchase.stemsPerBunch} 支
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">剩余保鲜天数</p>
                    <p className={cn(
                      'font-medium mt-0.5',
                      daysLeft > 3 ? 'text-sage-600' : daysLeft > 0 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {daysLeft > 0 ? `${daysLeft} 天` : '已过期'}
                    </p>
                  </div>
                </div>

                {purchase.isOnSale && !isPurchaseSaleActive(purchase) && (
                  <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-500 flex items-center gap-2">
                    <span>⏰</span>
                    <span>该批次特价活动已于 {formatDateCN(purchase.saleEndDate!)} 结束</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-rose-100 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenWastageModal(purchase)}
                    disabled={purchase.remainingStems <= 0}
                  >
                    报损
                  </Button>
                  {isPurchaseSaleActive(purchase) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCancelSale(purchase.id)}
                    >
                      取消特价
                    </Button>
                  ) : purchase.isOnSale ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="text-stone-400 hover:bg-transparent hover:text-stone-400"
                    >
                      特价已结束
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenSaleModal(purchase)}
                      disabled={purchase.remainingStems <= 0}
                    >
                      设置特价
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(purchase.id)}
                  >
                    {isExpanded ? '收起详情' : '查看详情'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-rose-100 animate-fade-in">
                    {purchase.isOnSale && (
                      <div className={cn(
                        'mb-4 p-3 rounded-xl text-sm',
                        isPurchaseSaleActive(purchase)
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-stone-50 border border-stone-200'
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{isPurchaseSaleActive(purchase) ? '🔥' : '⏰'}</span>
                            <span className={cn(
                              'font-medium',
                              isPurchaseSaleActive(purchase) ? 'text-orange-700' : 'text-stone-500'
                            )}>
                              {isPurchaseSaleActive(purchase) ? '特价进行中' : '特价已结束'}
                            </span>
                          </div>
                          <span className={cn(
                            'font-semibold',
                            isPurchaseSaleActive(purchase) ? 'text-orange-600' : 'text-stone-400'
                          )}>
                            ¥{purchase.salePrice}/支
                          </span>
                        </div>
                        {purchase.saleReason && (
                          <p className={cn(
                            'mt-1.5 text-xs',
                            isPurchaseSaleActive(purchase) ? 'text-orange-600' : 'text-stone-400'
                          )}>
                            原因：{purchase.saleReason}
                          </p>
                        )}
                        <p className={cn(
                          'mt-1 text-xs',
                          isPurchaseSaleActive(purchase) ? 'text-orange-600' : 'text-stone-400'
                        )}>
                          结束日期：{formatDateCN(purchase.saleEndDate!)}
                        </p>
                      </div>
                    )}
                    <h4 className="text-sm font-medium text-stone-700 mb-3">扣减历史</h4>
                    {deductionHistory.length === 0 ? (
                      <p className="text-sm text-stone-400 text-center py-4">暂无扣减记录</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {deductionHistory.map((deduction, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-rose-50/50 rounded-lg text-sm"
                          >
                            <div>
                              <p className="font-medium text-stone-700">
                                {deduction.customerName}
                              </p>
                              <p className="text-xs text-stone-400">
                                {formatDateCN(deduction.orderDate)} · 订单 {deduction.orderId.slice(-4)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-stone-700">
                                -{deduction.quantity} 支
                              </p>
                              <p className="text-xs text-stone-400">
                                ¥{deduction.unitPrice.toFixed(2)}/支
                                {deduction.isOnSale && (
                                  <span className="ml-1 text-orange-500">(特价)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
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

          {isFormValid && (
            <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
              <p>
                预计总金额：
                <span className="font-semibold">
                  ¥
                  {(
                    (parseInt(quantity || '0') / parseInt(stemsPerBunch || '1')) *
                    parseFloat(pricePerBunch || '0')
                  ).toFixed(2)}
                </span>
              </p>
              <p className="mt-1">
                每支成本：
                <span className="font-semibold">
                  ¥
                  {(
                    (parseFloat(pricePerBunch || '0') / parseInt(stemsPerBunch || '1'))
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
              onClick={handleClose}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              确认入库
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isWastageModalOpen}
        onClose={() => setIsWastageModalOpen(false)}
        title="报损登记"
      >
        {wastagePurchase && (
          <div className="space-y-4">
            <div className="bg-rose-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl">
                  {flowers.find((f) => f.id === wastagePurchase.flowerId)?.emoji || '🌸'}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{wastagePurchase.flowerName}</p>
                  <p className="text-sm text-stone-500">
                    剩余库存：{wastagePurchase.remainingStems} 支
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                报损数量（支）
              </label>
              <input
                type="number"
                value={wastageQuantity}
                onChange={(e) => setWastageQuantity(e.target.value)}
                placeholder="请输入报损数量"
                min="1"
                max={wastagePurchase.remainingStems}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
              <p className="text-xs text-stone-400 mt-1">
                最多可报损 {wastagePurchase.remainingStems} 支
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                报损原因
              </label>
              <select
                value={wastageReason}
                onChange={(e) => setWastageReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              >
                <option value="花期过了">花期过了</option>
                <option value="损坏">损坏</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {isWastageFormValid && (
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-700">
                <p>
                  预计损失金额：
                  <span className="font-semibold">
                    ¥
                    {(
                      (wastagePurchase.totalCost / wastagePurchase.quantity) *
                      parseInt(wastageQuantity || '0')
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
                onClick={() => setIsWastageModalOpen(false)}
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleWastageSubmit}
                disabled={!isWastageFormValid}
              >
                确认报损
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="设置特价"
      >
        {salePurchase && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-2xl">
                  {flowers.find((f) => f.id === salePurchase.flowerId)?.emoji || '🌸'}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{salePurchase.flowerName}</p>
                  <p className="text-sm text-stone-500">
                    当前成本：¥{getCostPerStem(salePurchase).toFixed(2)}/支
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                特价价格（元/支）
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="请输入特价价格"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                特价原因（可选）
              </label>
              <input
                type="text"
                value={saleReason}
                onChange={(e) => setSaleReason(e.target.value)}
                placeholder="例如：花期快过、清库存"
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                特价结束日期
              </label>
              <input
                type="date"
                value={saleEndDate}
                onChange={(e) => setSaleEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
              />
            </div>

            {isSaleFormValid && (
              <div className={cn(
                'rounded-xl p-3 text-sm',
                parseFloat(salePrice) < getCostPerStem(salePurchase)
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-sage-50 text-sage-700'
              )}>
                <p>
                  每支
                  {parseFloat(salePrice) < getCostPerStem(salePurchase)
                    ? `亏损 ¥${(getCostPerStem(salePurchase) - parseFloat(salePrice)).toFixed(2)}`
                    : `盈利 ¥${(parseFloat(salePrice) - getCostPerStem(salePurchase)).toFixed(2)}`
                  }
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsSaleModalOpen(false)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={handleSetSale}
                disabled={!isSaleFormValid}
              >
                确认设置
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
