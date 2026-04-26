import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, Calendar, Tag } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Link } from 'react-router-dom';

interface BlogPreview {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image: string | null;
  created_at: string;
}

const BlogPreviewSection: React.FC = () => {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';
  const [blogs, setBlogs] = useState<BlogPreview[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    direction: isRTL ? 'rtl' : 'ltr',
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('id, title, slug, excerpt, cover_image, created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          setBlogs(data);
        }
      } catch {
        // Silently ignore — section won't render
      }
    };
    fetchBlogs();
  }, []);

  // Don't render if no published blogs
  if (blogs.length === 0) return null;

  return (
    <section className="py-24 relative spray-texture">
      {/* Background accents */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[hsl(var(--cyan-bright))] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[hsl(var(--steel-blue))] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center w-full mb-4">
            <div className="inline-flex items-center gap-2 tag-style">
              <BookOpen className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
              <span className="text-xs">{isAr ? 'آخر المقالات' : 'DERNIERS ARTICLES'}</span>
            </div>
          </div>
          <h2 className="section-title">{isAr ? 'المدونة' : 'Notre Blog'}</h2>
          <p className="section-subtitle mx-auto mt-6 max-w-2xl">
            {isAr
              ? 'نصائح الخبراء وأحدث المعلومات حول العزل المائي'
              : "Conseils d'experts, actualités et guides pour protéger votre propriété"
            }
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 md:left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/20 hover:border-primary/50 transition-all shadow-lg"
            aria-label="Previous"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-primary/20 hover:border-primary/50 transition-all shadow-lg"
            aria-label="Next"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Embla Viewport */}
          <div className="overflow-hidden mx-6 md:mx-12" ref={emblaRef}>
            <div className="flex gap-5">
              {blogs.map((blog, idx) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0"
                >
                  <Link to={`/blog/${blog.slug}`} className="block group">
                    <div className="glass-card urban-border overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[hsl(var(--cyan-bright)/0.1)]">
                      {/* Blog Image */}
                      <div className="h-48 overflow-hidden bg-muted relative">
                        {blog.cover_image ? (
                          <img
                            src={blog.cover_image}
                            alt={blog.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--steel-blue)/0.2)] to-[hsl(var(--cyan-bright)/0.2)] flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Type badge */}
                        <div className="absolute top-3 left-3 z-10">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm border border-primary/30 rounded-sm text-foreground">
                            <Tag className="w-2.5 h-2.5 text-[hsl(var(--cyan-bright))]" />
                            {isAr ? 'مقال' : 'Article'}
                          </span>
                        </div>
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      {/* Blog Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(blog.created_at).toLocaleDateString(isAr ? 'ar-TN' : 'fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <h3 className="text-foreground font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {blog.title}
                        </h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {blog.excerpt}
                        </p>
                        <div className={`mt-4 inline-flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all ${isAr ? 'flex-row-reverse' : ''}`}>
                          {isAr ? 'اقرأ المزيد' : "Lire l'article"}
                          <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA — See All */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-primary/40 text-foreground hover:bg-primary/10 hover:border-primary transition-all uppercase tracking-wider text-sm font-bold"
          >
            {isAr ? 'جميع المقالات' : 'Voir Tous les Articles'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogPreviewSection;
