import { useState, useEffect, type ReactNode } from 'react';
import { getStoredLocale } from '../i18n/uiStrings';
import { translate } from '../i18n/messages';

interface SplashScreenProps {
  children: ReactNode;
  /** Minimum display time in ms (default 1800) */
  minDuration?: number;
}

const SPLASH_KEY = 'artier_splash_seen';

export function SplashScreen({ children, minDuration = 1800 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'splash' | 'fading' | 'done'>(() =>
    sessionStorage.getItem(SPLASH_KEY) ? 'done' : 'splash',
  );

  useEffect(() => {
    if (phase !== 'splash') return;
    const timer = setTimeout(() => {
      setPhase('fading');
      sessionStorage.setItem(SPLASH_KEY, '1');
    }, minDuration);
    return () => clearTimeout(timer);
  }, [phase, minDuration]);

  useEffect(() => {
    if (phase !== 'fading') return;
    const timer = setTimeout(() => setPhase('done'), 600);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return <>{children}</>;

  return (
    <>
      {/* Pre-render children behind splash for faster transition */}
      <div className="invisible fixed inset-0" aria-hidden="true">
        {children}
      </div>

      {/* Splash overlay */}
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${
          phase === 'fading' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Logo + watercolor background */}
        <div className="relative flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-700">
          <img
            src="/images/splash.png"
            alt={translate(getStoredLocale(), 'splash.alt')}
            className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-sm"
          />
          {/* Loading dots */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/40"
                style={{
                  animation: `splash-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        <style>{`
          @keyframes splash-dot {
            0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
            40% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
      </div>
    </>
  );
}
