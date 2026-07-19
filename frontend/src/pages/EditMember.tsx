import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';
import AnimatedPage from '../components/AnimatedPage.js';
import { ArrowLeft, User, Save } from 'lucide-react';

const editMemberFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Too long'),
  phone: z.string().optional().nullable(),
  roleId: z.string().min(1, 'Please select a role'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

type EditMemberFormInputs = z.infer<typeof editMemberFormSchema>;

const EditMember: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmittingState, setIsSubmittingState] = useState(false);

  // Fetch member profile details
  const { data: memberData, isLoading: isLoadingMember, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const response = await api.get(`/members/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const member = memberData?.data;

  // Fetch available roles in the society
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/members/roles');
      return response.data;
    },
  });

  const roles = rolesData?.data || [];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditMemberFormInputs>({
    resolver: zodResolver(editMemberFormSchema),
  });

  // Pre-fill form fields when member data is loaded
  useEffect(() => {
    if (member) {
      setValue('firstName', member.firstName);
      setValue('lastName', member.lastName);
      setValue('phone', member.phone || '');
      setValue('roleId', member.user?.role?.id || '');
      setValue('status', member.status);
      setValue('bio', member.bio || '');
      setValue('profileImage', member.profileImage || '');
    }
  }, [member, setValue]);

  // Edit member mutation
  const updateMutation = useMutation({
    mutationFn: async (data: EditMemberFormInputs) => {
      const response = await api.put(`/members/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      showToast('Member profile updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      navigate('/members');
    },
    onError: (err: any) => {
      console.error('Update member error:', err);
      const msg = err.response?.data?.message || 'Failed to update member profile.';
      showToast(msg, 'error');
      setIsSubmittingState(false);
    },
  });

  const onSubmit = (data: EditMemberFormInputs) => {
    setIsSubmittingState(true);
    const submissionData = {
      ...data,
      phone: data.phone === '' ? null : data.phone,
      profileImage: data.profileImage === '' ? null : data.profileImage,
    };
    updateMutation.mutate(submissionData);
  };

  if (isLoadingMember) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Fetching member details...</p>
        </div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="p-6 text-center text-rose-400 space-y-4">
        <p className="font-semibold text-lg">Member profile not found</p>
        <p className="text-sm text-slate-500">The member record might have been soft-deleted or you do not have permission to access it.</p>
        <Link to="/members" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <AnimatedPage>
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back link */}
      <div className="flex items-center gap-2">
        <Link
          to="/members"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Members
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <User className="text-indigo-400" />
          Edit Member Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Modify resident details, update role authority, or adjust status locks.
        </p>
      </div>

      {/* Form Panel */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl border border-slate-800">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="firstName">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.firstName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-4 transition-all`}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs font-medium text-rose-400">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="lastName">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.lastName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-4 transition-all`}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs font-medium text-rose-400">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-450" htmlFor="email">
                Email Address (Username - Read-Only)
              </label>
              <input
                id="email"
                type="email"
                value={member.user?.email || 'N/A'}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-sm text-slate-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="N/A"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-4 transition-all`}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-rose-400">{errors.phone.message}</p>
              )}
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="roleId">
                Portal Access Role <span className="text-rose-500">*</span>
              </label>
              <select
                id="roleId"
                disabled={isSubmittingState || isLoadingRoles}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.roleId ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-4 transition-all appearance-none`}
                {...register('roleId')}
              >
                <option value="">Select Role</option>
                {roles.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <p className="text-xs font-medium text-rose-400">{errors.roleId.message}</p>
              )}
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="status">
                Account Status
              </label>
              <select
                id="status"
                disabled={isSubmittingState}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 focus:outline-none transition-all"
                {...register('status')}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* Profile Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-350" htmlFor="profileImage">
              Profile Image URL (Optional)
            </label>
            <input
              id="profileImage"
              type="text"
              placeholder="N/A"
              disabled={isSubmittingState}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 focus:outline-none transition-all"
              {...register('profileImage')}
            />
          </div>

          {/* Bio Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-350" htmlFor="bio">
              Member Bio (Short notes)
            </label>
            <textarea
              id="bio"
              rows={3}
              placeholder="N/A"
              disabled={isSubmittingState}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 focus:outline-none transition-all resize-none"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-xs font-medium text-rose-400">{errors.bio.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
            <Link
              to={isSubmittingState ? '#' : '/members'}
              onClick={(e) => isSubmittingState && e.preventDefault()}
              className={`px-5 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-250 transition-all ${isSubmittingState ? 'opacity-50 pointer-events-none' : ''}`}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmittingState}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-550 disabled:bg-indigo-855 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-650/15 flex items-center gap-2"
            >
              {isSubmittingState ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default EditMember;
