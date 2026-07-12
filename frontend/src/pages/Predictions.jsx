import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Brain, 
  Percent, 
  Leaf, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

const Predictions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('score'); // 'score', 'emissions', 'csr', 'gov'

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      try {
        const response = await api.get('/predictions/esg');
        setData(response.data);
      } catch (e) {
        console.error("Failed to load predictions data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <span className="text-xs font-semibold">Running predictive models...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 py-16">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3 mx-auto" />
        <p className="text-xs font-semibold">Failed to load predictions</p>
        <p className="text-[10px] text-slate-400 mt-1">Please try again later or verify the backend is active.</p>
      </div>
    );
  }

  const { score_prediction, emissions_prediction, csr_prediction, governance_prediction } = data;

  // Prepare chart data for Recharts
  const prepareChartData = (predData, valName) => {
    const history = predData.history || [];
    const months = predData.months || [];
    const predictedVal = predData.predicted;
    
    // Build combined history + forecast array
    const chartData = history.map((val, idx) => ({
      name: months[idx] || `Month ${idx + 1}`,
      [valName]: val,
      type: 'Actual'
    }));

    // Add forecast point
    const lastMonth = months[months.length - 1];
    let nextMonthLabel = 'Next Month';
    if (lastMonth && lastMonth.includes('-')) {
      const [year, month] = lastMonth.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      nextMonthLabel = `${nextYear}-${nextMonth < 10 ? '0' + nextMonth : nextMonth}`;
    }
    
    chartData.push({
      name: nextMonthLabel,
      [valName]: predictedVal,
      type: 'Forecast'
    });

    return chartData;
  };

  const getTrendBadge = (trend) => {
    switch (trend) {
      case 'Improving':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 flex items-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Improving</span>
          </span>
        );
      case 'Declining':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-250 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 flex items-center space-x-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Declining</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center space-x-1">
            <Minus className="w-3.5 h-3.5" />
            <span>Stable</span>
          </span>
        );
    }
  };

  // Get active configurations based on selected tab
  const getTabConfig = () => {
    switch (activeTab) {
      case 'emissions':
        return {
          title: 'Emissions Trend Forecast',
          desc: 'Monthly carbon footprint (kg CO2e) projection based on historical energy, fuel, and utility draws.',
          data: prepareChartData(emissions_prediction, 'emissions'),
          dataKey: 'emissions',
          stroke: '#ef4444',
          unit: 'kg CO2e'
        };
      case 'csr':
        return {
          title: 'CSR Participation Forecast',
          desc: 'Projected monthly employee volunteering count based on seasonal CSR rosters and completed proof registries.',
          data: prepareChartData(csr_prediction, 'registrations'),
          dataKey: 'registrations',
          stroke: '#3b82f6',
          unit: 'people'
        };
      case 'gov':
        return {
          title: 'Governance Compliance Rate Forecast',
          desc: 'Projected audit resolution rate based on historic policy acknowledgement sign-offs and compliance tickets close-out rates.',
          data: prepareChartData(governance_prediction, 'compliance_rate'),
          dataKey: 'compliance_rate',
          stroke: '#6366f1',
          unit: '%'
        };
      default: // 'score'
        return {
          title: 'ESG Score Forecast',
          desc: 'Aggregated next-month ESG index rating across Environmental, Social, and Governance divisions.',
          data: prepareChartData(score_prediction, 'score'),
          dataKey: 'score',
          stroke: '#10b981',
          unit: '%'
        };
    }
  };

  const config = getTabConfig();

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESG Predictive Analytics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Machine learning forecasts for next month's score, carbon emissions, and social registers based on linear regression.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Score Card */}
        <div 
          onClick={() => setActiveTab('score')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${activeTab === 'score' ? 'bg-white dark:bg-darkbg-900 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white dark:bg-darkbg-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            {getTrendBadge(score_prediction.trend)}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Predicted ESG Score</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5">{score_prediction.predicted}%</span>
            <div className="flex items-center text-[10px] text-slate-500 mt-2">
              <span className="font-semibold text-emerald-500 mr-1">{score_prediction.confidence * 100}%</span> Confidence rating
            </div>
          </div>
        </div>

        {/* Emissions Card */}
        <div 
          onClick={() => setActiveTab('emissions')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${activeTab === 'emissions' ? 'bg-white dark:bg-darkbg-900 border-rose-500 ring-2 ring-rose-500/20' : 'bg-white dark:bg-darkbg-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-xl">
              <Leaf className="w-5 h-5" />
            </div>
            {getTrendBadge(emissions_prediction.trend === 'Declining' ? 'Improving' : 'Declining')}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emissions Forecast</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5">{emissions_prediction.predicted} kg</span>
            <div className="flex items-center text-[10px] text-slate-500 mt-2">
              <span className="font-semibold text-rose-500 mr-1">{emissions_prediction.confidence * 100}%</span> Confidence rating
            </div>
          </div>
        </div>

        {/* CSR Card */}
        <div 
          onClick={() => setActiveTab('csr')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${activeTab === 'csr' ? 'bg-white dark:bg-darkbg-900 border-blue-500 ring-2 ring-blue-500/20' : 'bg-white dark:bg-darkbg-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            {getTrendBadge(csr_prediction.trend)}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CSR Vol. Forecast</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5">{csr_prediction.predicted} registers</span>
            <div className="flex items-center text-[10px] text-slate-500 mt-2">
              <span className="font-semibold text-blue-500 mr-1">{csr_prediction.confidence * 100}%</span> Confidence rating
            </div>
          </div>
        </div>

        {/* Governance Card */}
        <div 
          onClick={() => setActiveTab('gov')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${activeTab === 'gov' ? 'bg-white dark:bg-darkbg-900 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white dark:bg-darkbg-900 border-slate-200 dark:border-slate-800 hover:border-slate-350'}`}
        >
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {getTrendBadge(governance_prediction.trend)}
          </div>
          <div className="mt-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Governance Forecast</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-0.5">{governance_prediction.predicted}%</span>
            <div className="flex items-center text-[10px] text-slate-500 mt-2">
              <span className="font-semibold text-indigo-500 mr-1">{governance_prediction.confidence * 100}%</span> Confidence rating
            </div>
          </div>
        </div>
      </div>

      {/* Main Prediction Graph */}
      <div className="bg-white dark:bg-darkbg-900 premium-gradient-border rounded-2xl p-6 shadow-xl">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">{config.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{config.desc}</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={config.data} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit={` ${config.unit}`} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }}
                formatter={(value, name, props) => [`${value} ${config.unit}`, props.payload.type]}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line 
                type="monotone" 
                dataKey={config.dataKey} 
                name="Historical Actual" 
                stroke={config.stroke} 
                strokeWidth={3} 
                dot={{ stroke: config.stroke, strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analytical Insights from model */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl p-6 shadow-sm flex items-start space-x-4">
        <Brain className="w-8 h-8 text-indigo-500 shrink-0 animate-pulse" />
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Predictive Engine Insights</h4>
          <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350">
            {activeTab === 'score' && `The linear regression indicates that our overall ESG rating is projected to hit ${score_prediction.predicted}% next month, showing an ${score_prediction.trend.toLowerCase()} trend. Continuing active governance checklists will solidify this forecast.`}
            {activeTab === 'emissions' && `Emissions are forecasted to reach ${emissions_prediction.predicted} kg. The model projects emissions are ${emissions_prediction.trend.toLowerCase()}. Carbon reductions in Operations boilers should remain a priority to outpace this baseline.`}
            {activeTab === 'csr' && `CSR volunteering represents stable engagement with a forecast of ${csr_prediction.predicted} approved registries next month. Expanding green challenges on the dashboard can push this trend higher.`}
            {activeTab === 'gov' && `Governance audits close-out rate is predicted to reach ${governance_prediction.predicted}%. Resolving open high-severity issues before their due date will boost next month's score beyond the trend line.`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
