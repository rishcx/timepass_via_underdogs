import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Message } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { otherId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify connection exists and is accepted
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},target_id.eq.${params.otherId}),and(requester_id.eq.${params.otherId},target_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No accepted connection with this user' }, { status: 403 });
    }

    // Get DM history between the two users
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('kind', 'dm')
      .or(`and(author_id.eq.${user.id},recipient_id.eq.${params.otherId}),and(author_id.eq.${params.otherId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching DM history:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages as Message[] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
