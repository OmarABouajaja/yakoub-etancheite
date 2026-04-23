import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [verifyingSession, setVerifyingSession] = useState(true);
    const [sessionError, setSessionError] = useState(false);

    useEffect(() => {
        // Verify if the user actually has a session (either from logging in or from a recovery/invite link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If they don't have a session, they can't update their password directly.
                // Wait a moment in case the auth state is still initializing from hash token
                setTimeout(async () => {
                    const { data: { session: delayedSession } } = await supabase.auth.getSession();
                    if (!delayedSession) {
                        setSessionError(true);
                    }
                    setVerifyingSession(false);
                }, 1500);
            } else {
                setVerifyingSession(false);
            }
        };
        
        checkSession();

        // Listen for auth state changes just in case the hash processes while component mounts
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setSessionError(false);
                setVerifyingSession(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (password.length < 6) {
            setError("Le mot de passe doit contenir au moins 6 caractères.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            
            toast.success("Mot de passe enregistré avec succès !");
            navigate('/dashboard');
            
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue lors de la mise à jour.');
        } finally {
            setLoading(false);
        }
    };

    if (verifyingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background px-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (sessionError) {
        return (
             <div className="min-h-screen flex items-center justify-center bg-background px-4">
                 <Card className="glass-card border-none max-w-md text-center p-6">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <CardTitle className="mb-2">Lien invalide ou expiré</CardTitle>
                    <CardDescription className="mb-6">
                        Nous n'avons pas pu vérifier votre invitation. Le lien a peut-être expiré ou a déjà été utilisé.
                    </CardDescription>
                    <Button onClick={() => navigate('/login')} variant="outline">
                        Retour à la connexion
                    </Button>
                 </Card>
             </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 spray-texture">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--teal)) 0%, transparent 60%)' }} />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-md object-contain border-2 border-primary/20 bg-white mx-auto p-1 mb-4" />
                    <h1 className="text-2xl font-bold font-display tracking-wider text-foreground">Bienvenue dans l'équipe</h1>
                    <p className="text-muted-foreground mt-2">Veuillez sécuriser votre compte en choisissant un mot de passe</p>
                </div>

                <Card className="glass-card border-2 border-primary/20">
                    <CardContent className="pt-6">
                        <form onSubmit={handleUpdatePassword} className="space-y-5">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-md flex items-center gap-2 text-red-500 text-sm">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="password">Nouveau mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-background/50 border-primary/20 focus:border-primary"
                                    required
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-background/50 border-primary/20 focus:border-primary"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full font-bold uppercase tracking-wider glow-button mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Enregistrer et Continuer
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default UpdatePassword;
