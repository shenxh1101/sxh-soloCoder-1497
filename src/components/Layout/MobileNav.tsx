import { LayoutDashboard, Package, Flower2, ShoppingCart, ClipboardList, TrendingUp, BarChart3, DollarSign } from 'lucide-react'
import { cn } from '../../lib/utils'

interface MobileNavProps {
  currentPage: string
  onNavigate: (page: string) => void
}

const navItems = [
  { id: 'home', label: '总览', icon: LayoutDashboard },
  { id: 'purchase', label: '进货', icon: Package },
  { id: 'bouquet', label: '模板', icon: Flower2 },
  { id: 'order', label: '订单', icon: ShoppingCart },
  { id: 'reconciliation', label: '对账', icon: ClipboardList },
  { id: 'batchProfit', label: '利润', icon: DollarSign },
  { id: 'restock', label: '补货', icon: TrendingUp },
  { id: 'stats', label: '统计', icon: BarChart3 },
]

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-rose-100 z-40 safe-area-pb">
      <div className="flex items-center gap-1 py-2 px-2 overflow-x-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px] flex-shrink-0',
                isActive ? 'text-rose-400' : 'text-stone-400 hover:text-stone-600'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn('transition-all duration-200', isActive && 'scale-110')}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
