import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import BeforeAfter from './BeforeAfter';
import { getProjectsByLang } from '@/lib/api';
import { Zap, Loader2, Layers } from 'lucide-react';

// Fallback data for when API is unavailable
import { FolderOpen } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  roof: 'Toiture',
  wall: 'Mur',
  pool: 'Piscine',
  basement: 'Sous-sol',
};

const CATEGORY_LABELS_AR: Record<string, string> = {
  roof: 'سطح',
  wall: 'جدار',
  pool: 'مسبح',
  basement: 'قبو',
};

const PortfolioSection: React.FC = () => {
  const { t, language, isRTL } = useLanguage();

  // Fetch projects from API with language
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', language],
    queryFn: () => getProjectsByLang(language),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  // Fallback to empty bracket explicitly if undefined instead of static stub array
  const displayProjects = projects || [];

  return (
    <section id="portfolio" className="py-24 relative spray-texture">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[hsl(var(--cyan-bright))] opacity-[0.05] blur-[120px] rounded-full" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center w-full mb-4">
            <div className="inline-flex items-center gap-2 tag-style">
              <Zap className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
              <span className="text-xs">{isRTL ? 'أعمالنا' : 'NOS PROJETS'}</span>
            </div>
          </div>
          <h2 className="section-title">{t('portfolio.title')}</h2>
          <p className="section-subtitle mx-auto mt-6">{t('portfolio.subtitle')}</p>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Portfolio Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="group"
              >
                {project.image_before && project.image_before !== '/placeholder.svg' ? (
                  <BeforeAfter
                    imageBefore={project.image_before}
                    imageAfter={project.image_after || ''}
                    title={project.title}
                  />
                ) : project.gallery_images && project.gallery_images.length > 0 ? (
                  <div className="relative group">
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bento-card p-0 flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
                      {project.gallery_images.map((img: string, i: number) => (
                        <img
                          key={i}
                          src={img}
                          alt={`${project.title} - ${i + 1}`}
                          className="w-full h-full object-cover shrink-0 snap-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ))}
                    </div>
                    {project.gallery_images.length > 1 && (
                       <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-[10px] uppercase font-bold tracking-wider rounded-md pointer-events-none z-10">
                         {project.gallery_images.length} {isRTL ? 'صور' : 'Photos'}
                       </div>
                    )}
                    <h4 className="mt-4 text-foreground font-marker text-lg line-clamp-1">{project.title}</h4>
                  </div>
                ) : (
                  <div className="relative group">
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bento-card p-0">
                      <img
                        src={project.image_after || '/placeholder.svg'}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <h4 className="mt-4 text-foreground font-marker text-lg line-clamp-1">{project.title}</h4>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {project.category && (
                    <span className="inline-flex items-center gap-1 tag-style text-[10px]">
                      <Layers className="w-2.5 h-2.5" />
                      {isRTL ? (CATEGORY_LABELS_AR[project.category] || project.category) : (CATEGORY_LABELS[project.category] || project.category)}
                    </span>
                  )}
                  {project.location_gov && (
                    <span className="tag-style text-[10px]">{project.location_gov}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        {!isLoading && displayProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground glass-card border border-primary/20">
              <FolderOpen className="w-16 h-16 mb-4 opacity-50 text-[hsl(var(--cyan-bright))]" />
              <p className="text-xl font-bold font-display tracking-wider">
                {isRTL ? 'لا توجد مشاريع حالياً' : 'Aucun projet pour le moment'}
              </p>
              <p className="text-sm">
                {isRTL ? 'سيتم إضافة أحدث أعمالنا قريباً.' : 'Nos derniers travaux seront ajoutés ici bientôt.'}
              </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PortfolioSection;
