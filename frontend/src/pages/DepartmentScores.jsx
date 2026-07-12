import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart2, 
  RefreshCw, 
  Loader2, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  TrendingDown, 
  Info,
  Calendar,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell
} from 'recharts';

const DepartmentScores = () => {
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [scores, setScores] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchScores = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.get('/department-scores');
      setScores(res.data);
    } catch (e) {
      console.error("Error loading department scores:", e);
      setErrorMessage("Could not load department scores. Please make sure master records exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await api.post('/department-scores/recalculate');
      setSuccessMessage("All department ESG scores recalculated successfully!");
      fetchScores();
    } catch (e) {
      console.error("Error recalculating scores:", e);
      setErrorMessage("Error occurred during scores recalculation execution.");
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  if (loading && scores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <span className="text-xs font-semibold">Recalculating live department indices...</span>
      </div>
    );
  }

  // Calculate statistics from the score records
  const topPerformer = scores.length > 0 ? scores[0] : null;
  const lowestPerformer = scores.length > 0 ? scores[scores.length - 1] : null;
  const averageTotalScore = scores.length > 0 
    ? Math.round((scores.reduce((acc, curr) => acc + curr.total_score, 0) / scores.length) * 10) / 10
    : 0;

  // Formatting timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
            <Award className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Departmental ESG Leaderboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live scorecards and compliance rankings calculated dynamically using settings weights.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-xs font-bold text-white shadow-sm hover:shadow rounded-xl outline-none transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            <span>Recalculate Live Scores</span>
          </button>
          
          <button 
            onClick={fetchScores}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-250 border border-slate-200 dark:border-slate-700 rounded-xl outline-none transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/50 rounded-xl text-xs flex items-center space-x-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-250 dark:border-rose-900/50 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      {scores.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Top Performer */}
          <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Performing Division</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                {topPerformer ? topPerformer.department_name : 'N/A'}
              </span>
              <span className="text-xl font-black text-emerald-500">
                {topPerformer ? topPerformer.total_score : 0}
              </span>
            </div>
            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full inline-block mt-3">
              Rank #1 Leader
            </span>
          </div>

          {/* Lowest Performer */}
          <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">At Risk / Action Needed</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                {lowestPerformer ? lowestPerformer.department_name : 'N/A'}
              </span>
              <span className="text-xl font-black text-amber-500">
                {lowestPerformer ? lowestPerformer.total_score : 0}
              </span>
            </div>
            <span className="text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full inline-block mt-3">
              Requires Review
            </span>
          </div>

          {/* Average Index */}
          <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Corporate average Score</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-2xl font-black text-indigo-500">
                {averageTotalScore}
              </span>
              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">
                ESG Target: 75+
              </span>
            </div>
            <span className="text-[9px] text-slate-450 block mt-4">Calculated across {scores.length} business units</span>
          </div>
        </div>
      )}

      {scores.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Leaderboard Table (2/3 width) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Division Ranking Standings
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculated based on current month active records.</p>
              </div>
              <div className="flex items-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                <Calendar className="w-3 h-3 text-slate-450 mr-1.5" />
                <span>Month: {scores[0] ? scores[0].month : 'N/A'}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <th className="py-3 text-center w-12">Rank</th>
                    <th className="py-3">Department Name</th>
                    <th className="py-3 w-48">Score Composition (E / S / G)</th>
                    <th className="py-3 text-right">Total Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {scores.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-darkbg-950/10">
                      {/* Rank Column */}
                      <td className="py-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-extrabold ${
                          row.ranking === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          row.ranking === 2 ? 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-400' :
                          row.ranking === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400' :
                          'text-slate-400 border border-slate-100 dark:border-slate-800'
                        }`}>
                          {row.ranking}
                        </span>
                      </td>
                      
                      {/* Name Column */}
                      <td className="py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{row.department_name}</span>
                        <span className="text-[9px] text-slate-400">Updated: {formatTime(row.last_updated)}</span>
                      </td>

                      {/* Composites Column (Mini Progress Bars) */}
                      <td className="py-4 space-y-1.5">
                        {/* E Progress */}
                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                          <span className="w-4">E</span>
                          <div className="w-32 bg-slate-100 dark:bg-darkbg-950 h-1.5 rounded-full overflow-hidden mx-2">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${row.environmental_score}%` }} />
                          </div>
                          <span className="w-8 text-right font-semibold text-emerald-600 dark:text-emerald-400">{row.environmental_score}</span>
                        </div>

                        {/* S Progress */}
                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                          <span className="w-4">S</span>
                          <div className="w-32 bg-slate-100 dark:bg-darkbg-950 h-1.5 rounded-full overflow-hidden mx-2">
                            <div className="bg-pink-500 h-full rounded-full" style={{ width: `${row.social_score}%` }} />
                          </div>
                          <span className="w-8 text-right font-semibold text-pink-600 dark:text-pink-400">{row.social_score}</span>
                        </div>

                        {/* G Progress */}
                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                          <span className="w-4">G</span>
                          <div className="w-32 bg-slate-100 dark:bg-darkbg-950 h-1.5 rounded-full overflow-hidden mx-2">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${row.governance_score}%` }} />
                          </div>
                          <span className="w-8 text-right font-semibold text-indigo-650 dark:text-indigo-400">{row.governance_score}</span>
                        </div>
                      </td>

                      {/* Total Score Column */}
                      <td className="py-4 text-right font-black text-slate-900 dark:text-white text-sm">
                        {row.total_score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard Chart comparison (1/3 width) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[450px]">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <BarChart2 className="w-4 h-4 text-indigo-500 mr-2" />
                Division comparison Chart
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Visual overall ESG comparison indices.</p>
            </div>

            <div className="h-72 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <YAxis dataKey="department_name" type="category" tick={{ fontSize: 9 }} width={60} />
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                  <Bar dataKey="total_score" name="Total Score" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                    {scores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : index === scores.length - 1 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-start space-x-1.5 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-[9px] text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Weights are retrieved live from ESG settings. Recalculation scans all carbon audits, CSR approvals, governance acknowledgements, and compliance tickets.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentScores;
