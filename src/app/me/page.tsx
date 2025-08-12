'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  top_artists?: any[];
  top_tracks?: any[];
  genres?: string[];
  audio_feature_avg?: any;
  last_taste_update?: string;
}

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Get user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleRefreshFromSpotify = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/ingest/spotify', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh the profile data
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);
        }
      } else {
        alert('Failed to refresh from Spotify');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Failed to refresh from Spotify');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile?.display_name}</h1>
              <p className="text-gray-600">{profile?.email}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleRefreshFromSpotify}
                disabled={refreshing}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                {refreshing ? 'Refreshing...' : 'Refresh from Spotify'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Last Update */}
          {profile?.last_taste_update && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                Last updated: {new Date(profile.last_taste_update).toLocaleString()}
              </p>
            </div>
          )}

          {/* Top Genres */}
          {profile?.genres && profile.genres.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Genres</h2>
              <div className="flex flex-wrap gap-2">
                {profile.genres.map((genre, index) => (
                  <span
                    key={genre}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Top Artists */}
          {profile?.top_artists && profile.top_artists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.top_artists.slice(0, 8).map((artist) => (
                  <div key={artist.id} className="text-center">
                    <img
                      src={artist.images[0]?.url || '/placeholder-artist.png'}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">{artist.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Tracks */}
          {profile?.top_tracks && profile.top_tracks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Tracks</h2>
              <div className="space-y-2">
                {profile.top_tracks.slice(0, 10).map((track, index) => (
                  <div key={track.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 font-medium w-8">{index + 1}</span>
                    <img
                      src={track.album.images[0]?.url || '/placeholder-track.png'}
                      alt={track.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{track.name}</p>
                      <p className="text-sm text-gray-600">{track.artists.map((a: any) => a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Features */}
          {profile?.audio_feature_avg && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Audio Features (Average)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(profile.audio_feature_avg).map(([key, value]) => (
                  <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 capitalize">{key}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={() => router.push('/discover')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200"
            >
              Discover Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
