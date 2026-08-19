import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import viteWasm from "vite-plugin-wasm";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command, mode }) => {
  // Load all env vars
  const env = loadEnv(mode, process.cwd(), ["VITE_", "NODE_", "APP_"]);

  // Validate required env vars
  const requiredVars = ["VITE_API_KEY", "VITE_API_SECRET_KEY", "VITE_NODE_ENV"];
  requiredVars.forEach((varName) => {
    if (!env[varName]) {
      console.warn(`Missing required environment variable: ${varName}`);
    }
  });

  return {
    plugins: [
      react(),
      viteWasm(),
      viteStaticCopy({
        targets: [
          {
            src: "node_modules/javascript-signature-sdk/signature-sdk.wasm",
            dest: "assets"
          }
        ]
      }),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "logo.png"],
        manifest: {
          name: "SDID Enrollment Biometric Data Capture",
          short_name: "Enrollment",
          description: "Capture biometric data in offline-ready PWA",
          theme_color: "#078ece",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "logo.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "logo.png",
              sizes: "512x512",
              type: "image/png"
            }
          ]
        },
        workbox: {
          globPatterns: [
            "**/*.{js,css,html,ico,png,svg,webmanifest,wasm,ts,tsx}"
          ],
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024 // 5 MB for large WASM
        }
      })
    ],
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./tests/setupTests.ts",
      coverage: {
        reporter: ["cobertura", "text-summary", "html"]
      }
    },
    build: {
      outDir: "dist",
      target: "esnext", // Required for WASM
      assetsInlineLimit: 0, // Ensure WASM isn't inlined
      commonjsOptions: {
        transformMixedEsModules: true // Helps with CJS/ESM interop
      },
      rollupOptions: {
        input: {
          main: "./index.html"
        },
        output: {
          manualChunks: {
            // Group heavy libraries
            pdf: ["pdfjs-dist", "jspdf", "jspdf-autotable"],
            charts: ["chart.js", "react-chartjs-2"],
            maps: ["leaflet", "react-leaflet", "react-leaflet-markercluster"],
            rsuite: [
              "rsuite",
              "@rsuite/interactions",
              "@rsuite/responsive-nav"
            ],
            utils: ["moment", "moment-timezone", "axios"],
            // Vendor bundle (adjust as needed)
            vendor: [
              "react",
              "react-dom",
              "react-router-dom",
              "redux",
              "formik"
            ]
          },
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === "localServiceWorker"
              ? "[name].js"
              : "assets/[name]-[hash].js";
          }
        }
      }
    },
    optimizeDeps: {
      include: ["rsuite", "@stomp/stompjs", "sockjs-client"],
      esbuildOptions: {
        define: {
          global: "globalThis"
          // "import.meta.env.VITE_API_KEY": JSON.stringify(
          //   process.env.VITE_API_KEY
          // ),
          // "import.meta.env.VITE_API_SECRET_KEY": JSON.stringify(
          //   process.env.VITE_API_SECRET_KEY
          // ),
        },
        // Add these plugins for Node.js polyfills
        plugins: [
          {
            name: "fix-stomp",
            setup(build) {
              build.onResolve({ filter: /@stomp\/stompjs/ }, () => {
                return { path: require.resolve("@stomp/stompjs") };
              });
            }
          }
        ]
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src")
      }
    },
    server: {
      port: 5190,
      strictPort: true,
      allowedHosts: ["sdid.enrollment.ui"],
      fs: {
        allow: [".."] // Allow serving files from node_modules
      },
      watch: {
        usePolling: true // Useful for some environments like Docker
      }
    },
    preview: {
      host: true,
      port: 4173
    }
  };
});
