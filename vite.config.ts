import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    watch: { ignored: ['**/release/**', '**/.desktop-stage/**', '**/.desktop-private/**', '**/test-output/**'] },
  },
});
