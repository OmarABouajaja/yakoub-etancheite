import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, FolderOpen, Settings, LogOut, Menu, X, FileText, Star, Shield, Award, DollarSign } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { t, isRTL } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut, role } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                        {/* Icon depends on state, handled below in original code? No, button content was separate */}
                        <Menu className="w-5 h-5 text-muted-foreground" />
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

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        {isSidebarOpen && <span className="font-medium">Déconnexion</span>}
                    </button>
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
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-md border border-border"
                >
                    {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="md:hidden fixed inset-0 top-16 z-40 bg-card/95 backdrop-blur-xl"
                    >
                        <nav className="p-4 space-y-2">
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
