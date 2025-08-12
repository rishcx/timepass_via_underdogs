'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PopulatedConnection } from '@/types';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<PopulatedConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  useEffect(() => {
    fetchConnections();
  }, [filter]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }
      
      const data = await response.json();
      setConnections([...data.pending, ...data.accepted]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject' | 'remove') => {
    try {
      if (action === 'accept' || action === 'reject') {
        const response = await fetch('/api/connections/respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            connection_id: connectionId, 
            action 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to ${action} connection`);
        }
      } else if (action === 'remove') {
        const response = await fetch(`/api/connections/${connectionId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove connection');
        }
      }
      
      // Refresh connections
      fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update connection');
    }
  };

  const filteredConnections = connections.filter(connection => {
    if (filter === 'all') return true;
    return connection.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading connections...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connections</h1>
          <p className="text-gray-600 mb-6">
            Manage your connections and pending requests.
          </p>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'accepted'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Accepted
            </button>
          </div>
        </div>

        {/* Connections List */}
        <div className="space-y-4">
          {filteredConnections.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">
                {filter === 'all' 
                  ? 'No connections yet.' 
                  : `No ${filter} connections.`
                }
              </p>
            </div>
          ) : (
            filteredConnections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
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
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {connection.user.display_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {connection.status === 'pending' && connection.requester_id === 'current-user-id'
                          ? 'Request sent'
                          : connection.status === 'pending'
                          ? 'Request received'
                          : 'Connected'
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {connection.status === 'pending' && connection.requester_id !== 'current-user-id' && (
                      <>
                        <button
                          onClick={() => handleConnectionAction(connection.id, 'accept')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleConnectionAction(connection.id, 'reject')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                                         {connection.status === 'accepted' && (
                       <div className="flex space-x-2">
                         <Link
                           href={`/messages/${connection.user.auth_user_id}`}
                           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                         >
                           Message
                         </Link>
                         <button
                           onClick={() => handleConnectionAction(connection.id, 'remove')}
                           className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                         >
                           Remove
                         </button>
                       </div>
                     )}
                    
                    {connection.status === 'pending' && connection.requester_id === 'current-user-id' && (
                      <button
                        onClick={() => handleConnectionAction(connection.id, 'remove')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
