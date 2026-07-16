import React, { createContext, useContext, useState, useEffect } from 'react';
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

// Clerk-powered Auth Provider
const ClerkAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  useEffect(() => {
    const syncSession = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const clerkToken = await getToken();
        if (clerkToken) {
          localStorage.setItem('auth_token', clerkToken);
          setToken(clerkToken);

          // Fetch local user details from backend
          const response = await api.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.user);
          } else {
            console.error('Failed to retrieve user profile from backend');
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to sync Clerk authentication with backend:', error);
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    syncSession();
  }, [isLoaded, isSignedIn, getToken, clerkUser]);

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

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading: !isLoaded || isLoadingProfile,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Fallback/Warning Banner Component
const FallbackWarningBanner: React.FC = () => {
  return (
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
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      maxWidth: '90%',
      width: 'max-content'
    }}>
      <span style={{ fontSize: '16px' }}>⚠️</span>
      <div>
        <strong>Clerk Configuration Required:</strong> Missing VITE_CLERK_PUBLISHABLE_KEY environment variable. UI features are running in preview mode.
      </div>
    </div>
  );
};

// Fallback Auth Provider for when Clerk is not configured
const FallbackAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkLocalToken = async () => {
      const localToken = localStorage.getItem('auth_token');
      if (localToken) {
        try {
          setToken(localToken);
          const response = await api.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.user);
          }
        } catch {
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };
    checkLocalToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role.name === 'Core Admin') return true;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      <FallbackWarningBanner />
      {children}
    </AuthContext.Provider>
  );
};

// Main AuthProvider wrapper
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isClerkConfigured = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (isClerkConfigured) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  } else {
    return <FallbackAuthProvider>{children}</FallbackAuthProvider>;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
