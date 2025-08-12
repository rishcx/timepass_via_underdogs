import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Message } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { to_auth_user_id, body } = await request.json();

    if (!to_auth_user_id || !body) {
      return NextResponse.json({ error: 'to_auth_user_id and body are required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id === to_auth_user_id) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Verify connection exists and is accepted
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},target_id.eq.${to_auth_user_id}),and(requester_id.eq.${to_auth_user_id},target_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No accepted connection with this user' }, { status: 403 });
    }

    // Create DM message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        kind: 'dm',
        body,
        author_id: user.id,
        recipient_id: to_auth_user_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating DM message:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ message: message as Message }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
