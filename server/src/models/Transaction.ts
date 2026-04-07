import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  referenceId?: string; // e.g. Stripe ID
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { 
      type: String, 
      enum: ['deposit', 'withdraw', 'transfer_in', 'transfer_out'], 
      required: true 
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    description: { type: String, default: '' },
    referenceId: { type: String },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
