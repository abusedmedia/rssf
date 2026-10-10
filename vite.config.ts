import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    cloudflare({
      // Workers AI uses a remote binding. Requires `wrangler login` (or
      // CLOUDFLARE_API_TOKEN). Set CLOUDFLARE_REMOTE_BINDINGS=false to boot
      // the app offline; AI generate/refine will fail until remote is on.
      remoteBindings: process.env.CLOUDFLARE_REMOTE_BINDINGS !== "false",
      inspectorPort: false,
    }),
  ],
});
