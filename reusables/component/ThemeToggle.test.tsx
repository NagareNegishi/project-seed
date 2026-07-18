import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ThemeToggle } from "./ThemeToggle"

// useTheme reads the OS preference through matchMedia, which jsdom lacks.
function stubMatchMedia(prefersDark: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: prefersDark }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})
afterEach(() => vi.unstubAllGlobals())

describe("ThemeToggle", () => {
  it("starts from the OS preference when nothing is stored", () => {
    stubMatchMedia(true)
    render(<ThemeToggle />)
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeTruthy()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("toggles the dark class and persists the choice", () => {
    stubMatchMedia(false)
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("theme")).toBe("dark")

    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }))
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(localStorage.getItem("theme")).toBe("light")
  })

  it("prefers the stored theme over the OS preference", () => {
    stubMatchMedia(true)
    localStorage.setItem("theme", "light")
    render(<ThemeToggle />)
    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeTruthy()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })
})
