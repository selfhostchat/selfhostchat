import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspaceMember {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
}

export interface IWorkspace extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IWorkspaceMember[];
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'guest'],
    default: 'member',
  },
  joinedAt: { type: Date, default: Date.now },
});

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [workspaceMemberSchema],
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ 'members.userId': 1 });

export const Workspace: Model<IWorkspace> = mongoose.model<IWorkspace>('Workspace', workspaceSchema);
