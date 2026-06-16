import { useState } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import { formatDateCN } from '../utils/date';
import type { Flower } from '../types';

export default function Purchase() {
  const { flowers, purchases, addPurchase } = useFlowerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlower, setSelectedFlower] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [stemsPerBunch, setStemsPerBunch] = useState<string>('20');
  const [pricePerBunch, setPricePerBunch] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterFlower, setFilterFlower] = useState<string>('all');

  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
  );

  const filteredPurchases =
    filterFlower === 'all'
      ? sortedPurchases
      : sortedPurchases.filter((p) => p.flowerId === filterFlower);

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

  const isFormValid =
    selectedFlower &&
    quantity &&
    parseInt(quantity) > 0 &&
    stemsPerBunch &&
    parseInt(stemsPerBunch) > 0 &&
    pricePerBunch &&
    parseFloat(pricePerBunch) > 0 &&
    purchaseDate;

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
            return (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5 transition-all duration-300 hover:shadow-hover hover:border-rose-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center text-3xl">
                      {flower?.emoji || '🌸'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-stone-800 text-lg">
                        {purchase.flowerName}
                      </h3>
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

                <div className="mt-4 pt-4 border-t border-rose-100 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-stone-400">单价</p>
                    <p className="font-medium text-stone-700 mt-0.5">
                      ¥{purchase.pricePerBunch}/扎
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">每扎支数</p>
                    <p className="font-medium text-stone-700 mt-0.5">
                      {purchase.stemsPerBunch} 支
                    </p>
                  </div>
                  <div>
                    <p className="text-stone-400">剩余库存</p>
                    <p className="font-medium text-sage-600 mt-0.5">
                      {purchase.remainingStems} 支
                    </p>
                  </div>
                </div>
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
    </div>
  );
}
