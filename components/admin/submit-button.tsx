'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({
  children,
  pendingText = 'Saving…',
  variant = 'primary',
  className = '',
}: {
  children: React.ReactNode
  pendingText?: string
  variant?: 'primary' | 'danger' | 'ghost'
  className?: string
}) {
  const { pending } = useFormStatus()

  const base = 'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-60'
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'border border-border bg-background text-foreground hover:bg-muted',
  }

  return (
    <button type="submit" disabled={pending} className={`${base} ${variants[variant]} ${className}`}>
      {pending ? pendingText : children}
    </button>
  )
}
