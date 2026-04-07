import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'entrepreneur' | 'investor';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;

  // Optional role-specific fields for schema compatibility
  startupName?: string;
  pitchSummary?: string;
  fundingNeeded?: string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  teamSize?: number;
  investmentInterests?: string[];
  investmentStage?: string[];
  portfolioCompanies?: string[];
  totalInvestments?: number;
  minimumInvestment?: string;
  maximumInvestment?: string;
  walletBalance: number;
  is2FAEnabled: boolean;
  twoFactorSecret?: string;
}

export interface IEntrepreneur extends IUser {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
}

export interface IInvestor extends IUser {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['entrepreneur', 'investor'], required: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },

    // Entrepreneur specific fields
    startupName: { type: String },
    pitchSummary: { type: String },
    fundingNeeded: { type: String },
    industry: { type: String },
    location: { type: String },
    foundedYear: { type: Number },
    teamSize: { type: Number },

    // Investor specific fields
    investmentInterests: [{ type: String }],
    investmentStage: [{ type: String }],
    portfolioCompanies: [{ type: String }],
    totalInvestments: { type: Number },
    minimumInvestment: { type: String },
    maximumInvestment: { type: String },

    // Financial & Security fields
    walletBalance: { type: Number, default: 0 },
    is2FAEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
