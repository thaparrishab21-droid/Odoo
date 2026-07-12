import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Award, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  Send,
  Sparkles
} from 'lucide-react';

const Social = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Active navigation tab: 'activities' | 'my_participations' | 'review'
  const [activeTab, setActiveTab] = useState('activities');
  
  // CSR Activities list state
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // Participations lists state
  const [participations, setParticipations] = useState([]);
  const [participationsLoading, setParticipationsLoading] = useState(false);

  // Modal controls
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [proofUrl, setProofUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch CSR Activities
  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const res = await api.get('/csr-activities');
      setActivities(res.data);
    } catch (err) {
      console.error("Error loading CSR activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  // Fetch Employee Participations
  const fetchParticipations = useCallback(async () => {
    setParticipationsLoading(true);
    try {
      const res = await api.get('/employee-participations');
      setParticipations(res.data);
    } catch (err) {
      console.error("Error loading participations:", err);
    } finally {
      setParticipationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
    fetchParticipations();
  }, [fetchActivities, fetchParticipations]);

  // Registers the employee for a CSR activity
  const handleRegister = async (activityId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/csr-activities/${activityId}/register`);
      setSuccessMsg("Successfully registered! You can now participate in this activity.");
      fetchParticipations();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Triggers Proof modal opening
  const openProofModal = (part) => {
    setSelectedParticipation(part);
    setProofUrl('');
    setErrorMsg('');
    setProofModalOpen(true);
  };

  // Submits proof url
  const handleSendProof = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitLoading(true);

    try {
      await api.post(`/employee-participations/${selectedParticipation.id}/submit-proof`, {
        proof_url: proofUrl
      });
      setProofModalOpen(false);
      fetchParticipations();
      setSuccessMsg("Proof submitted successfully! Awaiting administrator approval.");
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Proof submission failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Approves a participation proof as administrator
  const handleApproveParticipation = async (partId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.post(`/employee-participations/${partId}/approve`);
      setSuccessMsg("Participation proof approved! Rewards and XP points allocated.");
      fetchParticipations();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Approval failed.");
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Returns matching participation details for a given activity
  const getParticipationForActivity = (activityId) => {
    return participations.find(p => p.csr_activity_id === activityId);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/30 text-sky-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">CSR & Team Participations</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register for upcoming events, submit attendance proofs, and browse community CSR initiatives.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts */}
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

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('activities')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'activities' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Calendar className="w-4 h-4 mr-2" />
          Browse Activities
        </button>
        <button 
          onClick={() => setActiveTab('my_participations')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'my_participations' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Award className="w-4 h-4 mr-2" />
          My Logbook
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('review')}
            className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'review' ? 'border-sky-500 text-sky-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Review Submissions
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* PANEL 1: BROWSE ACTIVITIES */}
        {activeTab === 'activities' && (
          <div>
            {activitiesLoading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
                <span className="text-xs">Loading activities list...</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                No CSR activities scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activities.map((a) => {
                  const part = getParticipationForActivity(a.id);
                  return (
                    <div key={a.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/20 text-sky-600 font-bold text-[9px]">
                            {a.location ? 'In-Person' : 'Virtual'}
                          </span>
                          <div className="flex items-center space-x-1 text-[9px] text-amber-500 font-bold">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>+{a.points_reward} pts / +{a.xp_reward} XP</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{a.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-10">{a.description}</p>
                        
                        <div className="pt-2 flex flex-col space-y-1.5 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-2" /> {a.date}</span>
                          {a.location && <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-2" /> {a.location}</span>}
                          {a.max_participants && (
                            <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-2" /> Max {a.max_participants} Participants</span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        {!part ? (
                          <button
                            onClick={() => handleRegister(a.id)}
                            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-500/10 active:translate-y-px transition-all"
                          >
                            Register for Event
                          </button>
                        ) : part.status === 'Registered' ? (
                          <button
                            onClick={() => openProofModal(part)}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-amber-500/10 active:translate-y-px transition-all flex items-center justify-center"
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Submit Evidence Proof
                          </button>
                        ) : part.status === 'Submitted' ? (
                          <div className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                            <Clock className="w-4 h-4 animate-spin text-amber-500" />
                            <span>Submitted (Awaiting Approval)</span>
                          </div>
                        ) : (
                          <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span>Participation Approved</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 2: MY LOGBOOK */}
        {activeTab === 'my_participations' && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">My CSR Participation Logs</h3>
            <div className="overflow-x-auto min-h-60 mt-4">
              {participationsLoading ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                </div>
              ) : participations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  You haven't registered or participated in any CSR events yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5">Activity Name</th>
                      <th className="py-2.5">Date Logged</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5">Proof Link</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {participations.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">{p.csr_activity_title}</td>
                        <td className="py-3 text-slate-500">{p.submitted_at?.split('T')[0]}</td>
                        <td className="py-3 font-medium">
                          {p.status === 'Approved' && <span className="text-emerald-500">Approved</span>}
                          {p.status === 'Submitted' && <span className="text-amber-500">Submitted</span>}
                          {p.status === 'Registered' && <span className="text-sky-500">Registered</span>}
                        </td>
                        <td className="py-3 text-slate-500 max-w-xs truncate">
                          {p.proof_url ? (
                            <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-sky-500 flex items-center hover:underline">
                              {p.proof_url} <ExternalLink className="w-3.5 h-3.5 ml-1 inline" />
                            </a>
                          ) : '-'}
                        </td>
                        <td className="py-3 text-right">
                          {p.status === 'Registered' && (
                            <button
                              onClick={() => openProofModal(p)}
                              className="py-1 px-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-[10px] shadow-sm"
                            >
                              Upload Proof
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: REVIEW SUBMISSIONS (ADMIN ONLY) */}
        {activeTab === 'review' && isAdmin && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">CSR Submission Reviews</h3>
            <div className="overflow-x-auto min-h-60 mt-4">
              {participationsLoading ? (
                <div className="flex flex-col items-center py-10 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                </div>
              ) : participations.filter(p => p.status === 'Submitted').length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Zero pending proof submissions waiting for approval.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5">Employee Name</th>
                      <th className="py-2.5">CSR Activity Title</th>
                      <th className="py-2.5">Submitted Proof</th>
                      <th className="py-2.5 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {participations.filter(p => p.status === 'Submitted').map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="py-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{p.employee_name}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">ID: #{p.employee_id}</span>
                        </td>
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{p.csr_activity_title}</td>
                        <td className="py-3">
                          <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-sky-500 font-semibold hover:underline flex items-center max-w-xs truncate">
                            {p.proof_url} <ExternalLink className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleApproveParticipation(p.id)}
                            className="py-1.5 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-500/10 active:translate-y-px transition-all"
                          >
                            Approve Proof
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: EVIDENCE SUBMISSION */}
      {proofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 dark:bg-darkbg-900 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                Submit Participation Evidence
              </h3>
              <button 
                onClick={() => setProofModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendProof} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activity Mapped</label>
                <span className="block text-xs font-bold text-slate-900 dark:text-white mt-1">
                  {selectedParticipation?.csr_activity_title}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Proof URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="Paste URL to photo upload, check-in card, or pdf cert"
                  className="w-full mt-1.5 px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 transition-all"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                />
                <span className="block text-[9px] text-slate-400 mt-1">Provide a valid verification link showing participation.</span>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setProofModalOpen(false)}
                  className="py-1.5 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-xl dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitLoading}
                  className="py-1.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/10 active:translate-y-px transition-all disabled:opacity-50 flex items-center"
                >
                  {submitLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  Submit Proof
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Social;
