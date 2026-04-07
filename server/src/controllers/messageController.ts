import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user._id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversations = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user._id;

    // Aggregate to get unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ['$sender', '$receiver'] },
              ['$sender', '$receiver'],
              ['$receiver', '$sender']
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    // Populate user details for each conversation partner
    const results = await Promise.all(
      conversations.map(async (conv) => {
        const partnerId = conv.lastMessage.sender.toString() === currentUserId.toString()
          ? conv.lastMessage.receiver
          : conv.lastMessage.sender;
        
        const partner = await User.findById(partnerId).select('name avatarUrl role isOnline');
        return {
          partner,
          lastMessage: conv.lastMessage
        };
      })
    );

    res.json({ success: true, conversations: results });
  } catch (error: any) {
    console.error('getConversations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
