import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { community_id } = await request.json();

    if (!community_id) {
      return NextResponse.json({ error: 'community_id is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if community exists
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('id', community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
      .from('community_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member of this community' }, { status: 409 });
    }

    // Join the community
    const { data: membership, error: joinError } = await supabase
      .from('community_members')
      .insert({
        user_id: user.id,
        community_id: community_id,
        joined_at: new Date().toISOString()
      })
      .select()
      .single();

    if (joinError) {
      console.error('Error joining community:', joinError);
      return NextResponse.json({ error: 'Failed to join community' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Successfully joined community',
      membership 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
