import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'orange' | 'teal' | 'water-blue';
    isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'orange',
    isLoading = false
}) => {
    const colorClasses = {
        'orange': 'from-[hsl(var(--orange))] to-[hsl(var(--orange)/0.5)]',
        'teal': 'from-[hsl(var(--teal))] to-[hsl(var(--teal)/0.5)]',
        'water-blue': 'from-[hsl(var(--water-blue))] to-[hsl(var(--water-blue)/0.5)]',
    };

    const iconBgClasses = {
        'orange': 'bg-[hsl(var(--orange)/0.15)] text-[hsl(var(--orange))]',
        'teal': 'bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]',
        'water-blue': 'bg-[hsl(var(--water-blue)/0.15)] text-[hsl(var(--water-blue))]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 relative overflow-hidden"
        >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorClasses[color]}`} />

            <div className="flex items-start justify-between">
                <div>
                    <p className="text-muted-foreground text-sm uppercase tracking-wider mb-2">{title}</p>
                    {isLoading ? (
                        <div className="h-10 w-24 bg-muted/50 rounded animate-pulse" />
                    ) : (
                        <p className="text-4xl font-bold font-display text-foreground">{value}</p>
                    )}
                    
                    {!isLoading && trend && (
                        <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-md ${iconBgClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </motion.div>
    );
};

export default StatsCard;
