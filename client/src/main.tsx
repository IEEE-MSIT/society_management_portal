import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'
import SplashLoader from './components/SplashLoader.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  // In production this should never happen because vite.config.ts validates
  // the env var at build time. If it does, show a minimal user-facing message.
  const root = document.getElementById('root')!
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;padding:2rem;text-align:center">
      <div>
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem">Service Temporarily Unavailable</h1>
        <p style="color:#94a3b8;font-size:0.875rem">Authentication is not configured. Please contact the administrator.</p>
      </div>
    </div>
  `
  throw new Error(
    '[Society Portal] Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. ' +
    'Add it to your .env file (local) or Vercel Environment Variables (production).'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SplashLoader />
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
