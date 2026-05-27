import bcrypt from 'bcryptjs';
import { Config } from '../models/config.model.js';
import { Workspace } from '../models/workspace.model.js';
import { User } from '../models/index.js';
import type { IConfig } from '../models/config.model.js';

export interface CreateConfigData {
  organizationName: string;
  adminUsername: string;
  adminPassword: string;
}

export async function createConfig(data: CreateConfigData): Promise<IConfig> {
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(data.adminPassword, salt);

  const user = await User.create({
    email: `${data.adminUsername}@localhost`,
    passwordHash,
    name: 'Admin',
    workspaces: [],
  });

  const workspace = await Workspace.create({
    name: data.organizationName,
    description: `Workspace for ${data.organizationName}`,
    ownerId: user._id,
    members: [
      {
        userId: user._id,
        role: 'owner',
        joinedAt: new Date(),
      },
    ],
    plan: 'free',
  });

  await User.findByIdAndUpdate(user._id, {
    $push: { workspaces: workspace._id },
  });

  const config = await Config.create({
    workspaceId: workspace._id,
    organizationName: data.organizationName,
    adminUsername: data.adminUsername,
    adminPasswordHash: passwordHash,
    settings: {
      allowSignups: true,
      requireEmailVerification: false,
      maxChannelsPerWorkspace: 100,
      maxMembersPerWorkspace: 50,
      storageLimitMB: 1024,
    },
  });

  return config;
}

export async function getConfigByWorkspace(workspaceId: string): Promise<IConfig | null> {
  return Config.findOne({ workspaceId }).lean();
}

export async function getConfigByAdminUsername(username: string): Promise<IConfig | null> {
  return Config.findOne({ adminUsername: username.toLowerCase() }).lean();
}

export async function updateConfig(
  workspaceId: string,
  data: Partial<Pick<IConfig, 'organizationName' | 'settings' | 'adminPasswordHash'>>
): Promise<IConfig | null> {
  return Config.findOneAndUpdate({ workspaceId }, { $set: data }, { new: true, runValidators: true }).lean();
}

export async function updateAdminPassword(
  workspaceId: string,
  newPassword: string
): Promise<IConfig | null> {
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  return Config.findOneAndUpdate(
    { workspaceId },
    { $set: { adminPasswordHash: passwordHash } },
    { new: true }
  ).lean();
}
