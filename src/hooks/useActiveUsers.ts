import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveUser {
  email: string;
  name: string;
  page: string;
  lastSeen: string;
}

/**
 * Tracks which team members are currently online in the dashboard
 * using Supabase Realtime Presence.
 */
export const useActiveUsers = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const displayNameRef = useRef<string>('');

  useEffect(() => {
    if (!user?.email) return;
    let isMounted = true;

    // Fetch the user's display name from team_members
    const setupPresence = async () => {
      let displayName = user.email || 'Utilisateur';
      
      try {
        const { data } = await supabase
          .from('team_members')
          .select('name')
          .eq('email', user.email!)
          .limit(1)
          .maybeSingle();
        
        if (data?.name) {
          displayName = data.name;
        }
      } catch {
        // Fallback to email
      }

      if (!isMounted) return;
      displayNameRef.current = displayName;

      const ch = supabase.channel('online-users', {
        config: {
          presence: {
            key: user.email!,
          },
        },
      });

      ch.on('presence', { event: 'sync' }, () => {
        if (!isMounted) return;
        const state = ch.presenceState<ActiveUser>();
        const users: ActiveUser[] = [];
        
        for (const [, presences] of Object.entries(state)) {
          if (presences && presences.length > 0) {
            // Take the most recent presence for each user
            users.push(presences[presences.length - 1]);
          }
        }
        
        setActiveUsers(users);
      });

      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && isMounted) {
          await ch.track({
            email: user.email!,
            name: displayName,
            page: location.pathname,
            lastSeen: new Date().toISOString(),
          });
        }
      });

      channelRef.current = ch;
    };

    setupPresence();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Update presence when page changes (reuses cached display name)
  useEffect(() => {
    if (!channelRef.current || !user?.email) return;

    const updatePage = async () => {
      try {
        await channelRef.current?.track({
          email: user.email!,
          name: displayNameRef.current || user.email!,
          page: location.pathname,
          lastSeen: new Date().toISOString(),
        });
      } catch {
        // Silently fail — presence is non-critical
      }
    };

    updatePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isOnline = (email: string) => {
    return activeUsers.some((u) => u.email === email);
  };

  const getActiveUser = (email: string) => {
    return activeUsers.find((u) => u.email === email);
  };

  return { activeUsers, isOnline, getActiveUser };
};
