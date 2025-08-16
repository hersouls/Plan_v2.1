import { ExternalLink, Heart, Sparkles } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts';

// Constants
const FOOTER_LINKS = [
  {
    to: '/about',
    label: 'About Us',
    ariaLabel: 'Moonwave Plan About Us 페이지로 이동',
  },
  {
    to: '/terms-of-service',
    label: 'Terms Of Service',
    ariaLabel: 'Terms Of Service 페이지로 이동',
  },
] as const;

const CURRENT_YEAR = new Date().getFullYear();

// Sub-components
const BrandLogo = memo(() => (
  <div className="flex items-center justify-center">
    <img
      src="/Moonwave.png"
      alt="Moonwave"
      className="w-8 h-8 sm:w-10 sm:h-10 transform transition-all duration-300 hover:scale-110 wave-optimized"
    />
    <span
      className="typography-h6 sm:typography-h5 tracking-ko-normal ml-3 font-semibold"
      style={{
        color: 'var(--semantic-text-primary)',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      }}
    >
      Moonwave Plan
    </span>
  </div>
));

BrandLogo.displayName = 'BrandLogo';

const FooterLinks = memo(() => (
  <nav
    className="flex items-center gap-4 typography-body-small tracking-ko-normal"
    aria-label="Footer navigation"
  >
    {FOOTER_LINKS.map(link => (
      <Link
        key={link.to}
        to={link.to}
        className="group flex items-center gap-1 typography-body-small tracking-ko-normal transition-all duration-300 rounded-lg touch-target px-3 py-2 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        style={{
          color: 'var(--semantic-text-secondary)',
        }}
        aria-label={link.ariaLabel}
      >
        <span className="group-hover:text-primary-400 transition-colors duration-300">
          {link.label}
        </span>
        <ExternalLink
          size={12}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0.5"
          style={{ color: 'var(--semantic-text-tertiary)' }}
          aria-hidden="true"
        />
      </Link>
    ))}
  </nav>
));

FooterLinks.displayName = 'FooterLinks';

const MadeWithLove = memo(() => (
  <div
    className="flex items-center gap-2 typography-caption tracking-ko-normal"
    style={{
      color: 'var(--semantic-text-tertiary)',
    }}
  >
    <div className="flex items-center gap-1">
      <Heart
        size={10}
        style={{ color: 'var(--semantic-danger-400)' }}
        fill="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">Made with</span>
      <span>passion</span>
    </div>
    <span className="hidden sm:inline">•</span>
    <div className="flex items-center gap-1">
      <Sparkles
        size={10}
        style={{ color: 'var(--semantic-warning-400)' }}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="hidden sm:inline">React</span>
    </div>
  </div>
));

MadeWithLove.displayName = 'MadeWithLove';

export const Footer = memo(() => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Derive user display name
  const userDisplayName =
    user?.displayName || user?.email?.split('@')[0] || '사용자';

  // 전역 스크롤 효과 및 애니메이션 (성능 최적화)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);

          // Footer가 화면에 보이는지 확인 (IntersectionObserver 대신 최적화된 방식)
          const footerElement = document.querySelector('footer');
          if (footerElement) {
            const rect = footerElement.getBoundingClientRect();
            const isInViewport =
              rect.top <= window.innerHeight * 0.9 && rect.bottom >= 0;
            setIsVisible(isInViewport);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    // 초기 상태를 true로 설정하여 항상 보이도록 함
    setIsVisible(true);
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <footer
      className={`touch-optimized transition-all duration-700 ease-out px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{
        padding: `0 0 var(--semantic-spacing-lg)`,
        transform: `translateY(${Math.min(scrollY * 0.05, 10)}px)`,
        marginTop: 'var(--semantic-spacing-xl)',
        marginBottom: 'var(--semantic-spacing-xl)',
      }}
      role="contentinfo"
      aria-label="페이지 하단 정보"
    >
      <div className="relative z-10 max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 lg:py-12 xl:py-16">
        <div
          className={`family-glass-card group relative overflow-hidden wave-optimized transition-all duration-500 ease-out ${
            isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
          }`}
          style={{
            padding: '16px 20px 24px',
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            border: 'none',
            borderRadius: '0',
            boxShadow: 'none',
            transition: 'all var(--duration-normal) var(--ease-out)',
            transform: 'none',
          }}
        >
          {/* Enhanced gradient overlay for depth */}
          <div
            className="absolute inset-0 opacity-0 pointer-events-none"
            style={{
              background: 'transparent',
            }}
          />

          {/* Main Content */}
          <div className="relative z-10">
            {/* Desktop Layout - 가로 배치 */}
            <div className="hidden md:flex items-center justify-between w-full gap-8">
              {/* Left Section - Brand & Copyright */}
              <div className="flex items-center gap-6">
                <BrandLogo />
                <div className="text-left break-keep-ko flex items-center">
                  <p
                    className="typography-body-small tracking-ko-normal font-medium whitespace-nowrap"
                    style={{
                      color: 'var(--semantic-text-secondary)',
                      lineHeight: '1.5',
                    }}
                  >
                    © {CURRENT_YEAR} Moonwave Plan {userDisplayName}님의 공간
                  </p>
                </div>
              </div>

              {/* Center Section - Links */}
              <div className="flex items-center">
                <FooterLinks />
              </div>

              {/* Right Section - Made with Love */}
              <div className="flex items-center">
                <MadeWithLove />
              </div>
            </div>

            {/* Mobile Layout - 세로 배치 */}
            <div
              className="md:hidden flex flex-col items-center"
              style={{ gap: 'var(--semantic-spacing-lg)' }}
            >
              {/* Logo and Brand */}
              <BrandLogo />

              {/* Copyright and User Info */}
              <div className="text-center break-keep-ko">
                <p
                  className="typography-body-small tracking-ko-normal font-medium whitespace-nowrap"
                  style={{
                    color: 'var(--semantic-text-secondary)',
                    lineHeight: '1.5',
                  }}
                >
                  © {CURRENT_YEAR} Moonwave Plan {userDisplayName}님의 공간
                </p>
              </div>

              {/* Footer Links */}
              <div style={{ marginTop: 'var(--semantic-spacing-md)' }}>
                <FooterLinks />
              </div>

              {/* Made with Love */}
              <div style={{ marginTop: 'var(--semantic-spacing-md)' }}>
                <MadeWithLove />
              </div>
            </div>
          </div>

          {/* Enhanced hover effect */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-0 pointer-events-none"
            style={{
              background: 'transparent',
              transition: 'opacity var(--duration-slow) var(--ease-out)',
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
