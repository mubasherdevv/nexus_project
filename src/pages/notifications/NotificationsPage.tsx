import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageCircle, UserPlus, DollarSign, Wallet, FileText, Loader2 } from 'lucide-react';
import { Card, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { io, Socket } from 'socket.io-client';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationAPI.getNotifications();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();

      // Initialize Socket
      socketRef.current = io(SOCKET_URL, {
        query: { userId: user._id }
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to notification socket');
      });

      socketRef.current.on('new-notification', (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
        toast.success(`New Notification: ${notification.title}`, {
          icon: '🔔',
        });
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => notif._id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-primary-600" />;
      case 'connection':
        return <UserPlus size={16} className="text-secondary-600" />;
      case 'investment':
        return <DollarSign size={16} className="text-accent-600" />;
      case 'wallet':
        return <Wallet size={16} className="text-emerald-600" />;
      case 'meeting':
        return <Bell size={16} className="text-amber-600" />;
      case 'system':
        return <FileText size={16} className="text-gray-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with your network activity</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Loader2 className="animate-spin text-primary-600 mb-4" size={40} />
          <p className="text-gray-500 font-medium tracking-tight">Loading alerts...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <Card
                key={notification._id}
                className={`transition-all duration-300 border-none hover:shadow-lg translate-y-0 active:scale-[0.98] ${
                  !notification.read ? 'bg-primary-50/50 ring-1 ring-primary-100' : 'bg-white'
                }`}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              >
                <CardBody className="flex items-start p-5 cursor-pointer">
                  <Avatar
                    src={notification.sender?.avatarUrl}
                    alt={notification.sender?.name}
                    size="md"
                    className="flex-shrink-0 mr-4 shadow-sm"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-gray-900 truncate">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <Badge variant="primary" size="sm" rounded className="shadow-sm">New</Badge>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3 p-1.5 px-3 bg-gray-50 w-fit rounded-full text-xs font-semibold text-gray-500 border border-gray-100 shadow-sm">
                      {getNotificationIcon(notification.type)}
                      <span className="capitalize">{notification.type}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                <Bell size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No notifications yet</p>
              <p className="text-gray-400 text-sm mt-1">We'll alert you when something happens</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};