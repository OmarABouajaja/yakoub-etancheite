import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import { Users, FolderOpen, TrendingUp, Clock, ArrowRight, DollarSign, Activity, PenLine, Trash2, UserPlus, Eye, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getLeads, getProjects, Project, Lead } from '@/lib/api';
import { getFinancialSummary, formatTND } from '@/lib/finance-api';
import { getActivityLog, type ActivityLogEntry } from '@/lib/activity-api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusLabels: Record<string, string> = {
    new: 'Nouveau',
    contacted: 'Contacté',
    converted: 'Converti',
    lost: 'Perdu',
};

const Dashboard: React.FC = () => {
    const { data: leads = [], isLoading: isLeadsLoading } = useQuery({
        queryKey: ['leads'],
        queryFn: getLeads,
    });

    const { data: projects = [], isLoading: isProjectsLoading } = useQuery<Project[]>({
        queryKey: ['projects'],
        queryFn: getProjects,
    });

    const { data: financeSummary, isLoading: isFinanceLoading } = useQuery({
        queryKey: ['finance-summary'],
        queryFn: getFinancialSummary,
    });

    const { data: activityLog = [] } = useQuery({
        queryKey: ['activity-log'],
        queryFn: () => getActivityLog(10),
        staleTime: 30 * 1000, // 30s
    });
    
    const isLoading = isLeadsLoading || isProjectsLoading;

    const newLeads = leads.filter((l: Lead) => l.status === 'new').length;
    const recentLeads = leads.slice(0, 5);

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-wider text-foreground">
                        Tableau de Bord
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Bienvenue ! Voici votre aperçu.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Prospects"
                        value={leads.length}
                        icon={Users}
                        color="orange"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Nouveaux Prospects"
                        value={newLeads}
                        icon={Clock}
                        color="teal"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Projets Portfolio"
                        value={projects.length}
                        icon={FolderOpen}
                        color="water-blue"
                        isLoading={isLoading}
                    />
                    <StatsCard
                        title="Chiffre d'Affaires"
                        value={isFinanceLoading ? '…' : formatTND(financeSummary?.totalRevenue ?? 0)}
                        icon={DollarSign}
                        color="teal"
                        isLoading={isFinanceLoading}
                    />
                </div>

                {/* Recent Leads Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card overflow-hidden"
                >
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-xl font-bold font-display tracking-wider">Derniers Prospects</h2>
                        <Link
                            to="/dashboard/leads"
                            className="text-primary hover:text-primary/80 flex items-center gap-2 text-sm font-medium"
                        >
                            Voir Tout <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-muted/50 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-muted/50 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-muted/50 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-muted/50 rounded w-16"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-muted/50 rounded w-24"></div></td>
                                        </tr>
                                    ))
                                ) : recentLeads.length > 0 ? (
                                    recentLeads.map((lead: Lead) => (
                                        <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-foreground font-medium">{lead.client_name || lead.name || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground" dir="ltr">{lead.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs rounded-md bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]">
                                                    {lead.problem_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-md font-medium ${lead.status === 'new'
                                                    ? 'bg-[hsl(var(--orange)/0.15)] text-[hsl(var(--orange))]'
                                                    : lead.status === 'converted'
                                                    ? 'bg-green-500/15 text-green-500'
                                                    : lead.status === 'contacted'
                                                    ? 'bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]'
                                                    : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                    {statusLabels[lead.status] || lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground text-sm">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            Aucun prospect. Les demandes de devis apparaîtront ici.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Activity Log */}
                {activityLog.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card overflow-hidden"
                    >
                        <div className="p-6 border-b border-border flex items-center gap-3">
                            <Activity className="w-5 h-5 text-secondary" />
                            <h2 className="text-xl font-bold font-display tracking-wider">Activité Récente</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {activityLog.map((entry: ActivityLogEntry) => {
                                const actionIcons: Record<string, React.ReactNode> = {
                                    create: <PenLine className="w-4 h-4 text-green-400" />,
                                    update: <PenLine className="w-4 h-4 text-primary" />,
                                    delete: <Trash2 className="w-4 h-4 text-destructive" />,
                                    invite: <UserPlus className="w-4 h-4 text-secondary" />,
                                    status_change: <Eye className="w-4 h-4 text-[hsl(var(--teal))]" />,
                                    publish: <Send className="w-4 h-4 text-green-400" />,
                                    login: <Users className="w-4 h-4 text-muted-foreground" />,
                                };
                                return (
                                    <div key={entry.id} className="px-6 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                            {actionIcons[entry.action] || <Activity className="w-4 h-4 text-muted-foreground" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-foreground truncate">
                                                <span className="font-medium text-primary">{entry.user_name}</span>{' '}
                                                {entry.details}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        to="/dashboard/leads"
                        className="glass-card p-6 flex items-center gap-4 hover:border-primary/50 transition-colors group"
                    >
                                <div className="p-4 rounded-md bg-[hsl(var(--orange)/0.15)]">
                            <Users className="w-6 h-6 text-[hsl(var(--orange))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                Gérer les Prospects
                            </h3>
                            <p className="text-sm text-muted-foreground">Voir et modifier le statut</p>
                        </div>
                    </Link>

                    <Link
                        to="/dashboard/projects"
                        className="glass-card p-6 flex items-center gap-4 hover:border-primary/50 transition-colors group"
                    >
                        <div className="p-4 rounded-md bg-[hsl(var(--teal)/0.15)]">
                            <FolderOpen className="w-6 h-6 text-[hsl(var(--teal))]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                Gérer le Portfolio
                            </h3>
                            <p className="text-sm text-muted-foreground">Ajouter ou modifier des photos</p>
                        </div>
                    </Link>

                    <Link
                        to="/dashboard/finance"
                        className="glass-card p-6 flex items-center gap-4 hover:border-green-500/40 transition-colors group border-green-500/20"
                    >
                        <div className="p-4 rounded-md bg-green-500/10">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground group-hover:text-green-400 transition-colors">
                                Trésorerie
                            </h3>
                            <p className="text-sm text-muted-foreground">Revenus, coûts et dépenses</p>
                        </div>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Dashboard;
