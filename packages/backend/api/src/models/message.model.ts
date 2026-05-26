import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessageAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments: IMessageAttachment[];
  replyTo?: mongoose.Types.ObjectId;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    attachments: [{
      id: String,
      filename: String,
      mimeType: String,
      size: Number,
      url: String,
    }],
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ replyTo: 1 });

export const Message: Model<IMessage> = mongoose.model<IMessage>('Message', messageSchema);
