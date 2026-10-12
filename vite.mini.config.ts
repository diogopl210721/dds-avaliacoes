import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { THEME_FONTS, fontsUrl } from "./src/lib/miniFonts";
import { PALETTES } from "./src/lib/miniPalettes";

// Segundo build: o "runtime" leve da página pública do mini site, com nome fixo
// (dist/mini/runtime.js e runtime.css), usado pelas páginas www.ddsinovacao.com.br/<nome>.
// Também gera meta.json com fontes e cores de fundo, para o gerador das páginas.
function meta(): Plugin {
  return {
    name: "mini-meta",
    generateBundle() {
      const themes = Object.keys(THEME_FONTS) as (keyof typeof THEME_FONTS)[];
      const data = {
        fonts: Object.fromEntries(themes.map(t => [t, fontsUrl([t])])),
        bg: Object.fromEntries(themes.map(t => [t, Object.fromEntries(PALETTES[t].map(p => [p.id, p.vars["--bg"]]))])),
      };
      this.emitFile({ type: "asset", fileName: "meta.json", source: JSON.stringify(data) });
    },
  };
}

export default defineConfig({
  plugins: [react(), meta()],
  base: "./",
  publicDir: false,
  build: {
    outDir: "dist/mini",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: "src/mini-runtime.tsx",
      output: {
        format: "es",
        inlineDynamicImports: true,
        entryFileNames: "runtime.js",
        assetFileNames: (a) => (a.name?.endsWith(".css") ? "runtime.css" : "assets/[name]-[hash][extname]"),
      },
    },
  },
});
