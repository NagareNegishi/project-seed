import { describe, expect, it } from "vitest"
import { parseApiErrorBody } from "./apiError"

describe("parseApiErrorBody", () => {
  it("extracts the full contract shape", () => {
    expect(
      parseApiErrorBody({
        message: "Validation failed",
        code: "validation_failed",
        fieldErrors: { email: ["Email is invalid"], name: ["Required"] },
      })
    ).toEqual({
      message: "Validation failed",
      code: "validation_failed",
      fieldErrors: { email: ["Email is invalid"], name: ["Required"] },
    })
  })

  it("extracts a message-only body", () => {
    expect(parseApiErrorBody({ message: "Not found" })).toEqual({ message: "Not found" })
  })

  it("ignores non-string message and code", () => {
    expect(parseApiErrorBody({ message: 42, code: { nested: true } })).toEqual({})
  })

  it("joins identity-error arrays into one message", () => {
    expect(
      parseApiErrorBody([{ description: "Too short" }, { description: "Needs a digit" }])
    ).toEqual({ message: "Too short. Needs a digit" })
  })

  it("skips array entries without a description", () => {
    expect(parseApiErrorBody([{ code: "x" }, { description: "Only this" }])).toEqual({
      message: "Only this",
    })
  })

  it("returns {} for an empty array", () => {
    expect(parseApiErrorBody([])).toEqual({})
  })

  it("accepts a bare string body", () => {
    expect(parseApiErrorBody("Server exploded")).toEqual({ message: "Server exploded" })
  })

  it("returns {} for an empty string, null, and undefined", () => {
    expect(parseApiErrorBody("")).toEqual({})
    expect(parseApiErrorBody(null)).toEqual({})
    expect(parseApiErrorBody(undefined)).toEqual({})
  })

  it("drops malformed fieldErrors values but keeps valid ones", () => {
    expect(
      parseApiErrorBody({
        message: "Bad",
        fieldErrors: { email: ["Invalid"], age: "not-an-array", name: [1, 2] },
      })
    ).toEqual({ message: "Bad", fieldErrors: { email: ["Invalid"] } })
  })

  it("omits fieldErrors entirely when nothing valid remains", () => {
    expect(parseApiErrorBody({ message: "Bad", fieldErrors: { a: [] } })).toEqual({
      message: "Bad",
    })
  })
})
