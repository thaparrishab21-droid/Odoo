import React from 'react';
import { Trophy, Info } from 'lucide-react';

const Gamification = () => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Gamification Module</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Participate in ESG challenges, earn XP/points, and unlock system badges</p>
          </div>
        </div>
      </div>

      <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-darkbg-900 shadow-sm flex flex-col items-center justify-center text-center">
        <Info className="w-8 h-8 text-amber-500/80 mb-3 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eco Rewards & Team Leaderboards</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Compete on department leaderboards, complete tasks, unlock rewards, and track badges. Full functionality will be implemented in Milestone 8.
        </p>
      </div>
    </div>
  );
};

export default Gamification;
