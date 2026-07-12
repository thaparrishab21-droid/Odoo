import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Leaf, 
  Users, 
  ShieldCheck, 
  Trophy, 
  Award, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Admin';

  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [chartRes, summaryRes] = await Promise.all([
          api.get('/reports/esg-history'),
          api.get('/reports/esg-summary')
        ]);
        setChartData(chartRes.data);
        setSummaryData(summaryRes.data);
      } catch (error) {
        console.error("Dashboard stats fetching error:", error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { 
      title: 'Carbon Footprint', 
      value: summaryData ? `${summaryData.environmental.total_emissions} kg` : '0 kg', 
      change: 'Calculated Footprint', 
      icon: Leaf, 
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
    },
    { 
      title: 'CSR Register Count', 
      value: summaryData ? `${summaryData.social.total_participations} Events` : '0 Events', 
      change: `${summaryData?.social?.approved_participations || 0} Approved`, 
      icon: Users, 
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30' 
    },
    { 
      title: 'Policies Signed', 
      value: summaryData ? `${summaryData.governance.policy_acknowledgements_count} Signed` : '0 Signed', 
      change: 'Guideline Compliant', 
      icon: ShieldCheck, 
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' 
    },
    { 
      title: 'Your Level XP', 
      value: user ? `${user.xp} XP` : '0 XP', 
      change: `Eco Points: ${user?.points || 0}`, 
      icon: Trophy, 
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.name || 'User'}!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are signed in as <span className="font-semibold text-emerald-500">{user?.role}</span> in the <span className="font-semibold">{user?.department}</span> department.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-medium">
              Last Login: Today
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{stat.title}</span>
                <span className="block text-xl font-extrabold text-slate-950 dark:text-white mt-1">{stat.value}</span>
                <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                  {stat.change}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Columns split by role view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analytics Chart Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly ESG Scoring Performance</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Aggregated organizational ESG indicators</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">Realtime</span>
          </div>
          
          {/* Chart Display Area */}
          <div className="h-64 mt-6">
            {chartLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs">Loading analytics graphs...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                No historical department scorecards logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.98)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '10px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="overall" name="Overall Index" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOverall)" />
                  <Area type="monotone" dataKey="environmental" name="Environmental (E)" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorEnv)" />
                  <Area type="monotone" dataKey="social" name="Social (S)" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={0} />
                  <Area type="monotone" dataKey="governance" name="Governance (G)" stroke="#6366f1" strokeWidth={1.5} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column: Actions / Gamification Progress Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'System Tasks Checklist' : 'Your Challenge Goals'}
              </h3>
              <Award className="w-5 h-5 text-amber-500" />
            </div>

            <div className="mt-4 space-y-3.5">
              {isAdmin ? (
                <>
                  <div className="flex items-start space-x-3 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Initialize Backend Schema</span>
                      <span className="text-[10px] text-slate-500">Seed SQLite tables with enterprise test fixtures.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-800 dark:text-slate-200">Role Verification Setup</span>
                      <span className="text-[10px] text-slate-500">Finalize token permission checks inside middleware.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs">
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-600 dark:text-slate-400 font-bold">Configure ESG Weights</span>
                      <span className="text-[10px] text-slate-500">Modify ESG calculations in Settings (40-30-30).</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-3 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Policy Acknowledgement</span>
                      <span className="text-[10px] text-slate-500">Acknowledge current "Zero Carbon Office Policy".</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs">
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Complete ESG CSR activity</span>
                      <span className="text-[10px] text-slate-500">Join the "Community Solar Cleanup" this Saturday.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-xs">
                    <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block text-slate-400">Redeem Points</span>
                      <span className="text-[10px] text-slate-500">Use 500 green points to get Eco mug reward.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => navigate(isAdmin ? '/settings' : '/gamification')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold rounded-xl transition-all text-slate-900 dark:text-white"
            >
              {isAdmin ? 'Manage Platform Systems' : 'Go to Gamification'}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
