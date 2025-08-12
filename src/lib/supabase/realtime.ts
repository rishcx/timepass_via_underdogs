import { createSupabaseBrowserClient } from './client';
import { Message } from '@/types';

export function subscribeToDMMessages(otherUserId: string, onMessage: (message: Message) => void) {
  const supabase = createSupabaseBrowserClient();
  
  return supabase.channel(`dm:${otherUserId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `dm_with=eq.${otherUserId}` 
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
}

export function subscribeToGroupMessages(communityId: string, onMessage: (message: Message) => void) {
  const supabase = createSupabaseBrowserClient();
  
  return supabase.channel(`room:${communityId}`)
    .on(
      'postgres_changes',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `community_id=eq.${communityId}` 
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();
}

export function unsubscribeFromChannel(channel: ReturnType<typeof createSupabaseBrowserClient>['channel']) {
  if (channel) {
    channel.unsubscribe();
  }
}
