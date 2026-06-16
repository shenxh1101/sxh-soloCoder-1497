import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

interface LayoutProps {
  currentPage: string
  onNavigate: (page: string) => void
  title: string
  children: React.ReactNode
}

const pageTitles: Record<string, string> = {
  home: '库存总览',
  purchase: '进货管理',
  bouquet: '花束模板',
  order: '订单销售',
  stats: '月度统计',
}

export function Layout({ currentPage, onNavigate, title, children }: LayoutProps) {
  const displayTitle = title || pageTitles[currentPage] || '花小筑'

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-sage-50/30 font-sans">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      <div className="md:ml-60 min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-rose-100">
          <div className="px-4 md:px-8 py-4 md:py-5">
            <h1 className="text-xl md:text-2xl font-bold text-stone-800 font-serif">
              {displayTitle}
            </h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  )
}
