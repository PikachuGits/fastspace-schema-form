import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./package/__tests__/setup.ts"],
    include: ["package/**/*.{test,spec}.{ts,tsx}"],
  },
});
