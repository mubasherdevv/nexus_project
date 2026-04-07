import { Request, Response } from 'express';
import { Meeting } from '../models/Meeting';
import { Notification } from '../models/Notification';
import { emitNotification } from '../utils/socketManager';
import { v4 as uuidv4 } from 'uuid';

export const scheduleMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, participant, startTime, endTime } = req.body;
    const host = (req as any).user?._id;

    if (!host) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Convert strings to Date objects
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      res.status(400).json({ message: 'Start time must be before end time' });
      return;
    }

    // Conflict detection
    const existingMeeting = await Meeting.findOne({
      $or: [
        { host, status: 'accepted' },
        { participant, status: 'accepted' },
        { host: participant, status: 'accepted' },
        { participant: host, status: 'accepted' }
      ],
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (existingMeeting) {
      res.status(409).json({ message: 'Meeting conflict detected for one of the participants' });
      return;
    }

    const meeting = await Meeting.create({
      title,
      description,
      host,
      participant,
      startTime: start,
      endTime: end,
      roomId: uuidv4(),
      status: 'pending'
    });

    // Create Notification for the participant
    const notification = await Notification.create({
      recipient: participant,
      sender: host,
      type: 'meeting',
      title: 'New Pitch Request',
      message: `You have a new pitch request: ${title}`,
      link: '/meetings'
    });

    // Real-time emit
    emitNotification(participant.toString(), notification);

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error('Schedule Meeting Error:', error);
    res.status(500).json({ message: 'Error scheduling meeting', error });
  }
};

export const getUserMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const meetings = await Meeting.find({
      $or: [{ host: userId }, { participant: userId }]
    }).populate('host participant', 'name email role avatarUrl');

    res.json({ success: true, meetings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
};

export const updateMeetingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = (req as any).user?._id;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Only allow participant or host to update status (participant accepts/rejects, host can cancel)
    if (meeting.host.toString() !== userId.toString() && meeting.participant.toString() !== userId.toString()) {
      res.status(403).json({ message: 'Not authorized to update this meeting' });
      return;
    }

    meeting.status = status;
    await meeting.save();

    // Notify the other participant
    const recipientId = meeting.host.toString() === userId.toString() 
      ? meeting.participant 
      : meeting.host;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: userId,
      type: 'meeting',
      title: `Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your pitch "${meeting.title}" has been ${status}.`,
      link: '/meetings'
    });

    emitNotification(recipientId.toString(), notification);

    res.json({ success: true, meeting });
  } catch (error) {
    console.error('Update Meeting Status Error:', error);
    res.status(500).json({ message: 'Error updating meeting status', error });
  }
};
