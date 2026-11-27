import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Project Pages serves this preview at /freya/library/. Local dev stays at /.
  base: process.env.GITHUB_ACTIONS ? "/freya/library/" : "/",
  plugins: [react()],
  server: {
    host: true,
    port: 5176,
    strictPort: true,
  },
});
