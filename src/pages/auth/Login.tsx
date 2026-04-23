import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
            setError(err.message === 'Invalid login credentials' 
                ? 'Identifiants incorrects' 
                : err.message || 'Erreur lors de la connexion');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 spray-texture relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] opacity-15 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(var(--orange)) 0%, transparent 70%)' }} />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] opacity-15 rounded-full blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(var(--teal)) 0%, transparent 70%)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 rounded-full blur-[120px] bg-primary" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px] relative z-10"
            >
                <Card className="bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[hsl(var(--orange))] via-primary to-[hsl(var(--teal))]" />
                    
                    <CardHeader className="text-center pt-10 pb-6">
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto w-20 h-20 bg-white rounded-2xl p-2 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative"
                        >
                            <img src="/logo.png" alt="Yakoub Travaux Logo" className="w-full h-full object-contain" />
                            <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                                <ShieldCheck className="w-4 h-4" />
                            </div>
                        </motion.div>
                        <CardTitle className="text-2xl font-black font-display tracking-wide text-foreground">
                            Espace Administrateur
                        </CardTitle>
                        <CardDescription className="text-muted-foreground mt-2 font-medium">
                            Connectez-vous pour accéder au tableau de bord sécurisé.
                        </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="px-8 pb-10">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-500 text-sm font-medium overflow-hidden"
                                    >
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Adresse Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@yakoub-etancheite.com.tn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all h-12 rounded-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-black/20 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all h-12 rounded-lg font-mono tracking-widest placeholder:tracking-normal"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 font-bold text-[15px] uppercase tracking-wider glow-button mt-4 rounded-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Authentification...
                                    </>
                                ) : (
                                    'Se connecter'
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
