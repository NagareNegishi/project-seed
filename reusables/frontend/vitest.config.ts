// Test runner config for the reusables. jsdom everywhere: hooks and
// browser-facing utils need it, and pure TS tests run in it unchanged.
import { defineConfig } from "vitest/config"

// Absolute path next to this config file, without needing node types.
const here = (p: string) => new URL(p, import.meta.url).pathname

export default defineConfig({
  resolve: {
    // Components keep consumer-project import paths (@/components/ui,
    // @/lib/utils, @/utils); map them onto this repo's layout for tests.
    alias: [
      { find: /^@\/components\/ui\/(.*)$/, replacement: here("shadcn/") + "$1" },
      { find: "@/lib/utils", replacement: here("util/cn.ts") },
      { find: /^@\/utils\/(.*)$/, replacement: here("util/") + "$1" },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
})
