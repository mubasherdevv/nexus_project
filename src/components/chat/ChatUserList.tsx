import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface ChatUserListProps {
  conversations: any[];
  currentPartner?: string;
}

export const ChatUserList: React.FC<ChatUserListProps> = ({ conversations, currentPartner }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  if (!currentUser) return null;
  
  const handleSelectUser = (userId: string) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="bg-white h-full overflow-y-auto custom-scrollbar">
      <div className="py-2">
        <div className="px-4 py-3 border-b border-gray-100 mb-2">
          <h2 className="text-xl font-bold text-gray-800">Messages</h2>
        </div>
        
        <div className="space-y-0.5">
          {conversations.length > 0 ? (
            conversations.map((conv, index) => {
              const { partner, lastMessage } = conv;
              if (!partner) return null;
              
              const isActive = currentPartner === partner._id;
              
              return (
                <div
                  key={partner._id || index}
                  className={`px-4 py-3 flex items-center cursor-pointer transition-all duration-200 border-l-4 ${
                    isActive
                      ? 'bg-primary-50 border-primary-600'
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  onClick={() => handleSelectUser(partner._id)}
                >
                  <Avatar
                    src={partner.avatarUrl}
                    alt={partner.name}
                    size="md"
                    status={partner.isOnline ? 'online' : 'offline'}
                    className="mr-3 flex-shrink-0 shadow-sm"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                        {partner.name}
                      </h3>
                      
                      {lastMessage && (
                        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {lastMessage && (
                        <p className={`text-xs truncate ${isActive ? 'text-primary-700 font-medium' : 'text-gray-500'}`}>
                          {lastMessage.sender === currentUser._id ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">No messages yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a conversation from a profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};