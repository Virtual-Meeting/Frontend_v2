import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      assets: path.resolve(__dirname, "src/assets"),
      pages: path.resolve(__dirname, "src/pages"),
      components: path.resolve(__dirname, "src/components"),
      lib: path.resolve(__dirname, "src/lib"),
      types: path.resolve(__dirname, "src/types")
    }
  }
})