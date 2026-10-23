import { RrCaretDown } from 'icons/rr/fi-rr-caret-down'
import { useEffect, useRef, useState } from 'react'
import { InputError } from 'ui/inputs/error'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/interactive/popover'
import { getFormContext, RegisterOptions, useController } from 'ui/form'
import { clsxJoin } from 'ui/utils'
import { ShippingBillFormValues } from '../../model'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface AsyncComboboxProps {
  name: string
  placeholder?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  deps?: React.DependencyList
  fetchOptions: (query: string) => Promise<ComboboxOption[]>
  getInitialLabel?: (id: string) => Promise<string>
  onSelect?: (value: string, option?: ComboboxOption) => void
}

export function AsyncCombobox({
  name,
  placeholder = 'Select...',
  disabled = false,
  className,
  rules,
  deps = [],
  fetchOptions,
  getInitialLabel,
  onSelect
}: AsyncComboboxProps) {
  const ctx = getFormContext()
  const {
    field: { onChange, value, ref }
  } = useController({
    name,
    control: ctx.hooks.control,
    rules: ctx.schema.shape[name] ?? rules,
    disabled
  })

  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const fetchOptionsRef = useRef(fetchOptions)
  fetchOptionsRef.current = fetchOptions

  const getInitialLabelRef = useRef(getInitialLabel)
  getInitialLabelRef.current = getInitialLabel

  // Synchronize label display with value
  useEffect(() => {
    let active = true
    if (value) {
      if (getInitialLabelRef.current) {
        void getInitialLabelRef.current(String(value)).then((lbl) => {
          if (active && lbl) setSelectedLabel(lbl)
        })
      } else {
        const found = options.find((o) => o.value === String(value))
        if (found) setSelectedLabel(found.label)
        else setSelectedLabel(String(value))
      }
    } else {
      setSelectedLabel('')
    }
    return () => {
      active = false
    }
  }, [value, ...deps])

  // Fetch options asynchronously when query changes or popover opens
  useEffect(() => {
    if (!isOpen && !query) return

    let active = true
    setLoading(true)
    setError(null)

    const timer = setTimeout(() => {
      void fetchOptionsRef
        .current(query)
        .then((results) => {
          if (active) {
            setOptions(results)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (active) {
            setError(err instanceof Error ? err.message : 'Error fetching options')
            setOptions([])
            setLoading(false)
          }
        })
    }, 150)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, isOpen, ...deps])

  const handleSelectOption = (opt: ComboboxOption) => {
    onChange(opt.value)
    setSelectedLabel(opt.label)
    setIsOpen(false)
    setQuery('')
    onSelect?.(opt.value, opt)
  }

  return (
    <div>
      <input type="hidden" name={name} value={value ?? ''} ref={ref} disabled={disabled} />
      <Popover
        placement="bottom-start"
        fallbackPlacements={['top-start']}
        onOpenCallback={(open) => setIsOpen(open)}>
        <PopoverTrigger
          className={clsxJoin(
            'outline-focus-select group flex w-full cursor-pointer items-center justify-between rounded border border-gray-200 pr-2 transition-all hover:border-gray-300',
            className || 'bg-white',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          disabled={disabled}>
          <div className="flex items-center p-2 text-sm">
            <span className={selectedLabel ? 'font-medium text-gray-900 truncate max-w-[260px]' : 'text-gray-400'}>
              {selectedLabel || placeholder}
            </span>
          </div>
          <RrCaretDown className="size-4 shrink-0 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
        </PopoverTrigger>

        <InputError<ShippingBillFormValues> name={name as any} />

        <PopoverContent className="z-50 w-72 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="focus:border-primary-500 focus:ring-primary-500 w-full rounded border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:ring-1"
              autoFocus
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-3 text-center text-xs text-gray-500">
                <span className="inline-block size-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
                Loading options...
              </div>
            ) : error ? (
              <div className="p-3 text-center text-xs text-red-500">{error}</div>
            ) : options.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">No matching options found</div>
            ) : (
              options.map((opt) => {
                const isSelected = String(value) === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={clsxJoin(
                      'flex w-full flex-col items-start rounded px-2.5 py-1.5 text-left text-xs transition-colors',
                      isSelected ? 'bg-primary-50 font-medium text-primary-900' : 'text-gray-700 hover:bg-gray-100'
                    )}>
                    <span className="truncate w-full">{opt.label}</span>
                    {opt.sublabel && <span className="text-[10px] text-gray-400 truncate w-full">{opt.sublabel}</span>}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
