import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Validate required environment variables at build time
    {
      name: 'validate-env',
      buildStart() {
        if (!process.env.VITE_CLERK_PUBLISHABLE_KEY) {
          throw new Error(
            '\n\n🔴 Build Error: VITE_CLERK_PUBLISHABLE_KEY is not set.\n' +
            '   → For Vercel: Add it in Project Settings → Environment Variables\n' +
            '   → For local dev: Add it to client/.env\n'
          )
        }
      },
    },
  ],
  server: {
    port: 5180,
  },
})
