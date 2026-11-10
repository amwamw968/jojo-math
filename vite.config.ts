import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [
    react(),
    {
      name: "spa-404",
      closeBundle() {
        const dir = resolve("dist");
        copyFileSync(resolve(dir, "index.html"), resolve(dir, "404.html"));
      },
    },
  ],
});
