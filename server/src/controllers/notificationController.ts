import { Request, Response } from 'express';
import { Notification } from '../models/Notification';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name avatarUrl');

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    await Notification.updateMany({ recipient: userId, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const count = await Notification.countDocuments({ recipient: userId, read: false });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching unread count' });
  }
};
