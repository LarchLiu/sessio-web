import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const basePath = process.env.WEB_BASE_PATH ?? "./";

export default defineConfig({
  plugins: [react()],
  base: basePath.endsWith("/") ? basePath : `${basePath}/`,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
