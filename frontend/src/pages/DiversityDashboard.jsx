import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Building2, 
  Calendar, 
  UserCheck, 
  PieChart as PieIcon, 
  BarChart2, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  Loader2,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6']; // Blue for Male, Pink for Female, Purple for Other
const AGE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1'];

const DiversityDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Filters state
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Fetch departments dropdown list
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments', { params: { per_page: 100 } });
        setDepartments(res.data.items || res.data);
      } catch (e) {
        console.warn("Error loading departments dropdown:", e);
      }
    };
    fetchDepts();
  }, []);

  // Fetch Stats data from API
  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = {
        department_id: selectedDeptId || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        gender: selectedGender || undefined
      };
      const res = await api.get('/social/diversity-stats', { params });
      setStats(res.data);
    } catch (e) {
      console.error("Error loading diversity metrics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDeptId, startDate, endDate, selectedGender]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <span className="text-xs font-semibold">Compiling corporate diversity audits...</span>
      </div>
    );
  }

  // Calculate quick KPI percentages
  const femaleRatio = stats ? stats.gender_ratio.find(g => g.gender === 'Female') : null;
  const femalePercentage = femaleRatio ? femaleRatio.percentage : 0;
  
  const diverseRatio = stats ? stats.gender_ratio.filter(g => g.gender !== 'Male') : [];
  const diverseCount = diverseRatio.reduce((acc, curr) => acc + curr.count, 0);
  const diversePercentage = stats && stats.total_count > 0 ? roundToSingle((diverseCount / stats.total_count) * 100) : 0;

  function roundToSingle(num) {
    return Math.round(num * 10) / 10;
  }

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hiring & Diversity Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Monitor equal opportunity metrics, gender balance indexes, and age distribution profiles across divisions.
            </p>
          </div>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-650 dark:text-slate-250 border border-slate-200 dark:border-slate-700 rounded-xl outline-none transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="p-4 rounded-xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-900 dark:text-white mr-2">Filters:</span>
        </div>

        {/* Dept filter */}
        <div className="flex items-center space-x-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Date Filters */}
        <div className="flex items-center space-x-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <input 
            type="date"
            placeholder="Start Joined Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="date"
            placeholder="End Joined Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
          />
        </div>

        {/* Gender filter */}
        <div className="flex items-center space-x-2">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <select 
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {stats && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Employees */}
            <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Audited Staff count</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.total_count}</span>
                <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full flex items-center">
                  Active
                </span>
              </div>
            </div>

            {/* Female Representation */}
            <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Female Representation</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{femalePercentage}%</span>
                <span className="text-[10px] text-pink-500 font-bold bg-pink-50 dark:bg-pink-950/20 px-2 py-0.5 rounded-full">
                  Target: 40%
                </span>
              </div>
            </div>

            {/* Diversity Percentage */}
            <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Underrepresented Groups</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{diversePercentage}%</span>
                <span className="text-xs text-slate-500 font-medium">({diverseCount} staff)</span>
              </div>
            </div>

            {/* Diversity Index Status */}
            <div className="p-5 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equal Opportunity index</span>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-xl font-bold text-emerald-500 flex items-center">
                  <Sparkles className="w-4 h-4 mr-1 animate-pulse" />
                  {diversePercentage >= 35 ? 'Excellent' : 'Moderate'}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/25 px-2 py-0.5 rounded-full">
                  ESG Standard
                </span>
              </div>
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Male/Female/Other Ratio (Pie Chart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-96">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
                  <PieIcon className="w-4 h-4 text-indigo-500 mr-2" />
                  Gender Distribution Ratio
                </h3>
                <p className="text-[10px] text-slate-400">Total ratio comparison of staff identity registers.</p>
              </div>

              <div className="h-60 mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.gender_ratio}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="gender"
                    >
                      {stats.gender_ratio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                      formatter={(value, name, props) => [`${value} employees (${props.payload.percentage}%)`, name]}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Age Distribution brackets (Bar Chart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-96">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
                  <BarChart2 className="w-4 h-4 text-emerald-500 mr-2" />
                  Age Distribution Brackets
                </h3>
                <p className="text-[10px] text-slate-400">Employee count divided across standardized age segments.</p>
              </div>

              <div className="h-60 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.age_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="bracket" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10 }} />
                    <Bar dataKey="count" name="Staff Count" fill="#10b981" radius={[6, 6, 0, 0]}>
                      {stats.age_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Department-wise gender distribution (Stacked Bar Chart) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-96">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
                  <Layers className="w-4 h-4 text-blue-500 mr-2" />
                  Department Gender Composition
                </h3>
                <p className="text-[10px] text-slate-400">Comparative composition mapping by business division.</p>
              </div>

              <div className="h-60 mt-4">
                {stats.department_gender.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-450 text-xs">No department data.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.department_gender} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="department" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                      <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Other" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Hiring Diversity over time (Joined Employees by gender) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-96">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
                  <TrendingUp className="w-4 h-4 text-pink-500 mr-2" />
                  Hiring Diversity Index over Time
                </h3>
                <p className="text-[10px] text-slate-400">Monthly staff additions timeline tracked by gender profiles.</p>
              </div>

              <div className="h-60 mt-4">
                {stats.hiring_diversity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-450 text-xs">Zero historical hires.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.hiring_diversity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                      <Bar dataKey="Male" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Female" fill="#ec4899" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Other" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Department Diversity Percentage Table */}
          <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
                <Briefcase className="w-4 h-4 text-indigo-500 mr-2" />
                Departmental Diversity Breakdown
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">Representation index comparing diverse staff counts across divisions.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    <th className="py-3">Department Name</th>
                    <th className="py-3 text-center">Total Staff</th>
                    <th className="py-3 text-center">Diverse Staff Count</th>
                    <th className="py-3 text-right">Representation Diversity %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {stats.department_diversity_percentage.map((row) => (
                    <tr key={row.department} className="hover:bg-slate-50/50 dark:hover:bg-darkbg-950/10">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{row.department}</td>
                      <td className="py-3 text-center text-slate-600 dark:text-slate-400">{row.total_employees}</td>
                      <td className="py-3 text-center text-slate-600 dark:text-slate-400">{row.diverse_employees}</td>
                      <td className="py-3 text-right font-extrabold text-indigo-500 dark:text-indigo-400">{row.diversity_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DiversityDashboard;
