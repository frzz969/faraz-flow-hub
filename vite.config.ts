import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // All frontend code lives under frontend/src. Per @tanstack/start-plugin-core,
    // routesDirectory / generatedRouteTree / entries resolve relative to srcDirectory,
    // so these explicit values point at frontend/src/... after resolution.
    srcDirectory: "frontend/src",
    router: {
      routesDirectory: "routes",
      generatedRouteTree: "routeTree.gen.ts",
    },
    start: { entry: "start" },
    // Redirect TanStack Start's bundled server entry to frontend/src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Vite root stays at the repo root (node_modules + package.json unchanged).
    publicDir: "frontend/public",
    resolve: {
      // Override the wrapper's hardcoded `@` -> <root>/src` alias.
      alias: { "@": `${process.cwd()}/frontend/src` },
    },
  },
});
