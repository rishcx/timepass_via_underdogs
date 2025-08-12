'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Community, Message } from '@/types';
import { subscribeToGroupMessages, unsubscribeFromChannel } from '@/lib/supabase/realtime';

export default function CommunityPage() {
  const params = useParams();
  const communityId = params.id as string;
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    fetchCommunity();
    fetchMessages();
    
    // Subscribe to real-time messages
    const newChannel = subscribeToGroupMessages(communityId, (message) => {
      setMessages(prev => [...prev, message]);
    });
    setChannel(newChannel);

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        unsubscribeFromChannel(channel);
      }
    };
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch community');
      }
      const data = await response.json();
      setCommunity(data.community);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/group/${communityId}?limit=50`);
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
    if (!newMessage.trim() || !community) return;

    try {
      setSending(true);
      const response = await fetch('/api/messages/group', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          community_id: community.id,
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
          <p className="mt-4 text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Community not found'}</p>
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
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
              <p className="text-gray-600">Key: {community.key}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              community.type === 'genre' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {community.type}
            </span>
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 border-b">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No messages yet. Be the first to start the conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {message.author_id.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <p className="text-sm text-gray-900">{message.body}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
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
