import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GripVertical } from 'lucide-react';

interface BeforeAfterProps {
  imageBefore: string;
  imageAfter: string;
  title: string;
}

const BeforeAfter: React.FC<BeforeAfterProps> = ({ imageBefore, imageAfter, title }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useLanguage();

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let position = ((clientX - rect.left) / rect.width) * 100;
    position = Math.max(0, Math.min(100, position));
    
    if (isRTL) {
      position = 100 - position;
    }
    
    setSliderPosition(position);
  }, [isRTL]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="relative group">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] overflow-hidden rounded-sm cursor-ew-resize select-none bento-card p-0"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* After Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={imageAfter}
            alt={`${title} - ${t('portfolio.after')}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute bottom-3 right-3 bg-[hsl(var(--cyan-bright))] text-background px-3 py-1 text-xs font-bold uppercase tracking-wider transform -skew-x-3">
            {t('portfolio.after')}
          </div>
        </div>

        {/* Before Image (Overlay with clip) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: isRTL 
              ? `inset(0 0 0 ${100 - sliderPosition}%)`
              : `inset(0 ${100 - sliderPosition}% 0 0)`,
          }}
        >
          <img
            src={imageBefore}
            alt={`${title} - ${t('portfolio.before')}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute bottom-3 left-3 bg-[hsl(var(--steel-blue))] text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider transform skew-x-3">
            {t('portfolio.before')}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 transition-shadow"
          style={{
            left: isRTL ? `${100 - sliderPosition}%` : `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, hsl(var(--steel-blue)), hsl(var(--cyan-bright)))',
            boxShadow: '0 0 20px hsl(var(--steel-blue) / 0.5), 0 0 40px hsl(var(--cyan-bright) / 0.3)',
          }}
        >
          {/* Handle Button */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-20 bg-card border-2 rounded-sm flex flex-col items-center justify-center gap-1 transition-all ${
              isDragging ? 'scale-110 border-primary' : 'border-border group-hover:border-primary/50'
            }`}
            style={{
              boxShadow: isDragging 
                ? '0 0 30px hsl(var(--steel-blue) / 0.5)' 
                : '0 0 15px hsl(var(--steel-blue) / 0.2)',
            }}
          >
            <GripVertical className="w-5 h-5 text-primary" />
            <span className="text-[8px] text-primary font-bold text-center uppercase tracking-wider leading-tight">
              {t('portfolio.scan')}
            </span>
          </div>
        </div>
      </div>

      {/* Title */}
      <h4 className="mt-4 text-foreground font-marker text-lg">{title}</h4>
    </div>
  );
};

export default BeforeAfter;
