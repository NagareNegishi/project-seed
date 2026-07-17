import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import type { ComponentProps } from "react"

interface ResponsiveButtonProps extends ComponentProps<typeof Button> {
  icon: LucideIcon
}

export function ResponsiveButton({ icon: Icon, children, ...props }: ResponsiveButtonProps) {
  return (
    <Button {...props}>
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{children}</span>
    </Button>
  )
}
