import logger from '@/lib/logger';
import { cn } from '@/lib/utils';
import React, { useEffect, useMemo, useRef } from 'react';

interface WaveBackgroundProps {
  className?: string;
  quality?: 'low' | 'medium' | 'high';
  reduceMotion?: boolean;
  seed?: number;
  children?: React.ReactNode;
  // 전역 고정 배경 여부 (기본값: true)
  asFixed?: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  initialOpacity: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
  active: boolean;
}

const QUALITY_SETTINGS = {
  low: { stars: 50, meteors: 2, fps: 30 },
  medium: { stars: 100, meteors: 3, fps: 60 },
  high: { stars: 200, meteors: 5, fps: 60 },
};

export function WaveBackground({
  className,
  quality = 'medium',
  reduceMotion = false,
  seed = 12345,
  children,
  asFixed = true,
}: WaveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const starsRef = useRef<Star[]>([]);
  const meteorsRef = useRef<Meteor[]>([]);
  const isVisibleRef = useRef(true);
  const lastTimeRef = useRef(0);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const isInitializedRef = useRef(false);

  // 애니메이션 On/Off (사용자 환경설정 반영)
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  // 시드 랜덤 - 패턴 일관성 유지
  const seededRandom = useMemo(() => {
    let currentSeed = Number(seed) || 12345;
    return () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
  }, [seed]);

  // 별 생성 (품질 옵션 반영)
  const generateStars = useMemo(() => {
    const { stars: starCount } = QUALITY_SETTINGS[quality];
    const stars: Star[] = [];
    // 은은한 파스텔 톤 팔레트 (디자인 토큰 계열에 맞춘 저채도 색상)
    const subtlePalette = [
      '#93c5fd',
      '#a5b4fc',
      '#c4b5fd',
      '#6ee7b7',
      '#fde68a',
    ];
    const coloredRatio = 0.3; // 일부만 색상 적용
    for (let i = 0; i < starCount; i++) {
      const useColored = seededRandom() < coloredRatio;
      const colorIndex = Math.floor(seededRandom() * subtlePalette.length);
      const color = useColored ? subtlePalette[colorIndex] : '#ffffff';
      // 컬러 별은 더 뚜렷하게 보이도록 불투명도/크기 상향
      const opacity = useColored
        ? 0.6 + seededRandom() * 0.35 // 0.6 ~ 0.95
        : 0.3 + seededRandom() * 0.7; // 0.3 ~ 1.0
      const size = useColored
        ? 1.3 + seededRandom() * 2.7 // 1.3 ~ 4.0
        : 1 + seededRandom() * 2;
      stars.push({
        x: seededRandom() * 2000,
        y: seededRandom() * 1200,
        size,
        opacity,
        initialOpacity: opacity,
        twinkleSpeed: 0.5 + seededRandom() * 2,
        color,
      });
    }
    return stars;
  }, [quality, seededRandom]);

  // 유성 생성 (품질 옵션 반영)
  const generateMeteors = useMemo(() => {
    const { meteors: meteorCount } = QUALITY_SETTINGS[quality];
    const meteors: Meteor[] = [];
    for (let i = 0; i < meteorCount; i++) {
      meteors.push({
        x: -100,
        y: -100,
        length: 50 + seededRandom() * 100,
        speed: 2 + seededRandom() * 4,
        opacity: 0,
        angle: 45 + seededRandom() * 20,
        active: false,
      });
    }
    return meteors;
  }, [quality, seededRandom]);

  // 초기 데이터 로드
  useEffect(() => {
    if (isInitializedRef.current) return;
    try {
      starsRef.current = generateStars;
      meteorsRef.current = generateMeteors;
      isInitializedRef.current = true;
    } catch (error) {
      logger.warn('WaveBackground:init failed', error);
    }
  }, [generateStars, generateMeteors]);

  // 가시성 관찰 - 보이지 않을 때는 프레임 절약
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.1 }
      );
      observer.observe(canvas);
      return () => observer.disconnect();
    } catch (error) {
      logger.warn('WaveBackground:observer setup failed', error);
    }
  }, []);

  // 사용자 모션 선호 반영
  useEffect(() => {
    try {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      setShouldAnimate(!reduceMotion && !prefersReducedMotion);
    } catch (error) {
      logger.warn('WaveBackground:matchMedia failed', error);
      setShouldAnimate(!reduceMotion);
    }
  }, [reduceMotion]);

  // 애니메이션 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldAnimate || !isInitializedRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { fps } = QUALITY_SETTINGS[quality];
    const frameInterval = 1000 / fps;

    const resizeCanvas = () => {
      try {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const cssWidth = Math.floor(rect.width);
        const cssHeight = Math.floor(rect.height);

        canvas.width = Math.floor(cssWidth * dpr);
        canvas.height = Math.floor(cssHeight * dpr);
        canvasSizeRef.current = { width: cssWidth, height: cssHeight };

        // Reset transform to avoid accumulating scale
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      } catch (error) {
        logger.warn('WaveBackground:resize failed', error);
      }
    };

    const drawStars = (time: number) => {
      try {
        const stars = starsRef.current;
        const { width, height } = canvasSizeRef.current;
        if (!stars || !width || !height) return;
        stars.forEach(star => {
          if (star.x > width || star.y > height) return;
          const twinkle = Math.sin(time * 0.001 * star.twinkleSpeed) * 0.3;
          star.opacity = Math.max(0.1, star.initialOpacity + twinkle);
          ctx.save();
          ctx.globalAlpha = star.opacity;
          ctx.fillStyle = star.color;
          if (star.color !== '#ffffff') {
            // 컬러 별에만 은은한 글로우 추가
            ctx.shadowColor = star.color;
            ctx.shadowBlur = 6;
          }
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      } catch (error) {
        logger.warn('WaveBackground:drawStars failed', error);
      }
    };

    const drawMeteors = (deltaTime: number) => {
      try {
        const meteors = meteorsRef.current;
        const { width, height } = canvasSizeRef.current;
        if (!meteors || !width || !height) return;
        meteors.forEach(meteor => {
          // spawn
          if (!meteor.active && seededRandom() < 0.001) {
            meteor.x = -meteor.length;
            meteor.y = seededRandom() * height * 0.5;
            meteor.opacity = 0.8 + seededRandom() * 0.2;
            meteor.active = true;
          }
          if (meteor.active) {
            const radians = (meteor.angle * Math.PI) / 180;
            meteor.x += Math.cos(radians) * meteor.speed * (deltaTime / 16);
            meteor.y += Math.sin(radians) * meteor.speed * (deltaTime / 16);

            ctx.save();
            ctx.globalAlpha = meteor.opacity;
            const gradient = ctx.createLinearGradient(
              meteor.x,
              meteor.y,
              meteor.x - Math.cos(radians) * meteor.length,
              meteor.y - Math.sin(radians) * meteor.length
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#93c5fd');
            gradient.addColorStop(1, 'transparent');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(meteor.x, meteor.y);
            ctx.lineTo(
              meteor.x - Math.cos(radians) * meteor.length,
              meteor.y - Math.sin(radians) * meteor.length
            );
            ctx.stroke();
            ctx.restore();

            if (
              meteor.x > width + meteor.length ||
              meteor.y > height + meteor.length
            ) {
              meteor.active = false;
              meteor.opacity = 0;
            }
          }
        });
      } catch (error) {
        logger.warn('WaveBackground:drawMeteors failed', error);
      }
    };

    const animate = (currentTime: number) => {
      if (!isVisibleRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      const deltaTime = currentTime - lastTimeRef.current;
      if (deltaTime >= frameInterval) {
        try {
          const { width, height } = canvasSizeRef.current;
          ctx.clearRect(0, 0, width, height);
          drawStars(currentTime);
          drawMeteors(deltaTime);
          lastTimeRef.current = currentTime;
        } catch (error) {
          logger.warn('WaveBackground:animation frame error', error);
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    try {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      animationFrameRef.current = requestAnimationFrame(animate);
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
      };
    } catch (error) {
      logger.warn('WaveBackground:setup animation failed', error);
    }
  }, [shouldAnimate, quality, seededRandom]);

  const containerClassName = cn(
    asFixed
      ? 'fixed inset-0 -z-10 pointer-events-none'
      : 'relative overflow-hidden',
    className
  );

  return (
    <div className={containerClassName} data-testid="wave-background">
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />

      {/* Starfield */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: 'screen' }}
        aria-hidden
      />

      {/* Waves removed as requested */}

      {/* Noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      {/* Content (비고정 변형에서만 노출) */}
      {!asFixed && <div className="relative z-10">{children}</div>}
    </div>
  );
}

export function WaveBackgroundHero({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <WaveBackground
      className={cn('flex min-h-screen items-center justify-center', className)}
      quality="high"
      asFixed={false}
    >
      {children}
    </WaveBackground>
  );
}

export function WaveBackgroundSection({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <WaveBackground
      className={cn('py-20', className)}
      quality="medium"
      asFixed={false}
    >
      {children}
    </WaveBackground>
  );
}

export function WaveBackgroundCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <WaveBackground
      className={cn('overflow-hidden rounded-2xl', className)}
      quality="low"
      asFixed={false}
    >
      <div className="relative z-10 p-6">{children}</div>
    </WaveBackground>
  );
}

export default WaveBackground;
