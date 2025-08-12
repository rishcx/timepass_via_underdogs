// src/types.ts

export type UserSummary = {
  auth_user_id: string;
  display_name: string;
  avatar_url?: string;
};

export type MatchResult = {
  score: number;
  shared_artists: string[];
  shared_tracks: string[];
  shared_genres: string[];
};

export type Community = {
  id: string;
  type: 'genre' | 'artist';
  key: string;
  name: string;
};

export type Message = {
  id: string;
  kind: 'dm' | 'group';
  dm_with?: string;
  community_id?: string;
  author: string;
  body: string;
  created_at: string;
};

export type Connection = {
  id: string;
  created_at: string;
  requester_id: string;
  target_id: string;
  status: 'pending' | 'accepted';
};

// Enriched type for displaying connections
export type PopulatedConnection = Connection & {
  // Details of the *other* person in the connection
  user: UserSummary;
};
