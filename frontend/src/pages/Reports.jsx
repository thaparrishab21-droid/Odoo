import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  Download, 
  Filter, 
  Loader2, 
  Leaf, 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const Reports = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(null);

  // Fetch departments list
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments', { params: { per_page: 100 } });
        setDepartments(res.data.items || res.data);
      } catch (e) {
        console.warn("Failed to load departments in reports page:", e);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch ESG summary metrics
  const fetchESGSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/esg-summary', {
        params: { department_id: selectedDeptId || undefined }
      });
      setSummaryData(res.data);
    } catch (e) {
      console.error("ESG Summary metrics fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchESGSummary();
  }, [selectedDeptId]);

  // Authenticated CSV downloader
  const handleDownloadReport = async (type) => {
    setDownloadLoading(type);
    try {
      const response = await api.get('/reports/export-csv', {
        params: { type, department_id: selectedDeptId || undefined },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecosphere_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error("CSV export trigger failed:", e);
    } finally {
      setDownloadLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESG Document Center</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compile department carbon footprints, volunteer registers, and audit details to download spreadsheets.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <Building2 className="w-4 h-4 text-slate-400" />
          <select 
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="px-3.5 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <span className="text-xs">Compiling ESG scorecards data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Executive Stats Summary Widget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall ESG Average</span>
                <span className="block text-xl font-extrabold text-blue-600 dark:text-blue-400">{summaryData?.averages?.overall_score}%</span>
              </div>
              <TrendingUp className="w-7 h-7 text-blue-500" />
            </div>

            <div className="p-5 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Environmental (E)</span>
                <span className="block text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{summaryData?.averages?.environmental_score}%</span>
              </div>
              <Leaf className="w-7 h-7 text-emerald-500" />
            </div>

            <div className="p-5 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Social Score (S)</span>
                <span className="block text-xl font-extrabold text-sky-600 dark:text-sky-400">{summaryData?.averages?.social_score}%</span>
              </div>
              <Users className="w-7 h-7 text-sky-500" />
            </div>

            <div className="p-5 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Governance Score (G)</span>
                <span className="block text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{summaryData?.averages?.governance_score}%</span>
              </div>
              <ShieldCheck className="w-7 h-7 text-indigo-500" />
            </div>

          </div>

          {/* Module Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Environmental breakdown */}
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <Leaf className="w-4 h-4 mr-2 text-emerald-500" />
                Environmental Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-500">
                  <span>Carbon Footprint</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{summaryData?.environmental?.total_emissions} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-400 text-[11px]">
                  <span>Scope 1 (Direct)</span>
                  <span>{summaryData?.environmental?.scope1} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-400 text-[11px]">
                  <span>Scope 2 (Energy)</span>
                  <span>{summaryData?.environmental?.scope2} kg</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-400 text-[11px]">
                  <span>Scope 3 (Other)</span>
                  <span>{summaryData?.environmental?.scope3} kg</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Transactions Logged</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{summaryData?.environmental?.transactions_count} logs</span>
                </div>
              </div>
            </div>

            {/* Social summary */}
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <Users className="w-4 h-4 mr-2 text-sky-500" />
                Social Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-500">
                  <span>Total Registers</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{summaryData?.social?.total_participations} times</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-500">
                  <span>Approved Event Proofs</span>
                  <span className="font-semibold text-emerald-500">{summaryData?.social?.approved_participations} approvals</span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Pending Validation</span>
                  <span className="font-semibold text-amber-500">{summaryData?.social?.pending_participations} pending</span>
                </div>
              </div>
            </div>

            {/* Governance summary */}
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />
                Governance Summary
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-500">
                  <span>Signed Policies</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{summaryData?.governance?.policy_acknowledgements_count} logs</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/80 text-slate-500">
                  <span>Compliance Resolve Rate</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {summaryData?.governance?.total_issues 
                      ? Math.round((summaryData.governance.resolved_issues / summaryData.governance.total_issues) * 100)
                      : 100}%
                  </span>
                </div>
                <div className="flex justify-between py-1.5 text-slate-500">
                  <span>Overdue compliance cases</span>
                  <span className="font-semibold text-rose-500">{summaryData?.governance?.overdue_issues} cases</span>
                </div>
              </div>
            </div>

          </div>

          {/* Export Report CSV Actions Card */}
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spreadsheet Exporter</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Download aggregated CSV records directly to your machine.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-darkbg-950/20 border border-slate-100 dark:border-slate-850 flex flex-col justify-between h-40">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <Leaf className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                    Emissions Ledger
                  </h4>
                  <p className="text-[10px] text-slate-400">Carbon footprints logs, utility logs, and calculations coefficients outputs.</p>
                </div>
                <button
                  disabled={downloadLoading !== null}
                  onClick={() => handleDownloadReport('emissions')}
                  className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {downloadLoading === 'emissions' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Export Emissions CSV
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-darkbg-950/20 border border-slate-100 dark:border-slate-850 flex flex-col justify-between h-40">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-sky-500" />
                    Social Volunteers List
                  </h4>
                  <p className="text-[10px] text-slate-400">CSR event rosters, attendance signatures, points, and approvals histories.</p>
                </div>
                <button
                  disabled={downloadLoading !== null}
                  onClick={() => handleDownloadReport('social')}
                  className="py-1.5 px-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {downloadLoading === 'social' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Export Volunteering CSV
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-darkbg-950/20 border border-slate-100 dark:border-slate-850 flex flex-col justify-between h-40">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                    Governance Compliance Log
                  </h4>
                  <p className="text-[10px] text-slate-400">Compliance audit case schedules, issues, severity rates, and resolutions.</p>
                </div>
                <button
                  disabled={downloadLoading !== null}
                  onClick={() => handleDownloadReport('governance')}
                  className="py-1.5 px-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {downloadLoading === 'governance' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Export Compliance CSV
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Reports;
