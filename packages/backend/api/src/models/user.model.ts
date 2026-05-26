import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  avatar?: string;
  workspaces: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    workspaces: [{
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
    }],
  },
  { timestamps: true }
);

userSchema.index({ workspaces: 1 });

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
