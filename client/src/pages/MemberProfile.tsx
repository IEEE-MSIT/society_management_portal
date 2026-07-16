import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.js';
import api from '../services/api.js';
import AnimatedPage from '../components/AnimatedPage.js';
import { ArrowLeft, Edit2, Phone, Mail, Building, Calendar } from 'lucide-react';

const MemberProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();

  // Fetch member profile details
  const { data: memberData, isLoading, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const response = await api.get(`/members/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const member = memberData?.data;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INACTIVE':
        return 'bg-slate-550/10 text-slate-400 border-slate-700';
      case 'SUSPENDED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-700';
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case 'Core Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Core Team Lead':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Loading profile details...</p>
        </div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="p-6 text-center text-rose-400 space-y-4">
        <p className="font-semibold text-lg">Member not found</p>
        <p className="text-sm text-slate-500">The profile you are looking for might have been soft-deleted or you lack sufficient access permissions.</p>
        <Link to="/members" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <AnimatedPage>
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center">
        <Link
          to="/members"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Members
        </Link>

        {hasPermission('member:update') && (
          <Link
            to={`/members/edit/${member.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/10 transition-all"
          >
            <Edit2 size={12} />
            Edit Profile
          </Link>
        )}
      </div>

      {/* Main Profile Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {member.profileImage ? (
              <img
                src={member.profileImage}
                alt={`${member.firstName} ${member.lastName}`}
                className="h-28 w-28 rounded-full object-cover border-2 border-indigo-500/20"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-indigo-950 flex items-center justify-center font-bold text-4xl text-indigo-400 border-2 border-indigo-500/20">
                {member.firstName[0]}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-1 px-2.5 py-0.5 text-[10px] font-bold rounded border ${getStatusBadge(
                member.status
              )}`}
            >
              {member.status}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {member.firstName} {member.lastName}
            </h2>
            {member.user?.role?.name && (
              <span
                className={`inline-block mt-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(
                  member.user.role.name
                )}`}
              >
                {member.user.role.name}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Profile Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Section: Credentials */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2.5">
              Contact & Membership Info
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shrink-0">
                  <Mail size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-450 uppercase">Email Address</p>
                  <p className="text-sm text-slate-250 font-medium truncate">{member.user?.email || 'N/A'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shrink-0">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-450 uppercase">Phone Number</p>
                  <p className="text-sm text-slate-250 font-medium">{member.phone || '—'}</p>
                </div>
              </div>

              {/* Society */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shrink-0">
                  <Building size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-450 uppercase">Resident Society</p>
                  <p className="text-sm text-slate-250 font-medium">{user?.societyName || 'Greenwood Society'}</p>
                </div>
              </div>

              {/* Joined Date */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-450 uppercase">Registration Date</p>
                  <p className="text-sm text-slate-250 font-medium">
                    {new Date(member.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Biography / Notes */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2.5">
              Biography & Notes
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              {member.bio || 'No profile biography available for this member.'}
            </p>
          </div>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default MemberProfile;
