import { supabase } from './supabaseClient';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Spotify token');
  }

  return response.json();
}

export async function ensureFreshToken(userId: string) {
  // Get user profile from database
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('spotify_access_token, spotify_refresh_token, spotify_token_expires_at')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    throw new Error('User profile not found');
  }

  // Check if token is expired or will expire in the next 5 minutes
  const expiresAt = new Date(profile.spotify_token_expires_at);
  const now = new Date();
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt <= fiveMinutesFromNow) {
    // Token is expired or will expire soon, refresh it
    const tokenData = await refreshSpotifyToken(profile.spotify_refresh_token);
    
    // Update the database with new tokens
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        spotify_access_token: tokenData.access_token,
        spotify_refresh_token: tokenData.refresh_token || profile.spotify_refresh_token,
        spotify_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error('Failed to update tokens in database');
    }

    return tokenData.access_token;
  }

  return profile.spotify_access_token;
}

export async function spotifyApiCall(userId: string, endpoint: string) {
  const accessToken = await ensureFreshToken(userId);
  
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
