import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  LayoutDashboard,
  Leaf,
  Users,
  ShieldCheck,
  Trophy,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  Globe
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.warn("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.warn("Mark read error:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => api.post(`/notifications/${n.id}/read`)));
      fetchNotifications();
    } catch (error) {
      console.warn("Mark all read error:", error);
    }
  };

  // Sync theme with body class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Environmental', path: '/environmental', icon: Leaf },
    { name: 'Social', path: '/social', icon: Users },
    { name: 'Governance', path: '/governance', icon: ShieldCheck },
    { name: 'Gamification', path: '/gamification', icon: Trophy },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 dark:bg-darkbg-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-200 
        dark:bg-darkbg-900 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">EcoSphere</span>
              <span className="block text-[10px] uppercase tracking-wider text-emerald-500 font-bold">ESG SaaS</span>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 group
                  ${isActive 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer (User Info & Logout) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-darkbg-950/20">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => navigate('/profile')}
            >
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <span className="block text-sm font-semibold truncate group-hover:text-emerald-500 transition-colors">
                  {user?.name || 'Guest User'}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.role || 'Guest'} ({user?.department || 'N/A'})
                </span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Page Layout Wrapper */}
      <div className="flex flex-col flex-1 min-h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 dark:bg-darkbg-900 dark:border-slate-800/80 shrink-0">
          
          {/* Left: Mobile hamburger menu & Page Name */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-slate-400 text-xs">
              <span className="font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-900/30">
                Org ESG Score: 78.4 (B+)
              </span>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="relative w-full max-w-md mx-4 hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Global Search (ESG data, policies, employees)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 border-0 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:text-slate-100 dark:focus:bg-darkbg-950 transition-all outline-none"
            />
          </div>

          {/* Right: Actions (Theme, Notifications, Profile) */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Menu Toggle */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors ${notificationsOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-darkbg-900" />
                )}
              </button>
              
              {/* Notifications Dropdown Panel */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-2 z-20 w-80 bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden py-1">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">Notifications</span>
                      <button onClick={handleMarkAllRead} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline">Mark all read</button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
                          Zero notifications logs.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleMarkAsRead(notif.id)}
                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-emerald-500/5 font-semibold'}`}
                          >
                            <span className="block text-xs text-slate-800 dark:text-slate-100">{notif.title}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{notif.description}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 text-center border-t border-slate-100 dark:border-slate-800">
                      <button className="text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-500" onClick={() => { setNotificationsOpen(false); navigate('/settings'); }}>
                        View settings
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-darkbg-950/40">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
