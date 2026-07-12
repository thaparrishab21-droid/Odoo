import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine where to redirect after successful login
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Quick validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950 via-slate-900 to-slate-950 px-4">
      
      {/* Background decoration blur bubbles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3.5 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 mb-4 animate-bounce">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white text-center">Welcome to EcoSphere</h2>
          <p className="text-xs text-slate-400 mt-1.5 text-center">ESG Management & Compliance Platform</p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-center space-x-2.5 p-3.5 mb-6 text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@ecosphere.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs text-white rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs text-white rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:translate-y-px transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Access EcoSphere</span>
              )}
            </button>
          </div>
        </form>

        {/* Demo Helper Info Box */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <span className="block text-[10px] text-center text-slate-500 uppercase tracking-widest font-semibold mb-3">
            Demo Credentials
          </span>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <span className="block font-bold text-slate-300">Admin Account</span>
              <span className="block text-slate-500 mt-0.5 truncate">admin@ecosphere.com</span>
              <span className="block text-slate-500">pass: admin123</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50">
              <span className="block font-bold text-slate-300">Employee Account</span>
              <span className="block text-slate-500 mt-0.5 truncate">employee@ecosphere.com</span>
              <span className="block text-slate-500">pass: employee123</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
