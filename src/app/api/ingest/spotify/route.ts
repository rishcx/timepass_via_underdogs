import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { spotifyApiCall } from '@/lib/spotify';

export async function POST(request: NextRequest) {
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch top artists
    const topArtists = await spotifyApiCall(userId, '/me/top/artists?time_range=medium_term&limit=25');
    
    // Fetch top tracks
    const topTracks = await spotifyApiCall(userId, '/me/top/tracks?time_range=medium_term&limit=25');
    
    // Get audio features for top tracks
    const trackIds = topTracks.items.map((track: any) => track.id).join(',');
    const audioFeatures = await spotifyApiCall(userId, `/audio-features?ids=${trackIds}`);
    
    // Calculate average audio features
    const validFeatures = audioFeatures.audio_features.filter((feature: any) => feature !== null);
    const audioFeatureAvg = validFeatures.length > 0 ? {
      danceability: validFeatures.reduce((sum: number, f: any) => sum + f.danceability, 0) / validFeatures.length,
      energy: validFeatures.reduce((sum: number, f: any) => sum + f.energy, 0) / validFeatures.length,
      valence: validFeatures.reduce((sum: number, f: any) => sum + f.valence, 0) / validFeatures.length,
      tempo: validFeatures.reduce((sum: number, f: any) => sum + f.tempo, 0) / validFeatures.length,
    } : null;

    // Extract and count genres
    const allGenres = topArtists.items.flatMap((artist: any) => artist.genres);
    const genreCounts: { [key: string]: number } = {};
    allGenres.forEach((genre: string) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    // Get top 5 genres
    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);

    // Update user profile with taste data
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        top_artists: topArtists.items,
        top_tracks: topTracks.items,
        genres: topGenres,
        audio_feature_avg: audioFeatureAvg,
        last_taste_update: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update taste data:', updateError);
      return NextResponse.json({ error: 'Failed to save taste data' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        artists_count: topArtists.items.length,
        tracks_count: topTracks.items.length,
        genres: topGenres,
        audio_features: audioFeatureAvg,
      }
    });

  } catch (error) {
    console.error('Taste ingestion error:', error);
    return NextResponse.json(
      { error: 'Failed to ingest taste data' },
      { status: 500 }
    );
  }
}
