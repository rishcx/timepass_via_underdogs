'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    images?: Array<{ url: string }>;
  };
}

interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
}

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  top_artists?: SpotifyArtist[];
  top_tracks?: SpotifyTrack[];
  genres?: string[];
  audio_feature_avg?: AudioFeatures;
}

interface MatchData {
  score: number;
  shared_artists: SpotifyArtist[];
  shared_tracks: SpotifyTrack[];
  shared_genres: string[];
  other_user: {
    id: string;
    display_name: string;
    email: string;
  };
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const otherUserId = params.id as string;
      
      // Get match data
      try {
        const response = await fetch(`/api/match/${otherUserId}`);
        if (response.ok) {
          const matchResult = await response.json();
          setMatchData(matchResult);
          
          // Get the other user's profile
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();
          
          setProfile(profileData);
        } else {
          console.error('Failed to get match data');
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
      
      setLoading(false);
    };

    checkUser();
  }, [router, params.id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!profile || !matchData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <button
            onClick={() => router.push('/discover')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Discover
          </button>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">{profile.display_name}</h1>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <button
              onClick={() => router.push('/discover')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Back to Discover
            </button>
          </div>

          {/* Compatibility Score */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Compatibility Score</h2>
              <div className={`inline-block px-6 py-3 rounded-full text-3xl font-bold ${getScoreColor(matchData.score)}`}>
                {matchData.score}%
              </div>
            </div>
          </div>

          {/* Shared Items */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Shared Artists */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Shared Artists ({matchData.shared_artists.length})
              </h3>
              <div className="space-y-2">
                {matchData.shared_artists.slice(0, 5).map((artist) => (
                  <div key={artist.id} className="flex items-center space-x-2">
                    <img
                      src={artist.images[0]?.url || '/placeholder-artist.png'}
                      alt={artist.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm text-blue-700">{artist.name}</span>
                  </div>
                ))}
                {matchData.shared_artists.length > 5 && (
                  <p className="text-sm text-blue-600">+{matchData.shared_artists.length - 5} more</p>
                )}
              </div>
            </div>

            {/* Shared Tracks */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">
                Shared Tracks ({matchData.shared_tracks.length})
              </h3>
              <div className="space-y-2">
                {matchData.shared_tracks.slice(0, 5).map((track) => (
                  <div key={track.id} className="flex items-center space-x-2">
                    <img
                      src={track.album.images[0]?.url || '/placeholder-track.png'}
                      alt={track.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-green-700">{track.name}</p>
                      <p className="text-xs text-green-600">{track.artists.map((a) => a.name).join(', ')}</p>
                    </div>
                  </div>
                ))}
                {matchData.shared_tracks.length > 5 && (
                  <p className="text-sm text-green-600">+{matchData.shared_tracks.length - 5} more</p>
                )}
              </div>
            </div>

            {/* Shared Genres */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">
                Shared Genres ({matchData.shared_genres.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {matchData.shared_genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Their Top Genres */}
          {profile.genres && profile.genres.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Their Top Genres</h2>
              <div className="flex flex-wrap gap-2">
                {profile.genres.map((genre) => (
                  <span
                    key={genre}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      matchData.shared_genres.includes(genre)
                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Their Top Artists */}
          {profile.top_artists && profile.top_artists.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Their Top Artists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profile.top_artists.slice(0, 8).map((artist) => (
                  <div key={artist.id} className="text-center">
                    <img
                      src={artist.images[0]?.url || '/placeholder-artist.png'}
                      alt={artist.name}
                      className={`w-16 h-16 rounded-full mx-auto mb-2 object-cover ${
                        matchData.shared_artists.some(a => a.id === artist.id)
                          ? 'ring-4 ring-purple-300'
                          : ''
                      }`}
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">{artist.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect Button */}
          <div className="text-center">
            <button
              onClick={() => alert('Connect feature coming soon!')}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-200"
            >
              Connect with {profile.display_name}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
