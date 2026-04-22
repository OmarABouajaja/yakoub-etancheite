import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveUsers } from '@/hooks/useActiveUsers';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, FolderOpen, Settings, LogOut, Menu, X, FileText, Star, Shield, Award, DollarSign, Circle, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { t, isRTL } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, role, user } = useAuth();
    const { activeUsers } = useActiveUsers();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const pageLabels: Record<string, string> = {
        '/dashboard': 'Aperçu',
        '/dashboard/leads': 'Prospects',
        '/dashboard/projects': 'Portfolio',
        '/dashboard/finance': 'Trésorerie',
        '/dashboard/testimonials': 'Avis',
        '/dashboard/blog': 'Blog',
        '/dashboard/partners': 'Partenaires',
        '/dashboard/team': 'Équipe',
        '/dashboard/settings': 'Paramètres',
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const allNavItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Aperçu' },
        { path: '/dashboard/leads', icon: Users, label: 'Prospects' },
        { path: '/dashboard/projects', icon: FolderOpen, label: 'Portfolio' },
        { path: '/dashboard/finance', icon: DollarSign, label: 'Trésorerie' },
        { path: '/dashboard/testimonials', icon: Star, label: 'Avis Clients' },
        { path: '/dashboard/blog', icon: FileText, label: 'Blog CMS' },
        { path: '/dashboard/partners', icon: Award, label: 'Partenaires' },
        { path: '/dashboard/team', icon: Shield, label: 'Équipe' },
        { path: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
    ];

    const navItems = role === 'editor' 
        ? allNavItems.filter(item => ['/dashboard', '/dashboard/leads', '/dashboard/blog'].includes(item.path))
        : allNavItems;

    const isActive = (path: string) => location.pathname === path;

    // User display info
    const userEmail = user?.email || '';
    const userInitials = getInitials(userEmail.split('@')[0] || 'U');
    const currentUserPresence = activeUsers.find(u => u.email === userEmail);
    const displayName = currentUserPresence?.name || userEmail.split('@')[0] || 'Utilisateur';

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col transition-all duration-300 border-r border-border bg-card/50 backdrop-blur-xl ${isSidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-4 border-b border-border">
                    {isSidebarOpen ? (
                        <Link to="/" className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-white rounded-md p-0.5 flex items-center justify-center overflow-hidden border border-primary/20">
                                <img src="/logo.jpg" alt="Yakoub" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-bold text-lg font-display tracking-wider">YAKOUB</span>
                        </Link>
                    ) : (
                        <Link to="/" className="mx-auto">
                            <div className="h-10 w-10 bg-white rounded-md p-0.5 flex items-center justify-center overflow-hidden border border-primary/20">
                                <img src="/logo.jpg" alt="Yakoub" className="w-full h-full object-contain" />
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                    >
                        {isSidebarOpen 
                            ? <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                            : <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        }
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-2">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <Link
                            key={path}
                            to={path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all ${isActive(path)
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {isSidebarOpen && <span className="font-medium">{label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Active Users */}
                {isSidebarOpen && activeUsers.length > 0 && (
                    <div className="px-4 py-3 border-t border-border">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
                            En ligne ({activeUsers.length})
                        </p>
                        <div className="space-y-1.5">
                            {activeUsers.map((u) => (
                                <div key={u.email} className="flex items-center gap-2 text-xs">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                                            {getInitials(u.name)}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                                    </div>
                                    <div className="truncate">
                                        <p className={`font-medium truncate ${u.email === user?.email ? 'text-primary' : 'text-foreground'}`}>
                                            {u.name}{u.email === user?.email ? ' (vous)' : ''}
                                        </p>
                                        <p className="text-muted-foreground text-[10px] truncate">
                                            {pageLabels[u.page] || 'Navigation'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* User Profile + Logout */}
                <div className="border-t border-border">
                    {/* User avatar card */}
                    <div className={`px-4 py-3 ${isSidebarOpen ? '' : 'flex justify-center'}`}>
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-3">
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                                        {userInitials}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                            role === 'admin'
                                                ? 'bg-primary/15 text-primary border border-primary/30'
                                                : 'bg-secondary/15 text-secondary border border-secondary/30'
                                        }`}>
                                            {role === 'admin' ? 'Admin' : 'Éditeur'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-lg">
                                    {userInitials}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <div className="px-3 pb-4">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                        >
                            <LogOut className="w-5 h-5" />
                            {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-white rounded-md p-0.5 flex items-center justify-center overflow-hidden border border-primary/20">
                        <img src="/logo.jpg" alt="Yakoub" className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold font-display">YAKOUB</span>
                </Link>

                <div className="flex items-center gap-2">
                    {/* Mobile user avatar */}
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {userInitials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-md border border-border"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="md:hidden fixed inset-0 top-16 z-40 bg-card/95 backdrop-blur-xl flex flex-col"
                    >
                        {/* Mobile user info bar */}
                        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-bold text-primary-foreground">
                                    {userInitials}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                    role === 'admin'
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-secondary/15 text-secondary'
                                }`}>
                                    {role === 'admin' ? 'Admin' : 'Éditeur'}
                                </span>
                            </div>
                        </div>

                        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                            {navItems.map(({ path, icon: Icon, label }) => (
                                <Link
                                    key={path}
                                    to={path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-4 rounded-md transition-all ${isActive(path)
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{label}</span>
                                </Link>
                            ))}
                        </nav>
                        <div className="p-4 border-t border-border">
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }}
                                className="flex items-center gap-3 px-4 py-4 rounded-md text-destructive hover:bg-destructive/10 transition-colors w-full"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Déconnexion</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 md:p-8 p-4 pt-20 md:pt-8 overflow-auto">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
