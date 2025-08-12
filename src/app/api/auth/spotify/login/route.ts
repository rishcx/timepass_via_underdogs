import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_REDIRECT_URI) {
  throw new Error('Missing Spotify environment variables');
}

export async function GET(_request: NextRequest) {
  try {
    // Generate a random state parameter for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store the state in a secure way (you might want to use a session or database)
    // For now, we'll use a cookie
    const response = NextResponse.redirect(constructAuthorizeUrl(state));
    response.cookies.set('spotify_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });
    
    return response;
  } catch (error) {
    console.error('Spotify login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify login' },
      { status: 500 }
    );
  }
}

function constructAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI!,
    scope: 'user-top-read user-read-recently-played playlist-modify-private user-read-private user-read-email',
    state: state,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}
