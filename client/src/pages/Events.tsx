import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Calendar,
  MapPin,
  Users,
  Mic,
  DollarSign,
  QrCode,
  CheckCircle,
  Plus,
  Cpu,
  Loader2,
  XCircle,
  AlertTriangle,
  BadgeAlert,
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  location: string;
  budget: number;
  speakerInfo: string | null;
  sponsorInfo: string | null;
  registrations: Array<{
    id: string;
    memberId: string;
    isCheckedIn: boolean;
    checkInCode: string;
  }>;
}

const Events: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [aiPlanning, setAiPlanning] = useState(false);

  // AI Planner Suggestion State
  const [aiPlan, setAiPlan] = useState<{
    schedule: string[];
    budget: { marketing: number; catering: number; logistics: number; prizes: number; total: number };
    risks: string[];
    marketingStrategy: string;
  } | null>(null);

  const { register: eventReg, handleSubmit: eventSub, watch: eventWatch, setValue: eventSetValue, reset: eventReset } = useForm<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    budget: number;
    speakers: string;
    sponsors: string;
  }>();

  const { register: checkinReg, handleSubmit: checkinSub, reset: checkinReset } = useForm<{
    checkInCode: string;
  }>();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      if (res.data?.success) {
        setEvents(res.data.events);
      }
    } catch (err: any) {
      showToast('Failed to load society events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    try {
      const res = await api.post(`/events/${eventId}/register`);
      if (res.data?.success) {
        showToast('Successfully registered for the event! QR pass issued.', 'success');
        fetchEvents();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to register.', 'error');
    }
  };

  const handleCreateEvent = async (data: any) => {
    try {
      const res = await api.post('/events', data);
      if (res.data?.success) {
        showToast('New society event published successfully.', 'success');
        setModalOpen(false);
        setAiPlan(null);
        eventReset();
        fetchEvents();
      }
    } catch (err: any) {
      showToast('Failed to publish event.', 'error');
    }
  };

  const handleRunAIPlanner = async () => {
    const title = eventWatch('title');
    const description = eventWatch('description');
    if (!title || !description) {
      showToast('Please enter an event title and description first to generate AI plan.', 'info');
      return;
    }

    try {
      setAiPlanning(true);
      const res = await api.post('/ai/event-planner', { title, description });
      if (res.data?.success) {
        const plan = res.data.plan;
        setAiPlan(plan);
        // Auto populate budget
        if (plan.budget?.total) {
          eventSetValue('budget', plan.budget.total);
        }
        showToast('AI event structure and budget estimate generated!', 'success');
      }
    } catch (err) {
      showToast('Failed to query AI event planner.', 'error');
    } finally {
      setAiPlanning(false);
    }
  };

  const handleCheckin = async (data: any) => {
    if (!activeEvent) return;
    try {
      const res = await api.post(`/events/${activeEvent.id}/checkin`, { checkInCode: data.checkInCode });
      if (res.data?.success) {
        showToast(res.data.message || 'Check-in verified.', 'success');
        setCheckinModalOpen(false);
        checkinReset();
        fetchEvents();
        // reload details
        const updatedEvent = events.find((e) => e.id === activeEvent.id);
        if (updatedEvent) setActiveEvent(updatedEvent);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to verify check-in.', 'error');
    }
  };

  // Helper: check if logged-in user is registered
  const getRegistration = (event: Event) => {
    if (!user) return undefined;
    return event.registrations.find((r) => r.memberId === user?.member?.id);
  };

  return (
    <AnimatedPage>
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-850 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-red-400">
            Event Management Hub
          </h1>
          <p className="text-sm text-slate-400">
            Intelligent event planner, attendee check-in tickets, and sponsor details.
          </p>
        </div>
        {user?.role?.name === 'Core Admin' && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
          >
            <Plus className="h-4 w-4" />
            Publish Event
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading events calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events Listings */}
          <div className="lg:col-span-2 space-y-6">
            {events.length === 0 ? (
              <div className="glass-panel p-20 rounded-2xl border border-slate-800 text-center">
                <Calendar className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                <p className="text-sm text-slate-500">No events scheduled currently.</p>
              </div>
            ) : (
              events.map((event) => {
                const reg = getRegistration(event);
                const isWinner = reg?.isCheckedIn;
                return (
                  <div
                    key={event.id}
                    className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-6 hover:border-slate-700 transition-colors shadow-lg"
                  >
                    {/* Event Banner Placeholder */}
                    <div className="h-28 w-full md:w-28 bg-gradient-to-tr from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl flex flex-col items-center justify-center text-orange-400 font-bold text-center p-4">
                      <Calendar className="h-8 w-8 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider">
                        {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-extrabold text-slate-200 text-lg leading-snug">{event.title}</h3>
                          {reg && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                              isWinner
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}>
                              {isWinner ? 'CHECKED IN' : 'REGISTERED'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-normal">{event.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-650" />
                          {event.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-650" />
                          {event.registrations.length} Attending
                        </span>
                        {event.speakerInfo && (
                          <span className="flex items-center gap-1">
                            <Mic className="h-3.5 w-3.5 text-slate-650" />
                            {event.speakerInfo}
                          </span>
                        )}
                      </div>

                      {/* Register / Scan buttons */}
                      <div className="flex gap-3">
                        {!reg ? (
                          <button
                            onClick={() => handleRegister(event.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold px-4 py-2 rounded-lg cursor-pointer"
                          >
                            Register Ticket
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveEvent(event);
                              setCheckinModalOpen(true);
                            }}
                            className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 text-[10px] font-extrabold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            Ticket QR Pass
                          </button>
                        )}
                        {user?.role?.name === 'Core Admin' && (
                          <button
                            onClick={() => {
                              setActiveEvent(event);
                              setCheckinModalOpen(true);
                            }}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            Scan Ticket Code
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Guide */}
          <div className="lg:col-span-1 space-y-6 self-start">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Mic className="h-4 w-4 text-orange-400" />
                Featured Speaker Sessions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with industry professionals and developers. Active attendance logs automatically build points to boost your society contribution score.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
         MODALS (Publish Event, Ticket Scanner)
         ========================================== */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-2xl w-full my-8 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-250">Publish New Event</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={eventSub(handleCreateEvent)} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Event Title</label>
                    <input
                      type="text"
                      required
                      {...eventReg('title')}
                      placeholder="e.g. AI Sprints Hackathon"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Description</label>
                    <textarea
                      required
                      {...eventReg('description')}
                      placeholder="Explain speaker agenda, timelines, and rewards..."
                      rows={5}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRunAIPlanner}
                    disabled={aiPlanning}
                    className="w-full bg-slate-950 hover:bg-indigo-650/15 border border-slate-800 hover:border-indigo-600/40 text-indigo-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {aiPlanning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Cpu className="h-3.5 w-3.5" />
                    )}
                    Generate AI Plan & Budget
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        required
                        {...eventReg('startDate')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">End Date</label>
                      <input
                        type="datetime-local"
                        required
                        {...eventReg('endDate')}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Location</label>
                      <input
                        type="text"
                        required
                        {...eventReg('location')}
                        placeholder="Lab 4 / Seminar Hall"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Budget Allocation ($)</label>
                      <input
                        type="number"
                        {...eventReg('budget')}
                        placeholder="Estimated costs"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-1">Speakers</label>
                      <input
                        type="text"
                        {...eventReg('speakers')}
                        placeholder="John Doe, Jane Smith"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Sponsors</label>
                      <input
                        type="text"
                        {...eventReg('sponsors')}
                        placeholder="Google, IEEE India"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Planner Suggestions Box */}
              {aiPlan && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-amber-500" />
                    AI Plan Proposal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-slate-400 leading-normal">
                    <div className="space-y-1.5">
                      <span className="block font-bold text-slate-300">Suggested Timeline:</span>
                      {aiPlan.schedule.map((s, idx) => (
                        <p key={idx}>{s}</p>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="block font-bold text-slate-300">Cost Breakdown:</span>
                        <p>Marketing: ${aiPlan.budget.marketing} | Catering: ${aiPlan.budget.catering} | Logistics: ${aiPlan.budget.logistics}</p>
                      </div>
                      <div>
                        <span className="block font-bold text-slate-300">Risks Identified:</span>
                        {aiPlan.risks.map((r, idx) => (
                          <p key={idx} className="text-red-400">{r}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold py-2.5 rounded-xl cursor-pointer">
                Publish Event Page
              </button>
            </form>
          </div>
        </div>
      )}

      {checkinModalOpen && activeEvent && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 max-w-sm w-full space-y-6 text-center">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-350 text-left">Verify Check-In Ticket</h2>
              <button onClick={() => setCheckinModalOpen(false)} className="text-slate-500 hover:text-slate-400 cursor-pointer">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Display check-in pass for normal members */}
            {getRegistration(activeEvent) && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      getRegistration(activeEvent)!.checkInCode
                    )}`}
                    alt="Ticket QR Code"
                    className="w-36 h-36 mx-auto"
                  />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-widest text-indigo-400 block font-mono">
                    {getRegistration(activeEvent)!.checkInCode}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Unique Entry Pass</p>
                </div>
              </div>
            )}

            {/* Verification scanner for Admins */}
            {user?.role?.name === 'Core Admin' && (
              <form onSubmit={checkinSub(handleCheckin)} className="space-y-4 text-xs pt-4 border-t border-slate-850">
                <input
                  type="text"
                  required
                  {...checkinReg('checkInCode')}
                  placeholder="Enter 8-Digit Code (e.g. EV-123456)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-slate-200 text-sm font-mono focus:outline-none"
                />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl cursor-pointer">
                  Confirm Check-In Entry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Events;
