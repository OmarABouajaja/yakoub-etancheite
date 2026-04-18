import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';
import { Home, Building, Droplets, Layers, Check, Loader2, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitLead } from '@/lib/api';

const tunisianPhoneRegex = /^[2459]\d{7}$/;

const TUNISIAN_GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan",
  "Kasserine", "Kebili", "Kef", "Mahdia", "Manouba", "Medenine", "Monastir", "Nabeul",
  "Sfax", "Sidi Bouzid", "Siliana", "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
].sort();

const createQuoteSchema = (t: (key: string) => string) =>
  z.object({
    problemType: z.enum(['roof', 'wall', 'pool', 'basement'], {
      required_error: t('validation.problem.required'),
    }),
    surfaceArea: z.number().min(1).max(10000),
    isUrgent: z.boolean(),
    name: z.string().min(2, t('validation.name.required')),
    phone: z.string().regex(tunisianPhoneRegex, t('validation.phone.invalid')),
    location: z.string().min(2, t('validation.location.required')),
    message: z.string().optional(),
  });

interface QuoteWizardProps {
  onClose?: () => void;
}

const QuoteWizard: React.FC<QuoteWizardProps> = ({ onClose }) => {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    problemType: null as 'roof' | 'wall' | 'pool' | 'basement' | null,
    surfaceArea: 50,
    customSurfaceArea: '',
    isUrgent: false,
    name: '',
    phone: '',
    location: '',
    message: '',
  });

  const problemTypes = [
    { key: 'roof', icon: Home, label: t('quote.problem.roof'), color: 'steel-blue' },
    { key: 'wall', icon: Building, label: t('quote.problem.wall'), color: 'cyan-bright' },
    { key: 'pool', icon: Droplets, label: t('quote.problem.pool'), color: 'water-blue' },
    { key: 'basement', icon: Layers, label: t('quote.problem.basement'), color: 'steel-blue' },
  ] as const;

  const colorMap = {
    'steel-blue': 'hsl(204, 62%, 53%)',
    'cyan-bright': 'hsl(197, 85%, 48%)',
    'water-blue': 'hsl(200, 75%, 55%)',
  };

  const validateStep = (currentStep: number): boolean => {
    const schema = createQuoteSchema(t);
    setErrors({});

    if (currentStep === 1) {
      if (!formData.problemType) {
        setErrors({ problemType: t('validation.problem.required') });
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.surfaceArea > 500 && (!formData.customSurfaceArea || parseInt(formData.customSurfaceArea) <= 500)) {
        setErrors({ customSurfaceArea: isRTL ? 'يرجى إدخال مساحة أكبر من 500 م²' : 'Veuillez indiquer une surface supérieure à 500 m²' });
        return false;
      }
    }

    if (currentStep === 3) {
      try {
        schema.parse(formData);
        return true;
      } catch (err) {
        if (err instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          err.errors.forEach((e) => {
            if (e.path[0]) {
              newErrors[e.path[0] as string] = e.message;
            }
          });
          setErrors(newErrors);
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const richMessage = `[Région: ${formData.location}]\n\n${formData.message || ''}`.trim();

      await submitLead({
        client_name: formData.name,
        phone: formData.phone,
        problem_type: formData.problemType!,
        surface_area: formData.surfaceArea > 500 ? parseInt(formData.customSurfaceArea) : formData.surfaceArea,
        is_urgent: formData.isUrgent,
        message: richMessage
      });

      setIsSuccess(true);

      // Fire confetti
      const colors = ['#4A9FD4', '#29ABE2', '#0A1628', '#FFFFFF'];

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 400);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Submission failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? (isRTL ? -300 : 300) : isRTL ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? (isRTL ? -300 : 300) : isRTL ? 300 : -300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    if (newDirection > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-sm bg-gradient-to-br from-primary to-secondary flex items-center justify-center transform -skew-x-6">
          <Check className="w-12 h-12 text-primary-foreground skew-x-6" />
        </div>
        <h3 className="text-3xl font-bold text-foreground mb-2 font-display tracking-wider">{t('quote.success')}</h3>
        <p className="text-muted-foreground">
          {formData.name}, {formData.phone}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-xl font-display transition-all transform ${s <= step
                ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground -skew-x-3'
                : 'bg-muted text-muted-foreground'
                }`}
            >
              {s < step ? <Check className="w-6 h-6 skew-x-3" /> : <span className="skew-x-3">{s}</span>}
            </div>
            {s < 3 && (
              <div
                className={`w-12 md:w-20 h-1 mx-2 transition-all ${s < step ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {step === 1 && (
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wider">
                {t('quote.step1.title')}
              </h3>
              <p className="text-muted-foreground mb-6">{t('quote.step1.subtitle')}</p>

              <div className="grid grid-cols-2 gap-4">
                {problemTypes.map(({ key, icon: Icon, label, color }) => (
                  <button
                    key={key}
                    onClick={() => setFormData((prev) => ({ ...prev, problemType: key }))}
                    className={`p-6 rounded-sm border-2 transition-all flex flex-col items-center gap-3 ${formData.problemType === key
                      ? 'border-primary bg-primary/10 transform -skew-x-1'
                      : 'border-border hover:border-primary/50 bg-card'
                      }`}
                    style={{
                      boxShadow: formData.problemType === key
                        ? `0 0 30px ${colorMap[color]}40`
                        : 'none'
                    }}
                  >
                    <Icon
                      className={`w-10 h-10 transition-all ${formData.problemType === key
                        ? 'skew-x-1'
                        : ''
                        }`}
                      style={{
                        color: formData.problemType === key ? colorMap[color] : 'hsl(var(--muted-foreground))'
                      }}
                    />
                    <span
                      className={`font-bold uppercase tracking-wider text-sm ${formData.problemType === key ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>

              {errors.problemType && (
                <p className="text-destructive text-sm mt-4 font-medium">{errors.problemType}</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wider">
                {t('quote.step2.title')}
              </h3>
              <p className="text-muted-foreground mb-6">{t('quote.step2.subtitle')}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-foreground font-bold mb-4 uppercase tracking-wider text-sm">
                    {t('quote.area')}: <span className="text-gradient text-2xl">
                      {formData.surfaceArea > 500 ? t('quote.area.more') : `${formData.surfaceArea} m²`}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="10"
                      max="510"
                      step="10"
                      value={formData.surfaceArea}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          surfaceArea: parseInt(e.target.value),
                        }))
                      }
                      className="w-full h-3 bg-muted rounded-sm appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--steel-blue)) 0%, hsl(var(--cyan-bright)) ${(Math.min(formData.surfaceArea, 510) / 510) * 100}%, hsl(var(--muted)) ${(Math.min(formData.surfaceArea, 510) / 510) * 100}%, hsl(var(--muted)) 100%)`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2 uppercase tracking-wider">
                    <span>10 m²</span>
                    <span>500 m²+</span>
                  </div>
                </div>

                <AnimatePresence>
                  {formData.surfaceArea > 500 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 rounded-sm bg-primary/5 border-2 border-primary/20 urban-border space-y-3">
                        <label className="block text-foreground font-bold uppercase tracking-wider text-xs">
                          {t('quote.area.custom')}
                        </label>
                        <input
                          type="number"
                          min="501"
                          value={formData.customSurfaceArea}
                          onChange={(e) => setFormData(prev => ({ ...prev, customSurfaceArea: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-sm bg-card border-2 ${errors.customSurfaceArea ? 'border-destructive' : 'border-primary/30 focus:border-primary'} text-foreground outline-none transition-all`}
                          placeholder="Ex: 750"
                        />
                        {errors.customSurfaceArea && (
                          <p className="text-destructive text-[10px] font-bold uppercase tracking-tight">{errors.customSurfaceArea}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between p-5 rounded-sm bg-card border-2 border-border urban-border">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-[hsl(var(--cyan-bright))]" />
                    <span className="text-foreground font-bold uppercase tracking-wider text-sm">{t('quote.urgent')}</span>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isUrgent: !prev.isUrgent }))
                    }
                    className={`w-16 h-8 rounded-sm transition-all relative ${formData.isUrgent
                      ? 'bg-gradient-to-r from-primary to-secondary'
                      : 'bg-muted'
                      }`}
                    style={{
                      boxShadow: formData.isUrgent ? '0 0 20px hsl(var(--steel-blue) / 0.5)' : 'none'
                    }}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 rounded-sm bg-foreground transition-all ${formData.isUrgent
                        ? isRTL
                          ? 'left-1'
                          : 'right-1'
                        : isRTL
                          ? 'right-1'
                          : 'left-1'
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2 font-display tracking-wider">
                {t('quote.step3.title')}
              </h3>
              <p className="text-muted-foreground mb-6">{t('quote.step3.subtitle')}</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-foreground font-bold mb-2 uppercase tracking-wider text-sm">
                    {t('quote.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className={`w-full px-5 py-4 rounded-sm bg-card border-2 ${errors.name ? 'border-destructive' : 'border-border focus:border-primary'
                      } text-foreground focus:outline-none transition-all`}
                    placeholder="Ahmed Ben Ali"
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm mt-1 font-medium">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-foreground font-bold mb-2 uppercase tracking-wider text-sm">
                    {t('quote.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 8),
                      }))
                    }
                    className={`w-full px-5 py-4 rounded-sm bg-card border-2 ${errors.phone ? 'border-destructive' : 'border-border focus:border-primary'
                      } text-foreground focus:outline-none transition-all mb-4`}
                    placeholder="XX XXX XXX"
                    dir="ltr"
                  />
                  {errors.phone && (
                    <p className="text-destructive text-sm mt-1 mb-4 font-medium">{errors.phone}</p>
                  )}

                  <label className="block text-foreground font-bold mb-2 uppercase tracking-wider text-sm mt-4">
                    {isRTL ? 'المنطقة (الولاية)' : 'Région (Gouvernorat)'}
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-5 py-4 rounded-sm bg-card border-2 ${errors.location ? 'border-destructive' : 'border-border focus:border-primary'
                      } text-foreground focus:outline-none transition-all mb-4 cursor-pointer`}
                  >
                    <option value="" disabled>{isRTL ? 'اختر منطقتك...' : 'Sélectionnez votre région...'}</option>
                    {TUNISIAN_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                  {errors.location && (
                    <p className="text-destructive text-sm mt-1 mb-4 font-medium">{errors.location}</p>
                  )}

                  <label className="block text-foreground font-bold mb-2 uppercase tracking-wider text-sm mt-4">
                    {isRTL ? 'صف مشكلتك (اختياري)' : 'Décrivez votre problème (Optionnel)'}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                    className="w-full px-5 py-4 rounded-sm bg-card border-2 border-border focus:border-primary text-foreground focus:outline-none transition-all resize-none h-24"
                    placeholder={isRTL ? 'عندما تمطر، يتبلل السقف...' : 'Quand il pleut, le plafond est mouillé...'}
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        {step > 1 && (
          <button
            onClick={() => paginate(-1)}
            className="flex-1 py-4 px-6 rounded-sm border-2 border-border text-foreground font-bold hover:border-primary/50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            {t('quote.prev')}
          </button>
        )}

        {step < 3 ? (
          <button
            onClick={() => paginate(1)}
            className="flex-1 py-4 px-6 rounded-sm bg-primary text-primary-foreground font-bold glow-button flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {t('quote.next')}
            {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-4 px-6 rounded-sm bg-primary text-primary-foreground font-bold glow-button flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isRTL ? 'جاري التحميل...' : 'Chargement...'}
              </>
            ) : (
              t('quote.submit')
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteWizard;
