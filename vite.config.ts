import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.WEB_BASE_PATH ?? "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
