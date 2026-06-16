import { cn } from '../../lib/utils'

interface SidebarProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const menuItems = [
  { id: 'home', label: '库存总览', icon: '🏠' },
  { id: 'purchase', label: '进货管理', icon: '📦' },
  { id: 'bouquet', label: '花束模板', icon: '💐' },
  { id: 'order', label: '订单销售', icon: '🛒' },
  { id: 'reconciliation', label: '订单对账', icon: '📋' },
  { id: 'batchProfit', label: '批次利润', icon: '💰' },
  { id: 'restock', label: '补货建议', icon: '📈' },
  { id: 'stats', label: '月度统计', icon: '📊' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 h-screen bg-rose-50/80 backdrop-blur-sm border-r border-rose-100 fixed left-0 top-0 z-40">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-rose-100">
        <span className="text-3xl">🌸</span>
        <h1 className="text-xl font-bold text-rose-800 font-serif">花小筑</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
              currentPage === item.id
                ? 'bg-rose-400 text-white shadow-md shadow-rose-200'
                : 'text-stone-600 hover:bg-rose-100/60 hover:text-rose-700'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-rose-100">
        <div className="bg-gradient-to-br from-sage-100 to-rose-100 rounded-xl p-4">
          <p className="text-sm text-stone-600">今日心情</p>
          <p className="text-lg font-serif text-stone-800 mt-1">花开有时 🌹</p>
        </div>
      </div>
    </aside>
  )
}
