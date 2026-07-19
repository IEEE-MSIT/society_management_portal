import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Cpu,
  Loader2,
  FileText,
  Bookmark,
  Zap,
  HelpCircle,
  Code,
  CheckCircle2,
} from 'lucide-react';

const AiHub: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<'writer' | 'resume'>('writer');
  const [generating, setGenerating] = useState(false);
  const [writeResult, setWriteResult] = useState('');
  
  const [resumeResult, setResumeResult] = useState<{
    gaps: string[];
    interviewQuestions: string[];
    recommendations: string;
  } | null>(null);

  const { register: writeReg, handleSubmit: writeSub } = useForm<{
    type: string;
    prompt: string;
  }>();

  const { register: resumeReg, handleSubmit: resumeSub } = useForm<{
    skills: string;
    bio: string;
    techStack: string;
  }>();

  const handleGenerateWriting = async (data: any) => {
    try {
      setGenerating(true);
      setWriteResult('');
      const res = await api.post('/ai/generate-writing', data);
      if (res.data?.success) {
        setWriteResult(res.data.result);
        showToast('AI copy generated!', 'success');
      }
    } catch (err: any) {
      showToast('Failed to generate text.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleResumeReview = async (data: any) => {
    try {
      setGenerating(true);
      setResumeResult(null);
      const res = await api.post('/ai/resume-review', data);
      if (res.data?.success) {
        setResumeResult(res.data.review);
        showToast('AI profile review and skill gaps calculated!', 'success');
      }
    } catch (err: any) {
      showToast('Failed to review profile.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AnimatedPage>
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6 animate-fadeIn">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            AI Productivity Suite
          </h1>
          <p className="text-sm text-slate-400">
            Powered by Google Gemini: generate announcements, draft social copy, review tech resumes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-850 gap-6 text-sm">
        <button
          onClick={() => setActiveTool('writer')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTool === 'writer'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <Zap className="h-4 w-4" />
          Content & Minutes Copywriters
        </button>
        <button
          onClick={() => setActiveTool('resume')}
          className={`pb-3 font-semibold transition-colors flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTool === 'resume'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-300'
          }`}
        >
          <FileText className="h-4 w-4" />
          Resume Analyzer & Gap Checker
        </button>
      </div>

      {activeTool === 'writer' ? (
        /* ==========================================
           1. WRITER TOOL
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Input Panel */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 self-start">
            <h3 className="font-extrabold text-slate-200 text-sm">Generation Parameters</h3>
            <form onSubmit={writeSub(handleGenerateWriting)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Content Type</label>
                <select
                  {...writeReg('type')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-250 focus:outline-none cursor-pointer"
                >
                  <option value="caption">Social Media Poster Caption</option>
                  <option value="minutes">Meeting Minutes & Actions Summarizer</option>
                  <option value="announcement">Official Society Announcement</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Raw Context / Key points</label>
                <textarea
                  required
                  {...writeReg('prompt')}
                  placeholder="Enter agenda points or poster keywords..."
                  rows={6}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cpu className="h-3.5 w-3.5" />
                )}
                Generate Content
              </button>
            </form>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-indigo-400" />
              Generated Document Summary
            </h3>
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-950/30 min-h-[300px]">
              {writeResult ? (
                <div className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">
                  {writeResult}
                </div>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-slate-500 text-xs">
                  Awaiting generation inputs...
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==========================================
           2. RESUME ANALYZER TOOL
           ========================================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Input Panel */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 self-start">
            <h3 className="font-extrabold text-slate-200 text-sm">Resume Parameters</h3>
            <form onSubmit={resumeSub(handleResumeReview)} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Biography / Career Focus</label>
                <textarea
                  required
                  {...resumeReg('bio')}
                  placeholder="Focus areas (e.g. Backend developer seeking web infrastructure roles)..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">List Skills</label>
                <input
                  type="text"
                  required
                  {...resumeReg('skills')}
                  placeholder="React, SQLite, TypeScript"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Target Languages & Frameworks</label>
                <input
                  type="text"
                  required
                  {...resumeReg('techStack')}
                  placeholder="Node.js, AWS Cloud, Docker"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Cpu className="h-3.5 w-3.5" />
                )}
                Analyze Profile
              </button>
            </form>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-extrabold text-slate-200 text-sm flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-400" />
              AI Technical Evaluation Report
            </h3>

            {!resumeResult ? (
              <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                Submit profile details for gap validation review.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Skill Gaps Card */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Identified Gaps to Close
                  </h4>
                  <div className="space-y-2">
                    {resumeResult.gaps.map((gap, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-350">
                        <span className="h-1.5 w-1.5 bg-red-400 rounded-full shrink-0" />
                        {gap}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Prep Questions Card */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4" />
                    Custom Interview Prep Questions
                  </h4>
                  <div className="space-y-3 text-xs text-slate-300">
                    {resumeResult.interviewQuestions.map((q, idx) => (
                      <div key={idx} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex gap-2">
                        <span className="font-bold text-indigo-400 font-mono">Q{idx + 1}:</span>
                        <p>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Recommended Certifications & Sprints
                  </h4>
                  <p className="text-xs text-slate-400 leading-normal">{resumeResult.recommendations}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

// Simple import overrides for alert components in code blocks
const AlertCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

export default AiHub;
