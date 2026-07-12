import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Award, Calendar } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Profile Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <User className="w-10 h-10" />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-xl font-extrabold text-slate-950 dark:text-white">{user?.name || 'EcoSphere User'}</h1>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              {user?.role || 'Guest'}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active EcoSphere user node
            </p>
          </div>
        </div>
      </div>

      {/* Account Info Details Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          User Account Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-3 text-xs">
            <Mail className="w-4 h-4 text-slate-400" />
            <div>
              <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Email Address</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{user?.email || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Building className="w-4 h-4 text-slate-400" />
            <div>
              <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Department</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{user?.department || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Shield className="w-4 h-4 text-slate-400" />
            <div>
              <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Platform Role</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{user?.role || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Member Since</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">July 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accomplishments Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eco Achievements Summary</h3>
          <Award className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="p-3 bg-slate-50 dark:bg-darkbg-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <span className="block text-lg font-extrabold text-emerald-500">12</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Tasks Approved</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-darkbg-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <span className="block text-lg font-extrabold text-sky-500">3</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Badges Owned</span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-darkbg-950/40 rounded-xl border border-slate-100 dark:border-slate-800/40">
            <span className="block text-lg font-extrabold text-amber-500">450</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Green Points</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Profile;
