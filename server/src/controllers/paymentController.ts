import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitNotification } from '../utils/socketManager.js';

// Mock Stripe/PayPal SDK Response
const simulatePaymentGateway = async (amount: number): Promise<{ success: boolean; id: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, id: `pi_mock_${Math.random().toString(36).substring(7)}` });
    }, 1000);
  });
};

export const getWalletInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const user = await User.findById(userId).select('walletBalance');
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('recipientId', 'email name');

    res.json({
      success: true,
      balance: user.walletBalance,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet info', error });
  }
};

export const depositFunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid deposit amount' });
      return;
    }

    // Step 1: Simulate Gateway
    const payment = await simulatePaymentGateway(amount);
    
    // Step 2: Create Transaction Record
    const transaction = await Transaction.create({
      userId,
      type: 'deposit',
      amount,
      status: payment.success ? 'completed' : 'failed',
      description: description || 'Deposit via Nexus Payment Gateway',
      referenceId: payment.id
    });

    // Step 3: Update User Balance if success
    if (payment.success) {
      await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } });

      // CREATE NOTIFICATION
      const notification = await Notification.create({
        recipient: userId,
        sender: userId, // Self sender for system actions
        type: 'wallet',
        title: 'Funds Deposited',
        message: `Successfully deposited $${amount} into your wallet.`,
        link: '/wallet'
      });
      emitNotification(userId.toString(), notification);
    }

    res.status(201).json({
      success: true,
      message: 'Deposit successful',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Error depositing funds', error });
  }
};

export const withdrawFunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const { amount, description } = req.body;

    const user = await User.findById(userId);
    if (!user || user.walletBalance < amount) {
      res.status(400).json({ message: 'Insufficient funds' });
      return;
    }

    const transaction = await Transaction.create({
      userId,
      type: 'withdraw',
      amount,
      status: 'completed', // Mocking immediate completion
      description: description || 'Withdrawal to personal account'
    });

    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: -amount } });

    // CREATE NOTIFICATION
    const notification = await Notification.create({
      recipient: userId,
      sender: userId,
      type: 'wallet',
      title: 'Withdrawal Successful',
      message: `Successfully withdrew $${amount} from your wallet.`,
      link: '/wallet'
    });
    emitNotification(userId.toString(), notification);

    res.json({
      success: true,
      message: 'Withdrawal successful',
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing withdrawal', error });
  }
};

export const transferFunds = async (req: Request, res: Response): Promise<void> => {
  let session: mongoose.ClientSession | null = null;
  
  try {
    const senderId = (req as any).user?._id;
    const { recipientEmail, amount, description } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount' });
      return;
    }

    // Try to start a session for atomicity
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      // Fallback: If sessions are not supported (standalone MongoDB), proceed without it
      session = null;
      console.warn('MongoDB sessions not supported, proceeding without transaction');
    }

    const sender = await User.findById(senderId).session(session);
    if (!sender || sender.walletBalance < amount) {
      if (session) await session.abortTransaction();
      res.status(400).json({ message: 'Insufficient funds' });
      return;
    }

    const recipient = await User.findOne({ email: recipientEmail.toLowerCase() }).session(session);
    if (!recipient) {
      if (session) await session.abortTransaction();
      res.status(400).json({ message: 'Recipient not found' });
      return;
    }

    if (sender._id.equals(recipient._id)) {
      if (session) await session.abortTransaction();
      res.status(400).json({ message: 'Cannot transfer to yourself' });
      return;
    }

    // Create Transaction Records
    await Transaction.create([{
      userId: senderId,
      recipientId: recipient._id,
      type: 'transfer_out',
      amount,
      status: 'completed',
      description: description || `Transfer to ${recipient.name}`
    }], { session });

    await Transaction.create([{
      userId: recipient._id,
      recipientId: senderId,
      type: 'transfer_in',
      amount,
      status: 'completed',
      description: description || `Transfer from ${sender.name}`
    }], { session });

    // Update Balances
    await User.findByIdAndUpdate(senderId, { $inc: { walletBalance: -amount } }).session(session);
    await User.findByIdAndUpdate(recipient._id, { $inc: { walletBalance: amount } }).session(session);

    if (session) {
      await session.commitTransaction();
    }
    
    // NOTIFICATIONS
    // 1. Notify Sender
    const senderNotif = await Notification.create({
      recipient: senderId,
      sender: senderId,
      type: 'wallet',
      title: 'Transfer Sent',
      message: `You successfully sent $${amount} to ${recipient.name}.`,
      link: '/wallet'
    });
    emitNotification(senderId.toString(), senderNotif);

    // 2. Notify Recipient
    const recipientNotif = await Notification.create({
      recipient: recipient._id,
      sender: senderId,
      type: 'wallet',
      title: 'Funds Received',
      message: `You received $${amount} from ${sender.name}.`,
      link: '/wallet'
    });
    emitNotification(recipient._id.toString(), recipientNotif);
    
    res.json({ success: true, message: 'Transfer successful' });
  } catch (error: any) {
    if (session) {
      await session.abortTransaction();
    }
    console.error('Transfer Error:', error);
    res.status(500).json({ message: error.message || 'Error processing transfer' });
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .populate('recipientId', 'email name');

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};
