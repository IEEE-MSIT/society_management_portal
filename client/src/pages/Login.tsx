import React from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { Navigate } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext.js';
import { Building, ShieldAlert } from 'lucide-react';

const Login: React.FC = () => {
  const { isAuthenticated, isLoading, isClerkSignedIn, profileError } = useAuth();
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Already fully authenticated (Clerk session + backend user) → go to dashboard
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  // Hard loop-breaker: a Clerk session is active but the backend has NOT provisioned
  // the user (profileError set). DO NOT render <SignIn> here — its afterSignInUrl would
  // immediately auto-redirect back to /dashboard, recreate the reload loop. Show a stable
  // "setting up / error" panel instead (with a sign-out option via the AuthBlockedScreen path).
  if (isClerkConfigured && isClerkSignedIn && !isAuthenticated) {
    if (profileError) {
      // Surface the error inline; user can sign out (which clears the Clerk session)
      // and return to a clean <SignIn>.
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4">
          <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <span style={{ fontSize: '20px' }}>⚠️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Account not ready</h1>
              <p className="text-sm text-slate-400 mt-2">{profileError}</p>
            </div>
            <p className="text-xs text-slate-500">Sign out and sign back in to retry.</p>
          </div>
        </div>
      );
    }
    // Session active but profile still syncing / not yet resolved — hold on the spinner
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-400">Setting up your account…</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage>
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden px-4 py-12">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 flex flex-col items-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-indigo-650 flex items-center justify-center text-white border border-indigo-500/30 shadow-lg shadow-indigo-650/20">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 leading-tight">Society Management</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to manage your tenant portal</p>
          </div>
        </div>

        {/* Clerk Sign In component or configuration warning */}
        <div className="w-full flex justify-center">
          {isClerkConfigured ? (
            <SignIn
              routing="path"
              path="/login"
              signUpUrl="/signup"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  card: 'bg-transparent shadow-none border-none p-0 w-full',
                  header: 'hidden', // Hide standard header as we have custom headers
                  footer: 'text-slate-400 mt-4',
                  footerActionLink: 'text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-150',
                  formButtonPrimary: 'w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10 border-0 cursor-pointer',
                  formFieldLabel: 'text-xs font-semibold text-slate-350 mb-1.5',
                  formFieldInput: 'w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200',
                  identityPreviewText: 'text-slate-200',
                  identityPreviewEditButtonIcon: 'text-slate-400 hover:text-slate-250',
                  formResendCodeLink: 'text-indigo-400 hover:text-indigo-300',
                  dividerLine: 'bg-slate-800',
                  dividerText: 'text-slate-500 text-xs uppercase font-semibold px-2',
                  socialButtonsBlockButton: 'bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 transition-all duration-200 rounded-xl py-2 cursor-pointer',
                  socialButtonsBlockButtonText: 'text-slate-200 font-medium text-sm',
                  alert: 'bg-rose-950/40 border border-rose-500/20 text-rose-350 rounded-xl p-3.5 text-xs',
                },
                variables: {
                  colorPrimary: '#4f46e5',
                  colorBackground: 'transparent',
                  colorText: '#f1f5f9',
                  colorTextSecondary: '#94a3b8',
                  colorInputBackground: '#0f172a',
                  colorInputText: '#f1f5f9',
                }
              }}
            />
          ) : (
            <div className="w-full p-5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-center space-y-4">
              <div className="mx-auto h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-450 border border-rose-550/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-300">Authentication Required</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Clerk Authentication could not be loaded because the API keys are not configured.
                </p>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg text-left">
                <p className="text-[11px] text-slate-450 leading-relaxed font-mono">
                  Go to Vercel Project Settings and add <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> to verify your environment variables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Login;
