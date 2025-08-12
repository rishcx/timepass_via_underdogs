import { supabase } from '@/lib/supabaseClient';
import { scoreMatch } from '@/lib/match';
import DiscoverClient from './DiscoverClient';

async function getDiscoverData() {
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  // Get all user profiles except the current user
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .neq('id', user.id);

  if (profilesError || !profiles) {
    return null;
  }

  // Get current user's profile
  const { data: myProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!myProfile) {
    return null;
  }

  // Calculate match scores and sort
  const matches = profiles
    .map(profile => ({
      ...profile,
      score: scoreMatch(myProfile, profile)
    }))
    .sort((a, b) => b.score - a.score);

  return {
    myProfile,
    matches
  };
}

export default async function DiscoverPage() {
  const data = await getDiscoverData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to discover matches</h1>
          <a
            href="/login"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <DiscoverClient data={data} />;
}
