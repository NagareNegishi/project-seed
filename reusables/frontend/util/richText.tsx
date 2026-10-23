import { Fragment } from "react"

// Renders **bold** segments within plain copy strings as <strong>; lets
// config-driven copy mark emphasis inline instead of a field per string.
export function renderBoldText(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-bold text-foreground">{part}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
