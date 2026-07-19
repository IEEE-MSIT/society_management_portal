import { z } from 'zod';

export const resourceLinkSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  url: z.string().url('Must be a valid URL'),
});

export const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    isPinned: z.boolean().optional().default(false),
    resourceLinks: z.array(resourceLinkSchema).optional().default([]),
  }),
});

export const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200).optional(),
    content: z.string().min(1, 'Content is required').optional(),
    isPinned: z.boolean().optional(),
    resourceLinks: z.array(resourceLinkSchema).optional(),
  }),
});
