import { useEffect, useState } from "react"

type Theme = "light" | "dark"

const COLOR_THEMES = ["default", "blue", "red", "yellow", "pink"] as const
export type ColorTheme = typeof COLOR_THEMES[number]

// Passed as lazy initializer to useState, runs once on mount
function getInitialTheme(): Theme {
  const stored = localStorage.getItem("theme")
  if (stored === "light" || stored === "dark") return stored
  // Fall back to OS preference if no stored choice
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getInitialColorTheme(): ColorTheme {
  const stored = localStorage.getItem("colorTheme")
  // Reject unrecognised values
  return (COLOR_THEMES as readonly string[]).includes(stored ?? "")
    ? (stored as ColorTheme)
    : "default"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(getInitialColorTheme)

  // Both classes managed in one effect so .dark and .theme-* are always applied together
  useEffect(() => {
    const html = document.documentElement
    // toggle(name, force), true adds, false removes
    html.classList.toggle("dark", theme === "dark")
    // Remove all theme classes before adding
    COLOR_THEMES.forEach(t => html.classList.remove(`theme-${t}`))
    // "default" has no CSS class, skip the add
    if (colorTheme !== "default") html.classList.add(`theme-${colorTheme}`)
    localStorage.setItem("theme", theme)
  }, [theme, colorTheme])

  // Function form of setTheme, reads previous state and flips
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark")

  const setColorTheme = (t: ColorTheme) => {
    setColorThemeState(t)
    localStorage.setItem("colorTheme", t)
  }

  return { theme, toggleTheme, colorTheme, setColorTheme }
}
