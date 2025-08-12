import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Helper function to convert genre to title case
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export async function POST(_request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Seeding only allowed in development' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get all profiles with their top genres
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('top_genres')
      .not('top_genres', 'is', null);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Count genre frequency
    const genreCounts: Record<string, number> = {};
    
    profiles.forEach(profile => {
      if (profile.top_genres && Array.isArray(profile.top_genres)) {
        profile.top_genres.forEach(genre => {
          if (genre && typeof genre === 'string') {
            const normalizedGenre = genre.toLowerCase().trim();
            genreCounts[normalizedGenre] = (genreCounts[normalizedGenre] || 0) + 1;
          }
        });
      }
    });

    // Sort by frequency and take top ~50
    const topGenres = Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 50)
      .map(([genre, count]) => ({ genre, count }));

    // Upsert communities for top genres
    const communitiesToUpsert = topGenres.map(({ genre }) => ({
      type: 'genre' as const,
      key: genre,
      name: toTitleCase(genre)
    }));

    const { data: communities, error: upsertError } = await supabase
      .from('communities')
      .upsert(communitiesToUpsert, { 
        onConflict: 'key',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Error upserting communities:', upsertError);
      return NextResponse.json({ error: 'Failed to create communities' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Created ${communities.length} communities from ${profiles.length} profiles`,
      communities: communities,
      genreStats: topGenres
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
