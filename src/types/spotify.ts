export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
}

export interface AudioFeatures extends Record<string, number> {
  danceability: number;
  energy: number;
  valence: number;
  tempo: number;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  spotify_access_token: string;
  spotify_refresh_token: string;
  spotify_token_expires_at: string;
  top_artists?: SpotifyArtist[];
  top_tracks?: SpotifyTrack[];
  genres?: string[];
  audio_feature_avg?: AudioFeatures;
  last_taste_update?: string;
  created_at: string;
  updated_at: string;
}
