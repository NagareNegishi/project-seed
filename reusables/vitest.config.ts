// Test runner config for the reusables. jsdom everywhere: hooks and
// browser-facing utils need it, and pure TS tests run in it unchanged.
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    // Components keep consumer-project import paths (@/components/ui,
    // @/lib/utils, @/utils); map them onto this repo's layout for tests.
    alias: [
      { find: /^@\/components\/ui\/(.*)$/, replacement: path.resolve(import.meta.dirname, "shadcn/$1") },
      { find: "@/lib/utils", replacement: path.resolve(import.meta.dirname, "util/cn.ts") },
      { find: /^@\/utils\/(.*)$/, replacement: path.resolve(import.meta.dirname, "util/$1") },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
})
