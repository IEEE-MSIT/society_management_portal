import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Validate required environment variables at build time (warn, don't crash the build)
    {
      name: 'validate-env',
      buildStart() {
        if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
          console.warn(
            '\n\n⚠️  Build Warning: VITE_CLERK_PUBLISHABLE_KEY is not set.\n' +
            '   → For Vercel: Add it in Project Settings → Environment Variables\n' +
            '   → For local dev: Add it to frontend/.env\n'
          )
        }
      },
    },
  ],
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
  build: {
    chunkSizeWarningLimit: 1600, // Silence warning for large chunks like Three.js and Clerk
  },
})
