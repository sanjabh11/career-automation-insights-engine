import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    const { componentTagger } = await import("lovable-tagger");
    plugins.push(componentTagger());
  }

  if (process.env.APO_BUILD_TRACE === "1") {
    plugins.push({
      name: "apo-build-trace",
      transform(_code, id) {
        console.log(`[apo-build-trace] ${id}`);
        return null;
      },
    });
  }

  return {
    server: {
      host: true,
      port: 8080,
      // Prevent external processes touching .env files from spamming HMR restarts
      watch: {
        ignored: [
          "**/.env",
          "**/.env.local",
          "**/.env.*",
        ],
      },
    },
    plugins,
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            recharts: ['recharts'],
            'framer-motion': ['framer-motion'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'tanstack': ['@tanstack/react-query'],
          },
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "lucide-react": path.resolve(__dirname, "./src/lib/lucide-react-shim.ts"),
      },
    },
  };
});
