import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'file' | 'video-call';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  status: 'sent' | 'delivered' | 'read';
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'file', 'video-call'], default: 'text' },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
    deliveredAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
