import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
});

// Workspace
export const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'guest']).default('member'),
});

// Channel
export const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['public', 'private']).default('public'),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

// Message
export const createMessageSchema = z.object({
  channelId: z.string(),
  content: z.string().min(1).max(10000),
  replyTo: z.string().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(32),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

// File
export const uploadFileSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().int().min(1).max(50 * 1024 * 1024), // 50MB
});
