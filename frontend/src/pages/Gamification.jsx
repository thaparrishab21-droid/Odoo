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
  Users,
  Eye,
  Check,
  X,
  History,
  Copy,
  Check as CheckedIcon
} from 'lucide-react';

const Gamification = () => {
  const { user, refreshUser } = useAuth();

  // Navigation tab: 'leaderboard' | 'challenges' | 'store' | 'badges'
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [storeSubTab, setStoreSubTab] = useState('catalog'); // 'catalog' | 'history'

  // Leaderboard filters
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('all');
  const [leaderboardScope, setLeaderboardScope] = useState('global');

  // State caches
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [myParticipations, setMyParticipations] = useState([]);

  // Admin approval queue for challenge submissions requiring evidence
  const [adminQueue, setAdminQueue] = useState([]);
  const [adminQueueLoading, setAdminQueueLoading] = useState(false);

  const [rewards, setRewards] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [myRedemptions, setMyRedemptions] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const [myBadges, setMyBadges] = useState([]);
  const [myBadgesLoading, setMyBadgesLoading] = useState(false);
  const [allBadges, setAllBadges] = useState([]);

  // Proof submission modal state
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState(null);
  const [proofUrl, setProofUrl] = useState('');

  // Toast feedback states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Dynamic Level Progression calculations
  const getLevelInfo = (xp) => {
    const currentXp = xp || 0;
    const level = Math.floor(currentXp / 500) + 1;
    const nextLevelXp = level * 500;
    const currentLevelBaseXp = (level - 1) * 500;
    const progressInCurrentLevel = currentXp - currentLevelBaseXp;
    const percentToNextLevel = Math.min((progressInCurrentLevel / 500) * 100, 100);
    const xpNeeded = nextLevelXp - currentXp;

    let title = "Green Apprentice";
    if (level === 2) title = "Conservationist";
    else if (level === 3) title = "Eco Champion";
    else if (level === 4) title = "Carbon Fighter";
    else if (level >= 5) title = "Sustainability Sage";

    return { level, percentToNextLevel, xpNeeded, title };
  };

  const levelInfo = getLevelInfo(user?.xp);

  // Custom Vanilla Canvas Confetti animation particle trigger
  const triggerConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6'];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        d: Math.random() * canvas.height,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    let animationId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach((p) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 5;

        if (p.y < canvas.height) {
          active = true;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      if (active) {
        animationId = requestAnimationFrame(draw);
      } else {
        document.body.removeChild(canvas);
      }
    };

    draw();

    setTimeout(() => {
      try {
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
          cancelAnimationFrame(animationId);
        }
      } catch (e) {}
    }, 6000);
  };

  // Fetch leaderboard ranking list
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const params = {
        period: leaderboardPeriod,
        scope: leaderboardScope
      };
      if (leaderboardScope === 'department' && user?.department_id) {
        params.department_id = user.department_id;
      }
      const res = await api.get('/leaderboard', { params });
      setLeaderboard(res.data);
    } catch (e) {
      console.error("Leaderboard loading failed:", e);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [leaderboardPeriod, leaderboardScope, user]);

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

  // Fetch admin review queue
  const fetchAdminQueue = useCallback(async () => {
    if (user?.role !== 'Admin') return;
    setAdminQueueLoading(true);
    try {
      const res = await api.get('/challenge-participations?status=Under Review');
      setAdminQueue(res.data);
    } catch (e) {
      console.error("Admin queue load failed:", e);
    } finally {
      setAdminQueueLoading(false);
    }
  }, [user]);

  // Fetch rewards catalog
  const fetchRewards = useCallback(async () => {
    setRewardsLoading(true);
    try {
      const res = await api.get('/rewards');
      setRewards(res.data.items || res.data);
    } catch (e) {
      console.error("Rewards loading failed:", e);
    } finally {
      setRewardsLoading(false);
    }
  }, []);

  // Fetch redemption logs
  const fetchRedemptions = useCallback(async () => {
    setRedemptionsLoading(true);
    try {
      const res = await api.get('/employees/me/redemptions');
      setMyRedemptions(res.data);
    } catch (e) {
      console.error("Redemptions loading failed:", e);
    } finally {
      setRedemptionsLoading(false);
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
      setMyBadgesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leaderboard') fetchLeaderboard();
    if (activeTab === 'challenges') {
      fetchChallenges();
      fetchAdminQueue();
    }
    if (activeTab === 'store') {
      if (storeSubTab === 'catalog') fetchRewards();
      else fetchRedemptions();
    }
    if (activeTab === 'badges') fetchBadges();
  }, [activeTab, storeSubTab, fetchLeaderboard, fetchChallenges, fetchAdminQueue, fetchRewards, fetchRedemptions, fetchBadges]);

  // Initial load
  useEffect(() => {
    fetchBadges();
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

  // Increases progress of a challenge
  const handleUpdateProgress = async (part, currentProgress) => {
    setErrorMsg('');
    setSuccessMsg('');
    const targetProgress = Math.min(currentProgress + 25.0, 100.0);
    
    // Open modal if hitting 100% on evidence required quest
    if (targetProgress >= 100.0 && part.challenge_evidence_required) {
      setSelectedParticipation(part);
      setProofUrl('');
      setProofModalOpen(true);
      return;
    }

    setActionLoadingId(part.id);
    try {
      await api.post(`/challenge-participations/${part.id}/progress`, {
        progress: targetProgress
      });
      if (targetProgress >= 100.0) {
        setSuccessMsg("Challenge completed! Reward points and XP allocated.");
        triggerConfetti();
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

  // Submits evidence and sets to 100% progress
  const handleSubmitProof = async () => {
    if (!proofUrl.trim()) {
      setErrorMsg("Please enter proof link or evidence description.");
      return;
    }
    setProofModalOpen(false);
    setActionLoadingId(selectedParticipation.id);
    try {
      await api.post(`/challenge-participations/${selectedParticipation.id}/progress`, {
        progress: 100.0,
        proof: proofUrl
      });
      setSuccessMsg("Proof submitted! Challenge participation is now Under Review.");
      fetchChallenges();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Evidence submission failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin approves quest submission
  const handleAdminApprove = async (partId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(partId);
    try {
      await api.post(`/challenge-participations/${partId}/approve`);
      setSuccessMsg("Challenge proof approved and rewards credited.");
      triggerConfetti();
      fetchChallenges();
      fetchAdminQueue();
      refreshUser();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Approval failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Admin rejects quest submission
  const handleAdminReject = async (partId) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoadingId(partId);
    try {
      await api.post(`/challenge-participations/${partId}/reject`);
      setSuccessMsg("Challenge proof rejected. Employee notified.");
      fetchChallenges();
      fetchAdminQueue();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Rejection failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Redeems reward item
  const handleRedeemReward = async (reward) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Dynamic cost check based on new xp_required or fallback points_cost
    const costVal = reward.xp_required > 0 ? reward.xp_required : reward.points_cost;
    const isXp = reward.xp_required > 0;
    
    if (isXp) {
      if (user && user.xp < costVal) {
        setErrorMsg(`Insufficient XP balance. Requires ${costVal} XP.`);
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
    } else {
      if (user && user.points < costVal) {
        setErrorMsg(`Insufficient points balance. Requires ${costVal} points.`);
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
    }

    setActionLoadingId(reward.id);
    try {
      await api.post(`/rewards/${reward.id}/redeem`);
      setSuccessMsg("Reward successfully redeemed! Stock and currency updated.");
      triggerConfetti();
      refreshUser();
      fetchRewards();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Redemption failed.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyVoucher = (code, redemptionId) => {
    navigator.clipboard.writeText(code);
    setCopiedId(redemptionId);
    setTimeout(() => setCopiedId(null), 2000);
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
      <div className="p-6 rounded-2xl bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ESG Gamification Arena</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unlock corporate badges, redeem green rewards, and compete on the sustainability leaderboards.
            </p>
          </div>
        </div>

        {/* Dynamic Level Progress Bar & User stats widget */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 lg:gap-10">
          
          {/* Level progression bar */}
          <div className="flex flex-col justify-center space-y-1.5 min-w-[200px] border-l-0 sm:border-l sm:pl-6 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-500 uppercase tracking-wider">Level {levelInfo.level}</span>
              <span className="font-semibold text-slate-400">{levelInfo.title}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
              <div className="bg-gradient-to-r from-indigo-500 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${levelInfo.percentToNextLevel}%` }} />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {levelInfo.xpNeeded} XP to Level {levelInfo.level + 1}
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
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
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eco Champions Leaderboard</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Top contributing members sorted by level experience points.</p>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                  className="text-xs bg-slate-50 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-600 focus:outline-none"
                  value={leaderboardScope}
                  onChange={(e) => setLeaderboardScope(e.target.value)}
                >
                  <option value="global">Global Ranking</option>
                  {user?.department_id && <option value="department">My Department</option>}
                </select>
                <select 
                  className="text-xs bg-slate-50 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-600 focus:outline-none"
                  value={leaderboardPeriod}
                  onChange={(e) => setLeaderboardPeriod(e.target.value)}
                >
                  <option value="all">All-Time XP</option>
                  <option value="monthly">Monthly XP</option>
                  <option value="yearly">Yearly XP</option>
                </select>
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
                      <th className="py-2.5 px-3">Points Balance</th>
                      <th className="py-2.5 px-3 text-right">Contribution XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaderboard.map((e, index) => {
                      const rank = index + 1;
                      return (
                        <tr key={e.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${user?.id === e.id ? 'bg-amber-500/5 font-bold' : ''}`}>
                          <td className="py-3.5 px-3">
                            {rank === 1 && <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 font-extrabold rounded text-[9px] shadow-sm">1st Place</span>}
                            {rank === 2 && <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-extrabold rounded text-[9px] shadow-sm">2nd Place</span>}
                            {rank === 3 && <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 font-extrabold rounded text-[9px] shadow-sm">3rd Place</span>}
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
          <div className="space-y-6">
            
            {/* ADMIN ONLY REVIEW QUEUE */}
            {user?.role === 'Admin' && adminQueue.length > 0 && (
              <div className="bg-slate-50 dark:bg-darkbg-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold text-indigo-500 uppercase tracking-wider flex items-center">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Pending Challenge Evidence Verification
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Employees completed these challenges but require evidence verification.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500 text-white rounded-full text-[9px] font-bold">
                    {adminQueue.length} Pending
                  </span>
                </div>
                
                <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {adminQueue.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{item.employee_name}</span>
                        <span className="text-[10px] text-slate-400 block">Quest: {item.challenge_title}</span>
                        {item.proof && (
                          <a 
                            href={item.proof.startsWith('http') ? item.proof : `https://${item.proof}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-500 font-semibold hover:underline flex items-center mt-1"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View Submitted Evidence
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleAdminApprove(item.id)}
                          className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all font-semibold flex items-center space-x-1"
                          title="Approve Completion"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="text-[9px]">Approve</span>
                        </button>
                        <button
                          disabled={actionLoadingId === item.id}
                          onClick={() => handleAdminReject(item.id)}
                          className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-all font-semibold flex items-center space-x-1"
                          title="Reject Proof"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span className="text-[9px]">Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  const isUnderReview = part?.status === 'Under Review';
                  const isLoad = actionLoadingId === c.id || actionLoadingId === part?.id;
                  
                  return (
                    <div key={c.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {c.status}
                          </span>
                          <div className="flex items-center space-x-1 text-[9px] text-indigo-500 font-bold">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>+{c.points_reward || 0} pts / +{c.xp_reward || 0} XP</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${c.difficulty === 'Hard' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : c.difficulty === 'Medium' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20'}`}>
                            {c.difficulty || 'Medium'}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 h-10">{c.description}</p>
                        
                        <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-medium">
                          <span>Deadline: {c.deadline || c.end_date}</span>
                          {c.evidence_required && (
                            <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded">
                              Evidence Required
                            </span>
                          )}
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
                        ) : isUnderReview ? (
                          <div className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5">
                            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span>Under Admin Review</span>
                          </div>
                        ) : (
                          <button
                            disabled={isLoad}
                            onClick={() => handleUpdateProgress(part, part.progress)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                          >
                            {isLoad && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            {c.evidence_required && part.progress >= 75.0 ? 'Submit Evidence' : 'Log Progress (+25%)'}
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
          <div className="space-y-6">
            
            {/* Store Sub-Navigation (Catalog vs History) */}
            <div className="flex space-x-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs">
              <button
                onClick={() => setStoreSubTab('catalog')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${storeSubTab === 'catalog' ? 'bg-white dark:bg-darkbg-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Rewards Catalog
              </button>
              <button
                onClick={() => setStoreSubTab('history')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center ${storeSubTab === 'history' ? 'bg-white dark:bg-darkbg-900 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <History className="w-3 h-3 mr-1" />
                My Redemptions
              </button>
            </div>

            {/* Sub-panel Content */}
            {storeSubTab === 'catalog' ? (
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
                      
                      // XP Required takes precedence, fallback to points cost
                      const costVal = r.xp_required > 0 ? r.xp_required : r.points_cost;
                      const isXp = r.xp_required > 0;
                      
                      const canRedeem = r.stock > 0 && user && (isXp ? user.xp >= costVal : user.points >= costVal);
                      
                      return (
                        <div key={r.id} className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition-all">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 font-extrabold text-[9px]">
                                {costVal} {isXp ? 'XP' : 'Points'}
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
                              onClick={() => handleRedeemReward(r)}
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
            ) : (
              // REDEMPTIONS LOG HISTORY
              <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Redemption Vouchers Log</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use the codes below to claim your environmental reward items.</p>
                </div>
                
                <div className="overflow-x-auto min-h-60 mt-4">
                  {redemptionsLoading ? (
                    <div className="flex flex-col items-center py-20 text-slate-400">
                      <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                    </div>
                  ) : myRedemptions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      No rewards redeemed yet. Go to catalog and spend your XP!
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reward Item</th>
                          <th className="py-2.5 px-3">Points Spent</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Voucher Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {myRedemptions.map((red) => (
                          <tr key={red.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(red.redeemed_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-950 dark:text-white">
                              {red.reward_name}
                            </td>
                            <td className="py-3 px-3 text-amber-500 font-bold">
                              {red.points_spent} pts
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded font-bold text-[9px]">
                                {red.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {red.voucher_code ? (
                                <div className="inline-flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-xl">
                                  <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                                    {red.voucher_code}
                                  </span>
                                  <button
                                    onClick={() => handleCopyVoucher(red.voucher_code, red.id)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-700 transition-all"
                                    title="Copy Code"
                                  >
                                    {copiedId === red.id ? (
                                      <CheckedIcon className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-semibold italic text-[10px]">No code</span>
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

          </div>
        )}

        {/* PANEL 4: BADGES LOCKER */}
        {activeTab === 'badges' && (
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">My Badges Cabinet</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Cross achievements rules to unlock exclusive sustainability achievements.</p>
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
                    <span className="text-[9px] text-indigo-500 font-bold block mt-1">Rule: {b.unlock_rule || `xp >= ${b.xp_required}`}</span>
                    <span className="text-[9px] text-slate-400 mt-1.5 line-clamp-2 h-7">{b.description}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* EVIDENCE SUBMISSION MODAL */}
      {proofModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Submit Evidence Proof</h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Challenge "{selectedParticipation?.challenge_title}" requires completion evidence link or verification details.
              </p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Proof Description / Link</label>
              <textarea
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-darkbg-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
                placeholder="Paste shared drive file link, descriptive proof, or photo link..."
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setProofModalOpen(false)}
                className="px-4 py-2 border border-slate-250 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitProof}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Submit Evidence
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Gamification;
