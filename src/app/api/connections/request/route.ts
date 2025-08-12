import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Connection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { target_id } = await request.json();

    if (!target_id) {
      return NextResponse.json({ error: 'target_id is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id === target_id) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 });
    }

    // Check if connection already exists (either direction)
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('*')
      .or(`and(requester_id.eq.${user.id},target_id.eq.${target_id}),and(requester_id.eq.${target_id},target_id.eq.${user.id})`)
      .single();

    if (existingConnection) {
      return NextResponse.json({ error: 'Connection already exists' }, { status: 409 });
    }

    // Create connection request
    const { data: connection, error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        target_id: target_id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connection request:', error);
      return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Connection request sent',
      connection: connection as Connection 
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
