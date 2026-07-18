import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useAsync } from "./useAsync"

describe("useAsync", () => {
  it("starts idle with no result", () => {
    const { result } = renderHook(() => useAsync(async () => 1))
    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
  })

  it("sets loading while running", async () => {
    let resolve!: (v: number) => void
    const { result } = renderHook(() =>
      useAsync(() => new Promise<number>((res) => { resolve = res }))
    )

    let pending!: Promise<unknown>
    act(() => { pending = result.current.run() })
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve(1)
      await pending
    })
    expect(result.current.loading).toBe(false)
  })

  it("stores an ok result and resolves run with it", async () => {
    const { result } = renderHook(() => useAsync(async (n: number) => n * 2))

    let returned: unknown
    await act(async () => { returned = await result.current.run(21) })

    expect(returned).toEqual({ ok: true, value: 42 })
    expect(result.current.result).toEqual({ ok: true, value: 42 })
  })

  it("captures a rejection as an err result instead of throwing", async () => {
    const boom = new Error("boom")
    const { result } = renderHook(() => useAsync(async () => { throw boom }))

    await act(async () => { await result.current.run() })

    expect(result.current.result).toEqual({ ok: false, error: boom })
  })

  it("wraps non-Error throws in an Error", async () => {
    const { result } = renderHook(() => useAsync(async () => { throw "oops" }))

    await act(async () => { await result.current.run() })

    const r = result.current.result
    expect(r?.ok).toBe(false)
    if (r && !r.ok) {
      expect(r.error).toBeInstanceOf(Error)
      expect(r.error.message).toBe("oops")
    }
  })

  it("ignores a stale run settling after a newer one", async () => {
    const resolvers: Array<(v: string) => void> = []
    const { result } = renderHook(() =>
      useAsync(() => new Promise<string>((res) => { resolvers.push(res) }))
    )

    let first!: Promise<unknown>
    let second!: Promise<unknown>
    act(() => { first = result.current.run() })
    act(() => { second = result.current.run() })

    await act(async () => {
      resolvers[1]("second")
      await second
    })
    expect(result.current.result).toEqual({ ok: true, value: "second" })

    await act(async () => {
      resolvers[0]("first")
      await first
    })
    expect(result.current.result).toEqual({ ok: true, value: "second" })
    expect(result.current.loading).toBe(false)
  })

  it("reset clears state and detaches an in-flight run", async () => {
    let resolve!: (v: number) => void
    const { result } = renderHook(() =>
      useAsync(() => new Promise<number>((res) => { resolve = res }))
    )

    let pending!: Promise<unknown>
    act(() => { pending = result.current.run() })
    act(() => { result.current.reset() })

    await act(async () => {
      resolve(7)
      await pending
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
  })
})
