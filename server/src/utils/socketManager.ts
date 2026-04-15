import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';

// Map to track active users: userId -> socketId
const userSocketMap = new Map<string, string>();
let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;
    
    if (userId) {
      userSocketMap.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ${socket.id}`);
      
      // Update user status to online
      User.findByIdAndUpdate(userId, { isOnline: true }).exec();
      
      // Notify others
      socket.broadcast.emit('user-status-change', { userId, isOnline: true });
    }

    // Join a private room for personal notifications/messages
    if (userId) {
      socket.join(userId);
    }

    // --- CHAT EVENTS ---
    socket.on('send-message', async (data) => {
      const { senderId, receiverId, content, messageType, fileUrl, fileName, fileSize } = data;
      try {
        const isReceiverOnline = userSocketMap.has(receiverId);

        // Save message to database
        const newMessage = await Message.create({
          sender: senderId,
          receiver: receiverId,
          content,
          messageType: messageType || 'text',
          fileUrl,
          fileName,
          fileSize,
          status: isReceiverOnline ? 'delivered' : 'sent',
          deliveredAt: isReceiverOnline ? new Date() : undefined
        });

        // Emit to receiver's private room
        io.to(receiverId).emit('receive-message', newMessage);
        // Also emit back to sender
        socket.emit('message-sent', newMessage);

        // CREATE NOTIFICATION
        const notification = await Notification.create({
          recipient: receiverId,
          sender: senderId,
          type: 'message',
          title: 'New Message',
          message: `You have received a new message: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`,
          link: '/messages'
        });

        emitNotification(receiverId, notification);
        
      } catch (error) {
        console.error('Socket send-message error:', error);
      }
    });

    socket.on('mark-read', async (data) => {
      const { senderId, receiverId } = data; // senderId is the one who sent messages being marked as read
      try {
        const now = new Date();
        await Message.updateMany(
          { sender: senderId, receiver: receiverId, status: { $ne: 'read' } },
          { $set: { status: 'read', isRead: true, readAt: now } }
        );

        // Notify the original sender that their messages were read
        io.to(senderId).emit('messages-read', { receiverId, readAt: now });
      } catch (error) {
        console.error('Socket mark-read error:', error);
      }
    });

    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      io.to(recipientId).emit('typing-status', { from: userId, isTyping });
    });

    // --- VIDEO CALL EVENTS ---
    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined video room ${roomId}`);
      socket.to(roomId).emit('user-joined', { socketId: socket.id, userId });
    });

    socket.on('call-user', (data) => {
      const { to, from, signalData, roomId } = data;
      io.to(to).emit('incoming-call', { signal: signalData, from, roomId });
    });

    socket.on('offer', ({ offer, roomId }) => {
      socket.to(roomId).emit('offer', { offer, senderId: socket.id });
    });

    socket.on('answer', ({ answer, roomId }) => {
      socket.to(roomId).emit('answer', { answer, senderId: socket.id });
    });

    socket.on('ice-candidate', ({ candidate, roomId }) => {
      socket.to(roomId).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // --- DISCONNECT ---
    socket.on('disconnect', () => {
      if (userId) {
        userSocketMap.delete(userId);
        console.log(`User ${userId} disconnected`);
        
        const now = new Date();
        // Update user status to offline and set lastSeen
        User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: now }).exec();
        socket.broadcast.emit('user-status-change', { userId, isOnline: false, lastSeen: now });
      }
    });
  });

  return io;
};

export const emitNotification = (recipientId: string, notification: any) => {
  if (io) {
    io.to(recipientId).emit('new-notification', notification);
  }
};
