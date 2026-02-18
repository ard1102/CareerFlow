import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import CompaniesPage from './pages/CompaniesPage';
import ContactsPage from './pages/ContactsPage';
import KnowledgePage from './pages/KnowledgePage';
import TodosPage from './pages/TodosPage';
import PromptsPage from './pages/PromptsPage';
import JobToolsPage from './pages/JobToolsPage';
import JobPortalsPage from './pages/JobPortalsPage';
import TargetsPage from './pages/TargetsPage';
import RemindersPage from './pages/RemindersPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import AIChatDrawer from './components/AIChatDrawer';
import { Briefcase, LayoutDashboard, Settings, LogOut, MessageCircle, Building2, Users, BookOpen, CheckSquare, FileText, Wand2, User, Globe, Target, Bell, FileDown } from 'lucide-react';
import { Button } from './components/ui/button';
import './App.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Tools', path: '/tools', icon: Wand2 },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Contacts', path: '/contacts', icon: Users },
    { name: 'Portals', path: '/portals', icon: Globe },
    { name: 'Knowledge', path: '/knowledge', icon: BookOpen },
    { name: 'To-Do', path: '/todos', icon: CheckSquare },
    { name: 'Prompts', path: '/prompts', icon: FileText },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col p-6 z-10">
        <div className="mb-8">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-xl group-hover:shadow-orange-500/30 transition-all">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-heading bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              CareerFlow
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.name.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          <button
            data-testid="nav-ai-chat"
            onClick={() => setChatOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5" />
            AI Chat
          </button>
        </nav>

        <div className="border-t border-slate-200 pt-4">
          <div className="px-4 py-3 mb-2 rounded-xl bg-slate-50">
            <div className="text-sm font-medium text-slate-900">{user?.name}</div>
            <div className="text-xs text-slate-600">{user?.email}</div>
          </div>
          <button
            data-testid="logout-button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      <AIChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Sidebar />
      <div className="ml-64">{children}</div>
    </>
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/tools" element={<ProtectedRoute><JobToolsPage /></ProtectedRoute>} />
      <Route path="/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><ContactsPage /></ProtectedRoute>} />
      <Route path="/portals" element={<ProtectedRoute><JobPortalsPage /></ProtectedRoute>} />
      <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
      <Route path="/prompts" element={<ProtectedRoute><PromptsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/auth"} replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
