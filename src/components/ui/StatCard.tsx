import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  trend?: string
  trendUp?: boolean
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, trend, trendUp, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-card border border-rose-100/50',
        'hover:shadow-hover hover:border-rose-200 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-rose-400 mt-2 font-serif">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm mt-2 flex items-center gap-1',
                trendUp ? 'text-sage-500' : 'text-stone-400'
              )}
            >
              {trendUp ? '↑' : '→'}
              <span>{trend}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
