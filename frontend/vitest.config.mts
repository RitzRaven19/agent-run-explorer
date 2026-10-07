import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." imports as in tsconfig.json, so test files import the code exactly like the app does.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    // The tested functions are pure (no DOM, no React), so plain Node is enough and fastest.
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
