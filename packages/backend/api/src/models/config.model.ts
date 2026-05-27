import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConfig extends Document {
  _id: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  organizationName: string;
  adminUsername: string;
  adminPasswordHash: string;
  settings: {
    allowSignups: boolean;
    requireEmailVerification: boolean;
    maxChannelsPerWorkspace: number;
    maxMembersPerWorkspace: number;
    storageLimitMB: number;
    logoUrl?: string;
    primaryColor?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const configSettingsSchema = new Schema<IConfig['settings']>(
  {
    allowSignups: { type: Boolean, default: true },
    requireEmailVerification: { type: Boolean, default: false },
    maxChannelsPerWorkspace: { type: Number, default: 100 },
    maxMembersPerWorkspace: { type: Number, default: 50 },
    storageLimitMB: { type: Number, default: 1024 },
    logoUrl: { type: String },
    primaryColor: { type: String },
  },
  { _id: false }
);

const configSchema = new Schema<IConfig>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      unique: true,
    },
    organizationName: { type: String, required: true, trim: true },
    adminUsername: { type: String, required: true, trim: true, lowercase: true },
    adminPasswordHash: { type: String, required: true },
    settings: { type: configSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

configSchema.index({ workspaceId: 1 }, { unique: true });
configSchema.index({ adminUsername: 1 });

export const Config: Model<IConfig> = mongoose.model<IConfig>('Config', configSchema);
