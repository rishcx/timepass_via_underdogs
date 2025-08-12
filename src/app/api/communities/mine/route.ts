import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Community } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's community memberships
    const { data: memberships, error } = await supabase
      .from('community_members')
      .select(`
        community:communities(*)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching user memberships:', error);
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
    }

    // Extract communities from memberships
    const communities = memberships.map(membership => membership.community);

    return NextResponse.json({ 
      communities: communities as Community[] 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
