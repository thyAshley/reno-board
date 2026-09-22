import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base keeps dist/ portable across GitHub Pages, Netlify,
  // Cloudflare Pages and subpaths without reconfiguration.
  base: './',
  plugins: [react(), tailwindcss()],
})
