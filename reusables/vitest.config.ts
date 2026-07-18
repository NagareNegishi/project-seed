// Test runner config for the reusables. jsdom everywhere: hooks and
// browser-facing utils need it, and pure TS tests run in it unchanged.
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
  },
})
