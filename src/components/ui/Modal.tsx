import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-2xl shadow-soft',
          'animate-fade-in-up',
          className
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-rose-100">
          {title && (
            <h2 className="text-lg font-semibold text-stone-800 font-serif">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-rose-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
