import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY && import.meta.env.DEV) {
  console.warn(
    '[Society Portal] VITE_CLERK_PUBLISHABLE_KEY is not set. ' +
    'The application is running in configuration fallback mode. Please configure Clerk environment variables on Vercel.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {!PUBLISHABLE_KEY ? (
      <App />
    ) : (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    )}
  </StrictMode>,
)
