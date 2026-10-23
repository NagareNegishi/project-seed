interface SectionHeaderProps {
  title: string
  children: React.ReactNode // action(s) on the right
}

/**
 * SectionHeader shows a section's title on the left and its action(s) on the right.
 */
export function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-y-2 pl-4 pr-4">
      <span className="text-sm uppercase tracking-wider font-semibold text-muted-foreground border-l-2 border-primary pl-3">
        {title}
      </span>
      {children}
    </div>
  )
}
