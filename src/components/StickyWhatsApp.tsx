import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSettings } from '@/lib/api';

interface StickyWhatsAppProps {
    phoneNumber?: string;
}

/**
 * Sticky WhatsApp Button Component
 * 
 * A floating action button that provides instant WhatsApp contact.
 * Features:
 * - Fixed position (bottom-right, or bottom-left for RTL)
 * - Animated pulse effect to draw attention
 * - Pre-filled message based on language
 * - Fallback contact method when API is slow/down
 */
const StickyWhatsApp: React.FC<StickyWhatsAppProps> = ({
    phoneNumber: propPhoneNumber
}) => {
    const { isRTL, language } = useLanguage();

    // Fetch settings from API
    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings,
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    });

    // Use prop if provided, otherwise use settings, otherwise default
    const phoneNumber = propPhoneNumber || settings?.whatsapp_number || '+21698765432';

    // Pre-filled messages for each language
    const messages: Record<string, string> = {
        fr: "Bonjour! Je suis intéressé par vos services d'étanchéité. Pouvez-vous m'aider?",
        ar: "مرحبا! أنا مهتم بخدمات العزل المائي. هل يمكنكم مساعدتي؟",
    };

    const message = encodeURIComponent(messages[language] || messages.fr);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                delay: 2, // Appear after page loads
                type: 'spring',
                stiffness: 260,
                damping: 20
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`
        fixed bottom-6 z-50
        ${isRTL ? 'left-6' : 'right-6'}
        w-16 h-16 rounded-full
        bg-[#25D366] hover:bg-[#20BD5A]
        flex items-center justify-center
        shadow-lg shadow-[#25D366]/30
        transition-colors duration-300
        group
      `}
            aria-label="Contact via WhatsApp"
        >
            {/* Pulse ring animation */}
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse opacity-20" />

            {/* WhatsApp Icon */}
            <MessageCircle className="w-8 h-8 text-white relative z-10 group-hover:rotate-12 transition-transform" />

            {/* Tooltip */}
            <motion.span
                initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className={`
          absolute top-1/2 -translate-y-1/2
          ${isRTL ? 'right-full mr-3' : 'left-full ml-3'}
          px-3 py-2 rounded-lg
          bg-card/95 backdrop-blur-sm border border-border
          text-sm font-medium text-foreground
          whitespace-nowrap
          shadow-lg
          pointer-events-none
        `}
            >
                {language === 'ar' ? 'تواصل عبر واتساب' : 'Contactez-nous sur WhatsApp'}
            </motion.span>
        </motion.a>
    );
};

export default StickyWhatsApp;
