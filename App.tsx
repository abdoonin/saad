import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import { Header } from './components/Header';

// Lazy-loaded pages for code splitting
const SearchPage = lazy(() => import('./pages/SearchPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TermsPage = lazy(() => import('./components/TermsPage'));

// Loading spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

// Main layout with Header and Footer
function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();

  const currentView = (() => {
    const path = location.pathname;
    if (path === '/login') return 'login' as const;
    if (path === '/dashboard') return 'dashboard' as const;
    if (path === '/admin') return 'admin' as const;
    if (path === '/terms') return 'terms' as const;
    return 'search' as const;
  })();

  const handleLogoClick = () => {
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header
        onLoginClick={() => navigate('/login')}
        onLogoutClick={handleLogout}
        onLogoClick={handleLogoClick}
        onDashboardClick={() => navigate('/dashboard')}
        onAdminClick={() => navigate('/admin')}
        isLoggedIn={!!user}
        isAdmin={user?.isAdmin}
        showLoginBtn={currentView === 'search'}
        currentView={currentView}
      />

      <main className="flex-grow container mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-8 sm:py-12 max-w-6xl">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage user={user!} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard user={user!} />
                </ProtectedRoute>
              }
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <button onClick={() => navigate('/terms')} className="hover:text-primary-600 transition-colors">شروط الاستخدام</button>
            <button onClick={() => navigate('/terms')} className="hover:text-primary-600 transition-colors">سياسة الخصوصية</button>
            <button onClick={() => navigate('/terms')} className="hover:text-primary-600 transition-colors">إخلاء المسؤولية</button>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} صاد - جميع الحقوق محفوظة</p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppLayout />
      </UserProvider>
    </BrowserRouter>
  );
}