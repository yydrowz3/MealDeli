import { defineConfig } from "vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { PWA_RUNTIME_CACHING, PWA_UPDATE_BEHAVIOR } from "./src/app/pwa/policy.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    VitePWA({
      registerType: PWA_UPDATE_BEHAVIOR.registerType,
      injectRegister: null,
      includeAssets: [
        "favicon.svg",
        "pwa/apple-touch-icon.png",
        "brand/*.svg",
        "brand/*.png",
      ],
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [...PWA_RUNTIME_CACHING],
      },
      manifest: {
        name: "MealDeli",
        short_name: "MealDeli",
        description: "Simple delivery for everyone.",
        start_url: "/",
        display: "standalone",
        theme_color: "#2FA36B",
        background_color: "#F7F6F2",
        icons: [
          {
            src: "/pwa/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
