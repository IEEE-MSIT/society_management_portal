import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import { io, Socket } from 'socket.io-client';
import api, { getSocketUrl } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  ClipboardList,
  AlertTriangle,
  Send,
  Wrench,
  Zap,
  Shield,
  Clock,
  Loader2,
  Filter,
} from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  member: {
    firstName: string;
    lastName: string;
  };
}

interface ComplaintFormInput {
  title: string;
  description: string;
}

const Complaints: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ComplaintFormInput>();

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const response = await api.get('/complaints', { params });
      if (response.data?.success) {
        setComplaints(response.data.complaints);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load complaints', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, priorityFilter]);

  // Socket.IO Real-time Integration
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Real-time Socket.IO connected.');
    });

    socket.on('complaint_created', (newComplaint: any) => {
      // Add the new complaint dynamically to the top of the list
      setComplaints((prev) => [newComplaint, ...prev]);
      showToast(`New complaint submitted: "${newComplaint.title}"`, 'success');
    });

    socket.on('complaint_status_changed', (data: { id: string; status: string }) => {
      setComplaints((prev) =>
        prev.map((c) => (c.id === data.id ? { ...c, status: data.status } : c))
      );
      showToast(`Complaint status updated to ${data.status}`, 'info');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onSubmit = async (data: ComplaintFormInput) => {
    try {
      setSubmitting(true);
      const response = await api.post('/complaints', data);
      if (response.data?.success) {
        showToast('Complaint submitted successfully. AI analysis complete!', 'success');
        reset();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
    } catch (err: any) {
      showToast('Failed to update complaint status', 'error');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            LOW
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PLUMBING':
        return <Wrench className="h-4 w-4 text-cyan-400" />;
      case 'ELECTRICAL':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'SECURITY':
        return <Shield className="h-4 w-4 text-red-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <AnimatedPage>
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          AI-Powered Complaint Desk
        </h1>
        <p className="text-sm text-slate-400">
          Submit issues and have our AI engine automatically categorize and prioritize them for immediate response.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Submit Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl self-start">
          <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            File a Complaint
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-slate-300 mb-2">
                Title / Headline
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Broken corridor light bulb"
                {...register('title', { required: 'Title is required' })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {errors.title && <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-slate-300 mb-2">
                Detailed Description
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Describe the issue in detail to help the AI categorize it..."
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 10, message: 'Description must be at least 10 characters long' },
                })}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {errors.description && <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running AI Classifier...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Complaint
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Log */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold">
              <Filter className="h-4 w-4 text-indigo-400" />
              Filter Complaints
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="SECURITY">Security</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* List content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading complaints log...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-850 rounded-2xl">
              <ClipboardList className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-400">No Complaints Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no open complaints matching the selected filters. Use the form to file a new issue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-md hover:border-slate-700/80 transition-all flex flex-col gap-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                        {getCategoryIcon(complaint.category)}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-200">{complaint.title}</h3>
                        <p className="text-xs text-slate-400">
                          Filed by {complaint.member?.firstName} {complaint.member?.lastName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(complaint.priority)}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        complaint.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' :
                        complaint.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-900/60">
                    {complaint.description}
                  </p>

                  <div className="flex items-center justify-between gap-4 text-xs text-slate-400 pt-2 border-t border-slate-850/80">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      {new Date(complaint.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {/* Admin status control */}
                    {user?.role?.name === 'Core Admin' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Update Status:</label>
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Complaints;
