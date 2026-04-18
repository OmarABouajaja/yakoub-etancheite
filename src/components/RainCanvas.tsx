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
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const lastFrameRef = useRef<number>(0);

  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }, []);

  /**
   * Brand-matched rain palette — extracted from logo.jpg:
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

      // More particles — visible density
      const baseCount = Math.floor((window.innerWidth * window.innerHeight) / 6000);
      const maxCount  = isMobile ? 80 : 180;
      initParticles(window.innerWidth, window.innerHeight, Math.min(baseCount, maxCount));
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const repulsionRadius   = isMobile ? 120 : 150;
    const repulsionStrength = 10;
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
        // Mouse repulsion
        const dx = particle.x - mouseRef.current.x;
        const dy = particle.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < repulsionRadius && distance > 0) {
          const force = (repulsionRadius - distance) / repulsionRadius;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force * repulsionStrength;
          particle.vy += Math.sin(angle) * force * repulsionStrength * 0.3;
        }

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

      // Cursor repulsion glow — brand steel-blue tint
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        const grad = ctx.createRadialGradient(
          mouseRef.current.x, mouseRef.current.y, 0,
          mouseRef.current.x, mouseRef.current.y, repulsionRadius
        );
        grad.addColorStop(0,   'hsla(204, 62%, 53%, 0.12)');
        grad.addColorStop(0.5, 'hsla(197, 85%, 48%, 0.06)');
        grad.addColorStop(1,   'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(mouseRef.current.x, mouseRef.current.y, repulsionRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles, isMobile]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};

export default RainCanvas;
