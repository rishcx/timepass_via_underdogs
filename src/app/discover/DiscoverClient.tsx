'use client';

import { useRouter } from 'next/navigation';

interface SpotifyArtist {
  id: string;
  name: string;
  images?: Array<{ url: string }>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
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
  score?: number;
}

interface DiscoverData {
  myProfile: UserProfile;
  matches: UserProfile[];
}

interface DiscoverClientProps {
  data: DiscoverData;
}

export default function DiscoverClient({ data }: DiscoverClientProps) {
  const router = useRouter();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const handleConnect = (_userId: string) => {
    alert('Connect feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Matches</h1>
              <p className="text-gray-600">Find people with similar music taste</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/me')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                My Profile
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700">
              Found <span className="font-bold">{data.matches.length}</span> potential matches
            </p>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
            {data.matches.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600">Try refreshing your Spotify data or check back later!</p>
                <button
                  onClick={() => router.push('/me')}
                  className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  Refresh My Data
                </button>
              </div>
            ) : (
              data.matches.map((match, index) => (
                <div
                  key={match.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Rank */}
                      <div className="text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900">{match.display_name}</h3>
                        <p className="text-gray-600">{match.email}</p>
                        
                        {/* Top Genres */}
                        {match.genres && match.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {match.genres.slice(0, 3).map((genre) => (
                              <span
                                key={genre}
                                className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
                              >
                                {genre}
                              </span>
                            ))}
                            {match.genres.length > 3 && (
                              <span className="text-gray-500 text-xs">+{match.genres.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-center">
                        <div className={`px-4 py-2 rounded-full text-lg font-bold ${getScoreColor(match.score || 0)}`}>
                          {match.score}%
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Match</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/u/${match.id}`)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleConnect(match.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200"
                      >
                        Connect
                      </button>
                    </div>
                  </div>

                  {/* Top Artists Preview */}
                  {match.top_artists && match.top_artists.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Artists</h4>
                      <div className="flex space-x-3">
                        {match.top_artists.slice(0, 5).map((artist) => (
                          <div key={artist.id} className="text-center">
                            <img
                              src={artist.images?.[0]?.url || '/placeholder-artist.png'}
                              alt={artist.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <p className="text-xs text-gray-600 mt-1 truncate w-12">{artist.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Matches are based on your Spotify listening history and musical preferences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
