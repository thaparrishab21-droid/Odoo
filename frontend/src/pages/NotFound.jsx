import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 mb-6">
        <AlertCircle className="w-12 h-12 animate-pulse" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        The ESG module or resource you are looking for does not exist or is currently restricted.
      </p>
      <Link 
        to="/" 
        className="mt-8 flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:translate-y-px transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to ESG Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
