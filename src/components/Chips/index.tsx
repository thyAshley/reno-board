/* The filter row shared by every section that narrows a list.
 *
 * Real <button>s with aria-pressed, inside a group that names what is being
 * filtered — so the control is reachable and announced, which a clickable <div>
 * would not be.
 */
export interface ChipOption<T extends string> {
  value: T
  label: string
  count?: number
}

interface ChipsProps<T extends string> {
  /** Names the group for screen readers, e.g. "Filter by room". */
  label: string
  options: readonly ChipOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: ChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              'rounded-full border px-3 py-1 font-mono text-xs transition-colors',
              active
                ? 'border-walnut-800 bg-walnut-800 text-cream-50'
                : 'border-cream-300 bg-cream-100 text-walnut-700 hover:border-walnut-500',
            ].join(' ')}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={active ? 'ml-1.5 text-cream-300' : 'ml-1.5 text-walnut-400'}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
