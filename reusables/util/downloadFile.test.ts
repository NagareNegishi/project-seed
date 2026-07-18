import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { downloadFile } from "./downloadFile"

// jsdom implements neither createObjectURL nor revokeObjectURL — stub both.
const createObjectURL = vi.fn(() => "blob:mock-url")
const revokeObjectURL = vi.fn()

beforeEach(() => {
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe("downloadFile", () => {
  it("clicks an anchor pointing at the object URL with the download name set", () => {
    let clicked: HTMLAnchorElement | undefined
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        clicked = this
      })

    downloadFile("hello", "hello.txt")

    expect(click).toHaveBeenCalledOnce()
    expect(clicked?.href).toBe("blob:mock-url")
    expect(clicked?.download).toBe("hello.txt")
    click.mockRestore()
  })

  it("wraps string content in a blob with the given mime type", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    downloadFile('{"a":1}', "data.json", "application/json")

    const blob = createObjectURL.mock.calls[0][0] as unknown as Blob
    expect(blob.type).toBe("application/json")
    expect(blob.size).toBe('{"a":1}'.length)
  })

  it("passes an existing blob through untouched", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    const blob = new Blob(["x"], { type: "text/csv" })

    downloadFile(blob, "x.csv")

    expect(createObjectURL).toHaveBeenCalledWith(blob)
  })

  it("revokes the object URL and removes the anchor afterwards", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    downloadFile("bye", "bye.txt")

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url")
    expect(document.querySelector("a")).toBeNull()
  })
})
