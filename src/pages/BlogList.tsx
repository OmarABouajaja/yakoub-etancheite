import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getBlogs } from '@/lib/blog-api';
import { ArrowRight, BookOpen, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const BlogList = () => {
  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ['blogs'],
    queryFn: getBlogs
  });

  const { language } = useLanguage();
  const isAr = language === 'ar';

  const publishedBlogs = blogs.filter(b => b.status === 'published');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SEO 
        title={isAr ? "المدونة والموارد" : "Blog & Ressources"}
        description={isAr ? "نصائح وإرشادات حول عزل المنازل والمباني للتخلص من مشاكل الرطوبة" : "Articles, actualités et études de cas sur l'étanchéité résidentielle et commerciale."}
        path="/blog"
      />
      <Navbar onQuoteClick={() => window.location.href = '/contact'} />
      
      <main className="flex-grow pt-32 pb-24">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          
          <div className="text-center mb-16 space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
            >
              {isAr ? "دليلك الشامل لخرق الرطوبة" : "Notre Base de Connaissances"}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground mx-auto max-w-2xl"
            >
              {isAr ? "نصائح الخبراء وأحدث الأخبار للحفاظ على الممتلكات الخاصة بك الجافة" : "Conseils d'experts, actualités de l'industrie et guides détaillés pour garder votre propriété au sec."}
            </motion.p>
          </div>

          {isLoading ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3].map(i => (
                 <div key={i} className="h-96 rounded-2xl bg-secondary/30 animate-pulse border border-white/5" />
               ))}
             </div>
          ) : publishedBlogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-24 flex items-center justify-center flex-col">
              <BookOpen className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-xl">{isAr ? "عد قريباً لمقالات جديدة" : "Revenez bientôt pour de nouveaux articles !"}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedBlogs.map((blog, idx) => (
                <motion.div 
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="group rounded-2xl bg-secondary/20 border border-white/5 overflow-hidden hover:bg-secondary/40 transition-colors flex flex-col"
                >
                  <div className="h-48 overflow-hidden bg-muted relative">
                    {blog.cover_image ? (
                        <img 
                            src={blog.cover_image} 
                            alt={blog.title} 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                    )}
                    {/* Type badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm border border-primary/30 rounded-sm text-foreground">
                        <Tag className="w-2.5 h-2.5 text-[hsl(var(--cyan-bright))]" />
                        {isAr ? 'مقال' : 'Article'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-xs text-primary font-bold tracking-wider uppercase mb-3">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
                        {blog.title}
                    </h2>
                    <p className="text-slate-400 mb-6 line-clamp-3 text-sm flex-grow">
                        {blog.excerpt}
                    </p>
                    
                    <Link 
                        to={`/blog/${blog.slug}`} 
                        className={`inline-flex items-center text-primary font-medium group-hover:text-white transition-colors ${isAr ? 'flex-row-reverse' : ''}`}
                    >
                        {isAr ? 'اقرأ المقال' : 'Lire l\'Article'} <ArrowRight className={`w-4 h-4 ${isAr ? 'mr-2 rotate-180' : 'ml-2'} group-hover:${isAr ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogList;
