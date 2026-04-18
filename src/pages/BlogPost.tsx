import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useQuery } from '@tanstack/react-query';
import { getBlogBySlug } from '@/lib/blog-api';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const BlogPost = () => {
    const { slug } = useParams<{ slug: string }>();
    const { language } = useLanguage();
    const isAr = language === 'ar';

    const { data: blog, isLoading } = useQuery({
        queryKey: ['blog', slug],
        queryFn: () => getBlogBySlug(slug!),
        enabled: !!slug
    });

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 font-bold animate-spin text-primary rounded-full border-4 border-t-transparent" /></div>;
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-center px-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-4">{isAr ? "المقال غير موجود" : "Article Introuvable"}</h1>
                    <Link to="/blog" className="text-primary hover:text-white transition-colors">{isAr ? "العودة إلى المدونة" : "Retour au Blog"}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <SEO 
                title={blog.title}
                description={blog.excerpt}
                type="article"
                keywords={blog.meta_keywords || "étanchéité, waterproofing"}
                author={blog.author_name || "Yakoub Travaux"}
            />
            <Navbar onQuoteClick={() => window.location.href = '/contact'} />
            
            <main className="flex-grow pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <Link to="/blog" className={`inline-flex items-center text-muted-foreground hover:text-white transition-colors mb-8 ${isAr ? 'flex-row-reverse' : ''}`}>
                        {isAr ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />} {isAr ? "العودة للمقالات" : "Retour aux Articles"}
                    </Link>

                    <article>
                        <header className="mb-12 text-center">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
                                {blog.title}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-muted-foreground">
                                <span className="flex items-center"><Calendar className={`w-4 h-4 ${isAr ? 'ml-2' : 'mr-2'}`}/> {new Date(blog.created_at).toLocaleDateString()}</span>
                            </div>
                        </header>

                        {blog.cover_image && (
                            <div className="rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-black/50 border border-white/5 bg-muted">
                                <img src={blog.cover_image} alt={blog.title} className="w-full h-auto max-h-[600px] object-cover" />
                            </div>
                        )}

                        <div className="prose prose-invert prose-lg max-w-none mx-auto prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl">
                            {/* In a real project, we use react-markdown to safely render markdown */}
                            <ReactMarkdown>
                                {blog.content}
                            </ReactMarkdown>
                        </div>
                    </article>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default BlogPost;
