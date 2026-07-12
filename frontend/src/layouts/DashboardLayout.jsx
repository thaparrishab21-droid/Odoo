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
  Award,
  Globe,
  Calculator,
  Brain,
  Lightbulb,
  Send,
  MessageSquare,
  Bot,
  Sparkles
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

  // AI Copilot States
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '### Welcome\nHello! I am your AI ESG Copilot. Ask me anything about our emissions, department scores, compliance status, or how to improve our rankings.'
    }
  ]);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, chatOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/copilot/chat', { query: userMessage });
      setChatMessages(prev => [...prev, { sender: 'bot', text: response.data.response }]);
    } catch (error) {
      console.warn("Copilot chat query failed:", error);
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        text: "### Summary\nI apologize, but I encountered an error communicating with the ESG Copilot service.\n### Recommendations\n- Verify the backend server is running.\n- Try again in a moment."
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mt-4 mb-2 first:mt-0 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />
            {line.replace('### ', '')}
          </h4>
        );
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }
      
      const renderedLine = parts.length > 0 ? parts : line;

      if (line.trim().startsWith('- ')) {
        const bulletContent = line.trim().substring(2);
        let bulletParts = [];
        let bLastIndex = 0;
        let bMatch;
        while ((bMatch = boldRegex.exec(bulletContent)) !== null) {
          if (bMatch.index > bLastIndex) {
            bulletParts.push(bulletContent.substring(bLastIndex, bMatch.index));
          }
          bulletParts.push(<strong key={bMatch.index} className="font-extrabold text-slate-900 dark:text-white">{bMatch[1]}</strong>);
          bLastIndex = boldRegex.lastIndex;
        }
        if (bLastIndex < bulletContent.length) {
          bulletParts.push(bulletContent.substring(bLastIndex));
        }
        const finalBullet = bulletParts.length > 0 ? bulletParts : bulletContent;

        return (
          <li key={idx} className="list-disc list-inside text-xs ml-2 py-0.5 text-slate-650 dark:text-slate-350">
            {finalBullet}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mb-1">
          {renderedLine}
        </p>
      );
    });
  };

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
    { name: 'Carbon Calculator', path: '/carbon-calculator', icon: Calculator },
    { name: 'Predictive Analytics', path: '/predictions', icon: Brain },
    { name: 'Green Ideas', path: '/ideas', icon: Lightbulb },
    { name: 'Diversity Metrics', path: '/diversity', icon: Users },
    { name: 'Department Scores', path: '/department-scores', icon: Award },
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

      {/* Floating AI ESG Copilot Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-500/20 animate-pulse-glow active:scale-95 transition-all focus:outline-none"
        title="AI ESG Copilot"
      >
        {chatOpen ? <X className="w-6 h-6 animate-spin-once" /> : <Bot className="w-6 h-6 animate-pulse" />}
      </button>

      {/* Chat Popup Drawer */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[480px] max-h-[80vh] bg-white/95 dark:bg-darkbg-900/95 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden animate-fade-in-up backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-darkbg-950/10">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-800 dark:text-white">AI ESG Copilot</span>
                <span className="block text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Enterprise Assistant</span>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' ? (
                  <div className="flex items-start space-x-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-50 dark:bg-darkbg-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl rounded-tl-none p-3 shadow-xs">
                      {renderMarkdown(msg.text)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500 text-white rounded-2xl rounded-tr-none px-3.5 py-2.5 max-w-[85%] text-xs shadow-sm font-medium">
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator bubble */}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-slate-50 dark:bg-darkbg-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-1 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input */}
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center space-x-2 p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-950/20"
          >
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot (e.g. Which department has highest emissions?)..."
              disabled={chatLoading}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all placeholder:text-[10px]"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-500/25 transition-all shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default DashboardLayout;
