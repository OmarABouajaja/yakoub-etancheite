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

    const fetchRole = async (email: string | undefined) => {
        if (!email) {
            setRole(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('role')
                .eq('email', email)
                .single();
            
            if (error) {
                console.error("Error fetching role:", error);
                setRole(null);
            } else {
                setRole(data?.role as 'admin' | 'editor' | null);
            }
        } catch (err) {
            console.error(err);
            setRole(null);
        }
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            await fetchRole(session?.user?.email);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setLoading(true);
            setSession(session);
            setUser(session?.user ?? null);
            await fetchRole(session?.user?.email);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
