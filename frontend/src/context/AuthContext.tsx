import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, SignOutButton } from '@clerk/clerk-react';
import api, { setUnauthorizedHandler } from '../services/api.js';

interface User {
  id: string;
  email: string;
  status: string;
  societyId: string;
  societyName: string;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    profileImage: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // True when a Clerk session exists but our backend has NOT yet provisioned a user.
  // Used by the login page to avoid rendering <SignIn>, which would auto-redirect
  // back into a protected route and create the redirect/reload loop.
  isClerkSignedIn: boolean;
  // Last profile-sync error (e.g. backend unreachable). Drives the error screen.
  profileError: string | null;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Auth Blocked Screen (hard loop-breaker) ─────────────────────────────────
// Shown when a valid Clerk session exists but our backend could NOT provision /
// load the user (e.g. backend unreachable, DB error, or no default society).
// Rendering this INSTEAD of {children} means the router never mounts, so
// PrivateRoute cannot bounce the user to /login where Clerk would auto-redirect
// them straight back — which is exactly the redirect/reload loop we are killing.
const AuthBlockedScreen: React.FC<{ error: string | null }> = ({ error }) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4">
    <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl text-center space-y-5">
      <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
        <span style={{ fontSize: '20px' }}>⚠️</span>
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100">Session found, account not ready</h1>
        <p className="text-sm text-slate-400 mt-2">
          You are signed in, but your society portal account could not be loaded.
        </p>
      </div>
      {error && (
        <p className="text-xs text-rose-300 bg-rose-950/20 border border-rose-500/20 rounded-lg p-3">
          {error}
        </p>
      )}
      <div className="pt-2">
        <SignOutButton>
          <button className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer">
            Sign out and try again
          </button>
        </SignOutButton>
      </div>
    </div>
  </div>
);

// ─── Clerk-powered Auth Provider ─────────────────────────────────────────────
const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [clerkLoaded, setClerkLoaded] = useState(false);
  const [clerkFailed, setClerkFailed] = useState(false);

  // Use refs to avoid stale closures and infinite loops
  const hasSyncedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Reset sync flag when user signs out (isSignedIn goes from true to false)
  // This allows re-sync when user signs in again
  useEffect(() => {
    if (!isSignedIn) {
      hasSyncedRef.current = false;
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    }
  }, [isSignedIn]);

  // Register the 401 handler so the API layer can reset auth state WITHOUT
  // touching window.location. PrivateRoute then does a single SPA <Navigate>.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!isMountedRef.current) return;
      hasSyncedRef.current = false;
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Timeout for Clerk initialization (10 seconds) - prevents infinite loading if Clerk fails to load
  useEffect(() => {
    if (isLoaded) {
      setClerkLoaded(true);
    } else {
      const timer = setTimeout(() => {
        if (isMountedRef.current && !isLoaded) {
          setClerkError('Clerk initialization timed out. Please check your publishable key and network connection.');
          setClerkFailed(true);
          setClerkLoaded(true); // Allow app to proceed to fallback/error state
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Stable getToken reference to prevent infinite useEffect loops
  const stableGetToken = useCallback(async () => {
    try {
      return await getToken();
    } catch (e) {
      console.error('getToken failed:', e);
      return null;
    }
  }, [getToken]);

  // Session sync effect - runs when Clerk loads and user is signed in
  useEffect(() => {
    // Only sync once when Clerk is loaded and user is signed in
    if (!clerkLoaded || !isSignedIn || hasSyncedRef.current || clerkFailed) return;

    const syncSession = async () => {
      hasSyncedRef.current = true;
      setIsLoadingProfile(true);
      setClerkError(null);

      // Timeout for profile fetch (8 seconds) - prevents infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 60000);
      });

      try {
        const clerkToken = await Promise.race([stableGetToken(), timeoutPromise]);
        if (!isMountedRef.current) return;

        if (!clerkToken) {
          // Signed into Clerk but unable to obtain a session token — treat as a
          // hard failure so we surface the blocked screen instead of hanging.
          setClerkError('Could not obtain a Clerk session token. Please sign out and try again.');
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
          return;
        }

        localStorage.setItem('auth_token', clerkToken);
        setToken(clerkToken);

        const response = await Promise.race([api.get('/auth/me'), timeoutPromise]);
        if (!isMountedRef.current) return;

        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          setClerkError(
            response.data?.message || 'Your account could not be loaded from the backend.'
          );
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        console.error('Failed to sync Clerk authentication with backend:', error);
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setClerkError(error instanceof Error ? error.message : 'Authentication failed');
      } finally {
        if (isMountedRef.current) {
          setIsLoadingProfile(false);
        }
      }
    };

    syncSession();
  }, [clerkLoaded, isSignedIn, stableGetToken, clerkFailed]);
  // Note: clerkUser intentionally omitted from deps to prevent re-sync on user object changes

  // If Clerk failed, immediately render FallbackAuthProvider to stop all loading
  if (clerkFailed) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out from Clerk:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role.name === 'Core Admin') return true;
    return user.permissions.includes(permission);
  };

  // Hard loop-breaker: a valid Clerk session exists, loading finished, but no
  // user was provisioned/loaded and an error occurred. Render the blocked screen
  // (router unmounted) instead of bouncing back and forth between /login and /dashboard.
  const blockedByClerkSession =
    !!isSignedIn && clerkLoaded && !isLoadingProfile && !user && !!clerkError;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading: !clerkLoaded || isLoadingProfile,
      isClerkSignedIn: !!isSignedIn,
      profileError: clerkError,
      login,
      logout,
      hasPermission,
    }}>
      {blockedByClerkSession ? (
        <AuthBlockedScreen error={clerkError} />
      ) : (
        <>
          {children}
          {clerkError && (
            <div style={{
              position: 'fixed',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 99999,
              background: 'rgba(239, 68, 68, 0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#fca5a5',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
              maxWidth: '90%',
              width: 'max-content',
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div>
                <strong>Auth Error:</strong> {clerkError}. Please refresh or check your Clerk configuration.
              </div>
            </div>
          )}
        </>
      )}
    </AuthContext.Provider>
  );
};

// ─── Configuration Warning Banner ────────────────────────────────────────────
const ConfigWarningBanner: React.FC = () => (
  <div style={{
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 99999,
    background: 'rgba(239, 68, 68, 0.15)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#fca5a5',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37)',
    maxWidth: '90%',
    width: 'max-content',
  }}>
    <span style={{ fontSize: '16px' }}>⚠️</span>
    <div>
      <strong>Setup Required:</strong> Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> and{' '}
      <code>VITE_API_URL</code> to your Vercel Environment Variables, then redeploy.
    </div>
  </div>
);

// ─── Fallback Auth Provider (no Clerk, no backend calls) ─────────────────────
// When env vars are not configured: isLoading is immediately false, user is null,
// and PrivateRoute redirects to /login instantly — no hanging spinner.
const FallbackAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const noop = async () => {};

  const value: AuthContextType = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false, // ← CRITICAL: immediately false, no backend call, no spinner
    isClerkSignedIn: false,
    profileError: null,
    login: () => {},
    logout: noop,
    hasPermission: () => false,
  };

  return (
    <AuthContext.Provider value={value}>
      <ConfigWarningBanner />
      {children}
    </AuthContext.Provider>
  );
};

// ─── Main AuthProvider wrapper ────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!isClerkConfigured) {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }

  // Clerk is configured, use ClerkAuthProvider which handles its own fallback on failure
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
