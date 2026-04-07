import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { MessageCircle, Loader2 } from 'lucide-react';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setIsLoading(true);
        const response = await messageAPI.getConversations();
        if (response.success) {
          setConversations(response.conversations);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchConversations();
    }
  }, [user]);

  if (!user) return null;
  
  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <h1 className="text-2xl font-bold text-gray-900">Your Inbox</h1>
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-600" size={48} />
          </div>
        ) : conversations.length > 0 ? (
          <ChatUserList conversations={conversations} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50">
            <div className="bg-white p-6 rounded-full shadow-md mb-6">
              <MessageCircle size={48} className="text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">No messages yet</h2>
            <p className="text-gray-500 text-center mt-2 max-w-sm">
              Start connecting with entrepreneurs and investors to begin real-time conversations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};