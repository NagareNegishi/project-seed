import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SortableHeader, type SortState } from "./SortableHeader"

/** Renders the header inside a valid table so jsdom accepts the <th>. */
function renderHeader(sort: SortState | null, onSortChange: (s: SortState) => void = () => {}) {
  return render(
    <table>
      <thead>
        <tr>
          <SortableHeader sortKey="name" sort={sort} onSortChange={onSortChange}>
            Name
          </SortableHeader>
        </tr>
      </thead>
    </table>
  )
}

describe("SortableHeader", () => {
  it("has no aria-sort while another column is active", () => {
    renderHeader({ key: "age", direction: "asc" })
    expect(screen.getByRole("columnheader").hasAttribute("aria-sort")).toBe(false)
  })

  it("reflects the active direction in aria-sort", () => {
    const { rerender } = renderHeader({ key: "name", direction: "asc" })
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending")

    rerender(
      <table>
        <thead>
          <tr>
            <SortableHeader sortKey="name" sort={{ key: "name", direction: "desc" }} onSortChange={() => {}}>
              Name
            </SortableHeader>
          </tr>
        </thead>
      </table>
    )
    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("descending")
  })

  it("starts ascending when its column is not the active one", () => {
    const onSortChange = vi.fn()
    renderHeader({ key: "age", direction: "desc" }, onSortChange)

    fireEvent.click(screen.getByRole("button", { name: "Name" }))
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ key: "name", direction: "asc" })
  })

  it("flips direction when already active", () => {
    const onSortChange = vi.fn()
    renderHeader({ key: "name", direction: "asc" }, onSortChange)

    fireEvent.click(screen.getByRole("button", { name: "Name" }))
    expect(onSortChange).toHaveBeenCalledExactlyOnceWith({ key: "name", direction: "desc" })
  })
})
