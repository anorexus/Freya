import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Project Pages serves the site at /freya/. Local dev stays at /.
  base: process.env.GITHUB_ACTIONS ? "/freya/" : "/",
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
