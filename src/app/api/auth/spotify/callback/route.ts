import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REDIRECT_URI) {
  throw new Error('Missing Spotify environment variables');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for errors
    if (error) {
      console.error('Spotify authorization error:', error);
      return NextResponse.redirect(new URL('/auth/error?error=spotify_denied', request.url));
    }

    // Validate state parameter
    const storedState = request.cookies.get('spotify_state')?.value;
    if (!state || !storedState || state !== storedState) {
      console.error('State mismatch in Spotify callback');
      return NextResponse.redirect(new URL('/auth/error?error=invalid_state', request.url));
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(new URL('/auth/error?error=no_code', request.url));
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Get user profile from Spotify
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user profile:', await userResponse.text());
      return NextResponse.redirect(new URL('/auth/error?error=profile_fetch_failed', request.url));
    }

    const userData = await userResponse.json();

    // Store user data in Supabase
    const { data: authUser, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'spotify',
      options: {
        queryParams: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        },
      },
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.redirect(new URL('/auth/error?error=supabase_auth_failed', request.url));
    }

    // Store additional user data in your database
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        spotify_access_token: tokenData.access_token,
        spotify_refresh_token: tokenData.refresh_token,
        spotify_token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile update error:', profileError);
    }

    // Clear the state cookie
    const response = NextResponse.redirect(new URL('/me', request.url));
    response.cookies.delete('spotify_state');
    
    return response;

  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}
