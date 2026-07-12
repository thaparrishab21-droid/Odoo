import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { 
  Calculator, 
  Leaf, 
  Car, 
  Zap, 
  Plane, 
  Utensils, 
  History, 
  TrendingUp, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Calendar 
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
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';

const VEHICLE_TYPES = [
  { value: 'Petrol Car', label: 'Petrol Vehicle' },
  { value: 'Diesel Car', label: 'Diesel Vehicle' },
  { value: 'Electric Car (EV)', label: 'Electric Vehicle (EV)' },
  { value: 'Public Transit (Bus/Train)', label: 'Public Transit' }
];

const FOOD_PREFERENCES = [
  { value: 'Vegan', label: 'Vegan (Plant-based)' },
  { value: 'Vegetarian', label: 'Vegetarian' },
  { value: 'Balanced', label: 'Balanced (Mixed Diet)' },
  { value: 'Meat-heavy', label: 'Meat-heavy' }
];

const COLORS = ['#10b981', '#3b82f6', '#ec4899', '#f59e0b'];

const CarbonCalculator = () => {
  const [history, setHistory] = useState([]);
  const [trends, setTrends] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      commute_distance: 10,
      vehicle_type: 'Petrol Car',
      electricity_usage: 100,
      flight_hours: 0,
      fuel_consumption: 0,
      food_preference: 'Balanced',
      working_days: 20
    }
  });

  const fetchHistoryAndTrends = async () => {
    setHistoryLoading(true);
    try {
      const [historyRes, trendsRes] = await Promise.all([
        api.get('/carbon-calculator/history'),
        api.get('/carbon-calculator/trends')
      ]);
      setHistory(historyRes.data);
      setTrends(trendsRes.data);
    } catch (e) {
      console.warn("Failed to load calculator history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndTrends();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await api.post('/carbon-calculator/calculate', {
        commute_distance: parseFloat(data.commute_distance),
        vehicle_type: data.vehicle_type,
        electricity_usage: parseFloat(data.electricity_usage),
        flight_hours: parseFloat(data.flight_hours),
        fuel_consumption: parseFloat(data.fuel_consumption),
        food_preference: data.food_preference,
        working_days: parseInt(data.working_days, 10)
      });
      
      setCurrentResult(response.data);
      setSuccessMsg('Your carbon footprint has been calculated and logged successfully!');
      fetchHistoryAndTrends();
      reset();
    } catch (err) {
      const msg = err.response?.data?.message || 'Calculation failed. Please verify inputs.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for the pie chart
  const pieData = currentResult ? [
    { name: 'Transportation', value: currentResult.transportation_co2 },
    { name: 'Electricity', value: currentResult.electricity_co2 },
    { name: 'Food', value: currentResult.food_co2 },
    { name: 'Flights', value: currentResult.flight_co2 }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
          <Calculator className="w-6 h-6 animate-bounce" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Personal Carbon Footprint Coach</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log your daily habits and travel details. Get instant analytical breakdown and custom AI recommendations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-1 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-5 flex items-center">
            <Leaf className="w-4 h-4 text-emerald-500 mr-2" />
            Emissions Calculator
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Commute distance */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Daily Commute Distance (One Way, km)
              </label>
              <input
                type="number"
                step="any"
                {...register('commute_distance', { required: 'Required', min: 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              />
              {errors.commute_distance && <span className="text-[10px] text-rose-500">{errors.commute_distance.message}</span>}
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Primary Commute Vehicle Type
              </label>
              <select
                {...register('vehicle_type', { required: 'Required' })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              >
                {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>

            {/* Fuel Consumption */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Direct Fuel Consumed (Liters / Month)
              </label>
              <input
                type="number"
                step="any"
                {...register('fuel_consumption', { required: 'Required', min: 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              />
              {errors.fuel_consumption && <span className="text-[10px] text-rose-500">{errors.fuel_consumption.message}</span>}
            </div>

            {/* Electricity usage */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Home Electricity (kWh)
              </label>
              <input
                type="number"
                step="any"
                {...register('electricity_usage', { required: 'Required', min: 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              />
              {errors.electricity_usage && <span className="text-[10px] text-rose-500">{errors.electricity_usage.message}</span>}
            </div>

            {/* Flights */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Monthly Flight Hours
              </label>
              <input
                type="number"
                step="any"
                {...register('flight_hours', { required: 'Required', min: 0 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              />
              {errors.flight_hours && <span className="text-[10px] text-rose-500">{errors.flight_hours.message}</span>}
            </div>

            {/* Food preference */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Dietary Food Preference
              </label>
              <select
                {...register('food_preference', { required: 'Required' })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              >
                {FOOD_PREFERENCES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            {/* Working days */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                Days Commuting to Office / Month
              </label>
              <input
                type="number"
                {...register('working_days', { required: 'Required', min: 1, max: 31 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none transition-all"
              />
              {errors.working_days && <span className="text-[10px] text-rose-500">{errors.working_days.message}</span>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Compute & Log Footprint</span>
                </>
              )}
            </button>
          </form>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-2 dark:bg-rose-950/20 dark:border-rose-900/30">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-2 dark:bg-emerald-950/20 dark:border-emerald-900/30">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{successMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Result and AI Insights */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Result Card */}
          {currentResult ? (
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
              
              {/* Left text statistics */}
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Calculated Result</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{currentResult.total_co2}</span>
                    <span className="text-xs text-slate-500 font-medium">kg CO₂e / month</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Category Breakdown</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center"><Car className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Commute & Fuel</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentResult.transportation_co2} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center"><Zap className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Electricity Usage</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentResult.electricity_co2} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center"><Utensils className="w-3.5 h-3.5 mr-1.5 text-pink-500" /> Diet Food Preference</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentResult.food_co2} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center"><Plane className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Airplane Travel</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{currentResult.flight_co2} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pie Chart */}
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                    />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center text-slate-400 py-16">
              <Leaf className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No Calculation Output Active</p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Fill in your commute and utility details on the left, then click Calculate to start analyzing your impact.</p>
            </div>
          )}

          {/* AI recommendations suggestions block */}
          {currentResult?.ai_suggestions && (
            <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 premium-gradient-border rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md animate-fade-in-up">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-3.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider">AI Sustainability Coach Suggestions</h3>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 space-y-2 whitespace-pre-line">
                {currentResult.ai_suggestions}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical logs and trends section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Emissions Trend */}
        <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-96">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
              <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
              Monthly Emissions Trend
            </h3>
            <p className="text-[10px] text-slate-400">Comparative line chart tracking your logged totals month-over-month.</p>
          </div>

          <div className="h-60 mt-4">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">Zero monthly logs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="total_co2" name="Footprint (kg)" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* History Log table */}
        <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-96">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-1">
              <History className="w-4 h-4 text-pink-500 mr-2" />
              Calculation History Log
            </h3>
            <p className="text-[10px] text-slate-400">Auditable list of your past personal footprints calculations.</p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto min-h-0">
            {historyLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-1" /> Loading logs...
              </div>
            ) : history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No previous logs found.</div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Month</th>
                    <th className="py-2.5">Commute</th>
                    <th className="py-2.5 text-right">Total (CO₂)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {history.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-darkbg-950/10 cursor-pointer" onClick={() => setCurrentResult(row)}>
                      <td className="py-2.5 text-[11px] text-slate-500">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-350">{row.month}</td>
                      <td className="py-2.5 text-slate-500 text-[11px]">{row.commute_distance} km ({row.vehicle_type})</td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">{row.total_co2} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarbonCalculator;
