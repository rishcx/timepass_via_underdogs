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

export const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
};

export const audioSim = (a: AudioFeatures = {} as AudioFeatures, b: AudioFeatures = {} as AudioFeatures) => {
  const keys = ['danceability', 'energy', 'valence', 'tempo'] as const;
  const dist = Math.sqrt(keys.reduce((s, k) => s + Math.pow((a[k] ?? 0) - (b[k] ?? 0), 2), 0));
  const max = Math.sqrt(keys.length);
  return 1 - Math.min(1, dist / max);
};

export const scoreMatch = (A: UserProfile, B: UserProfile) => {
  const sa = A.top_artists?.map((x: SpotifyArtist) => x.id) || [], 
        sb = B.top_artists?.map((x: SpotifyArtist) => x.id) || [];
  const ta = A.top_tracks?.map((x: SpotifyTrack) => x.id) || [], 
        tb = B.top_tracks?.map((x: SpotifyTrack) => x.id) || [];
  const ga = A.genres || [], 
        gb = B.genres || [];
  
  const s = 0.55 * jaccard(sa, sb) + 
            0.25 * jaccard(ta, tb) + 
            0.15 * jaccard(ga, gb) + 
            0.05 * audioSim(A.audio_feature_avg, B.audio_feature_avg);
  
  return Math.round(s * 100);
};

export const getSharedItems = (A: UserProfile, B: UserProfile) => {
  const sharedArtists = A.top_artists?.filter((artist: SpotifyArtist) => 
    B.top_artists?.some((bArtist: SpotifyArtist) => bArtist.id === artist.id)
  ) || [];
  
  const sharedTracks = A.top_tracks?.filter((track: SpotifyTrack) => 
    B.top_tracks?.some((bTrack: SpotifyTrack) => bTrack.id === track.id)
  ) || [];
  
  const sharedGenres = A.genres?.filter((genre: string) => 
    B.genres?.includes(genre)
  ) || [];
  
  return {
    shared_artists: sharedArtists,
    shared_tracks: sharedTracks,
    shared_genres: sharedGenres,
  };
};
