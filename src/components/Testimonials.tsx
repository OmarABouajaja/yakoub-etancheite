import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Testimonial {
  id: string;
  client_name: string;
  content: string;
  rating: number;
  city?: string;
}
import { MessageSquareOff } from 'lucide-react';


const Testimonials = () => {
  const { language } = useLanguage();
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from Supabase, fallback to mock if table missing or error
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }
        
        setTestimonials(data || []);
      } catch (err) {
        console.error("No testimonials fetched:", err);
        setTestimonials([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (isLoading) return null;

  return (
    <section className="py-24 relative spray-texture">
      {/* Decorative background elements */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[hsl(var(--cyan-bright))] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[hsl(var(--steel-blue))] opacity-[0.05] blur-[150px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center w-full mb-4">
              <div className="inline-flex items-center gap-2 tag-style">
                  <Star className="w-3 h-3 text-[hsl(var(--cyan-bright))]" />
                  <span className="text-xs">{language === 'fr' ? 'AVIS CLIENTS' : 'آراء العملاء'}</span>
              </div>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title text-center block"
          >
            {language === 'fr' ? "Témoignages" : "قصص نجاح العملاء"}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto mt-6"
          >
            {language === 'fr' ? "Découvrez ce que nos clients disent de nos solutions d'étanchéité de haute performance." : "اكتشف ما يقوله عملاؤنا عن حلول العزل الفعالة لدينا."}
          </motion.p>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          {testimonials.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground glass-card bg-card border border-primary/10 mx-auto max-w-2xl text-center rounded-2xl">
              <MessageSquareOff className="w-12 h-12 mb-4 opacity-50 text-[hsl(var(--cyan-bright))]" />
              <p className="text-xl font-bold font-display tracking-wider">
                {language === 'fr' ? 'Aucun témoignage pour le moment' : 'لا توجد آراء حالياً'}
              </p>
            </div>
          ) : (
            <div className="flex -ml-4">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id} 
                className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-4"
              >
                <div className="py-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="glass-card p-8 h-full flex flex-col relative urban-border group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-[hsl(var(--steel-blue)/0.15)] bg-card"
                    >
                      <MessageSquareQuote className="absolute top-8 right-8 w-12 h-12 text-[hsl(var(--cyan-bright))] opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500" />
                  
                  <div className="flex mb-6 space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.floor(testimonial.rating) ? "fill-primary text-primary" : "text-muted"}`} 
                      />
                    ))}
                  </div>
                  
                  <p className="text-lg text-foreground/80 mb-8 flex-grow leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center mt-auto pt-6 border-t border-border">
                    <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-primary-foreground mr-4 text-xl uppercase tracking-wider transform -skew-x-3">
                      <span className="skew-x-3">{testimonial.client_name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground font-display tracking-wider">{testimonial.client_name}</h4>
                      <p className="text-xs uppercase tracking-wider text-[hsl(var(--cyan-bright))] font-bold mt-1">
                        {testimonial.city
                          ? testimonial.city
                          : language === 'fr' ? 'Client Vérifié' : 'عميل موثق'}
                      </p>
                    </div>
                  </div>
                </motion.div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
