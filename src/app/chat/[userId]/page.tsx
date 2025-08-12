'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Message, UserSummary } from '@/types';
import { subscribeToDMMessages, unsubscribeFromChannel } from '@/lib/supabase/realtime';

export default function ChatWithUserPage() {
  const params = useParams();
  const userId = params.userId as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<UserSummary | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<ReturnType<typeof subscribeToDMMessages> | null>(null);

  useEffect(() => {
    fetchMessages();
    fetchOtherUser();
    
    // Subscribe to real-time messages
    const newChannel = subscribeToDMMessages(userId, (message) => {
      setMessages(prev => [...prev, message]);
    });
    setChannel(newChannel);

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        unsubscribeFromChannel(channel);
      }
    };
  }, [userId]);

  const fetchOtherUser = async () => {
    try {
      // This would typically fetch user details from your profiles table
      // For now, we'll create a mock user object
      setOtherUser({
        auth_user_id: userId,
        display_name: `User ${userId.slice(0, 8)}`,
        avatar_url: undefined
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/dm/${userId}?limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_auth_user_id: userId,
          body: newMessage.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Chat Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              {otherUser?.avatar_url ? (
                <img 
                  src={otherUser.avatar_url} 
                  alt={otherUser.display_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-gray-600">
                  {otherUser?.display_name.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {otherUser?.display_name || 'User'}
              </h1>
              <p className="text-sm text-gray-500">Direct Message</p>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 border-b">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.author_id === 'current-user-id';
                  return (
                    <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start space-x-3 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwnMessage && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              {otherUser?.avatar_url ? (
                                <img 
                                  src={otherUser.avatar_url} 
                                  alt={otherUser.display_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  {otherUser?.display_name.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                          <div className={`rounded-lg px-4 py-2 ${
                            isOwnMessage 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.body}</p>
                          </div>
                          <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : ''}`}>
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-6">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
