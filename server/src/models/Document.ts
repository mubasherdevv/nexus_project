import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
  name: string;
  originalName: string;
  url: string;
  owner: mongoose.Types.ObjectId;
  version: number;
  status: 'draft' | 'pending_signature' | 'signed';
  fileType: string;
  size: number;
  signatures: {
    userId: mongoose.Types.ObjectId;
    signatureImage?: string;
    signedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'pending_signature', 'signed'],
      default: 'draft',
    },
    fileType: { type: String },
    size: { type: Number },
    signatures: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        signatureImage: { type: String },
        signedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);
