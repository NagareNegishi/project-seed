// Shared test setup. RTL's auto-cleanup needs a global afterEach, which
// vitest only provides with `globals: true`; register cleanup explicitly.
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(cleanup)
