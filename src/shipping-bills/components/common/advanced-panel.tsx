import { useState } from 'react'
import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'

interface AdvancedPanelProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: React.ReactNode
}

export function AdvancedPanel({ title, children, defaultOpen = false, badge }: AdvancedPanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 transition-colors">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-3.5 text-left text-sm font-medium text-gray-700 hover:text-gray-950 focus:outline-none">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {badge}
        </div>
        <RrCaretDown
          className={`size-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="border-t border-gray-200/80 p-4 pt-3">
          {children}
        </div>
      )}
    </div>
  )
}
