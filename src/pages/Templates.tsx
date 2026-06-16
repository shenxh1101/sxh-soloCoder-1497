import { useState } from 'react';
import { useFlowerStore } from '../store/useFlowerStore';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { cn } from '../lib/utils';
import type { BouquetItem, BouquetTemplate } from '../types';

export default function Templates() {
  const { templates, flowers, addTemplate, updateTemplate, deleteTemplate } = useFlowerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BouquetTemplate | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<BouquetItem[]>([]);

  const handleOpenModal = (template?: BouquetTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setName(template.name);
      setPrice(template.price.toString());
      setDescription(template.description);
      setItems([...template.items]);
    } else {
      setEditingTemplate(null);
      setName('');
      setPrice('');
      setDescription('');
      setItems([]);
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
    setName('');
    setPrice('');
    setDescription('');
    setItems([]);
  };

  const handleAddItem = () => {
    const firstFlower = flowers[0];
    if (firstFlower) {
      setItems([
        ...items,
        {
          flowerId: firstFlower.id,
          flowerName: firstFlower.name,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'flowerId' | 'quantity', value: string) => {
    const newItems = [...items];
    if (field === 'flowerId') {
      const flower = flowers.find((f) => f.id === value);
      if (flower) {
        newItems[index] = {
          ...newItems[index],
          flowerId: value,
          flowerName: flower.name,
        };
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        quantity: parseInt(value) || 0,
      };
    }
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!name || !price || parseFloat(price) <= 0 || items.length === 0) {
      return;
    }

    const validItems = items.filter((item) => item.quantity > 0);
    if (validItems.length === 0) return;

    if (editingTemplate) {
      updateTemplate(editingTemplate.id, {
        name,
        price: parseFloat(price),
        description,
        items: validItems,
      });
    } else {
      addTemplate({
        name,
        price: parseFloat(price),
        description,
        items: validItems,
      });
    }

    handleClose();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个花束模板吗？')) {
      deleteTemplate(id);
    }
  };

  const isFormValid =
    name.trim() !== '' &&
    price !== '' &&
    parseFloat(price) > 0 &&
    items.length > 0 &&
    items.every((item) => item.quantity > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 font-serif">花束模板</h1>
          <p className="text-stone-500 text-sm mt-1">管理您的花束配方和定价</p>
        </div>
        <Button variant="primary" size="md" onClick={() => handleOpenModal()}>
          <span>+</span>
          新增模板
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-12 text-center">
          <p className="text-5xl mb-4">💐</p>
          <p className="text-stone-500">暂无花束模板</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => handleOpenModal()}
          >
            创建第一个模板
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-card border border-rose-100/50 p-5 transition-all duration-300 hover:shadow-hover hover:border-rose-200 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-stone-800 text-lg">{template.name}</h3>
                  <p className="text-2xl font-bold text-rose-400 font-serif mt-1">
                    ¥{template.price}
                  </p>
                </div>
                <span className="text-3xl">💐</span>
              </div>

              {template.description && (
                <p className="text-sm text-stone-500 mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex-1">
                <p className="text-xs text-stone-400 mb-2">花材组成</p>
                <div className="flex flex-wrap gap-1.5">
                  {template.items.map((item, index) => {
                    const flower = flowers.find((f) => f.id === item.flowerId);
                    return (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs"
                      >
                        <span>{flower?.emoji || '🌸'}</span>
                        {item.flowerName} ×{item.quantity}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t border-rose-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOpenModal(template)}
                >
                  编辑
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(template.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingTemplate ? '编辑模板' : '新增模板'}
        className="max-w-lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              花束名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入花束名称"
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              售价（元）
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="请输入售价"
              min="0"
              step="0.01"
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入花束描述（可选）"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-200 bg-white text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700">花材组成</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddItem}
                className="text-rose-500 hover:text-rose-600"
              >
                + 添加花材
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-rose-200 rounded-xl text-stone-400 text-sm">
                点击上方按钮添加花材
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => {
                  const flower = flowers.find((f) => f.id === item.flowerId);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-rose-50/50 rounded-xl animate-fade-in"
                    >
                      <div className="flex-1">
                        <select
                          value={item.flowerId}
                          onChange={(e) => handleItemChange(index, 'flowerId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-white text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                        >
                          {flowers.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.emoji} {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          className="w-full px-3 py-2 rounded-lg border border-rose-200 bg-white text-stone-700 text-sm text-center focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
                        />
                      </div>
                      <span className="text-xs text-stone-400">支</span>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isFormValid && items.length > 0 && (
            <div className="bg-sage-50 rounded-xl p-3 text-sm text-sage-700">
              <p>
                共 <span className="font-semibold">{items.length}</span> 种花材，
                合计 <span className="font-semibold">¥{price}</span>
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
              {editingTemplate ? '保存修改' : '创建模板'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
