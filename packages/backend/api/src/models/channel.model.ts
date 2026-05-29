import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChannel extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: mongoose.Types.ObjectId[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['public', 'private', 'direct'],
      default: 'public',
    },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

channelSchema.index({ workspaceId: 1, type: 1, name: 1, members: 1, lastMessageAt: -1 });

export const Channel: Model<IChannel> = mongoose.model<IChannel>('Channel', channelSchema);
