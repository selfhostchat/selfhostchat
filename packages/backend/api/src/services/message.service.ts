import { Message, Channel } from '../models/index.js';
import type { IMessage } from '../models/message.model.js';

async function checkChannelAccess(channelId: string, userId: string): Promise<boolean> {
  const channel = await Channel.findById(channelId).lean();
  if (!channel) return false;

  if (channel.type === 'public') return true;

  return channel.members.some(
    (m) => m.toString() === userId
  );
}

export async function createMessage(
  data: { channelId: string; content: string; replyTo?: string },
  senderId: string
): Promise<IMessage> {
  const hasAccess = await checkChannelAccess(data.channelId, senderId);
  if (!hasAccess) {
    throw new Error('Access denied to channel');
  }

  const message = await Message.create({
    channelId: data.channelId,
    senderId,
    content: data.content,
    replyTo: data.replyTo,
    attachments: [],
  });

  // Update channel lastMessageAt
  await Channel.findByIdAndUpdate(data.channelId, {
    lastMessageAt: message.createdAt,
  });

  return message;
}

export async function getMessages(
  channelId: string,
  userId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{
  data: IMessage[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  const hasAccess = await checkChannelAccess(channelId, userId);
  if (!hasAccess) {
    throw new Error('Access denied to channel');
  }

  const skip = (page - 1) * pageSize;
  const [messages, total] = await Promise.all([
    Message.find({ channelId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('senderId', '_id email name avatar')
      .populate('replyTo', '_id content')
      .lean(),
    Message.countDocuments({ channelId }),
  ]);

  return {
    data: messages.reverse(),
    total,
    page,
    pageSize,
    hasMore: skip + messages.length < total,
  };
}

export async function getMessageById(
  id: string,
  userId: string
): Promise<IMessage | null> {
  const message = await Message.findById(id)
    .populate('senderId', '_id email name avatar')
    .lean();

  if (!message) return null;

  const hasAccess = await checkChannelAccess(message.channelId.toString(), userId);
  return hasAccess ? message : null;
}

export async function updateMessage(
  id: string,
  userId: string,
  content: string
): Promise<IMessage | null> {
  const message = await Message.findOneAndUpdate(
    { _id: id, senderId: userId },
    { $set: { content, editedAt: new Date() } },
    { new: true, runValidators: true }
  )
    .populate('senderId', '_id email name avatar')
    .lean();

  return message;
}

export async function deleteMessage(
  id: string,
  userId: string
): Promise<boolean> {
  const message = await Message.findOne({ _id: id, senderId: userId });
  if (!message) return false;

  await Message.findByIdAndDelete(id);
  return true;
}
