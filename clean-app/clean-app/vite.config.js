import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env.SHOPIFY_API_KEY": JSON.stringify(process.env.SHOPIFY_API_KEY),
    "process.env.ANTHROPIC_API_KEY": JSON.stringify(process.env.ANTHROPIC_API_KEY),
  },
  server: {
    port: 3000,
    hmr: { protocol: "ws" },
  },
  build: {
    outDir: "dist",
  },
});
