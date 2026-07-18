import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { FileDropzone, isAcceptedType } from "./FileDropzone"

function makeFile(name: string, type: string, bytes = 4): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

/** Drops files onto the dropzone. */
function drop(files: File[]) {
  fireEvent.drop(screen.getByRole("button", { name: "Upload files" }), {
    dataTransfer: { files },
  })
}

describe("isAcceptedType", () => {
  const csv = makeFile("data.CSV", "text/csv")
  const png = makeFile("pic.png", "image/png")

  it("matches extensions case-insensitively", () => {
    expect(isAcceptedType(csv, ".csv")).toBe(true)
    expect(isAcceptedType(png, ".csv")).toBe(false)
  })

  it("matches exact and wildcard mime types", () => {
    expect(isAcceptedType(csv, "text/csv")).toBe(true)
    expect(isAcceptedType(png, "image/*")).toBe(true)
    expect(isAcceptedType(csv, "image/*")).toBe(false)
  })

  it("accepts when any token in the list matches", () => {
    expect(isAcceptedType(png, ".csv, image/*")).toBe(true)
  })
})

describe("FileDropzone", () => {
  it("reports dropped files that pass validation", () => {
    const onFiles = vi.fn()
    render(<FileDropzone onFiles={onFiles} multiple />)

    const files = [makeFile("a.png", "image/png"), makeFile("b.png", "image/png")]
    drop(files)
    expect(onFiles).toHaveBeenCalledExactlyOnceWith(files)
  })

  it("takes only the first file when multiple is off", () => {
    const onFiles = vi.fn()
    render(<FileDropzone onFiles={onFiles} />)

    const files = [makeFile("a.png", "image/png"), makeFile("b.png", "image/png")]
    drop(files)
    expect(onFiles).toHaveBeenCalledExactlyOnceWith([files[0]])
  })

  it("rejects wrong types and oversized files with reasons", () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    render(<FileDropzone onFiles={onFiles} onReject={onReject} accept="image/*" maxSizeBytes={10} multiple />)

    const wrongType = makeFile("doc.pdf", "application/pdf")
    const tooBig = makeFile("big.png", "image/png", 11)
    const ok = makeFile("ok.png", "image/png")
    drop([wrongType, tooBig, ok])

    expect(onFiles).toHaveBeenCalledExactlyOnceWith([ok])
    expect(onReject).toHaveBeenCalledExactlyOnceWith([
      { file: wrongType, reason: "type" },
      { file: tooBig, reason: "size" },
    ])
  })

  it("does not call onFiles when every file is rejected", () => {
    const onFiles = vi.fn()
    const onReject = vi.fn()
    render(<FileDropzone onFiles={onFiles} onReject={onReject} accept=".csv" />)

    drop([makeFile("pic.png", "image/png")])
    expect(onFiles).not.toHaveBeenCalled()
    expect(onReject).toHaveBeenCalledOnce()
  })

  it("reports files picked through the hidden input", () => {
    const onFiles = vi.fn()
    const { container } = render(<FileDropzone onFiles={onFiles} />)

    const input = container.querySelector<HTMLInputElement>("input[type=file]")!
    const file = makeFile("a.png", "image/png")
    fireEvent.change(input, { target: { files: [file] } })
    expect(onFiles).toHaveBeenCalledExactlyOnceWith([file])
  })

  it("ignores drops while disabled", () => {
    const onFiles = vi.fn()
    render(<FileDropzone onFiles={onFiles} disabled />)

    drop([makeFile("a.png", "image/png")])
    expect(onFiles).not.toHaveBeenCalled()
  })
})
