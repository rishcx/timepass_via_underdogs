import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Community } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'genre' | 'artist' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('communities')
      .select('*')
      .order('name')
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: communities, error } = await query;

    if (error) {
      console.error('Error fetching communities:', error);
      return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
    }

    return NextResponse.json({ communities: communities as Community[] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
