import React, { useState, useEffect } from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { useForm } from 'react-hook-form';
import api from '../services/api.js';
import { useToast } from '../context/ToastContext.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  PlusCircle,
  BookOpen,
  Info,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Facility {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  capacity: number | null;
  costPerHour: number;
}

interface Booking {
  id: string;
  facility: {
    name: string;
    location: string | null;
  };
  startTime: string;
  endTime: string;
  status: string;
  cost: number;
}

interface BookingFormInput {
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
}

const Bookings: React.FC = () => {
  const { showToast } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<BookingFormInput>();

  const selectedFacilityId = watch('facilityId');
  const selectedFacility = (facilities || []).find((f) => f.id === selectedFacilityId);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch facilities
      const facResponse = await api.get('/bookings/facilities');
      if (facResponse.data?.success) {
        setFacilities(facResponse.data.facilities || facResponse.data.data || []);
      }

      // Fetch bookings list
      const bookResponse = await api.get('/bookings');
      if (bookResponse.data?.success) {
        setBookings(bookResponse.data.bookings || bookResponse.data.data || []);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch bookings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: BookingFormInput) => {
    try {
      setSubmitting(true);

      // Construct ISO timestamp strings from Date + Time inputs
      const startDateTime = new Date(`${data.date}T${data.startTime}:00`).toISOString();
      const endDateTime = new Date(`${data.date}T${data.endTime}:00`).toISOString();

      // Check validation helper: end must be after start
      if (new Date(endDateTime) <= new Date(startDateTime)) {
        showToast('End time must be later than the start time.', 'error');
        return;
      }

      const response = await api.post('/bookings', {
        facilityId: data.facilityId,
        startTime: startDateTime,
        endTime: endDateTime,
      });

      if (response.data?.success) {
        showToast('Facility booked successfully! Overlap conflict validation passed.', 'success');
        reset();
        // Refresh bookings log
        const bookResponse = await api.get('/bookings');
        if (bookResponse.data?.success) {
          setBookings(bookResponse.data.bookings);
        }
      }
    } catch (err: any) {
      // Overlap error messages returned by BookingService will trigger here
      showToast(
        err.response?.data?.message || 'Failed to book facility. Double check scheduling conflicts.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Facility Bookings
        </h1>
        <p className="text-sm text-slate-400">
          Schedule amenity reservations. Our scheduling engine automatically guards against time slot overlap conflicts.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-slate-400">Loading scheduling panels...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Bookings list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Facilities Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilities.map((fac) => (
                <div key={fac.id} className="glass-panel p-5 rounded-2xl border border-slate-800 shadow flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-extrabold text-slate-100">{fac.name}</h3>
                    <span className="flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <DollarSign className="h-3 w-3" />
                      {fac.costPerHour === 0 ? 'Free' : `${fac.costPerHour}/hr`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {fac.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                    {fac.location || 'Within complex'}
                  </div>
                </div>
              ))}
            </div>

            {/* Bookings log table */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl">
              <h2 className="text-lg font-extrabold text-slate-100 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                Your Booking History
              </h2>
              {bookings.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl">
                  <Calendar className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">You have no reservations logged.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        <th className="py-3 px-2">Amenity</th>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Timing</th>
                        <th className="py-3 px-2 text-right">Cost</th>
                        <th className="py-3 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/80">
                      {bookings.map((booking) => {
                        const startDate = new Date(booking.startTime);
                        const endDate = new Date(booking.endTime);
                        return (
                          <tr key={booking.id} className="hover:bg-slate-900/25 transition-colors text-xs text-slate-300">
                            <td className="py-3 px-2 font-bold text-slate-200">{booking.facility.name}</td>
                            <td className="py-3 px-2">{startDate.toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-2 text-right font-mono font-semibold text-emerald-400">
                              ${booking.cost}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Reservation Request Form */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6 self-start">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-indigo-500" />
                Reserve Amenity
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Select Amenity</label>
                  <select
                    {...register('facilityId', { required: 'Please select a facility' })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select facility...</option>
                    {facilities.map((fac) => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}
                      </option>
                    ))}
                  </select>
                  {errors.facilityId && <span className="text-xs text-red-500 mt-1 block">{errors.facilityId.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Select Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    {...register('date', { required: 'Date is required' })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.date && <span className="text-xs text-red-500 mt-1 block">{errors.date.message}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Start Time</label>
                    <input
                      type="time"
                      {...register('startTime', { required: 'Start time is required' })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.startTime && <span className="text-xs text-red-500 mt-1 block">{errors.startTime.message}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">End Time</label>
                    <input
                      type="time"
                      {...register('endTime', { required: 'End time is required' })}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors.endTime && <span className="text-xs text-red-500 mt-1 block">{errors.endTime.message}</span>}
                  </div>
                </div>

                {/* Estimate Cost Card */}
                {selectedFacility && (
                  <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl space-y-2 text-xs">
                    <span className="flex items-center gap-1 text-slate-400 font-semibold uppercase tracking-wider">
                      <Info className="h-3.5 w-3.5 text-indigo-400" />
                      Cost breakdown
                    </span>
                    <p className="text-slate-300 leading-normal">
                      Hourly rate: <span className="font-semibold text-emerald-400">${selectedFacility.costPerHour}/hr</span>. 
                      Payment will be auto-billed to your monthly maintenance invoice.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Book Facility
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default Bookings;
