import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Connection } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { connection_id, action } = await request.json();

    if (!connection_id || !action) {
      return NextResponse.json({ error: 'connection_id and action are required' }, { status: 400 });
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the connection and verify the user is the target
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connection_id)
      .eq('target_id', user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found or not pending' }, { status: 404 });
    }

    if (action === 'accept') {
      // Accept the connection
      const { data: updatedConnection, error: updateError } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connection_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error accepting connection:', updateError);
        return NextResponse.json({ error: 'Failed to accept connection' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Connection accepted',
        connection: updatedConnection as Connection 
      });
    } else {
      // Reject the connection (delete it)
      const { error: deleteError } = await supabase
        .from('connections')
        .delete()
        .eq('id', connection_id);

      if (deleteError) {
        console.error('Error rejecting connection:', deleteError);
        return NextResponse.json({ error: 'Failed to reject connection' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Connection rejected'
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
