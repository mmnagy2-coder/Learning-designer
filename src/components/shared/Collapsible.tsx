// Reusable progressive-disclosure primitive: collapsed by default, animates open/closed by
// measuring real content height via ResizeObserver so "auto" height animates smoothly.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useHapticProps } from './motion'

interface CollapsibleProps {
  title: ReactNode
  trigger?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

export function Collapsible({ title, trigger, defaultOpen = false, children, className = '' }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const haptic = useHapticProps()

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (isOpen) setHeight(el.scrollHeight)
    })
    observer.observe(el)
    if (isOpen) setHeight(el.scrollHeight)
    return () => observer.disconnect()
  }, [isOpen])

  return (
    <div className={className}>
      <motion.button
        {...haptic}
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium text-text-primary"
      >
        <span className="flex items-center gap-2">{trigger ?? title}</span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-text-muted" />
        </motion.span>
      </motion.button>
      <motion.div
        animate={{ height: isOpen ? height : 0 }}
        initial={false}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div ref={contentRef} className="pb-3">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
