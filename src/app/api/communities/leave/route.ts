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

    // Remove membership
    const { error: leaveError } = await supabase
      .from('community_members')
      .delete()
      .eq('user_id', user.id)
      .eq('community_id', community_id);

    if (leaveError) {
      console.error('Error leaving community:', leaveError);
      return NextResponse.json({ error: 'Failed to leave community' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Successfully left community'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
