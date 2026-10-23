import { describe, expect, it, vi } from "vitest"
import { retry, sleep } from "./retry"

// Real timers with ~0ms delays keep these tests simple and fast.
const fast = { baseDelayMs: 0 }

describe("sleep", () => {
  it("resolves after the given time", async () => {
    vi.useFakeTimers()
    const done = vi.fn()
    sleep(500).then(done)
    await vi.advanceTimersByTimeAsync(499)
    expect(done).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(done).toHaveBeenCalled()
    vi.useRealTimers()
  })
})

describe("retry", () => {
  it("returns the first successful attempt without retrying", async () => {
    const fn = vi.fn().mockResolvedValue("done")
    await expect(retry(fn, fast)).resolves.toBe("done")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries failures until one succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("1"))
      .mockRejectedValueOnce(new Error("2"))
      .mockResolvedValue("done")
    await expect(retry(fn, fast)).resolves.toBe("done")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("throws the last error once retries are exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always"))
    await expect(retry(fn, { ...fast, retries: 2 })).rejects.toThrow("always")
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it("stops immediately when shouldRetry returns false", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent"))
    const shouldRetry = vi.fn().mockReturnValue(false)
    await expect(retry(fn, { ...fast, shouldRetry })).rejects.toThrow("permanent")
    expect(fn).toHaveBeenCalledTimes(1)
    expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error), 0)
  })

  it("doubles the delay each attempt and caps it at maxDelayMs", async () => {
    vi.useFakeTimers()
    const delays: number[] = []
    const spy = vi.spyOn(globalThis, "setTimeout")
    const fn = vi.fn().mockRejectedValue(new Error("x"))

    const p = retry(fn, { retries: 3, baseDelayMs: 100, maxDelayMs: 250 })
    p.catch(() => {}) // avoid unhandled rejection while timers advance
    await vi.runAllTimersAsync()
    await expect(p).rejects.toThrow("x")

    for (const call of spy.mock.calls) delays.push(call[1] as number)
    expect(delays).toEqual([100, 200, 250])
    vi.useRealTimers()
  })
})
