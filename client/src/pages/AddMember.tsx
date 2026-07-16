import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext.js';
import api from '../services/api.js';
import AnimatedPage from '../components/AnimatedPage.js';
import { ArrowLeft, UserPlus, Save, AlertCircle } from 'lucide-react';

const memberFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'Too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Too long'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional().nullable(),
  roleId: z.string().min(1, 'Please select a role'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional().nullable(),
  profileImage: z.string().optional().nullable(),
});

type MemberFormInputs = z.infer<typeof memberFormSchema>;

const AddMember: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmittingState, setIsSubmittingState] = useState(false);

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
    formState: { errors },
  } = useForm<MemberFormInputs>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: '',
      status: 'ACTIVE',
      bio: '',
      profileImage: '',
    },
  });

  // Create member mutation
  const createMutation = useMutation({
    mutationFn: async (data: MemberFormInputs) => {
      const response = await api.post('/members', data);
      return response.data;
    },
    onSuccess: () => {
      showToast('Member created successfully. A default password has been generated.', 'success');
      queryClient.invalidateQueries({ queryKey: ['members'] });
      navigate('/members');
    },
    onError: (err: any) => {
      console.error('Create member error:', err);
      const msg = err.response?.data?.message || 'Failed to create member profile.';
      showToast(msg, 'error');
      setIsSubmittingState(false);
    },
  });

  const onSubmit = (data: MemberFormInputs) => {
    setIsSubmittingState(true);
    const submissionData = {
      ...data,
      phone: data.phone === '' ? null : data.phone,
      profileImage: data.profileImage === '' ? null : data.profileImage,
    };
    createMutation.mutate(submissionData);
  };

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
          <UserPlus className="text-indigo-400" />
          Add Society Member
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create a member profile. This will automatically generate a user login account with default credentials.
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
                placeholder="Amit"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.firstName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs font-medium text-rose-400">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-355" htmlFor="lastName">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="Sharma"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.lastName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs font-medium text-rose-400">{errors.lastName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="email">
                Email Address (Username) <span className="text-rose-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="amit@example.com"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs font-medium text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-350" htmlFor="phone">
                Phone Number
              </label>
              <input
                id="phone"
                type="text"
                placeholder="9876543210"
                disabled={isSubmittingState}
                className={`w-full px-4 py-2.5 bg-slate-900 border ${
                  errors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-800 focus:ring-indigo-500/20'
                } rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 transition-all`}
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
              placeholder="https://images.unsplash.com/... or relative path"
              disabled={isSubmittingState}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none transition-all"
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
              placeholder="A brief description about the member..."
              disabled={isSubmittingState}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all resize-none"
              {...register('bio')}
            />
            {errors.bio && (
              <p className="text-xs font-medium text-rose-400">{errors.bio.message}</p>
            )}
          </div>

          {/* Alert Box for Generated Password */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Default Credentials Generated</p>
              <p className="mt-0.5 text-slate-400 leading-normal">
                Creating this member will instantiate a User account with password <code className="text-slate-200 font-mono">ChangeMe123!</code>. The user should be instructed to change their password upon their first login.
              </p>
            </div>
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
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-550 disabled:bg-indigo-850 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-650/15 flex items-center gap-2"
            >
              {isSubmittingState ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Saving Member...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Member
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

export default AddMember;
