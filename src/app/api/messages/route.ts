import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Message } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind') as 'dm' | 'group' | null;
    const communityId = searchParams.get('community_id');
    const recipientId = searchParams.get('recipient_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (kind === 'dm') {
      if (!recipientId) {
        return NextResponse.json({ error: 'recipient_id is required for DM messages' }, { status: 400 });
      }
      // Get DMs between the two users (either direction)
      query = query
        .eq('kind', 'dm')
        .or(`and(author_id.eq.${user.id},recipient_id.eq.${recipientId}),and(author_id.eq.${recipientId},recipient_id.eq.${user.id})`);
    } else if (kind === 'group') {
      if (!communityId) {
        return NextResponse.json({ error: 'community_id is required for group messages' }, { status: 400 });
      }
      query = query
        .eq('kind', 'group')
        .eq('community_id', communityId);
    } else {
      // Get all messages for the user (both DMs and group messages they're part of)
      query = query.or(`author_id.eq.${user.id},recipient_id.eq.${user.id},community_id.not.is.null`);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ messages: messages as Message[] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { kind, body, community_id, recipient_id } = await request.json();

    if (!kind || !body) {
      return NextResponse.json({ error: 'kind and body are required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (kind === 'dm' && !recipient_id) {
      return NextResponse.json({ error: 'recipient_id is required for DM messages' }, { status: 400 });
    }

    if (kind === 'group' && !community_id) {
      return NextResponse.json({ error: 'community_id is required for group messages' }, { status: 400 });
    }

    const messageData: any = {
      kind,
      body,
      author_id: user.id
    };

    if (community_id) {
      messageData.community_id = community_id;
    }

    if (recipient_id) {
      messageData.recipient_id = recipient_id;
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    return NextResponse.json({ message: message as Message }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
