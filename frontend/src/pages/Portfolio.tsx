import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  User,
  FileText,
  Globe,
  Settings,
  Trophy,
  Code2,
  FolderGit2,
  Calendar,
  Plus,
  Loader2,
  CheckCircle2,
  TrendingUp,
  XCircle,
} from 'lucide-react';

interface PortfolioData {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  unitNumber: string;
  phone: string | null;
  bio: string | null;
  skills: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  techStack: string | null;
  totalScore: number;
  contributions: Array<{
    id: string;
    activityType: string;
    description: string;
    scorePoints: number;
    date: string;
  }>;
  projectMembers: Array<{
    id: string;
    role: string;
    project: {
      id: string;
      title: string;
      status: string;
    };
  }>;
  awardNominations: Array<{
    id: string;
    period: string;
    awardRule: {
      name: string;
    };
  }>;
}

const Portfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Default to logged-in user member ID if no ID in URL parameters
  const memberId = id || user?.member?.id;

  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm<{
    bio: string;
    skills: string;
    techStack: string;
    githubUrl: string;
    linkedinUrl: string;
    resumeUrl: string;
    portfolioUrl: string;
  }>();

  const fetchPortfolio = async () => {
    if (!memberId) return;
    try {
      setLoading(true);
      const res = await api.get(`/portfolio/${memberId}`);
      if (res.data?.success) {
        setData(res.data.portfolio);
        reset(res.data.portfolio);
      }
    } catch (err: any) {
      showToast('Failed to load portfolio details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [memberId]);

  const handleUpdatePortfolio = async (formData: any) => {
    try {
      const res = await api.put('/portfolio', formData);
      if (res.data?.success) {
        showToast('Portfolio profile updated successfully.', 'success');
        setEditModalOpen(false);
        fetchPortfolio();
      }
    } catch (err: any) {
      showToast('Failed to update portfolio.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center max-w-lg mx-auto">
        <User className="h-10 w-10 text-slate-700 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Portfolio record not found.</p>
      </div>
    );
  }

  const isOwnProfile = user?.member?.id === data.id;

  return (
    <AnimatedPage>
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 1. Profile Hero Section */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8 bg-slate-900/30">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
        
        {/* Avatar */}
        <div className="h-28 w-28 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-4xl shadow-md">
          {data.firstName[0]}
          {data.lastName[0]}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
                {data.firstName} {data.lastName}
              </h2>
              <span className="text-[10px] font-bold bg-indigo-550/15 border border-indigo-500/30 text-indigo-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                IEEE Member
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              {data.bio || 'This member has not written a bio yet.'}
            </p>
          </div>

          {/* Social Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-400 text-xs">
            {data.githubUrl && (
              <a href={data.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                <FolderGit2 className="h-4 w-4" /> GitHub
              </a>
            )}
            {data.linkedinUrl && (
              <a href={data.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                <User className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {data.resumeUrl && (
              <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                <FileText className="h-4 w-4" /> Resume
              </a>
            )}
            {data.portfolioUrl && (
              <a href={data.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-200 transition-colors">
                <Globe className="h-4 w-4" /> Personal Website
              </a>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isOwnProfile && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="md:self-start bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-250 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Settings className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* 2. Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Contribution Analytics, Projects, Awards) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Projects Contributed To */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <FolderGit2 className="h-5 w-5 text-indigo-400" />
              Active Projects Mapped
            </h3>
            {data.projectMembers.length === 0 ? (
              <p className="text-xs text-slate-500">Not participating in active project workspaces yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.projectMembers.map((pm) => (
                  <div key={pm.id} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-350 text-xs">{pm.project.title}</h4>
                      <span className="text-[8px] font-bold bg-slate-900 border border-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                        {pm.project.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Role: {pm.role}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline / Logs */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              Contribution Timeline Logs
            </h3>
            {data.contributions.length === 0 ? (
              <p className="text-xs text-slate-500 font-serif">No activities logged yet.</p>
            ) : (
              <div className="space-y-4">
                {data.contributions.map((act) => (
                  <div key={act.id} className="flex gap-4 items-start relative border-l border-slate-850 pl-4 pb-2">
                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-indigo-500/20 border border-indigo-400" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(act.date).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">+{act.scorePoints} Points</span>
                      </div>
                      <h4 className="font-bold text-slate-350 text-xs mt-1">{act.description}</h4>
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block mt-0.5">
                        Category: {act.activityType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (Metrics, Badges, Tech Stack) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Analytics Stats */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 bg-gradient-to-br from-indigo-950/10 via-purple-950/5 to-slate-900/30">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Contribution Analytics
            </h3>
            <div className="text-center bg-slate-950/50 p-6 rounded-2xl border border-slate-900/80">
              <span className="text-5xl font-black tracking-tight text-white block">
                {data.totalScore}
              </span>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-2">
                Overall Contribution Score
              </p>
            </div>
          </div>

          {/* Badges / Verified Awards */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Verified Badges ({data.awardNominations.length})
            </h3>
            {data.awardNominations.length === 0 ? (
              <p className="text-xs text-slate-500">No verified badges claimed yet.</p>
            ) : (
              <div className="space-y-3">
                {data.awardNominations.map((nom) => (
                  <div key={nom.id} className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-850 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Trophy className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-250 text-xs">{nom.awardRule.name}</h4>
                      <p className="text-[9px] text-slate-500">Period: {nom.period}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills & Tech Stack */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="text-base font-extrabold text-slate-200 flex items-center gap-2">
              <Code2 className="h-5 w-5 text-indigo-400" />
              Technical Stack
            </h3>
            <div className="space-y-4 text-xs">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">
                  Skills:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(data.skills || '').split(',').filter(Boolean).map((skill, idx) => (
                    <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[10px]">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-black tracking-wider mb-2">
                  Languages & Frameworks:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(data.techStack || '').split(',').filter(Boolean).map((tech, idx) => (
                    <span key={idx} className="bg-indigo-650/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-xl text-[10px] font-mono">
                      {tech.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-lg w-full my-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-250">Edit Portfolio Details</h2>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleUpdatePortfolio)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Biography Profile Bio</label>
                <textarea
                  {...register('bio')}
                  placeholder="Tell peers about your focus, experience, and timeline goals..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Skills (Comma-separated)</label>
                  <input
                    type="text"
                    {...register('skills')}
                    placeholder="WebDev, Public Speaking, Writing"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Languages & Tech Stack</label>
                  <input
                    type="text"
                    {...register('techStack')}
                    placeholder="React, SQLite, TypeScript"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">GitHub Profile Link</label>
                  <input
                    type="url"
                    {...register('githubUrl')}
                    placeholder="https://github.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">LinkedIn Profile Link</label>
                  <input
                    type="url"
                    {...register('linkedinUrl')}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">Resume File Link</label>
                  <input
                    type="url"
                    {...register('resumeUrl')}
                    placeholder="Link to GDrive / Dropbox PDF"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Portfolio Link</label>
                  <input
                    type="url"
                    {...register('portfolioUrl')}
                    placeholder="https://..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Portfolio;
