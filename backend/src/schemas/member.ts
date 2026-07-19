import { z } from 'zod';

export const createMemberSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().nullable(),
    roleId: z.string().min(1, 'Role is required'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    bio: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
  }),
});

export const updateMemberSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    phone: z.string().optional().nullable(),
    roleId: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    bio: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
  }),
});

export const queryMemberSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
    search: z.string().optional(),
    status: z.string().optional(),
    roleId: z.string().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
