import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // Group heavy libraries into their own separate chunks
            if (id.includes("framer-motion")) return "vendor-framer";
            if (id.includes("jspdf") || id.includes("html2canvas"))
              return "vendor-pdf";
            if (id.includes("lucide-react")) return "vendor-icons";

            // Put everything else in a general vendor chunk
            return "vendor";
          }
        },
      },
    },
  },
});
