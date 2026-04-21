import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role-based access control
    if (role === 'editor') {
        const restrictedPaths = ['/dashboard/finance', '/dashboard/team', '/dashboard/settings', '/dashboard/projects', '/dashboard/partners', '/dashboard/testimonials'];
        if (restrictedPaths.some(path => location.pathname.startsWith(path))) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default RequireAuth;
