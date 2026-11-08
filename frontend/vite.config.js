// Vite build config; also holds the Vitest block.
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // Listen on all interfaces so the host browser can reach the dev server inside the dev container.
  server: {
    host: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
  },
})
