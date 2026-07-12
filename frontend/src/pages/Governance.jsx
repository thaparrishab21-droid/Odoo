import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  ExternalLink,
  Kanban,
  FileText,
  User,
  CheckSquare,
  X,
  AlertCircle
} from 'lucide-react';

const SEVERITY_COLORS = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Medium: 'bg-sky-50 text-sky-600 dark:bg-sky-950/20 dark:text-sky-400',
  High: 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400',
  Critical: 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
};

const STATUS_COLUMNS = ['Open', 'In Progress', 'Resolved', 'Overdue'];

const Governance = () => {
  const { user, refreshUser } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Navigation tab: 'policies' | 'audits' | 'compliance'
  const [activeTab, setActiveTab] = useState('policies');
  
  // Policies lists state
  const [policies, setPolicies] = useState([]);
  const [signedPolicyIds, setSignedPolicyIds] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(true);

  // Audits lists state
  const [audits, setAudits] = useState([]);
  const [auditsLoading, setAuditsLoading] = useState(false);

  // Compliance issues state
  const [issues, setIssues] = useState([]);
  const [issuesLoading, setIssuesLoading] = useState(false);

  // Modal controls
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [editIssueModalOpen, setEditIssueModalOpen] = useState(false);

  // Dropdowns lists caching
  const [employees, setEmployees] = useState([]);

  // Form states
  const [auditValues, setAuditValues] = useState({ title: '', description: '', audit_date: '', lead_auditor_id: '' });
  const [issueValues, setIssueValues] = useState({ title: '', description: '', severity: 'Medium', status: 'Open', due_date: '', owner_id: '', audit_id: '' });
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch Policies and sign state
  const fetchPolicies = useCallback(async () => {
    setPoliciesLoading(true);
    try {
      const pRes = await api.get('/policies');
      const sRes = await api.get('/policies/me/status');
      setPolicies(pRes.data.items || pRes.data);
      setSignedPolicyIds(sRes.data);
    } catch (e) {
      console.error("Policies loading failed:", e);
    } finally {
      setPoliciesLoading(false);
    }
  }, []);

  // Fetch Audits list
  const fetchAudits = useCallback(async () => {
    setAuditsLoading(true);
    try {
      const res = await api.get('/audits');
      setAudits(res.data);
    } catch (e) {
      console.error("Audits loading failed:", e);
    } finally {
      setAuditsLoading(false);
    }
  }, []);

  // Fetch Compliance Issues list
  const fetchIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const res = await api.get('/compliance-issues');
      setIssues(res.data);
    } catch (e) {
      console.error("Compliance issues loading failed:", e);
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  // Fetch employee catalog for dropdown select
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { per_page: 100 } });
      setEmployees(res.data.items);
    } catch (e) {
      console.warn("Auditor dropdown loading warning:", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'policies') fetchPolicies();
    if (activeTab === 'audits') {
      fetchAudits();
      fetchEmployees();
    }
    if (activeTab === 'compliance') {
      fetchIssues();
      fetchEmployees();
      fetchAudits();
    }
  }, [activeTab, fetchPolicies, fetchAudits, fetchIssues]);

  // Acknowledges a corporate policy guidelines document
  const handleAcknowledgePolicy = async (policyId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(policyId);
    try {
      await api.post(`/policies/${policyId}/acknowledge`);
      setSuccessMsg("Policy read & signed! Learning rewards (+50 pts / +150 XP) earned.");
      refreshUser();
      fetchPolicies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Acknowledgement failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Creates audit record
  const handleCreateAudit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/audits', auditValues);
      setAuditModalOpen(false);
      fetchAudits();
      setSuccessMsg("Internal audit scheduled successfully.");
      setAuditValues({ title: '', description: '', audit_date: '', lead_auditor_id: '' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create audit.");
    }
  };

  // Creates compliance issue
  const handleCreateIssue = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/compliance-issues', issueValues);
      setIssueModalOpen(false);
      fetchIssues();
      setSuccessMsg("Compliance issue logged & assigned successfully.");
      setIssueValues({ title: '', description: '', severity: 'Medium', status: 'Open', due_date: '', owner_id: '', audit_id: '' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to create compliance issue.");
    }
  };

  // Opens compliance update modal
  const openEditIssueModal = (issue) => {
    setSelectedIssue(issue);
    setIssueValues({
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      due_date: issue.due_date,
      owner_id: issue.owner_id,
      audit_id: issue.audit_id || ''
    });
    setEditIssueModalOpen(true);
  };

  // Updates compliance issue details or status
  const handleUpdateIssue = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.put(`/compliance-issues/${selectedIssue.id}`, issueValues);
      setEditIssueModalOpen(false);
      fetchIssues();
      setSuccessMsg("Compliance issue updated successfully.");
      refreshUser(); // sync score increments
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Update failed.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Governance & Compliance</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Read corporate compliance guidelines policies, track internal audits, and coordinate compliance issues resolution.
            </p>
          </div>
        </div>
        
        {isAdmin && activeTab === 'compliance' && (
          <button 
            onClick={() => setIssueModalOpen(true)}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all flex items-center shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Issue Case
          </button>
        )}
        
        {isAdmin && activeTab === 'audits' && (
          <button 
            onClick={() => setAuditModalOpen(true)}
            className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all flex items-center shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Audit
          </button>
        )}
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center space-x-2.5 p-4 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-2.5 p-4 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('policies')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'policies' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Corporate Policies
        </button>
        <button 
          onClick={() => setActiveTab('audits')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'audits' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Audit Logs
        </button>
        <button 
          onClick={() => setActiveTab('compliance')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'compliance' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Kanban className="w-4 h-4 mr-2" />
          Compliance Board
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* PANEL 1: CORPORATE POLICIES */}
        {activeTab === 'policies' && (
          <div>
            {policiesLoading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                <span className="text-xs">Loading corporate policies...</span>
              </div>
            ) : policies.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                No policies available.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {policies.map((p) => {
                  const isSigned = signedPolicyIds.includes(p.id);
                  const isLoad = actionLoadingId === p.id;
                  
                  return (
                    <div key={p.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-500">Version: {p.version}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Effective: {p.effective_date}</span>
                        </div>
                        
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{p.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-4 h-16">{p.content}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        {isSigned ? (
                          <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Acknowledgement Signed</span>
                          </div>
                        ) : (
                          <button
                            disabled={isLoad}
                            onClick={() => handleAcknowledgePolicy(p.id)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/10 active:translate-y-px transition-all flex items-center justify-center"
                          >
                            {isLoad && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Read & Acknowledge Policy (+50 pts)
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: AUDIT TIMELINE */}
        {activeTab === 'audits' && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">Compliance Verification Timelines</h3>
            
            <div className="overflow-x-auto min-h-60 mt-4">
              {auditsLoading ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : audits.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No verification audits scheduled.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5">Audit Title / Desc</th>
                      <th className="py-2.5">Verification Date</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Lead Inspector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {audits.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{a.title}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{a.description || 'No description notes.'}</span>
                        </td>
                        <td className="py-3 text-slate-500 flex items-center space-x-1.5 mt-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{a.audit_date}</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${a.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className="font-semibold block">{a.lead_auditor_name}</span>
                          <span className="text-[9px] text-slate-400 block">ID: #{a.lead_auditor_id}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: COMPLIANCE KANBAN BOARD */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            
            {issuesLoading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {STATUS_COLUMNS.map((colName) => {
                  const filteredIssues = issues.filter(i => i.status === colName);
                  return (
                    <div key={colName} className="p-4 rounded-2xl bg-slate-50 dark:bg-darkbg-950/40 border border-slate-200/50 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{colName}</span>
                        <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold rounded-md">
                          {filteredIssues.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                        {filteredIssues.map((issue) => {
                          const canEdit = isAdmin || issue.owner_id === user?.id;
                          return (
                            <div 
                              key={issue.id} 
                              onClick={() => canEdit && openEditIssueModal(issue)}
                              className={`p-4 bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm space-y-2 hover:shadow transition-all ${canEdit ? 'cursor-pointer hover:border-indigo-400' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${SEVERITY_COLORS[issue.severity] || 'bg-slate-100'}`}>
                                  {issue.severity}
                                </span>
                                {issue.status === 'Resolved' && (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                )}
                                {issue.status === 'Overdue' && (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                )}
                              </div>
                              
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{issue.title}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-2">{issue.description}</p>
                              
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                                <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {issue.owner_name}</span>
                                <span>Due: {issue.due_date}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL 1: SCHEDULE AUDIT (ADMIN ONLY) */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Schedule Compliance Audit
              </h3>
              <button 
                onClick={() => setAuditModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAudit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Q3 Energy Efficiency Audit"
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                  value={auditValues.title}
                  onChange={(e) => setAuditValues({...auditValues, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audit Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={auditValues.audit_date}
                    onChange={(e) => setAuditValues({...auditValues, audit_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Inspector</label>
                  <select 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={auditValues.lead_auditor_id}
                    onChange={(e) => setAuditValues({...auditValues, lead_auditor_id: e.target.value})}
                  >
                    <option value="">Select Auditor...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verification Scope Notes</label>
                <textarea 
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                  rows={3}
                  placeholder="Details regarding electricity bills, gas certificates, or mileage records."
                  value={auditValues.description}
                  onChange={(e) => setAuditValues({...auditValues, description: e.target.value})}
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setAuditModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all"
                >
                  Schedule Audit
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: LOG COMPLIANCE ISSUE (ADMIN ONLY) */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Create Compliance Issue
              </h3>
              <button 
                onClick={() => setIssueModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Scope 1 Fuel Record Missing"
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                  value={issueValues.title}
                  onChange={(e) => setIssueValues({...issueValues, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                  <select 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={issueValues.severity}
                    onChange={(e) => setIssueValues({...issueValues, severity: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={issueValues.due_date}
                    onChange={(e) => setIssueValues({...issueValues, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee Owner</label>
                  <select 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={issueValues.owner_id}
                    onChange={(e) => setIssueValues({...issueValues, owner_id: e.target.value})}
                  >
                    <option value="">Select Assignee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Link Audit (Optional)</label>
                  <select 
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={issueValues.audit_id}
                    onChange={(e) => setIssueValues({...issueValues, audit_id: e.target.value})}
                  >
                    <option value="">None</option>
                    {audits.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Description</label>
                <textarea 
                  required
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                  rows={3}
                  placeholder="Provide details regarding specific compliance failures or guidelines actions needed."
                  value={issueValues.description}
                  onChange={(e) => setIssueValues({...issueValues, description: e.target.value})}
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all"
                >
                  Create Issue
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: MODIFY STATUS / OWNER (ADMIN OR ASSIGNEE) */}
      {editIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Update Compliance Issue #{selectedIssue?.id}
              </h3>
              <button 
                onClick={() => setEditIssueModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateIssue} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Title</label>
                <input 
                  type="text" 
                  required
                  disabled={!isAdmin}
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                  value={issueValues.title}
                  onChange={(e) => setIssueValues({...issueValues, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select 
                    required
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none"
                    value={issueValues.status}
                    onChange={(e) => setIssueValues({...issueValues, status: e.target.value})}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</label>
                  <select 
                    required
                    disabled={!isAdmin}
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                    value={issueValues.severity}
                    onChange={(e) => setIssueValues({...issueValues, severity: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assignee Owner</label>
                  <select 
                    required
                    disabled={!isAdmin}
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                    value={issueValues.owner_id}
                    onChange={(e) => setIssueValues({...issueValues, owner_id: e.target.value})}
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date" 
                    required
                    disabled={!isAdmin}
                    className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                    value={issueValues.due_date}
                    onChange={(e) => setIssueValues({...issueValues, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Description</label>
                <textarea 
                  required
                  disabled={!isAdmin}
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none disabled:opacity-50"
                  rows={3}
                  value={issueValues.description}
                  onChange={(e) => setIssueValues({...issueValues, description: e.target.value})}
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setEditIssueModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 active:translate-y-px transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Governance;
