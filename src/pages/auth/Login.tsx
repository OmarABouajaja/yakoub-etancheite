import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 spray-texture">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--orange)) 0%, transparent 60%)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--teal)) 0%, transparent 60%)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="glass-card border-2 border-primary/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-white rounded-md p-1 flex items-center justify-center mb-4 border-2 border-primary/20">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <CardTitle className="text-2xl font-bold font-display tracking-wider">
                            Admin Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-center gap-2 text-red-500 text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@yakoub.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-background/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background/50"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full font-bold uppercase tracking-wider glow-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
