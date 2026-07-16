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
          manualChunks(id) {
            const normalizedId = id.split(path.sep).join("/");

            if (!normalizedId.includes("/node_modules/")) {
              if (
                normalizedId.includes("/src/integrations/supabase/") ||
                normalizedId.endsWith("/src/lib/supabase.ts")
              ) {
                return "supabase-app";
              }

              if (normalizedId.endsWith("/src/utils/webVitals.ts")) {
                return "analytics-app";
              }

              return undefined;
            }

            if (
              normalizedId.includes("/node_modules/react/") ||
              normalizedId.includes("/node_modules/react-dom/") ||
              normalizedId.includes("/node_modules/react-router/") ||
              normalizedId.includes("/node_modules/react-router-dom/")
            ) {
              return "react-vendor";
            }

            if (normalizedId.includes("/node_modules/recharts/")) {
              return "recharts";
            }

            if (normalizedId.includes("/node_modules/framer-motion/")) {
              return "framer-motion";
            }

            if (normalizedId.includes("/node_modules/@tanstack/")) {
              return "tanstack";
            }

            if (normalizedId.includes("/node_modules/@supabase/")) {
              return "supabase-vendor";
            }

            if (
              normalizedId.includes("/node_modules/posthog-js/") ||
              normalizedId.includes("/node_modules/dompurify/")
            ) {
              return "analytics-vendor";
            }

            if (
              normalizedId.includes("/node_modules/sonner/") ||
              normalizedId.includes("/node_modules/next-themes/")
            ) {
              return "feedback-vendor";
            }

            if (normalizedId.includes("/node_modules/@radix-ui/")) {
              return "radix-ui";
            }

            if (normalizedId.includes("/node_modules/@stripe/")) {
              return "payments-vendor";
            }

            if (
              normalizedId.includes("/node_modules/@whop-apps/") ||
              normalizedId.includes("/node_modules/zod/")
            ) {
              return "whop-vendor";
            }
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
