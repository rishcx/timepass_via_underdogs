import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Community } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get communities with member counts, ordered by member count desc
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        *,
        member_count:community_members(count)
      `)
      .order('member_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching trending communities:', error);
      return NextResponse.json({ error: 'Failed to fetch trending communities' }, { status: 500 });
    }

    // Transform the data to include member count
    const transformedCommunities = communities.map(community => ({
      ...community,
      member_count: community.member_count?.[0]?.count || 0
    }));

    return NextResponse.json({ 
      communities: transformedCommunities as (Community & { member_count: number })[] 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
