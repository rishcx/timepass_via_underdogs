export const jaccard = (a: string[], b: string[]) => {
  const A = new Set(a), B = new Set(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
};

export const audioSim = (a: any = {}, b: any = {}) => {
  const keys = ['danceability', 'energy', 'valence', 'tempo'];
  const dist = Math.sqrt(keys.reduce((s, k) => s + Math.pow((a[k] ?? 0) - (b[k] ?? 0), 2), 0));
  const max = Math.sqrt(keys.length);
  return 1 - Math.min(1, dist / max);
};

export const scoreMatch = (A: any, B: any) => {
  const sa = A.top_artists?.map((x: any) => x.id) || [], 
        sb = B.top_artists?.map((x: any) => x.id) || [];
  const ta = A.top_tracks?.map((x: any) => x.id) || [], 
        tb = B.top_tracks?.map((x: any) => x.id) || [];
  const ga = A.genres || [], 
        gb = B.genres || [];
  
  const s = 0.55 * jaccard(sa, sb) + 
            0.25 * jaccard(ta, tb) + 
            0.15 * jaccard(ga, gb) + 
            0.05 * audioSim(A.audio_feature_avg, B.audio_feature_avg);
  
  return Math.round(s * 100);
};

export const getSharedItems = (A: any, B: any) => {
  const sharedArtists = A.top_artists?.filter((artist: any) => 
    B.top_artists?.some((bArtist: any) => bArtist.id === artist.id)
  ) || [];
  
  const sharedTracks = A.top_tracks?.filter((track: any) => 
    B.top_tracks?.some((bTrack: any) => bTrack.id === track.id)
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
