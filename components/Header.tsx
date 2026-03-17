import React from 'react';
import { Pill, LogIn, LogOut, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onLoginClick?: () => void;
  onLogoutClick?: () => void;
  onLogoClick?: () => void;
  onDashboardClick?: () => void;
  onAdminClick?: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  showLoginBtn?: boolean;
  currentView?: 'search' | 'login' | 'dashboard' | 'admin' | 'terms';
}

export const Header: React.FC<HeaderProps> = ({ 
  onLoginClick, 
  onLogoutClick,
  onLogoClick,
  onDashboardClick,
  onAdminClick,
  isLoggedIn = false,
  isAdmin = false,
  showLoginBtn = true,
  currentView = 'search'
}) => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={onLogoClick}
        >
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors">
            <Pill size={24} />
          </div>
          <span className="text-2xl font-black text-primary-700 tracking-tight">صاد</span>
        </div>
        
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {isAdmin && currentView !== 'admin' && (
                <button 
                  onClick={onAdminClick}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors px-4 py-2 rounded-xl"
                >
                  <ShieldCheck size={18} />
                  <span>الإدارة</span>
                </button>
              )}
              {currentView === 'search' ? (
                <button 
                  onClick={onDashboardClick}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors px-4 py-2 rounded-xl"
                >
                  <LayoutDashboard size={18} />
                  <span>لوحة التحكم</span>
                </button>
              ) : (
                <button 
                  onClick={onLogoClick}
                  className="hidden sm:flex items-center gap-2 text-sm font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors px-4 py-2 rounded-xl"
                >
                  <Search size={18} />
                  <span>البحث عن دواء</span>
                </button>
              )}
              <button 
                onClick={onLogoutClick}
                className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 hover:bg-red-50 transition-all px-4 py-2 rounded-xl"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">تسجيل خروج</span>
              </button>
            </div>
          ) : (
            showLoginBtn && (
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all px-4 py-2 rounded-xl"
              >
                <LogIn size={18} />
                <span>دخول الصيدلي</span>
              </button>
            )
          )}
        </nav>
      </div>
    </header>
  );
};
