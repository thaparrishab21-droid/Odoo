import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Award, 
  ShoppingBag, 
  Trophy as ChallengeIcon, 
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Star,
  Users
} from 'lucide-react';

const Gamification = () => {
  const { user, refreshUser } = useAuth();

  // Navigation tab: 'leaderboard' | 'challenges' | 'store' | 'badges'
  const [activeTab, setActiveTab] = useState('leaderboard');

  // State caches
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [myParticipations, setMyParticipations] = useState([]);

  const [rewards, setRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);

  const [myBadges, setMyBadges] = useState([]);
  const [myBadgesLoading, setMyBadgesLoading] = useState(false);
  const [allBadges, setAllBadges] = useState([]);

  // Toast feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch leaderboard ranking list
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await api.get('/leaderboard');
      setLeaderboard(res.data);
    } catch (e) {
      console.error("Leaderboard loading failed:", e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Fetch challenges and joined states
  const fetchChallenges = useCallback(async () => {
    setChallengesLoading(true);
    try {
      const challengesRes = await api.get('/challenges');
      const participationsRes = await api.get('/challenge-participations');
      setChallenges(challengesRes.data);
      setMyParticipations(participationsRes.data);
    } catch (e) {
      console.error("Challenges loading failed:", e);
    } finally {
      setChallengesLoading(false);
    }
  }, []);

  // Fetch rewards catalog
  const fetchRewards = useCallback(async () => {
    setRewardsLoading(true);
    try {
      const res = await api.get('/rewards');
      setRewards(res.data.items || res.data); // handles paginated format if returned
    } catch (e) {
      console.error("Rewards loading failed:", e);
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  // Fetch unlocked badges
  const fetchBadges = useCallback(async () => {
    setMyBadgesLoading(true);
    try {
      const myRes = await api.get('/employees/me/badges');
      const allRes = await api.get('/badges');
      setMyBadges(myRes.data);
      setAllBadges(allRes.data.items || allRes.data);
    } catch (e) {
      console.error("Badges loading failed:", e);
    } finally {
      setMyBadgesLoading(true);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
    if (activeTab === 'challenges') fetchChallenges();
    if (activeTab === 'store') fetchRewards();
    if (activeTab === 'badges') fetchBadges();
  }, [activeTab, fetchLeaderboard, fetchChallenges, fetchRewards, fetchBadges]);

  // Initial load
  useEffect(() => {
    fetchBadges(); // to update badges counter count
  }, []);

  // Joins a challenge
  const handleJoinChallenge = async (challengeId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(challengeId);
    try {
      await api.post(`/challenges/${challengeId}/join`);
      setSuccessMsg("Challenge joined! Log progress to earn your points.");
      fetchChallenges();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Join failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simulates increasing progress of a challenge by 25% increments
  const handleUpdateProgress = async (partId, currentProgress) => {
    setErrorMsg('');
    setSuccessMsg('');
    const targetProgress = Math.min(currentProgress + 25.0, 100.0);
    setActionLoadingId(partId);
    try {
      await api.post(`/challenge-participations/${partId}/progress`, {
        progress: targetProgress
      });
      if (targetProgress >= 100.0) {
        setSuccessMsg("Challenge completed! Reward points and XP allocated.");
        refreshUser();
      } else {
        setSuccessMsg(`Challenge progress logged at ${targetProgress}%`);
      }
      fetchChallenges();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Progress update failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Redeems reward item
  const handleRedeemReward = async (rewardId, pointsCost) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (user && user.points < pointsCost) {
      setErrorMsg(`Insufficient points. Requires ${pointsCost} points.`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setActionLoadingId(rewardId);
    try {
      await api.post(`/rewards/${rewardId}/redeem`);
      setSuccessMsg("Reward successfully redeemed! Check notification log.");
      refreshUser();
      fetchRewards();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Redemption failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Helper selectors
  const getParticipationForChallenge = (challengeId) => {
    return myParticipations.find(p => p.challenge_id === challengeId);
  };

  const isBadgeUnlocked = (badgeId) => {
    return myBadges.some(b => b.id === badgeId);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Profile Summary Widget */}
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESG Gamification Arena</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unlock corporate badges, redeem green rewards, and compete on the sustainability leaderboards.
            </p>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex items-center space-x-6 self-start md:self-auto pt-2 md:pt-0 border-t border-slate-100 dark:border-slate-800 md:border-t-0">
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level XP</span>
            <span className="block text-lg font-extrabold text-indigo-500 mt-0.5">{user?.xp} XP</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Eco Points Balance</span>
            <span className="block text-lg font-extrabold text-amber-500 mt-0.5">{user?.points} pts</span>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Badges Unlocked</span>
            <span className="block text-lg font-extrabold text-emerald-500 mt-0.5">{myBadges.length} unlocked</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center space-x-2.5 p-4 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
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
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'leaderboard' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-4 h-4 mr-2" />
          Company Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab('challenges')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'challenges' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <ChallengeIcon className="w-4 h-4 mr-2" />
          Challenge Arena
        </button>
        <button 
          onClick={() => setActiveTab('store')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'store' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Eco Rewards Store
        </button>
        <button 
          onClick={() => setActiveTab('badges')}
          className={`px-5 py-3 text-xs font-semibold tracking-wider flex items-center border-b-2 transition-all ${activeTab === 'badges' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Award className="w-4 h-4 mr-2" />
          Badges Locker
        </button>
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* PANEL 1: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eco Champions Leaderboard</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Top contributing members sorted by level experience points.</p>
              </div>
            </div>

            <div className="overflow-x-auto min-h-60 mt-4">
              {leaderboardLoading ? (
                <div className="flex flex-col items-center py-20 text-slate-400">
                  <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Points Mapped</th>
                      <th className="py-2.5 px-3 text-right">Contribution XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboard.map((e, index) => {
                      const rank = index + 1;
                      return (
                        <tr key={e.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${user?.id === e.id ? 'bg-amber-500/5 font-bold' : ''}`}>
                          <td className="py-3.5 px-3">
                            {rank === 1 && <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 font-extrabold rounded text-[9px] shadow-sm">1st Place</span>}
                            {rank === 2 && <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 font-extrabold rounded text-[9px] shadow-sm">2nd Place</span>}
                            {rank === 3 && <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded text-[9px] shadow-sm">3rd Place</span>}
                            {rank > 3 && <span className="text-slate-400 font-bold ml-2">#{rank}</span>}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="block text-slate-900 dark:text-white">{e.name} {user?.id === e.id ? '(You)' : ''}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{e.email}</span>
                          </td>
                          <td className="py-3.5 px-3 text-slate-500">{e.role}</td>
                          <td className="py-3.5 px-3 text-amber-500 font-bold">{e.points} pts</td>
                          <td className="py-3.5 px-3 text-right font-extrabold text-indigo-500">{e.xp} XP</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: CHALLENGE ARENA */}
        {activeTab === 'challenges' && (
          <div>
            {challengesLoading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-2" />
                <span className="text-xs">Entering arena...</span>
              </div>
            ) : challenges.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                No active challenges scheduled.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.map((c) => {
                  const part = getParticipationForChallenge(c.id);
                  const isCompleted = part?.status === 'Completed';
                  const isLoad = actionLoadingId === c.id || actionLoadingId === part?.id;
                  
                  return (
                    <div key={c.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                            {c.status}
                          </span>
                          <div className="flex items-center space-x-1 text-[9px] text-indigo-500 font-bold">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>+{c.points_reward} pts / +{c.xp_reward} XP</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-10">{c.description}</p>
                        
                        <div className="pt-2 text-[10px] text-slate-400 font-medium">
                          <span>Timeline: {c.start_date} to {c.end_date}</span>
                        </div>

                        {part && (
                          <div className="pt-2 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                              <span>Quest Progress</span>
                              <span>{Math.round(part.progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${part.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Interactive Buttons */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        {!part ? (
                          <button
                            disabled={isLoad || c.status !== 'Active'}
                            onClick={() => handleJoinChallenge(c.id)}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            {isLoad && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Accept Quest Challenge
                          </button>
                        ) : isCompleted ? (
                          <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Quest Completed!</span>
                          </div>
                        ) : (
                          <button
                            disabled={isLoad}
                            onClick={() => handleUpdateProgress(part.id, part.progress)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            {isLoad && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Log Progress (+25%)
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

        {/* PANEL 3: ECO REWARDS STORE */}
        {activeTab === 'store' && (
          <div>
            {rewardsLoading ? (
              <div className="flex flex-col items-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
            ) : rewards.length === 0 ? (
              <div className="p-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                No items available in rewards catalog.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards.map((r) => {
                  const isLoad = actionLoadingId === r.id;
                  const canRedeem = r.stock > 0 && user && user.points >= r.points_cost;
                  
                  return (
                    <div key={r.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 font-extrabold text-[9px]">
                            {r.points_cost} Points
                          </span>
                          <span className={`text-[10px] font-semibold ${r.stock > 0 ? 'text-slate-400' : 'text-rose-500 font-bold'}`}>
                            {r.stock > 0 ? `${r.stock} In Stock` : 'Out of Stock'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{r.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-10">{r.description || 'No item details description available.'}</p>
                      </div>

                      {/* Redeem action trigger */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                        <button
                          disabled={isLoad || !canRedeem}
                          onClick={() => handleRedeemReward(r.id, r.points_cost)}
                          className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-500/10 active:translate-y-px transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                          {isLoad ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                          ) : (
                            <ShoppingBag className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          )}
                          Redeem Reward
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PANEL 4: BADGES LOCKER */}
        {activeTab === 'badges' && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Badges Cabinet</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Cross level XP points to unlock exclusive sustainability achievements.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 mt-6">
              {allBadges.map((b) => {
                const unlocked = isBadgeUnlocked(b.id);
                return (
                  <div 
                    key={b.id} 
                    className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${unlocked ? 'border-emerald-200 bg-emerald-50/10 dark:border-emerald-900/30' : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/20 opacity-60'}`}
                  >
                    <div className={`p-4 rounded-full mb-3 flex items-center justify-center relative ${unlocked ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`}>
                      <Award className="w-6 h-6 shrink-0" />
                      {unlocked && (
                        <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-yellow-400 text-white shadow-sm" title="Unlocked Achievement">
                          <Star className="w-3 h-3 fill-current text-white" />
                        </span>
                      )}
                    </div>
                    
                    <span className="text-xs font-bold text-slate-900 dark:text-white block line-clamp-1">{b.name}</span>
                    <span className="text-[9px] text-indigo-500 font-bold block mt-1">Requires: {b.xp_required} XP</span>
                    <span className="text-[9px] text-slate-400 mt-1.5 line-clamp-2 h-7">{b.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default Gamification;
