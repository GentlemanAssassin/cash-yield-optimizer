/// <reference types="node" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves project sites at /<repo-name>/.
// Override at deploy time by setting VITE_BASE if the repo name differs.
const base = process.env.VITE_BASE ?? "/cash-yield-optimizer/";

export default defineConfig({
  plugins: [react()],
  base,
});
