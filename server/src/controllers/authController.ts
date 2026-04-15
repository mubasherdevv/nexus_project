import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Request, Response } from 'express';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role: 'entrepreneur' | 'investor';
}

interface LoginBody {
  email: string;
  password: string;
  role: 'entrepreneur' | 'investor';
}

const generateToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as any);
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as RegisterBody;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
    });

    const token = generateToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        isOnline: user.isOnline,
        createdAt: user.createdAt,
        // Include any role-specific fields that might have default values
        ...(user.role === 'entrepreneur' ? {
          startupName: (user as any).startupName,
          pitchSummary: (user as any).pitchSummary,
          fundingNeeded: (user as any).fundingNeeded,
          industry: (user as any).industry,
          location: (user as any).location,
        } : {
          investmentInterests: (user as any).investmentInterests,
          investmentStage: (user as any).investmentStage,
        })
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body as LoginBody;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.is2FAEnabled) {
      // Mock OTP generation
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store mock OTP in a temp field or cache (for now, we'll just log it as per plan)
      console.log(`[security] [2FA] Mock OTP for ${user.email}: ${otp}`);
      
      res.json({
        success: true,
        twoFactorRequired: true,
        userId: user._id,
        message: '2FA required'
      });
      return;
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        id: user._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const verify2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;
    
    // In a real app, verify against stored secret. Here we'll accept '123456' as mock or any 6 digits for demo.
    if (!otp || otp.length !== 6) {
      res.status(400).json({ message: 'Invalid OTP' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.isOnline = true;
    await user.save();

    const token = generateToken(user._id.toString(), user.role);
    res.json({
      success: true,
      token,
      user: {
        ...user.toObject(),
        id: user._id,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying 2FA', error });
  }
};

export const toggle2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { enabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.is2FAEnabled = enabled;
    await user.save();

    res.json({ success: true, is2FAEnabled: user.is2FAEnabled });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling 2FA', error });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { isOnline: false });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error getting user', error });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const updates = req.body;

    const allowedFields = ['name', 'bio', 'avatarUrl'];
    const filteredUpdates: Record<string, any> = {};
    
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error });
  }
};
