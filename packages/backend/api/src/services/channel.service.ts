import { Channel } from '../models/channel.model.js';
import { Workspace } from '../models/workspace.model.js';
import type { IChannel } from '../models/channel.model.js';

async function checkWorkspaceAccess(workspaceId: string, userId: string): Promise<boolean> {
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    'members.userId': userId,
  });
  return !!workspace;
}

export async function createChannel(
  data: { name: string; type?: 'public' | 'private' | 'direct'; workspaceId?: string },
  userId: string
): Promise<IChannel> {
  if (!data.workspaceId) {
    throw new Error('workspaceId is required');
  }

  const hasAccess = await checkWorkspaceAccess(data.workspaceId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to workspace');
  }

  return Channel.create({
    workspaceId: data.workspaceId,
    name: data.name,
    type: data.type || 'public',
    members: [],
  });
}

export async function getChannels(
  workspaceId: string,
  userId: string
): Promise<IChannel[]> {
  const hasAccess = await checkWorkspaceAccess(workspaceId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to workspace');
  }

  return Channel.find({ workspaceId })
    .sort({ createdAt: 1 })
    .lean();
}

export async function getChannelById(
  id: string,
  userId: string
): Promise<IChannel | null> {
  const channel = await Channel.findById(id).lean();
  if (!channel) return null;

  const hasAccess = await checkWorkspaceAccess(channel.workspaceId.toString(), userId);
  if (!hasAccess) return null;

  return channel;
}

export async function updateChannel(
  id: string,
  userId: string,
  data: { name?: string }
): Promise<IChannel | null> {
  const channel = await Channel.findById(id).lean();
  if (!channel) return null;

  const workspace = await Workspace.findOne({
    _id: channel.workspaceId,
    'members.userId': userId,
    'members.role': { $in: ['owner', 'admin'] },
  });

  if (!workspace) return null;

  return Channel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
}

export async function deleteChannel(
  id: string,
  userId: string
): Promise<boolean> {
  const channel = await Channel.findById(id).lean();
  if (!channel) return false;

  const workspace = await Workspace.findOne({
    _id: channel.workspaceId,
    'members.userId': userId,
    'members.role': { $in: ['owner', 'admin'] },
  });

  if (!workspace) return false;

  await Channel.findByIdAndDelete(id);
  return true;
}
