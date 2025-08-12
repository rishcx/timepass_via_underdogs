import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Connection, PopulatedConnection } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all connections for the user
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        requester:profiles!connections_requester_id_fkey(
          auth_user_id,
          display_name,
          avatar_url
        ),
        target:profiles!connections_target_id_fkey(
          auth_user_id,
          display_name,
          avatar_url
        )
      `)
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Separate pending and accepted connections
    const pending: PopulatedConnection[] = [];
    const accepted: PopulatedConnection[] = [];

    connections.forEach((conn: any) => {
      const isRequester = conn.requester_id === user.id;
      const otherUser = isRequester ? conn.target : conn.requester;
      
      const populatedConnection: PopulatedConnection = {
        ...conn,
        user: otherUser
      };

      if (conn.status === 'pending') {
        pending.push(populatedConnection);
      } else if (conn.status === 'accepted') {
        accepted.push(populatedConnection);
      }
    });

    return NextResponse.json({ 
      pending,
      accepted
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
