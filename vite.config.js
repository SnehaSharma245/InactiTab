import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, "src/popup/popup.html"),
        background: path.resolve(__dirname, "src/background/background.js"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background/background.js";
          return "popup/assets/[name].js";
        },
        assetFileNames: (chunk) => {
          if (chunk.name && chunk.name.endsWith(".css")) {
            return "popup/assets/[name].[ext]";
          }
          return "assets/[name].[ext]";
        },
      },
    },
  },
});
