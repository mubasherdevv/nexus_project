import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Video, Info, MessageCircle, Loader2, Paperclip } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { messageAPI, profileAPI, documentAPI } from '../../services/api';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { SOCKET_URL } from '../../services/api';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  
  // Initialize Socket
  useEffect(() => {
    if (currentUser?._id) {
      socketRef.current = io(SOCKET_URL, {
        query: { userId: currentUser._id }
      });

      socketRef.current.on('receive-message', (message: any) => {
        if (message.sender === userId) {
          setMessages(prev => [...prev, message]);
          // If we're looking at this chat, mark it as read immediately
          socketRef.current?.emit('mark-read', { senderId: userId, receiverId: currentUser._id });
        }
        fetchConversations();
      });

      socketRef.current.on('message-sent', (message: any) => {
        setMessages(prev => [...prev, message]);
        fetchConversations();
      });

      socketRef.current.on('messages-read', (data: any) => {
        if (data.receiverId === userId) {
          setMessages((prev: any[]) => 
            prev.map(msg => 
              msg.sender === currentUser?._id ? { ...msg, status: 'read', isRead: true } : msg
            )
          );
        }
      });

      socketRef.current.on('user-status-change', (data: any) => {
        if (data.userId === userId) {
          setChatPartner((prev: any) => prev ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen } : null);
        }
        setConversations((prev: any[]) => 
          prev.map(conv => {
            if (conv.user?._id === data.userId) {
              return { ...conv, user: { ...conv.user, isOnline: data.isOnline } };
            }
            return conv;
          })
        );
      });

      socketRef.current.on('typing-status', (data: any) => {
        if (data.from === userId) {
          setIsPartnerTyping(data.isTyping);
        }
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [currentUser, userId]);

  const fetchConversations = async () => {
    try {
      const response = await messageAPI.getConversations();
      if (response.success) {
        setConversations(response.conversations);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const fetchMessages = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const [msgResponse, partnerResponse] = await Promise.all([
        messageAPI.getMessages(userId),
        profileAPI.getUser(userId)
      ]);

      if (msgResponse.success) {
        setMessages(msgResponse.messages);
        // Mark these as read since we just opened them
        socketRef.current?.emit('mark-read', { senderId: userId, receiverId: currentUser._id });
      }
      if (partnerResponse.success) {
        setChatPartner(partnerResponse.user);
      }
    } catch (err) {
      console.error('Error fetching chat data:', err);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchConversations();
  }, [currentUser]);
  
  useEffect(() => {
    if (userId) {
      fetchMessages();
      setIsPartnerTyping(false);
    } else {
      setChatPartner(null);
      setMessages([]);
      setIsLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Emit typing status
    if (socketRef.current && userId) {
      socketRef.current.emit('typing', { recipientId: userId, isTyping: true });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // Set timeout to stop typing status
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { recipientId: userId, isTyping: false });
      }, 3000);
    }
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?._id || !userId) return;
    
    // Stop typing status instantly
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing', { recipientId: userId, isTyping: false });

    socketRef.current?.emit('send-message', {
      senderId: currentUser._id,
      receiverId: userId,
      content: newMessage,
      messageType: 'text'
    });
    
    setNewMessage('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !currentUser?._id) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('document', file);
      formData.append('name', file.name);

      const response = await documentAPI.upload(formData);
      if (response.success) {
        // Send message with file details
        socketRef.current?.emit('send-message', {
          senderId: currentUser._id,
          receiverId: userId,
          content: `Shared a file: ${file.name}`,
          messageType: 'file',
          fileUrl: response.document.url,
          fileName: response.document.originalName || file.name,
          fileSize: response.document.size
        });
        toast.success('File uploaded successfully');
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartVideoCall = () => {
    if (!userId) return;
    const roomId = `room-${[currentUser?._id, userId].sort().join('-')}`;
    navigate(`/meeting/${roomId}`);
    
    socketRef.current?.emit('send-message', {
      senderId: currentUser?._id,
      receiverId: userId,
      content: `📞 Video call started. Click to join.`,
      messageType: 'video-call',
      fileUrl: `/meeting/${roomId}`
    });
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in shadow-sm">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200 bg-gray-50">
        <ChatUserList conversations={conversations} currentPartner={userId} />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {userId ? (
          <>
            {/* Chat header */}
            <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-white z-10">
              <div className="flex items-center">
                {isLoading ? (
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse mr-3" />
                ) : chatPartner && (
                  <Avatar
                    src={chatPartner.avatarUrl}
                    alt={chatPartner.name}
                    size="md"
                    status={chatPartner.isOnline ? 'online' : 'offline'}
                    className="mr-3"
                  />
                )}
                
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {isLoading ? <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" /> : chatPartner?.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {chatPartner?.isOnline ? (
                        <span className="text-primary-600 font-bold tracking-tight">Active now</span>
                      ) : chatPartner?.lastSeen ? (
                        `last seen ${formatDistanceToNow(new Date(chatPartner.lastSeen), { addSuffix: true })}`
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="rounded-full p-2 hover:bg-gray-100" onClick={handleStartVideoCall}>
                    <Video size={18} className="text-primary-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full p-2 hover:bg-gray-100">
                    <Info size={18} className="text-gray-600" />
                  </Button>
                </div>
              </div>
              
              {/* Messages container */}
              <div className="flex-1 p-4 overflow-y-auto bg-[#F0F2F5] backgroundImagePattern">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="animate-spin text-primary-600" size={32} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((message, index) => (
                      <ChatMessage
                        key={message._id || index}
                        message={{
                          _id: message._id,
                          content: message.content,
                          timestamp: message.createdAt,
                          senderId: message.sender,
                          messageType: message.messageType,
                          fileUrl: message.fileUrl,
                          fileName: message.fileName,
                          status: message.status
                        }}
                        isCurrentUser={message.sender === currentUser?._id}
                        avatarUrl={message.sender === currentUser?._id ? currentUser?.avatarUrl : chatPartner?.avatarUrl}
                      />
                    ))}
                    {isPartnerTyping && (
                    <div className="flex items-center text-gray-500 text-xs italic ml-2 mt-2">
                      <div className="flex space-x-1 mr-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      {chatPartner?.name} is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex space-x-2 items-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 hover:bg-gray-100"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={22} className="animate-spin text-primary-600" /> : <Paperclip size={22} className="text-gray-500" />}
                </Button>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  fullWidth
                  className="flex-1 bg-gray-100 border-none focus:ring-1 focus:ring-primary-500 rounded-2xl"
                />
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim() || isSending}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center shadow-md bg-primary-600 hover:bg-primary-700"
                >
                  <Send size={18} className="text-white" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="bg-white p-6 rounded-full shadow-md mb-4 flex items-center justify-center">
              <MessageCircle size={48} className="text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Your Messages</h2>
            <p className="text-gray-500 mt-2 text-center max-w-md">
              Select a contact to start messaging and share documents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};