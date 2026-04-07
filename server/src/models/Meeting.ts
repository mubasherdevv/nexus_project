import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  host: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true },
    description: { type: String },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    roomId: { type: String, required: true },
  },
  { timestamps: true }
);

// Add index for conflict detection
meetingSchema.index({ host: 1, startTime: 1, endTime: 1 });
meetingSchema.index({ participant: 1, startTime: 1, endTime: 1 });

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
