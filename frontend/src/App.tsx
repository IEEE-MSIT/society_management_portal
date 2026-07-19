import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

// Layout & Guards
import Layout from './components/Layout.js';
import PrivateRoute from './components/PrivateRoute.js';
import RoleRoute from './components/RoleRoute.js';

// Pages
import Login from './pages/Login.js';
import Signup from './pages/Signup.js';
import Dashboard from './pages/Dashboard.js';
import MembersList from './pages/MembersList.js';
import AddMember from './pages/AddMember.js';
import EditMember from './pages/EditMember.js';
import MemberProfile from './pages/MemberProfile.js';
import Unauthorized from './pages/Unauthorized.js';
import NotFound from './pages/NotFound.js';
import Complaints from './pages/Complaints';
import Visitors from './pages/Visitors';
import Bookings from './pages/Bookings';
import AwardsDashboard from './pages/AwardsDashboard';
import CertificateView from './pages/CertificateView';
import Projects from './pages/Projects';
import Events from './pages/Events';
import Portfolio from './pages/Portfolio';
import AiHub from './pages/AiHub';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login/*" element={<Login />} />
              <Route path="/signup/*" element={<Signup />} />
              <Route path="/awards/certificate/:id" element={<CertificateView />} />

              {/* Private Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* Member Routes guarded by Role Permissions */}
                  <Route element={<RoleRoute permission="member:read" />}>
                    <Route path="/members" element={<MembersList />} />
                    <Route path="/members/:id" element={<MemberProfile />} />
                  </Route>

                  <Route element={<RoleRoute permission="member:create" />}>
                    <Route path="/members/add" element={<AddMember />} />
                  </Route>

                  <Route element={<RoleRoute permission="member:update" />}>
                    <Route path="/members/edit/:id" element={<EditMember />} />
                  </Route>

                  {/* Complaints Route */}
                  <Route element={<RoleRoute permission="complaint:read" />}>
                    <Route path="/complaints" element={<Complaints />} />
                  </Route>

                  {/* Visitors Route */}
                  <Route element={<RoleRoute permission="visitor:read" />}>
                    <Route path="/visitors" element={<Visitors />} />
                  </Route>

                  {/* Bookings Route */}
                  <Route element={<RoleRoute permission="booking:read" />}>
                    <Route path="/bookings" element={<Bookings />} />
                  </Route>

                  {/* Awards Route */}
                  <Route element={<RoleRoute permission="member:read" />}>
                    <Route path="/awards" element={<AwardsDashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/portfolio/:id" element={<Portfolio />} />
                    <Route path="/ai-hub" element={<AiHub />} />
                  </Route>
                </Route>
              </Route>

              {/* Error Pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
