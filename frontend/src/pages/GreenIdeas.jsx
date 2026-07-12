import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Lightbulb, 
  MessageSquare, 
  ThumbsUp, 
  Trophy, 
  Plus, 
  Check, 
  X, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  Award,
  ShieldAlert,
  Inbox
} from 'lucide-react';

const CATEGORIES = ['Environmental', 'Social', 'Governance', 'Other'];
const DEPARTMENTS = ['Sustainability', 'Engineering', 'Operations', 'Sales'];

const GreenIdeas = () => {
  const { user, isAdmin } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeIdeaId, setActiveIdeaId] = useState(null); // For comments modal/drawer
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const fetchIdeasAndLeaderboard = async () => {
    setLoading(true);
    try {
      const [ideasRes, leaderboardRes] = await Promise.all([
        api.get('/green-ideas', {
          params: { category: categoryFilter || undefined, department: deptFilter || undefined }
        }),
        api.get('/green-ideas/leaderboard')
      ]);
      setIdeas(ideasRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (e) {
      console.error("Failed to load green ideas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeasAndLeaderboard();
  }, [categoryFilter, deptFilter]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await api.post('/green-ideas', {
        title: data.title,
        description: data.description,
        category: data.category,
        department: data.department
      });
      setSuccessMsg('Your sustainability idea has been submitted successfully!');
      fetchIdeasAndLeaderboard();
      reset();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (ideaId) => {
    try {
      const response = await api.post(`/green-ideas/${ideaId}/vote`);
      // Update local state directly for responsive feedback
      setIdeas(prev => prev.map(idea => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            voted: response.data.voted,
            votes_count: response.data.votes_count
          };
        }
        return idea;
      }));
      // Refresh leaderboard after vote
      const leaderboardRes = await api.get('/green-ideas/leaderboard');
      setLeaderboard(leaderboardRes.data);
    } catch (e) {
      console.warn("Failed to vote:", e);
    }
  };

  const handleViewComments = async (ideaId) => {
    setActiveIdeaId(ideaId);
    setCommentsLoading(true);
    try {
      const response = await api.get(`/green-ideas/${ideaId}/comments`);
      setComments(response.data);
    } catch (e) {
      console.warn("Failed to load comments:", e);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const response = await api.post(`/green-ideas/${activeIdeaId}/comment`, {
        content: commentText
      });
      setComments(prev => [...prev, response.data]);
      setCommentText('');
      // Update comment count on ideas list
      setIdeas(prev => prev.map(idea => {
        if (idea.id === activeIdeaId) {
          return { ...idea, comments_count: (idea.comments_count || 0) + 1 };
        }
        return idea;
      }));
    } catch (err) {
      console.warn("Failed to submit comment:", err);
    }
  };

  const handleUpdateStatus = async (ideaId, newStatus) => {
    try {
      await api.put(`/green-ideas/${ideaId}/status`, { status: newStatus });
      fetchIdeasAndLeaderboard();
    } catch (e) {
      console.warn("Status change error:", e);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400';
      case 'Implemented':
        return 'bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400';
      case 'Rejected':
        return 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400';
      case 'Under Review':
        return 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in-up">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-xl">
          <Lightbulb className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Green Ideas Portal</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Crowdsource company sustainability initiatives. Submitting ideas that get approved and implemented awards points and XP!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Submit Idea & Leaderboard Column (Left/Side) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Submit Form */}
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center mb-4">
              <Plus className="w-4 h-4 text-indigo-500 mr-1.5" />
              Submit Sustainability Idea
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Energy efficient solar roof"
                  {...register('title', { required: 'Required', maxLength: 150 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {errors.title && <span className="text-[10px] text-rose-500">{errors.title.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="What is the plan, budget, and impact?"
                  rows={4}
                  {...register('description', { required: 'Required', minLength: 5 })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
                {errors.description && <span className="text-[10px] text-rose-500">{errors.description.message}</span>}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  {...register('category', { required: 'Required' })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Division</label>
                <select
                  {...register('department', { required: 'Required' })}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Submit to Committee</span>
                )}
              </button>
            </form>

            {successMsg && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] text-emerald-600 font-medium">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 font-medium">
                {errorMsg}
              </div>
            )}
          </div>

           {/* Leaderboard Panel */}
           {leaderboard && (
             <div className="bg-white dark:bg-darkbg-900 premium-gradient-border rounded-2xl p-5 shadow-xl space-y-5">
              
              {/* Top Contributors */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Trophy className="w-4 h-4 text-amber-500 mr-1.5" />
                  Top Contributors
                </h3>
                <div className="space-y-2">
                  {leaderboard.top_contributors.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block">No submissions yet.</span>
                  ) : (
                    leaderboard.top_contributors.map((c, i) => (
                      <div key={c.employee_id} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center">
                          <span className="text-[10px] font-bold text-slate-400 w-4 block">{i + 1}.</span>
                          {c.name}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full">
                          {c.ideas_count} ideas
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Popular Ideas */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
                  <Award className="w-4 h-4 text-emerald-500 mr-1.5" />
                  Most Popular
                </h3>
                <div className="space-y-2">
                  {leaderboard.most_popular_ideas.length === 0 ? (
                    <span className="text-[10px] text-slate-400 block">No votes yet.</span>
                  ) : (
                    leaderboard.most_popular_ideas.map((p, i) => (
                      <div key={p.id} className="text-xs space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">{p.title}</span>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>by {p.employee_name}</span>
                          <span className="font-bold text-emerald-500">{p.votes_count} votes</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Ideas Feed Column (Right/Center) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Active Submissions Feed</span>
            
            <div className="flex items-center space-x-3 text-xs">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 rounded-xl outline-none"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Ideas List */}
          {ideas.length === 0 ? (
            <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center py-20">
              <Inbox className="w-10 h-10 text-slate-350 dark:text-slate-700 mb-3" />
              <p className="text-xs font-semibold text-slate-650 dark:text-slate-300">No ideas matching filter criteria</p>
              <p className="text-[10px] text-slate-400 mt-1">Be the first to submit a proposal for this category or department!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                  
                  {/* Status header & Category Tag */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800/60 mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                        {idea.category}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                        {idea.department} Division
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] border font-bold ${getStatusBadgeColor(idea.status)}`}>
                      {idea.status}
                    </span>
                  </div>

                  {/* Body title & description */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{idea.title}</h3>
                  <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed">{idea.description}</p>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-450 dark:text-slate-500 mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800/40">
                    <span>submitted by **{idea.employee_name}** • {idea.created_at ? new Date(idea.created_at).toLocaleDateString() : ''}</span>
                    
                    <div className="flex items-center space-x-4">
                      {/* Voting */}
                      <button
                        onClick={() => handleVote(idea.id)}
                        className={`flex items-center space-x-1 py-1 px-2.5 rounded-xl border transition-all ${idea.voted ? 'bg-emerald-500 border-emerald-500 text-white font-bold' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 hover:dark:bg-slate-700'}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{idea.votes_count}</span>
                      </button>

                      {/* Comments count link */}
                      <button 
                        onClick={() => handleViewComments(idea.id)}
                        className="flex items-center space-x-1 py-1 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-350 hover:dark:bg-slate-700 transition-all"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{idea.comments_count || 0} Comments</span>
                      </button>
                    </div>
                  </div>

                  {/* Admin actions block */}
                  {isAdmin() && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 flex items-center">
                        <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Admin Moderator Control
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {idea.status !== 'Under Review' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'Under Review')}
                            className="px-2.5 py-1 text-[9px] font-bold rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/30 dark:hover:bg-amber-950/20 transition-all"
                          >
                            Under Review
                          </button>
                        )}
                        {idea.status !== 'Approved' && idea.status !== 'Implemented' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'Approved')}
                            className="px-2.5 py-1 text-[9px] font-bold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/30 dark:hover:bg-blue-950/20 transition-all"
                          >
                            Approve (+50 Pts)
                          </button>
                        )}
                        {idea.status !== 'Implemented' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'Implemented')}
                            className="px-2.5 py-1 text-[9px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all flex items-center"
                          >
                            <Check className="w-3 h-3 mr-0.5" /> Implement (+100 Pts)
                          </button>
                        )}
                        {idea.status !== 'Rejected' && idea.status !== 'Implemented' && (
                          <button
                            onClick={() => handleUpdateStatus(idea.id, 'Rejected')}
                            className="px-2.5 py-1 text-[9px] font-bold rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:hover:bg-rose-950/20 transition-all"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Discussion Drawer / Comments Drawer Overlay */}
      {activeIdeaId !== null && (
        <>
          <div className="fixed inset-0 z-45 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={() => setActiveIdeaId(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-darkbg-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Comments & Discussion</h3>
                <button onClick={() => setActiveIdeaId(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-650 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
              </div>

              {commentsLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin mr-1" /> Loading comments...
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-2">
                  {comments.length === 0 ? (
                    <div className="py-12 text-center text-[10px] text-slate-400">Zero comments logged. Start the discussion below!</div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-50 dark:bg-darkbg-950/20 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>{c.employee_name}</span>
                          <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{c.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Comment inputs */}
            <form onSubmit={handleAddComment} className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts or constructive critique..."
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 dark:bg-darkbg-950 dark:border-slate-800 dark:text-slate-100 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 transition-all"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
};

export default GreenIdeas;
