import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  trend?: string
  trendUp?: boolean
  icon?: React.ReactNode
  highlight?: 'rose' | 'orange' | 'sage'
  className?: string
}

export function StatCard({ title, value, trend, trendUp, icon, highlight = 'rose', className }: StatCardProps) {
  const highlightStyles = {
    rose: {
      border: 'border-rose-100/50',
      hoverBorder: 'hover:border-rose-200',
      value: 'text-rose-400',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-400',
    },
    orange: {
      border: 'border-orange-100/50',
      hoverBorder: 'hover:border-orange-200',
      value: 'text-orange-500',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    sage: {
      border: 'border-sage-100/50',
      hoverBorder: 'hover:border-sage-200',
      value: 'text-sage-600',
      iconBg: 'bg-sage-50',
      iconColor: 'text-sage-600',
    },
  }

  const style = highlightStyles[highlight]

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-card border',
        style.border,
        'hover:shadow-hover',
        style.hoverBorder,
        'transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-stone-500 font-medium">{title}</p>
          <p className={cn('text-3xl font-bold mt-2 font-serif', style.value)}>{value}</p>
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
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', style.iconBg, style.iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
