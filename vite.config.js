import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
);

// Hash del commit corrente: cambia a ogni deploy, così l'etichetta versione
// in fondo all'app permette di distinguere build nuova da cache vecchia.
let commit = "dev";
try {
  commit = execSync("git rev-parse --short HEAD").toString().trim();
} catch {
  // build fuori da un repo git: lasciamo "dev"
}

const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  plugins: [react()],
  base: "/unicorn-challenge/",
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(buildDate)
  }
});
