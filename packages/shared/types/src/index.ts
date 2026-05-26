// User
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workspace
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
}

// Channel
export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members?: string[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Message
export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  attachments: Attachment[];
  replyTo?: string;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

// Reaction
export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

// WebSocket Events
export interface WsEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export type MessageEvent = WsEvent<{
  action: 'create' | 'update' | 'delete';
  message: Message;
}>;

export type ChannelEvent = WsEvent<{
  action: 'create' | 'update' | 'delete';
  channel: Channel;
}>;

export type PresenceEvent = WsEvent<{
  userId: string;
  status: 'online' | 'offline' | 'away';
}>;

export type ReactionEvent = WsEvent<{
  action: 'add' | 'remove';
  reaction: Reaction;
  messageId: string;
}>;

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Workspace Plan
export enum FeatureFlag {
  MAX_USERS_PER_WORKSPACE = 'max_users_per_workspace',
  MAX_STORAGE_GB = 'max_storage_gb',
  MAX_MESSAGE_HISTORY = 'max_message_history',
  AI_SUGGESTIONS = 'ai_suggestions',
  ADVANCED_SEARCH = 'advanced_search',
  CUSTOM_EMOJI = 'custom_emoji',
  PRIORITY_SUPPORT = 'priority_support',
  SSO = 'sso',
  AUDIT_LOG = 'audit_log',
  API_ACCESS = 'api_access',
  CUSTOM_BRANDING = 'custom_branding',
}

export interface WorkspacePlan {
  type: 'free' | 'pro' | 'enterprise';
  features: Record<FeatureFlag, boolean | number>;
  limits: {
    users: number;
    storageGb: number;
    messageHistoryDays: number;
  };
}
