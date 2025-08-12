import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Message } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { community_id, body } = await request.json();

    if (!community_id || !body) {
      return NextResponse.json({ error: 'community_id and body are required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of the community
    const { data: membership } = await supabase
      .from('community_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('community_id', community_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 });
    }

    // Create group message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        kind: 'group',
        body,
        author_id: user.id,
        community_id: community_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: message as Message }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
