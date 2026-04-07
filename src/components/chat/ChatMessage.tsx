import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui/Avatar';
import { FileText, ExternalLink, Video, Download, Check, CheckCheck } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

interface ChatMessageProps {
  message: {
    _id?: string;
    content: string;
    timestamp: string;
    senderId: string;
    messageType?: 'text' | 'file' | 'video-call';
    fileUrl?: string;
    fileName?: string;
    status: 'sent' | 'delivered' | 'read';
  };
  isCurrentUser: boolean;
  avatarUrl?: string;
  name?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser, avatarUrl, name }) => {
  const isFile = message.messageType === 'file';
  const isVideoCall = message.messageType === 'video-call';
  
  // Get absolute URL for files
  const getFileUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const isImage = (fileName?: string) => {
    if (!fileName) return false;
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return extensions.some(ext => fileName.toLowerCase().endsWith(ext));
  };

  const fileLink = message.fileUrl ? getFileUrl(message.fileUrl) : '#';

  const renderStatus = () => {
    if (!isCurrentUser) return null;
    
    switch (message.status) {
      case 'read':
        return <CheckCheck size={12} className="text-blue-400 ml-1" />;
      case 'delivered':
        return <CheckCheck size={12} className="text-gray-400 ml-1" />;
      case 'sent':
      default:
        return <Check size={12} className="text-gray-400 ml-1" />;
    }
  };

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2 animate-fade-in`}>
      {!isCurrentUser && avatarUrl && (
        <Avatar src={avatarUrl} alt={name || 'Partner'} size="sm" className="mr-2 self-end mb-1 shadow-sm" />
      )}
      
      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
          isCurrentUser
            ? 'bg-primary-600 text-white rounded-tr-none'
            : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
        }`}>
          {isFile ? (
            <div className="py-1">
              {isImage(message.fileName) ? (
                <div className="flex flex-col space-y-2">
                  <div className="relative group overflow-hidden rounded-lg border border-gray-200/20 shadow-sm max-w-full sm:max-w-xs md:max-w-sm">
                    <img 
                      src={fileLink} 
                      alt={message.fileName} 
                      className="max-h-60 object-cover w-full cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => window.open(fileLink, '_blank')}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={fileLink} 
                        download={message.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-medium truncate max-w-[120px] opacity-70">
                      {message.fileName}
                    </p>
                    <a 
                      href={fileLink} 
                      download={message.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-[10px] flex items-center font-bold uppercase hover:underline ml-2 ${
                        isCurrentUser ? 'text-primary-100' : 'text-primary-600'
                      }`}
                    >
                      Download <Download size={10} className="ml-1" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isCurrentUser ? 'bg-primary-500' : 'bg-gray-100'}`}>
                    <FileText size={20} className={isCurrentUser ? 'text-white' : 'text-primary-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate max-w-[150px]">{message.fileName || 'Document'}</p>
                    <a 
                      href={fileLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      download={message.fileName}
                      className={`text-[10px] flex items-center font-bold uppercase mt-0.5 hover:underline ${
                        isCurrentUser ? 'text-primary-100' : 'text-primary-600'
                      }`}
                    >
                      Download <ExternalLink size={10} className="ml-1" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : isVideoCall ? (
            <div className="flex flex-col items-center py-2 text-center min-w-[140px]">
              <div className={`p-3 rounded-full mb-2 ${isCurrentUser ? 'bg-primary-500' : 'bg-primary-50'}`}>
                <Video size={24} className={isCurrentUser ? 'text-white' : 'text-primary-600'} />
              </div>
              <p className="text-sm font-bold mb-2">Video Meeting Started</p>
              <a 
                href={message.fileUrl} 
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isCurrentUser 
                    ? 'bg-white text-primary-600 hover:bg-primary-50' 
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                Join Now
              </a>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
        
        <div className="flex items-center mt-1">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {renderStatus()}
        </div>
      </div>
      
      {isCurrentUser && avatarUrl && (
        <Avatar src={avatarUrl} alt={name || 'You'} size="sm" className="ml-2 self-end mb-1 shadow-sm" />
      )}
    </div>
  );
};