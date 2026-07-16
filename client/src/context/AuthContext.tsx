import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import api from '../services/api.js';

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
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Clerk-powered Auth Provider ─────────────────────────────────────────────
const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);
  const [clerkError, setClerkError] = useState<string | null>(null);
  const [clerkLoaded, setClerkLoaded] = useState(false);

  // Use refs to avoid stale closures and infinite loops
  const hasSyncedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Timeout for Clerk initialization (10 seconds) - prevents infinite loading if Clerk fails to load
  useEffect(() => {
    if (isLoaded) {
      setClerkLoaded(true);
    } else {
      const timer = setTimeout(() => {
        if (isMountedRef.current && !isLoaded) {
          setClerkError('Clerk initialization timed out. Please check your publishable key and network connection.');
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

  useEffect(() => {
    // Only sync once when Clerk is loaded and user is signed in
    if (!clerkLoaded || !isSignedIn || hasSyncedRef.current) return;

    const syncSession = async () => {
      hasSyncedRef.current = true;
      setIsLoadingProfile(true);
      setClerkError(null);

      // Timeout for profile fetch (8 seconds) - prevents infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });

      try {
        const clerkToken = await Promise.race([stableGetToken(), timeoutPromise]);
        if (!isMountedRef.current) return;

        if (clerkToken) {
          localStorage.setItem('auth_token', clerkToken);
          setToken(clerkToken);

          const response = await Promise.race([api.get('/auth/me'), timeoutPromise]);
          if (!isMountedRef.current) return;

          if (response.data?.success) {
            setUser(response.data.user);
          } else {
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
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
  }, [clerkLoaded, isSignedIn, stableGetToken]);
  // Note: clerkUser intentionally omitted from deps to prevent re-sync on user object changes

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

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading: !clerkLoaded || isLoadingProfile,
      login,
      logout,
      hasPermission,
    }}>
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

  if (isClerkConfigured) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
