import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import { io, Socket } from 'socket.io-client';
import api, { getSocketUrl } from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  UserCheck,
  QrCode,
  PlusCircle,
  Phone,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Printer,
  Shield,
  XCircle,
} from 'lucide-react';

interface Visitor {
  id: string;
  name: string;
  phone: string;
  purpose: string;
  passCode: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  createdAt: string;
}

interface VisitorFormInput {
  name: string;
  phone: string;
  purpose: string;
}

const Visitors: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeVisitor, setActiveVisitor] = useState<Visitor | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VisitorFormInput>();

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/visitors');
      if (response.data?.success) {
        const list = response.data.visitors || response.data.data || [];
        setVisitors(list);
        if (list.length > 0 && !activeVisitor) {
          setActiveVisitor(list[0]);
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load visitor logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Socket.IO Real-time updates for security check-ins
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const socket: Socket = io(getSocketUrl(), {
      auth: { token },
    });

    socket.on('visitor_status_changed', (data: { id: string; status: string; checkIn: string | null; checkOut: string | null }) => {
      setVisitors((prev) =>
        prev.map((v) =>
          v.id === data.id
            ? { ...v, status: data.status, checkIn: data.checkIn, checkOut: data.checkOut }
            : v
        )
      );

      // Update active visitor card if matching
      setActiveVisitor((prev) => {
        if (prev && prev.id === data.id) {
          return { ...prev, status: data.status, checkIn: data.checkIn, checkOut: data.checkOut };
        }
        return prev;
      });

      const action = data.status === 'APPROVED' ? 'checked in' : 'checked out';
      showToast(`Visitor status update: Guest ${action}!`, 'info');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const onSubmit = async (data: VisitorFormInput) => {
    try {
      setSubmitting(true);
      const response = await api.post('/visitors/pre-register', data);
      if (response.data?.success) {
        showToast('Guest pre-registered successfully. Gate pass generated!', 'success');
        const newVisitor = response.data.visitor || response.data.data;
        if (newVisitor) {
          setVisitors((prev) => [newVisitor, ...prev]);
          setActiveVisitor(newVisitor);
          reset();
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to pre-register guest', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const [cancelling, setCancelling] = useState(false);

  const handleCancelPass = async (id: string) => {
    try {
      setCancelling(true);
      const response = await api.patch(`/visitors/${id}/cancel`);
      if (response.data?.success) {
        showToast('Visitor pass cancelled successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel pass', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
            CHECKED IN
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            CHECKED OUT
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
            PENDING ENTRY
          </span>
        );
    }
  };

  return (
    <AnimatedPage>
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Visitor Management System
        </h1>
        <p className="text-sm text-slate-400">
          Pre-register visitors, generate instant gate passes, and track entry/exit logs in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pre-register Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-indigo-500" />
              Pre-Register Guest
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Guest Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 99999 99999"
                  {...register('phone', { required: 'Phone is required' })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Purpose of Visit</label>
                <input
                  type="text"
                  placeholder="e.g. Delivery / Family / Maintenance"
                  {...register('purpose', { required: 'Purpose is required' })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {errors.purpose && <span className="text-xs text-red-500 mt-1 block">{errors.purpose.message}</span>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Generate Gate Pass
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Center: Active Gate Pass Card (Printable) */}
        <div className="lg:col-span-1">
          {activeVisitor ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 bg-slate-900/30 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none relative overflow-hidden">
              {/* Card Hologram background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 print:hidden" />
              
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 print:border-black">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-500 print:text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black">
                    Society Gate Pass
                  </span>
                </div>
                <button
                  onClick={handlePrint}
                  className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:bg-slate-850 transition-colors text-indigo-400 print:hidden cursor-pointer"
                  title="Print Gate Pass"
                >
                  <Printer className="h-4 w-4" />
                </button>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center gap-4 bg-slate-950/50 p-6 rounded-xl border border-slate-850/80 print:bg-white print:border-black">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/visitors/verify?otp=${activeVisitor.passCode}`
                  )}`}
                  alt="Scannable Visitor QR Code"
                  className="w-40 h-40 border-2 border-indigo-500/30 p-1.5 rounded-lg bg-white print:border-black shadow-lg"
                />
                <div className="text-center">
                  <span className="text-2xl font-black tracking-[0.25em] text-indigo-400 print:text-black">
                    {activeVisitor.passCode}
                  </span>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 print:text-black">
                    6-Digit Verification OTP
                  </p>
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-850 pb-2 print:border-black">
                  <span className="text-slate-500">Visitor Name:</span>
                  <span className="font-semibold text-slate-200 print:text-black">{activeVisitor.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2 print:border-black">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-semibold text-slate-200 print:text-black">{activeVisitor.phone}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-2 print:border-black">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-semibold text-indigo-400 print:text-black">{activeVisitor.purpose}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-500">Status:</span>
                  <span>{getStatusBadge(activeVisitor.status)}</span>
                </div>
              </div>

              {activeVisitor.status === 'PENDING' && (
                <button
                  onClick={() => handleCancelPass(activeVisitor.id)}
                  disabled={cancelling}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-500/35 hover:bg-red-500/10 text-red-400 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 print:hidden"
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Cancel Pass
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="glass-panel p-20 rounded-2xl border border-slate-800 shadow-xl text-center">
              <QrCode className="h-12 w-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-slate-500">Select a Guest to view pass</h3>
            </div>
          )}
        </div>

        {/* Right: Visitor Logs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[520px]">
            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-500" />
              Recent Logs
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <Calendar className="h-10 w-10 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">No visitors logged today.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {visitors.filter((v) => v && v.id).map((visitor) => (
                  <div
                    key={visitor.id}
                    onClick={() => setActiveVisitor(visitor)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      activeVisitor?.id === visitor.id
                        ? 'bg-indigo-650/15 border-indigo-600/60 shadow-md'
                        : 'bg-slate-950/40 border-slate-900/80 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 text-sm">{visitor.name}</span>
                      <span className="text-[10px]">{getStatusBadge(visitor.status)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-500" />
                        {visitor.phone}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        OTP: {visitor.passCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Visitors;
// Recompile trigger comment
