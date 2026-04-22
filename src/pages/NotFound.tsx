import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import RainCanvas from "@/components/RainCanvas";
import { Home, ArrowLeft, Droplets } from "lucide-react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background spray-texture">
      <SEO title="Page Introuvable" noIndex={true} schema={false} />
      {/* Rain Canvas Background */}
      <RainCanvas />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-20 left-10 w-96 h-96 opacity-15 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--steel-blue)) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-20 right-10 w-80 h-80 opacity-15 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--cyan-bright)) 0%, transparent 70%)" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
        {/* Animated water drop icon */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse-neon">
            <Droplets className="w-12 h-12 text-primary" />
          </div>
        </motion.div>

        {/* 404 number with glitch effect */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[10rem] md:text-[14rem] font-bold font-display leading-none tracking-wider text-gradient select-none"
          style={{ lineHeight: 0.85 }}
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold font-display tracking-wider text-foreground mb-4 mt-4"
        >
          {isRTL ? "الصفحة غير موجودة" : "Page Introuvable"}
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg text-muted-foreground mb-10 max-w-md mx-auto"
        >
          {isRTL
            ? "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
            : "Désolé, la page que vous cherchez n'existe pas ou a été déplacée."}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/"
            className="px-8 py-4 rounded-sm bg-primary text-primary-foreground font-bold text-lg glow-button uppercase tracking-wider flex items-center gap-3 w-full sm:w-auto justify-center"
          >
            <Home className="w-5 h-5" />
            {isRTL ? "العودة للرئيسية" : "Retour à l'Accueil"}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 rounded-sm urban-border text-foreground font-bold text-lg uppercase tracking-wider flex items-center gap-3 hover:scale-105 transition-all w-full sm:w-auto justify-center"
          >
            <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            {isRTL ? "رجوع" : "Page Précédente"}
          </button>
        </motion.div>

        {/* Attempted path display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12"
        >
          <p className="text-xs text-muted-foreground/60 font-mono">
            {location.pathname}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
