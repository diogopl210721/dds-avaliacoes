import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "/" pois o domínio custom (avaliacao.ddsinovacao.com.br) serve a
// raiz do repositório. Se publicar em usuario.github.io/repo, troque para
// base: "/repo/".
export default defineConfig({
  plugins: [react()],
  base: "./",
});
