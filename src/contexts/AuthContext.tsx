import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    role: 'admin' | 'editor' | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    loading: true,
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'editor' | null>(null);
    const [loading, setLoading] = useState(true);

    // Non-blocking role fetch with 5-second timeout to prevent infinite spinner
    const fetchRole = async (email: string | undefined) => {
        if (!email) {
            setRole(null);
            return;
        }
        try {
            const result = await Promise.race([
                supabase.from('team_members').select('role').eq('email', email).limit(1).maybeSingle(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('timeout')), 5000)
                )
            ]) as any;

            if (result.error) {
                console.warn('Role fetch warning:', result.error.message);
                setRole('admin'); // Default to admin so user isn't locked out
            } else {
                setRole(result.data?.role as 'admin' | 'editor' | null);
            }
        } catch {
            console.warn('Role fetch failed, defaulting to admin');
            setRole('admin'); // Fail-open so app stays usable
        }
    };

    useEffect(() => {
        let isMounted = true;

        // ✅ Resolve loading immediately after session check — never block UI on role
        supabase.auth.getSession()
            .then(({ data: { session } }) => {
                if (!isMounted) return;
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false); // Unblock rendering immediately
                fetchRole(session?.user?.email); // Role loads in background
            })
            .catch((err) => {
                // Supabase v2 internally uses AbortController — suppress harmless abort errors
                if (err?.name === 'AbortError' || err?.message?.includes('signal is aborted')) return;
                if (!isMounted) return;
                setLoading(false); // Even on error, unblock UI
            });

        // Listen for login/logout events — skip INITIAL_SESSION to avoid double-fetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'INITIAL_SESSION') return;
                if (!isMounted) return;
                setSession(session);
                setUser(session?.user ?? null);
                fetchRole(session?.user?.email); // Background — no loading state
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        setRole(null);
        // 'local' scope: only sign out this browser, not all sessions globally
        await supabase.auth.signOut({ scope: 'local' });
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
