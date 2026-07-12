import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Leaf, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Calendar,
  AlertTriangle,
  Loader2,
  TrendingDown,
  Percent,
  TrendingUp,
  X,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend
} from 'recharts';

const CHART_COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

const Environmental = () => {
  const { user } = useAuth();
  
  // Dashboard statistics state
  const [stats, setStats] = useState({
    total_emissions: 0,
    by_department: [],
    by_category: [],
    monthly_trend: [],
    goals: []
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Transactions logs state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Cache options for filters & modal select dropdowns
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Fetch Dashboard aggregate statistics
  const fetchDashboardStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/environmental-dashboard');
      setStats(res.data);
    } catch (err) {
      console.error("Error loading environmental stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Transactions Logs
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await api.get('/carbon-transactions', {
        params: {
          page: page,
          per_page: 5,
          search: search,
          department_id: filterDept || undefined,
          category_id: filterCat || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined
        }
      });
      setTransactions(res.data.items);
      setTotalPages(res.data.pages);
      setTotalTransactions(res.data.total);
    } catch (err) {
      console.error("Error loading transactions:", err);
    } finally {
      setTxLoading(false);
    }
  }, [page, search, filterDept, filterCat, startDate, endDate]);

  // Load selection helpers
  const fetchSelectionData = async () => {
    try {
      const deptsRes = await api.get('/departments', { params: { per_page: 100 } });
      const catsRes = await api.get('/categories', { params: { per_page: 100 } });
      const factorsRes = await api.get('/emission-factors', { params: { per_page: 100 } });
      
      setDepartments(deptsRes.data.items);
      setCategories(catsRes.data.items);
      setEmissionFactors(factorsRes.data.items);
    } catch (err) {
      console.warn("Dropdown items loading error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchSelectionData();
  }, [fetchDashboardStats]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterReset = () => {
    setSearch('');
    setFilterDept('');
    setFilterCat('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // CRUD Modals Trigger helpers
  const openAddModal = () => {
    setSelectedTx(null);
    setFormErrors({});
    setApiError('');
    setFormValues({
      date: new Date().toISOString().split('T')[0],
      activity_name: '',
      quantity: '',
      category_id: '',
      emission_factor_id: '',
      department_id: user?.department_id || ''
    });
    setModalOpen(true);
  };

  const openEditModal = (tx) => {
    setSelectedTx(tx);
    setFormErrors({});
    setApiError('');
    setFormValues({
      date: tx.date,
      activity_name: tx.activity_name,
      quantity: tx.quantity,
      category_id: tx.category_id,
      emission_factor_id: tx.emission_factor_id,
      department_id: tx.department_id
    });
    setModalOpen(true);
  };

  const openDeleteModal = (tx) => {
    setSelectedTx(tx);
    setApiError('');
    setDeleteModalOpen(true);
  };

  // Handles transaction submit
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setApiError('');

    try {
      if (selectedTx) {
        await api.put(`/carbon-transactions/${selectedTx.id}`, formValues);
      } else {
        await api.post('/carbon-transactions', formValues);
      }
      setModalOpen(false);
      fetchDashboardStats();
      fetchTransactions();
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.errors) {
        setFormErrors(err.response.data.errors);
      } else {
        setApiError(err.response?.data?.message || "Error saving transaction.");
      }
    }
  };

  const handleDeleteTransaction = async () => {
    try {
      await api.delete(`/carbon-transactions/${selectedTx.id}`);
      setDeleteModalOpen(false);
      setPage(1);
      fetchDashboardStats();
      fetchTransactions();
    } catch (err) {
      setApiError(err.response?.data?.message || "Deletion failed.");
    }
  };

  // Filtered factors for dropdown binding
  const filteredFactors = emissionFactors.filter(
    ef => ef.category_id === Number(formValues.category_id)
  );

  // Selected factor details (to show coefficient units)
  const selectedFactorObj = emissionFactors.find(
    ef => ef.id === Number(formValues.emission_factor_id)
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Environmental Footprint Tracking</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record carbon transactions, monitor scope emissions coefficients, and track corporate sustainability goals.
            </p>
          </div>
        </div>
        <button 
          onClick={openAddModal}
          className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:translate-y-px transition-all flex items-center shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Carbon Transaction
        </button>
      </div>

      {/* Overview Cards Row */}
      {statsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200/50 dark:border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Carbon Footprint</span>
              <span className="block text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {stats.total_emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">kg CO2e generated</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
              <TrendingDown className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental Goals</span>
              <span className="block text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {stats.goals.length} Active
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Category targets matching</span>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-500">
              <Target className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goal Achievement Rate</span>
              <span className="block text-2xl font-bold mt-1 text-slate-900 dark:text-white">
                {stats.goals.length > 0 
                  ? Math.round((stats.goals.filter(g => g.current_value >= g.target_value).length / stats.goals.length) * 100) 
                  : 0}%
              </span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Carbon reduction targets met</span>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
              <Percent className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts & Goals grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (Left) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Carbon Footprint Trend</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Monthly emission breakdown over time.</p>
          </div>
          <div className="h-64">
            {statsLoading ? (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" />
                <span className="text-xs">Generating trends...</span>
              </div>
            ) : stats.monthly_trend.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
                <TrendingUp className="w-6 h-6 mb-1 text-slate-300" />
                <span className="text-[10px]">No historical data found.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEmissions)" name="kg CO2e" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Goals Progress Card (Right) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active ESG Goal Targets</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Sustainability targets progress bars.</p>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-64 pr-1">
            {statsLoading ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs">Syncing goals...</span>
              </div>
            ) : stats.goals.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-100 rounded-xl text-center text-slate-400 text-xs">
                No goals currently registered in Settings.
              </div>
            ) : (
              stats.goals.map((g) => {
                const ratio = Math.min((g.current_value / g.target_value) * 100, 100);
                const achieved = g.current_value >= g.target_value;
                return (
                  <div key={g.id} className="space-y-1.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${achieved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20'}`}>
                        {Math.round(ratio)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${achieved ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                      <span>{g.current_value.toLocaleString()} {g.unit}</span>
                      <span>Target: {g.target_value.toLocaleString()} {g.unit}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pie Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emissions by ESG Category</h3>
          <div className="h-56 flex items-center justify-center">
            {statsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            ) : stats.by_category.length === 0 ? (
              <span className="text-xs text-slate-400">No categories statistics.</span>
            ) : (
              <div className="flex w-full items-center justify-around">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.by_category}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="emissions"
                        nameKey="category_name"
                      >
                        {stats.by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col space-y-2 text-[10px] pl-4">
                  {stats.by_category.map((item, index) => (
                    <div key={item.category_name} className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-xs">{item.category_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Breakdown */}
        <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Department Footprint Comparison</h3>
          <div className="h-56">
            {statsLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : stats.by_department.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No department statistics.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_department} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="department_name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                  <Bar dataKey="emissions" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="kg CO2e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Search Filters and Transaction Log Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Title */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Carbon Activity Logs</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Database search panel for ESG reporting.</p>
        </div>

        {/* Filter controls row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Search activity name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <select
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <select
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              className="w-full px-3.5 py-1.5 text-[10px] rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
            <span className="text-slate-400 text-xs">-</span>
            <input 
              type="date" 
              className="w-full px-3.5 py-1.5 text-[10px] rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-all"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>

          <button 
            onClick={handleFilterReset}
            className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-500 font-semibold text-xs rounded-xl transition-all dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-400"
          >
            Reset Filters
          </button>
        </div>

        {/* Results grid */}
        <div className="overflow-x-auto min-h-60 pt-2">
          {txLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mb-2" />
              <span className="text-xs">Fetching carbon logs...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <Info className="w-7 h-7 mb-2 text-slate-300" />
              <span className="text-xs font-semibold">No carbon logs logged</span>
              <span className="text-[10px] mt-0.5 text-slate-400">Record a new transaction using the log button.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Activity Name</th>
                  <th className="py-2.5 px-3">Scope / Factor</th>
                  <th className="py-2.5 px-3">Scope Group</th>
                  <th className="py-2.5 px-3">Footprint</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-3 px-3 text-slate-500 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{tx.date}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{tx.activity_name}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.category_name}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{tx.emission_factor_name} ({tx.quantity.toLocaleString()})</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{tx.department_name}</td>
                    <td className="py-3 px-3 font-bold text-rose-500">
                      {tx.calculated_emissions.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO2e
                    </td>
                    <td className="py-3 px-3 text-right space-x-1">
                      <button 
                        onClick={() => openEditModal(tx)}
                        title="Edit Log"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all inline-block"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(tx)}
                        title="Delete Log"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all inline-block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">Total: {totalTransactions} logs</span>
            <div className="flex items-center space-x-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold">{page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: ADD / EDIT DIALOG */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                {selectedTx ? 'Edit' : 'Record'} Carbon Transaction
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {apiError && (
                  <div className="flex items-center space-x-2.5 p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Mapped</label>
                    <input 
                      type="date" 
                      required
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                      value={formValues.date || ''}
                      onChange={(e) => setFormValues({...formValues, date: e.target.value})}
                    />
                    {formErrors.date && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.date}</span>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Name / Desc</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Q3 Electricity bill"
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                      value={formValues.activity_name || ''}
                      onChange={(e) => setFormValues({...formValues, activity_name: e.target.value})}
                    />
                    {formErrors.activity_name && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.activity_name}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scope Category</label>
                    <select 
                      required
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                      value={formValues.category_id || ''}
                      onChange={(e) => setFormValues({
                        ...formValues, 
                        category_id: e.target.value,
                        emission_factor_id: '' // reset factor on category change
                      })}
                    >
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {formErrors.category_id && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.category_id}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emission Factor Coefficient</label>
                    <select 
                      required
                      disabled={!formValues.category_id}
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                      value={formValues.emission_factor_id || ''}
                      onChange={(e) => setFormValues({...formValues, emission_factor_id: e.target.value})}
                    >
                      <option value="">Select Factor...</option>
                      {filteredFactors.map(ef => (
                        <option key={ef.id} value={ef.id}>{ef.name} ({ef.factor})</option>
                      ))}
                    </select>
                    {formErrors.emission_factor_id && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.emission_factor_id}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Quantity Consumed {selectedFactorObj ? `(${selectedFactorObj.unit})` : ''}
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                      value={formValues.quantity || ''}
                      onChange={(e) => setFormValues({...formValues, quantity: parseFloat(e.target.value)})}
                    />
                    {formErrors.quantity && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.quantity}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsible Department</label>
                    <select 
                      required
                      className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                      value={formValues.department_id || ''}
                      onChange={(e) => setFormValues({...formValues, department_id: parseInt(e.target.value)})}
                    >
                      <option value="">Select Department...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {formErrors.department_id && <span className="text-[10px] text-rose-500 font-bold block mt-1">{formErrors.department_id}</span>}
                  </div>
                </div>

              </div>

              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-darkbg-950/20 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/10 active:translate-y-px transition-all"
                >
                  Save Log
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE DIALOG */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 text-center space-y-4">
            
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Transaction Log</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently delete this footprint log record?
              </p>
            </div>

            {apiError && (
              <div className="flex items-center space-x-2.5 p-3 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button 
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleDeleteTransaction}
                className="py-1.5 px-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/10 active:translate-y-px transition-all"
              >
                Confirm Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Environmental;
