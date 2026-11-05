import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";

function releaseCommit() {
  const supplied = process.env["RELEASE_COMMIT_SHA"]?.trim();
  if (supplied && /^[0-9a-f]{40}$/i.test(supplied)) return supplied.toLowerCase();
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "development";
  }
}

export default defineConfig({
  define: { __RELEASE_COMMIT__: JSON.stringify(releaseCommit()) },
  server: { host: "0.0.0.0", port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({ server: { entry: "server" } }),
    nitro({ output: { dir: "dist" } }),
    viteReact(),
  ],
});
