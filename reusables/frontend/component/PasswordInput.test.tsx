import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PasswordInput } from "./PasswordInput"

describe("PasswordInput", () => {
  it("starts hidden as type=password", () => {
    render(<PasswordInput placeholder="pw" />)
    expect(screen.getByPlaceholderText<HTMLInputElement>("pw").type).toBe("password")
  })

  it("toggles to text and back via the eye button", () => {
    render(<PasswordInput placeholder="pw" />)
    const input = screen.getByPlaceholderText<HTMLInputElement>("pw")

    fireEvent.click(screen.getByRole("button", { name: "Show password" }))
    expect(input.type).toBe("text")

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }))
    expect(input.type).toBe("password")
  })

  it("passes input props through", () => {
    render(<PasswordInput placeholder="pw" defaultValue="secret" name="password" />)
    const input = screen.getByPlaceholderText<HTMLInputElement>("pw")
    expect(input.value).toBe("secret")
    expect(input.name).toBe("password")
  })
})
