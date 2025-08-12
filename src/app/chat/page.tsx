'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PopulatedConnection, Message } from '@/types';

export default function ChatPage() {
  const [connections, setConnections] = useState<PopulatedConnection[]>([]);
  const [recentMessages, setRecentMessages] = useState<Record<string, Message>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      setConnections(data.accepted);
      
      // Fetch recent messages for each connection
      await fetchRecentMessages(data.accepted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async (connections: PopulatedConnection[]) => {
    const messages: Record<string, Message> = {};
    
    for (const connection of connections) {
      try {
        const response = await fetch(`/api/messages/dm/${connection.user.auth_user_id}?limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages.length > 0) {
            messages[connection.user.auth_user_id] = data.messages[0];
          }
        }
      } catch (err) {
        console.error('Error fetching recent message:', err);
      }
    }
    
    setRecentMessages(messages);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversations...</p>
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
            onClick={fetchConnections}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Messages</h1>
          <p className="text-gray-600 mb-6">
            Chat with your connections.
          </p>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm">
          {connections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No connections yet.</p>
              <Link 
                href="/connections"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View Connections
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {connections.map((connection) => {
                const recentMessage = recentMessages[connection.user.auth_user_id];
                return (
                  <Link
                    key={connection.id}
                    href={`/chat/${connection.user.auth_user_id}`}
                    className="block hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                            {connection.user.avatar_url ? (
                              <img 
                                src={connection.user.avatar_url} 
                                alt={connection.user.display_name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-medium text-gray-600">
                                {connection.user.display_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {connection.user.display_name}
                            </h3>
                            {recentMessage && (
                              <span className="text-sm text-gray-500">
                                {new Date(recentMessage.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {recentMessage ? (
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {recentMessage.body}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">
                              No messages yet
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
