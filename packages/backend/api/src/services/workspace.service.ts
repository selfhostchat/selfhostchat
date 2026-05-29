import { User } from '../models/index.js';
import type { IWorkspace } from '../models/workspace.model.js';

export async function createWorkspace(
  data: { name: string; description?: string },
  ownerId: string
): Promise<IWorkspace> {
  const workspace = await User.findById(ownerId);

  const workspaceDoc = await import('../models/workspace.model.js').then(
    ({ Workspace }) =>
      Workspace.create({
        name: data.name,
        description: data.description,
        ownerId,
        members: [
          {
            userId: ownerId,
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
      })
  );

  // Add workspace to user's workspaces list
  await User.findByIdAndUpdate(ownerId, {
    $push: { workspaces: workspaceDoc._id },
  });

  return workspaceDoc;
}

export async function getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
  const { Workspace } = await import('../models/workspace.model.js');
  return Workspace.find({
    'members.userId': userId,
  })
    .populate('ownerId', '_id email name avatar')
    .populate('members.userId', '_id email name avatar')
    .lean();
}

export async function getWorkspaceById(
  id: string,
  userId: string
): Promise<IWorkspace | null> {
  const { Workspace } = await import('../models/workspace.model.js');
  const workspace = await Workspace.findOne({
    _id: id,
    'members.userId': userId,
  })
    .populate('ownerId', '_id email name avatar')
    .populate('members.userId', '_id email name avatar')
    .lean();

  return workspace;
}

export async function updateWorkspace(
  id: string,
  userId: string,
  data: { name?: string; description?: string }
): Promise<IWorkspace | null> {
  const { Workspace } = await import('../models/workspace.model.js');

  const workspace = await Workspace.findOneAndUpdate(
    { _id: id, 'members.userId': userId, 'members.role': { $in: ['owner', 'admin'] } },
    { $set: data },
    { new: true, runValidators: true }
  )
    .populate('ownerId', '_id email name avatar')
    .populate('members.userId', '_id email name avatar')
    .lean();

  return workspace;
}

export async function deleteWorkspace(
  id: string,
  userId: string
): Promise<boolean> {
  const { Workspace } = await import('../models/workspace.model.js');
  const result = await Workspace.deleteOne({
    _id: id,
    ownerId: userId,
  });

  if (result.deletedCount > 0) {
    // Remove workspace from all members
    await User.updateMany(
      { workspaces: id },
      { $pull: { workspaces: id } }
    );
  }

  return result.deletedCount > 0;
}

export async function addMember(
  workspaceId: string,
  inviterId: string,
  email: string,
  role: 'admin' | 'member' | 'guest' = 'member'
) {
  const { Workspace } = await import('../models/workspace.model.js');
  const user = await User.findOne({ email });

  if (!user) return null;

  const workspace = await Workspace.findOneAndUpdate(
    {
      _id: workspaceId,
      'members.userId': inviterId,
      'members.role': { $in: ['owner', 'admin'] },
    },
    {
      $push: {
        members: {
          userId: user._id,
          role,
          joinedAt: new Date(),
        },
      },
    },
    { new: true }
  )
    .populate('ownerId', '_id email name avatar')
    .populate('members.userId', '_id email name avatar')
    .lean();

  if (workspace) {
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { workspaces: workspace._id },
    });
  }

  return workspace;
}

export async function removeMember(
  workspaceId: string,
  currentUserId: string,
  targetUserId: string
): Promise<IWorkspace | null> {
  const { Workspace } = await import('../models/workspace.model.js');
  const workspace = await Workspace.findOne({
    _id: workspaceId,
    ownerId: currentUserId,
  });

  if (!workspace) return null;

  await Workspace.findByIdAndUpdate(workspaceId, {
    $pull: { members: { userId: targetUserId } },
  });

  await User.findByIdAndUpdate(targetUserId, {
    $pull: { workspaces: workspaceId },
  });

  return workspace;
}
