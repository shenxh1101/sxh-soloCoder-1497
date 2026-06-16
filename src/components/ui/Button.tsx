import { cn } from '../../lib/utils'
import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-rose-400 text-white hover:bg-rose-500 shadow-sm shadow-rose-200 hover:shadow-md hover:shadow-rose-200 active:bg-rose-600',
  secondary:
    'bg-white text-sage-600 border-2 border-sage-400 hover:bg-sage-50 hover:border-sage-500 active:bg-sage-100',
  ghost:
    'bg-transparent text-stone-600 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100',
  danger:
    'bg-red-400 text-white hover:bg-red-500 shadow-sm shadow-red-200 hover:shadow-md active:bg-red-600',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-lg rounded-2xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'font-medium transition-all duration-200 inline-flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-300',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
