// Dev config for the disposable test shell. The dev server proxies /api to the
// testhost so the browser and the API share one origin (no CORS) and the
// Anthropic key and wallet stay on the server.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const TESTHOST_PORT = 8787;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": `http://localhost:${TESTHOST_PORT}`,
    },
  },
});
