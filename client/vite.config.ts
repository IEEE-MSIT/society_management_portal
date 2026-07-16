import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
  },
  resolve: {
    alias: {
      three: path.resolve(__dirname, '../node_modules/three'),
    },
  },
  optimizeDeps: {
    include: ['three'],
  },
})


