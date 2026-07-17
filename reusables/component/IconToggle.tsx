// Reusable icon-based toggle group for mutually exclusive view/mode switching.
import { Check } from 'lucide-react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ToggleOption<T extends string> {
  value: T
  icon: ReactNode
  label?: string
}

interface IconToggleProps<T extends string> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
}

/** Renders a pill-shaped button group where exactly one option is active at a time. */
export function IconToggle<T extends string>({ options, value, onChange }: IconToggleProps<T>) {
  return (
    <div className="flex bg-card rounded-full p-1 shadow-sm">
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <Fragment key={opt.value}>
            {/* Divider between options */}
            {i > 0 && <div className="w-0.5 bg-muted-foreground/40 self-stretch" />}
            <Button
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('rounded-full', active && 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60')}
              onClick={() => onChange(opt.value)}
            >
              {/* Span animates width to reveal/hide the check */}
              <span className={cn(
                'overflow-hidden transition-all duration-200',
                active ? 'w-4 opacity-100' : 'w-0 opacity-0'
              )}>
                <Check />
              </span>
              {opt.icon}
              {opt.label && <span>{opt.label}</span>}
            </Button>
          </Fragment>
        )
      })}
    </div>
  )
}
