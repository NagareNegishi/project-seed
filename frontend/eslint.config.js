// ESLint flat config: JS recommended rules, React and React hooks rules, browser globals.
import js from "@eslint/js"
import globals from "globals"
import reactPlugin from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      sourceType: "module",
    },
    settings: { react: { version: "detect" } },
  },
])
