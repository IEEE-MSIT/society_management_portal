import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { io, Socket } from 'socket.io-client';
import { useForm } from 'react-hook-form';
import api, { getSocketUrl } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Trophy,
  Award,
  Users,
  Settings,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Loader2,
  Calendar,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface AwardRule {
  id: string;
  awardType: string;
  name: string;
  description: string;
  minEvents: number;
  minVolHours: number;
  minTasks: number;
  weightEvents: number;
  weightVolHrs: number;
  weightTasks: number;
}

interface Nominee {
  id: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  awardRule: {
    name: string;
    awardType: string;
  };
  score: number;
  period: string;
  status: string;
  reason: string;
  winner?: {
    id: string;
    certificateUrl: string;
    qrCodeUrl: string;
    badgeUrl: string;
  } | null;
}

interface Winner {
  id: string;
  nomination: {
    id: string;
    period: string;
    score: number;
    member: {
      firstName: string;
      lastName: string;
    };
    awardRule: {
      name: string;
    };
  };
  badgeUrl: string;
  certificateUrl: string;
}

const AwardsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [period, setPeriod] = useState('2026-07');
  const [rules, setRules] = useState<AwardRule[]>([]);
  const [leaderboard, setLeaderboard] = useState<Nominee[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'gallery' | 'rules'>('leaderboard');

  const { register, handleSubmit, reset } = useForm<{
    awardType: string;
    memberId: string;
    score: number;
    reason: string;
  }>();

  const fetchAwardsData = async () => {
    try {
      setLoading(true);
      // Fetch Rules
      const rulesRes = await api.get('/awards/rules');
      if (rulesRes.data?.success) {
        setRules(rulesRes.data.rules);
      }

      // Fetch Leaderboard for active period
      const leadRes = await api.get(`/awards/leaderboard?period=${period}`);
      if (leadRes.data?.success) {
        setLeaderboard(leadRes.data.leaderboard);
      }

      // Fetch Winners Gallery
      const winnersRes = await api.get('/awards/winners');
      if (winnersRes.data?.success) {
        setWinners(winnersRes.data.winners);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch awards dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwardsData();
  }, [period]);

  // Socket.IO Real-time Winner Announcement
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
    });

    socket.on('award_approved', (data: { memberName: string; awardName: string; period: string }) => {
      showToast(`🏆 Congratulations! ${data.memberName} won the "${data.awardName}" for ${data.period}!`, 'success');
      // Refresh listings
      fetchAwardsData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const res = await api.post('/awards/evaluate', { period });
      if (res.data?.success) {
        showToast(`AI Performance metrics evaluated for ${period}!`, 'success');
        fetchAwardsData();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to run AI evaluation', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await api.patch(`/awards/nominations/${id}/approve`);
      if (res.data?.success) {
        showToast('Nomination approved! Digital certificate and badge issued.', 'success');
        fetchAwardsData();
      }
    } catch (err: any) {
      showToast('Failed to approve nomination.', 'error');
    }
  };

  const handleWeightsUpdate = async (ruleId: string, data: any) => {
    try {
      const res = await api.put(`/awards/rules/${ruleId}`, data);
      if (res.data?.success) {
        showToast('Award weights configuration updated.', 'success');
        fetchAwardsData();
      }
    } catch (err: any) {
      showToast('Failed to update config.', 'error');
    }
  };

  return (
    <AnimatedPage>
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-indigo-400">
            Awards & Recognition
          </h1>
          <p className="text-sm text-slate-400">
            Intelligent metrics analyzer and verified digital certificate distribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>
          {user?.role?.name === 'Core Admin' && (
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
            >
              {evaluating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Cpu className="h-3.5 w-3.5" />
              )}
              Run AI Evaluation
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-850 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Nominees & Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('gallery')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'gallery'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <Award className="h-4 w-4" />
          Winners Gallery
        </button>
        {user?.role?.name === 'Core Admin' && (
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'rules'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            <Settings className="h-4 w-4" />
            Config Rules
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading achievements records...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Nominees & Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Leaderboard Rankings List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                    Auto-Nomination Rankings
                  </h2>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center">
                    <Trophy className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-sm text-slate-500">No evaluations run for {period} yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((nom, index) => (
                      <div
                        key={nom.id}
                        className={`glass-panel p-5 rounded-2xl border flex flex-col gap-3 relative overflow-hidden ${
                          nom.status === 'APPROVED' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-550/15 border border-indigo-500/20 text-indigo-400 font-black text-sm">
                              #{index + 1}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-200 text-sm">
                                {nom.member.firstName} {nom.member.lastName}
                              </h3>
                              <p className="text-xs text-indigo-400 font-semibold">{nom.awardRule.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-base font-black text-slate-100">{nom.score}</span>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Weighted Score</p>
                            </div>
                            {user?.role?.name === 'Core Admin' && nom.status === 'NOMINATED' && (
                              <button
                                onClick={() => handleApprove(nom.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Approve Award
                              </button>
                            )}
                            {nom.status === 'APPROVED' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                WINNER
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-normal bg-slate-950/40 p-3 rounded-xl border border-slate-900/50">
                          {nom.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar Guide */}
              <div className="lg:col-span-1 space-y-6 self-start">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-indigo-400" />
                    How rankings work
                  </h3>
                  <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                    <p>
                      1. AI aggregates metrics monthly: attendance logs, completed tasks, and volunteering hours.
                    </p>
                    <p>
                      2. Configurations define the minimum eligibility bars. Candidates below the bars are excluded.
                    </p>
                    <p>
                      3. Qualified scores are evaluated using rule weightages: 
                      <span className="block font-mono text-[10px] text-indigo-400 mt-1 bg-slate-950 p-2 rounded">
                        Score = (Events * W) + (Hours * W) + (Tasks * W)
                      </span>
                    </p>
                    <p>
                      4. Top 3 candidates are nominated. Admins review and approve to distribute digital badges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Winners Gallery Tab */}
          {activeTab === 'gallery' && (
            <div>
              {winners.length === 0 ? (
                <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center max-w-3xl mx-auto">
                  <Award className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                  <h3 className="text-base font-bold text-slate-400">Winners Gallery is empty</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    No nominations have been approved as winners yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {winners.map((win) => (
                    <div
                      key={win.id}
                      className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col items-center gap-5 relative group hover:border-amber-500/35 transition-all"
                    >
                      {/* Badge Icon */}
                      <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.05)]">
                        <Award className="h-10 w-10" />
                      </div>

                      {/* Details */}
                      <div className="text-center space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {win.nomination.period}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-200">
                          {win.nomination.member.firstName} {win.nomination.member.lastName}
                        </h3>
                        <p className="text-xs text-indigo-400 font-semibold">
                          {win.nomination.awardRule.name}
                        </p>
                      </div>

                      {/* Link to Certificate */}
                      <a
                        href={`/awards/certificate/${win.nomination.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full mt-2 bg-slate-950/80 hover:bg-indigo-650/15 border border-slate-800 hover:border-indigo-600/40 text-slate-300 hover:text-indigo-400 text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Print Certificate
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Rules Manager Tab (Admin) */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <h2 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-400" />
                Award Metrics Configuration
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rules.map((rule) => {
                  const ruleFormId = `rule-form-${rule.id}`;
                  return (
                    <div key={rule.id} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-200">{rule.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">{rule.description}</p>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = e.target as HTMLFormElement;
                          const data = {
                            minEvents: Number((form.elements.namedItem('minEvents') as HTMLInputElement).value),
                            minVolHours: Number((form.elements.namedItem('minVolHours') as HTMLInputElement).value),
                            minTasks: Number((form.elements.namedItem('minTasks') as HTMLInputElement).value),
                            weightEvents: Number((form.elements.namedItem('weightEvents') as HTMLInputElement).value),
                            weightVolHrs: Number((form.elements.namedItem('weightVolHrs') as HTMLInputElement).value),
                            weightTasks: Number((form.elements.namedItem('weightTasks') as HTMLInputElement).value),
                          };
                          handleWeightsUpdate(rule.id, data);
                        }}
                        className="space-y-4 text-xs"
                      >
                        {/* Minimum Eligibility Rows */}
                        <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <div>
                            <label className="block text-slate-400 mb-1">Min Events</label>
                            <input
                              type="number"
                              name="minEvents"
                              defaultValue={rule.minEvents}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Min Hours</label>
                            <input
                              type="number"
                              name="minVolHours"
                              defaultValue={rule.minVolHours}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Min Tasks</label>
                            <input
                              type="number"
                              name="minTasks"
                              defaultValue={rule.minTasks}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Weightages Config Rows */}
                        <div className="grid grid-cols-3 gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-900">
                          <div>
                            <label className="block text-slate-400 mb-1">Event Weight</label>
                            <input
                              type="number"
                              step="0.1"
                              name="weightEvents"
                              defaultValue={rule.weightEvents}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Hour Weight</label>
                            <input
                              type="number"
                              step="0.1"
                              name="weightVolHrs"
                              defaultValue={rule.weightVolHrs}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Task Weight</label>
                            <input
                              type="number"
                              step="0.1"
                              name="weightTasks"
                              defaultValue={rule.weightTasks}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Save Config
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default AwardsDashboard;
