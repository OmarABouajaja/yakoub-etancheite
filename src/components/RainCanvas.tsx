import React, { useEffect, useRef, useCallback, useMemo } from 'react';

interface Particle {
  x: number;
  y: number;
  speed: number;
  length: number;
  width: number;
  opacity: number;
  vx: number;
  vy: number;
  hue: number;
  saturation: number;
  lightness: number;
}

const RainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastFrameRef = useRef<number>(0);

  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }, []);

  /**
   * Brand-matched rain palette — extracted from logo.png:
   *   Steel Blue  hsl(204, 62%, 53%)  — house outline / drops
   *   Bright Cyan hsl(197, 85%, 48%)  — wave/drip accent
   *   Light Blue  hsl(200, 75%, 65%)  — highlight shimmer
   */
  const brandHues = [204, 197, 200, 207, 194];

  const createParticle = useCallback((width: number, height: number): Particle => {
    const hue = brandHues[Math.floor(Math.random() * brandHues.length)];
    const isBright = Math.random() > 0.6; // 40% of drops are bright accent cyan
    return {
      x: Math.random() * width,
      y: Math.random() * height - height,
      speed: 3 + Math.random() * 6,           // faster fall
      length: 20 + Math.random() * 45,         // longer streaks
      width: 1.2 + Math.random() * 1.6,        // thicker drops
      opacity: isBright
        ? 0.45 + Math.random() * 0.45           // bright drops: 0.45–0.90
        : 0.20 + Math.random() * 0.30,          // regular drops: 0.20–0.50
      vx: 0,
      vy: 0,
      hue,
      saturation: isBright ? 85 : 65,
      lightness: isBright ? 72 : 58,
    };
  }, []);

  const initParticles = useCallback((width: number, height: number, count: number) => {
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(width, height)
    );
  }, [createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      // Create stable background ambiance, limiting count for mobile phones
      const baseCount = Math.floor((window.innerWidth * window.innerHeight) / 7000);
      const maxCount  = isMobile ? 60 : 150;
      initParticles(window.innerWidth, window.innerHeight, Math.min(baseCount, maxCount));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const targetFPS         = isMobile ? 30 : 60;
    const frameInterval     = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      if (!ctx || !canvas) return;

      const deltaTime = currentTime - lastFrameRef.current;
      if (deltaTime < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = currentTime;

      // Slight trail fade instead of full clear — adds motion blur effect
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.lineCap = 'round';

      particlesRef.current.forEach((particle) => {

        particle.vx *= 0.90;
        particle.vy *= 0.90;

        particle.x += particle.vx;
        particle.y += particle.speed + particle.vy;

        // Reset when drop exits bottom
        if (particle.y > window.innerHeight + 60) {
          particle.y  = -particle.length;
          particle.x  = Math.random() * window.innerWidth;
          particle.vx = 0;
          particle.vy = 0;
        }

        if (particle.x < -50) particle.x = window.innerWidth + 50;
        if (particle.x > window.innerWidth + 50) particle.x = -50;

        // Brand-colored streak with bright head and faded tail
        const endX = particle.x + particle.vx * 0.2;
        const endY = particle.y + particle.length;

        const gradient = ctx.createLinearGradient(particle.x, particle.y, endX, endY);
        gradient.addColorStop(0,    `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, 0)`);
        gradient.addColorStop(0.25, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${particle.opacity * 0.5})`);
        gradient.addColorStop(0.65, `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness + 10}%, ${particle.opacity})`);
        gradient.addColorStop(1,    `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness + 15}%, ${particle.opacity * 0.15})`);

        ctx.beginPath();
        ctx.lineWidth   = particle.width;
        ctx.strokeStyle = gradient;
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Glowing head dot on brighter drops
        if (particle.opacity > 0.55) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y + particle.length * 0.65, particle.width * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${particle.hue}, 90%, 80%, ${particle.opacity * 0.6})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};

export default RainCanvas;
