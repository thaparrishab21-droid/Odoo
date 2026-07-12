import React from 'react';
import { Settings as SettingsIcon, Info } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Settings Module</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configure organization profiles, set ESG coefficients, and update notifications preferences</p>
          </div>
        </div>
      </div>

      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-darkbg-900 shadow-sm flex flex-col items-center justify-center text-center">
        <Info className="w-8 h-8 text-slate-400/80 mb-3 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">ESG Configuration & Thresholds</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Fine-tune weights for Environmental (40%), Social (30%), and Governance (30%) calculations and toggles. Full features will be implemented in Milestone 10.
        </p>
      </div>
    </div>
  );
};

export default Settings;
