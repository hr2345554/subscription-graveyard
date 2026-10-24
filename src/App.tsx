import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import Dashboard  from './pages/Dashboard';

// Vercel Analytics import
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'; 

import { Subscriptions } from './pages/Subscriptions';
import { Graveyard } from './pages/Graveyard';

// 👇 YAHAN FIX KIYA HAI: Curly braces { } hata diye hain 👇
import Analytics from './pages/Analytics'; 

import { Settings } from './pages/Settings';
import { PageTransition } from './components/ui/Skeleton';
import { ThemeProvider } from './contexts/ThemeContext';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white text-xl">💀</span>
        </div>
        <p className="text-text-muted text-sm">
          Loading Subscription Graveyard...
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <PageTransition>{children}</PageTransition>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <Login />
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? '/dashboard' : '/login'}
            replace
          />
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/graveyard" element={<Graveyard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRoutes />
          
          {/* Vercel Analytics Component */}
          <VercelAnalytics />
          
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;