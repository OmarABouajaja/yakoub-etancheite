/**
 * Activity Log — tracks admin actions for auditability
 */
import { supabase } from '@/lib/supabase';

export interface ActivityLogEntry {
  id: string;
  user_email: string;
  user_name: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'invite' | 'status_change' | 'publish';
  entity: string;           // e.g. 'lead', 'project', 'blog', 'team_member'
  entity_id: string | null;
  details: string;          // human-readable summary
  created_at: string;
}

/**
 * Log an admin action
 */
export async function logActivity(
  action: ActivityLogEntry['action'],
  entity: string,
  entityId: string | null,
  details: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    // Try to get display name
    let userName = user.email;
    try {
      const { data } = await supabase
        .from('team_members')
        .select('name')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle();
      if (data?.name) userName = data.name;
    } catch { /* fallback to email */ }

    await supabase.from('activity_log').insert([{
      user_email: user.email,
      user_name: userName,
      action,
      entity,
      entity_id: entityId,
      details,
    }]);
  } catch (err) {
    // Activity logging is non-critical — never block user workflows
    console.warn('Activity log failed:', err);
  }
}

/**
 * Fetch recent activity log entries
 */
export async function getActivityLog(limit: number = 15): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getActivityLog error:', error);
    return [];
  }

  return (data as ActivityLogEntry[]) || [];
}
