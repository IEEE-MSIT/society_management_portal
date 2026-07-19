import React, { useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import SplitText from '../components/SplitText.js';
import { gsap } from 'gsap';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  Building,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Activity,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animated Counter – counts from 0 to target on mount               */
/* ------------------------------------------------------------------ */
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1.5,
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val).toString();
      },
    });
    return () => { tween.kill(); };
  }, [value, duration]);

  return <span ref={ref}>0</span>;
};

/* ------------------------------------------------------------------ */
/*  Dashboard Component                                               */
/* ------------------------------------------------------------------ */
const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch members to compute metrics (retrieve up to 100 members to compute client-side stats)
  const { data, isLoading, error } = useQuery({
    queryKey: ['members', 'dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/members', {
        params: { limit: 100, page: 1 },
      });
      return response.data;
    },
  });

  const members = data?.data || [];
  const totalCount = data?.meta?.total || members.length;

  const activeCount = members.filter((m: any) => m.status === 'ACTIVE').length;
  const inactiveCount = members.filter((m: any) => m.status !== 'ACTIVE').length;

  const coreTeamCount = members.filter(
    (m: any) => m.user?.role?.name === 'Core Admin' || m.user?.role?.name === 'Core Team Lead'
  ).length;

  const recentMembers = members.slice(0, 4);

  /* ----- GSAP: Hero entrance animation ----- */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const ctx = gsap.context(() => {
      // Hero panel slides up and fades in
      gsap.fromTo(hero,
        { y: 40, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
      );
      // Badge pops in
      const badge = hero.querySelector('.hero-badge');
      if (badge) {
        gsap.fromTo(badge,
          { y: -20, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, delay: 0.3, ease: 'back.out(1.7)' }
        );
      }
      // Description text fades up
      const desc = hero.querySelector('.hero-desc');
      if (desc) {
        gsap.fromTo(desc,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, delay: 0.5, ease: 'power2.out' }
        );
      }
      // Buttons stagger in
      const buttons = hero.querySelectorAll('.hero-btn');
      if (buttons.length) {
        gsap.fromTo(buttons,
          { y: 20, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, delay: 0.7, stagger: 0.12, ease: 'back.out(1.5)' }
        );
      }
    }, hero);
    return () => ctx.revert();
  }, []);

  /* ----- GSAP: Metric cards stagger animation ----- */
  useEffect(() => {
    const container = cardsRef.current;
    if (!container || isLoading || error) return;
    const cards = container.querySelectorAll('.metric-card');
    if (!cards.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(cards,
        { y: 60, opacity: 0, scale: 0.9, rotateX: 15 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          duration: 0.6, stagger: 0.1, delay: 0.3,
          ease: 'power3.out',
        }
      );
    }, container);
    return () => ctx.revert();
  }, [isLoading, error, data]);

  /* ----- GSAP: Bottom grid animation ----- */
  useEffect(() => {
    const container = bottomRef.current;
    if (!container || isLoading) return;
    const ctx = gsap.context(() => {
      const sections = container.querySelectorAll('.animate-section');
      if (sections.length) {
        gsap.fromTo(sections,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, delay: 0.6, ease: 'power3.out' }
        );
      }
      // Member rows slide in from the left
      const memberRows = container.querySelectorAll('.member-row');
      if (memberRows.length) {
        gsap.fromTo(memberRows,
          { x: -30, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 1.0, ease: 'power2.out' }
        );
      }
      // Quick action links pop in
      const quickLinks = container.querySelectorAll('.quick-link');
      if (quickLinks.length) {
        gsap.fromTo(quickLinks,
          { x: 30, opacity: 0, scale: 0.95 },
          { x: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, delay: 1.1, ease: 'power2.out' }
        );
      }
    }, container);
    return () => ctx.revert();
  }, [isLoading, data]);

  /* ----- Card hover tilt handler ----- */
  const handleCardMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    gsap.to(card, { rotateY: x, rotateX: y, duration: 0.3, ease: 'power2.out', transformPerspective: 600 });
  }, []);

  const handleCardLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' });
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Hero Panel */}
      <div ref={heroRef} className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-900 p-6 md:p-8 shadow-2xl" style={{ opacity: 0 }}>
        {/* Animated Aurora Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="particle particle-1" />
          <div className="particle particle-2" />
          <div className="particle particle-3" />
          <div className="particle particle-4" />
          <div className="particle particle-5" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="hero-badge inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" style={{ opacity: 0 }}>
              <Sparkles size={12} className="animate-pulse-slow" />
              {user?.societyName || 'Greenwood'}
            </div>
            <SplitText text={"Hello, " + (user?.member?.firstName || "User") + "!"} delay={400} duration={0.6} className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight" />
            <p className="hero-desc text-sm md:text-base text-slate-400 max-w-xl" style={{ opacity: 0 }}>
              Welcome to your Society Management Portal. You are logged in as a{' '}
              <span className="text-indigo-400 font-medium">{user?.role?.name}</span>. Here is the latest overview of your society membership.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasPermission('member:create') && (
              <Link
                to="/members/add"
                className="hero-btn flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-300 hover:-translate-y-0.5"
                style={{ opacity: 0 }}
              >
                <UserPlus size={16} />
                Add Member
              </Link>
            )}
            <Link
              to="/members"
              className="hero-btn flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 hover:shadow-lg text-slate-200 border border-slate-700 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
              style={{ opacity: 0 }}
            >
              View Members
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl h-32 animate-pulse space-y-3">
              <div className="h-4 w-2/3 bg-slate-800 rounded"></div>
              <div className="h-8 w-1/3 bg-slate-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          Failed to load dashboard metrics. Please reload the page.
        </div>
      ) : (
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" style={{ perspective: '800px' }}>
          {/* Card 1: Total Members */}
          <div
            className="metric-card glass-panel p-5 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 group relative cursor-default"
            onMouseMove={handleCardMouse}
            onMouseLeave={handleCardLeave}
            style={{ opacity: 0, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Members</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">
                  <AnimatedCounter value={totalCount} />
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <Users size={20} />
              </div>
            </div>
            <div className="relative flex items-center gap-1.5 mt-4 text-xs text-indigo-400">
              <TrendingUp size={14} className="animate-bounce-subtle" />
              <span>Registered in database</span>
            </div>
          </div>

          {/* Card 2: Active Members */}
          <div
            className="metric-card glass-panel p-5 rounded-2xl hover:border-emerald-500/30 transition-all duration-300 group relative cursor-default"
            onMouseMove={handleCardMouse}
            onMouseLeave={handleCardLeave}
            style={{ opacity: 0, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Status</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">
                  <AnimatedCounter value={activeCount} />
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <UserCheck size={20} />
              </div>
            </div>
            <div className="relative flex items-center gap-1.5 mt-4 text-xs text-emerald-400">
              <Activity size={14} className="animate-pulse" />
              <span>Currently active accounts</span>
            </div>
          </div>

          {/* Card 3: Inactive/Suspended */}
          <div
            className="metric-card glass-panel p-5 rounded-2xl hover:border-rose-500/30 transition-all duration-300 group relative cursor-default"
            onMouseMove={handleCardMouse}
            onMouseLeave={handleCardLeave}
            style={{ opacity: 0, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive Status</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">
                  <AnimatedCounter value={inactiveCount} />
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-rose-950 text-rose-400 border border-rose-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <UserX size={20} />
              </div>
            </div>
            <div className="relative flex items-center gap-1.5 mt-4 text-xs text-rose-400">
              <span>Suspended or inactive</span>
            </div>
          </div>

          {/* Card 4: Core Team Members */}
          <div
            className="metric-card glass-panel p-5 rounded-2xl hover:border-amber-500/30 transition-all duration-300 group relative cursor-default"
            onMouseMove={handleCardMouse}
            onMouseLeave={handleCardLeave}
            style={{ opacity: 0, transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Management</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-2">
                  <AnimatedCounter value={coreTeamCount} />
                </h3>
              </div>
              <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-500/10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="relative flex items-center gap-1.5 mt-4 text-xs text-amber-400">
              <span>Admins & Team Leads</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Activity & Quick Actions */}
      <div ref={bottomRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Members Panel */}
        <div className="animate-section lg:col-span-2 glass-panel p-6 rounded-2xl space-y-5" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" />
              Recently Registered Members
            </h2>
            <Link to="/members" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors hover:underline underline-offset-2">
              View All
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 bg-slate-800 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/4 bg-slate-800 rounded"></div>
                    <div className="h-2.5 w-1/3 bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentMembers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No members found.</p>
          ) : (
            <div className="divide-y divide-slate-850">
              {recentMembers.map((member: any, idx: number) => (
                <div key={member.id} className="member-row flex items-center justify-between py-3.5 first:pt-0 last:pb-0 hover:bg-slate-800/30 -mx-3 px-3 rounded-lg transition-colors duration-200" style={{ opacity: 0 }}>
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-sm border-2 border-indigo-400/20 shrink-0 group-hover:scale-105 transition-transform">
                      {member.firstName[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-200 truncate">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">{member.user?.email || 'No email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        member.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                      }`}
                    >
                      {member.status}
                    </span>
                    <Link
                      to={`/members/${member.id}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all duration-200"
                      title="View Profile"
                    >
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & System Info */}
        <div className="space-y-6">
          <div className="animate-section glass-panel p-6 rounded-2xl space-y-4" style={{ opacity: 0 }}>
            <h2 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2.5 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              Portal Quick Access
            </h2>
            <div className="space-y-2.5">
              <Link
                to={user?.member ? `/members/${user.member.id}` : '#'}
                className="quick-link flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/20 transition-all duration-300 text-sm group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
                style={{ opacity: 0 }}
              >
                <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all duration-300">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">My Profile</p>
                  <p className="text-[10px] text-slate-400">View your assigned privileges</p>
                </div>
              </Link>

              {hasPermission('member:create') && (
                <Link
                  to="/members/add"
                  className="quick-link flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/20 transition-all duration-300 text-sm group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
                  style={{ opacity: 0 }}
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all duration-300">
                    <UserPlus size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Add Member Profile</p>
                    <p className="text-[10px] text-slate-400">Register a new resident user</p>
                  </div>
                </Link>
              )}
            </div>
          </div>

          {/* System Environment Info */}
          <div className="animate-section glass-panel p-5 rounded-2xl bg-slate-900/30 text-xs text-slate-400 space-y-3" style={{ opacity: 0 }}>
            <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-800/80 pb-2">
              <Clock size={14} className="animate-spin-slow" />
              <span>Session Log Info</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Active Tenant:</span>
                <span className="font-semibold text-slate-200">{user?.societyName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Access Level:</span>
                <span className="font-semibold text-indigo-400">{user?.role?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Permissions Count:</span>
                <span className="font-semibold text-slate-200">{user?.permissions.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
