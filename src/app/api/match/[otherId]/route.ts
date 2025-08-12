import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { scoreMatch, getSharedItems } from '@/lib/match';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ otherId: string }> }
) {
  const { otherId } = await params;
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const myId = user.id;
    // otherId is already extracted from params above

    // Get both user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', [myId, otherId]);

    if (profilesError || !profiles || profiles.length !== 2) {
      return NextResponse.json({ error: 'User profiles not found' }, { status: 404 });
    }

    const myProfile = profiles.find(p => p.id === myId);
    const otherProfile = profiles.find(p => p.id === otherId);

    if (!myProfile || !otherProfile) {
      return NextResponse.json({ error: 'User profiles not found' }, { status: 404 });
    }

    // Calculate match score
    const score = scoreMatch(myProfile, otherProfile);
    
    // Get shared items
    const shared = getSharedItems(myProfile, otherProfile);

    return NextResponse.json({
      score,
      shared_artists: shared.shared_artists,
      shared_tracks: shared.shared_tracks,
      shared_genres: shared.shared_genres,
      other_user: {
        id: otherProfile.id,
        display_name: otherProfile.display_name,
        email: otherProfile.email,
      }
    });

  } catch (error) {
    console.error('Match calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate match' },
      { status: 500 }
    );
  }
}
