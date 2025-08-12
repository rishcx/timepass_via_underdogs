'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Community } from '@/types';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'genre' | 'artist'>('all');

  useEffect(() => {
    fetchCommunities();
  }, [filter]);

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await fetch('/api/communities/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ community_id: communityId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join community');
      }

      // Refresh communities to update member counts
      fetchCommunities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join community');
    }
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      
      // Fetch trending communities by default
      const response = await fetch('/api/communities/trending');
      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }
      
      const data = await response.json();
      setCommunities(data.communities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading communities...</p>
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
            onClick={fetchCommunities}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Communities</h1>
          <p className="text-gray-600 mb-6">
            Discover and join communities based on your favorite genres and artists.
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
              onClick={() => setFilter('genre')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'genre'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Genres
            </button>
            <button
              onClick={() => setFilter('artist')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                filter === 'artist'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Artists
            </button>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community: any) => (
            <div key={community.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  community.type === 'genre' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {community.type}
                </span>
                <span className="text-sm text-gray-500">
                  {community.member_count || 0} members
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {community.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Key: {community.key}
              </p>
              <div className="flex space-x-2">
                <Link
                  href={`/communities/${community.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                >
                  View Chat
                </Link>
                <button
                  onClick={() => handleJoinCommunity(community.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>

        {communities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No communities found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
