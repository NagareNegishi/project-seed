// Config-driven "planned maintenance" window - flip `enabled` and set the
// window before taking the app down on purpose, then check `isWithinWindow`
// wherever you decide to redirect to a maintenance page (e.g. on a 503).
// Generalized from `maintenance.ts` - the NZ-specific defaults are left out.

export interface MaintenanceWindow {
  enabled: boolean
  startHour: number  // 0-23, local to `timezone`
  endHour: number     // 0-23, local to `timezone`
  timezone: string    // IANA zone, e.g. "Pacific/Auckland"
  label: string       // human name for the zone, e.g. "New Zealand time"
}

// True only when `enabled` and the current time in `timezone` falls within the window.
// If startHour > endHour the window crosses midnight, so the check becomes an OR:
// "after start OR before end".
export function isWithinWindow(window: MaintenanceWindow): boolean {
  if (!window.enabled) return false

  const hour = parseInt(
    new Intl.DateTimeFormat("en-AU", {
      timeZone: window.timezone,
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
    10
  )
  const { startHour, endHour } = window
  return startHour <= endHour
    ? hour >= startHour && hour < endHour
    : hour >= startHour || hour < endHour
}

function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM"
  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  return `${displayHour} ${period}`
}

// e.g. "8 PM – 7 AM New Zealand time"
export function formatWindowLabel(window: MaintenanceWindow): string {
  return `${formatHour(window.startHour)} – ${formatHour(window.endHour)} ${window.label}`
}
