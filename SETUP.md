# MusicMate Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Spotify Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/auth/spotify/callback

# For production, update the redirect URI to your domain
# SPOTIFY_REDIRECT_URI=https://yourdomain.com/api/auth/spotify/callback
```

## Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add the redirect URI: `http://localhost:3000/api/auth/spotify/callback`
4. Copy the Client ID and Client Secret to your `.env.local` file

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Add them to your `.env.local` file

## Database Schema

Create the following table in your Supabase database:

```sql
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  spotify_token_expires_at TIMESTAMP WITH TIME ZONE,
  top_artists JSONB,
  top_tracks JSONB,
  genres TEXT[],
  audio_feature_avg JSONB,
  last_taste_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id);
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3000/login` to test the Spotify authentication

## Features Implemented

- ✅ Supabase client configuration
- ✅ Spotify OAuth login flow
- ✅ Authorization code exchange
- ✅ User profile storage
- ✅ Error handling
- ✅ CSRF protection with state parameter
- ✅ Secure token storage
- ✅ User authentication flow

## Next Steps

1. Implement user profile completion
2. Add music taste analysis
3. Create matching algorithm
4. Build chat functionality
5. Add playlist collaboration features
