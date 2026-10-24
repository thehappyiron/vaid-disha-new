import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Check, X } from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

const SHORT_CODE: Record<LanguageCode, string> = {
  en: 'EN',
  hi: 'हि',
  mr: 'मरा',
};

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxMobileRef = useRef<HTMLDivElement>(null);
  const listboxDesktopRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  const currentCode = (i18n.language || 'en').slice(0, 2) as LanguageCode;
  const currentShort = SHORT_CODE[currentCode] || currentCode.toUpperCase();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('vd-lang', code);
    document.documentElement.lang = code;
    setIsOpen(false);
  };

  // Measure button position for desktop popover
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleResize = () => updateCoords();
      const handleScroll = () => updateCoords();
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  // Body scroll lock & focus management
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        const container = isMobile ? listboxMobileRef.current : listboxDesktopRef.current;
        const selectedBtn = container?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
        if (selectedBtn) {
          selectedBtn.focus();
        } else {
          container?.querySelector<HTMLButtonElement>('button')?.focus();
        }
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
        clearTimeout(timer);
        buttonRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative shrink-0 ${className}`}>
      {/* ── MOBILE & TABLET: SINGLE DROPDOWN BUTTON (< lg) ────────────── */}
      <div className="lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('a11y.language_switcher', 'Language selector')}
          className="btn btn-ghost btn-sm min-h-[44px] px-2 sm:px-2.5 flex items-center gap-1 border border-[var(--color-border)] bg-[var(--color-surface)] font-bold text-xs sm:text-sm text-[var(--color-text)] cursor-pointer"
        >
          <Globe size={16} aria-hidden="true" className="shrink-0 text-[var(--color-primary-500)]" />
          <span className="font-black tracking-tight">{currentShort}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* ── DESKTOP: INLINE 3 BUTTONS (>= lg) ───────────────────────────── */}
      <nav
        aria-label={t('a11y.language_switcher')}
        className="hidden lg:flex items-center gap-1"
      >
        {LANGUAGES.map((lang) => {
          const isActive = currentCode === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleChange(lang.code)}
              aria-pressed={isActive}
              aria-label={t('a11y.current_language', { lang: lang.nativeLabel })}
              lang={lang.code}
              className={[
                'btn btn-sm min-h-[44px] px-3 text-xs font-bold transition-all',
                isActive ? 'btn-primary' : 'btn-ghost border border-[var(--color-border)]',
              ].join(' ')}
            >
              {lang.nativeLabel}
            </button>
          );
        })}
      </nav>

      {/* ── REACT PORTAL: OPTIONS PANEL (immune to header overflow / clipping) ── */}
      {isOpen &&
        createPortal(
          <div className="language-selector-portal">
            {/* Dimmed backdrop z-[90] */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] transition-opacity animate-in fade-in"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Bottom Sheet on mobile (< md) */}
            <div
              ref={listboxMobileRef}
              role="listbox"
              aria-label={t('a11y.choose_language', 'Choose language')}
              className="md:hidden fixed inset-x-0 bottom-0 z-[100] bg-[var(--color-surface)] rounded-t-2xl border-t-2 border-[var(--color-border)] shadow-2xl p-4 sm:p-5 animate-in slide-in-from-bottom duration-200"
              style={{
                paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))',
              }}
            >
              {/* Grab handle indicator */}
              <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] mx-auto mb-3" aria-hidden="true" />

              <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-[var(--color-primary-500)]" aria-hidden="true" />
                  <h2 className="text-lg font-black text-[var(--color-text)]">
                    {t('a11y.choose_language', 'Choose language')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] rounded-full"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {LANGUAGES.map((lang) => {
                  const isSelected = currentCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleChange(lang.code)}
                      lang={lang.code}
                      className={[
                        'w-full min-h-14 px-4 py-3 rounded-xl flex items-center justify-between text-left transition-all border-2',
                        'whitespace-normal break-words cursor-pointer',
                        isSelected
                          ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-black shadow-xs'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary-300)] font-bold',
                      ].join(' ')}
                    >
                      <span className="text-base sm:text-lg">{lang.nativeLabel}</span>
                      {isSelected ? (
                        <div className="flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-full bg-[var(--color-primary-500)] text-white">
                          <Check size={14} className="shrink-0 stroke-[3]" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase font-mono">
                          {lang.code.toUpperCase()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popover on md and above */}
            <div
              ref={listboxDesktopRef}
              role="listbox"
              aria-label={t('a11y.choose_language', 'Choose language')}
              style={{
                top: coords ? `${coords.top}px` : undefined,
                right: coords ? `${coords.right}px` : undefined,
              }}
              className="hidden md:block fixed z-[100] w-64 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('a11y.choose_language', 'Choose language')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost btn-icon btn-xs"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {LANGUAGES.map((lang) => {
                  const isSelected = currentCode === lang.code;
                  return (
                    <button
                      key={lang.code}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleChange(lang.code)}
                      lang={lang.code}
                      className={[
                        'w-full min-h-14 px-3.5 py-3 rounded-xl flex items-center justify-between text-left transition-all border',
                        'whitespace-normal break-words cursor-pointer',
                        isSelected
                          ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-black'
                          : 'bg-transparent text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)] font-bold',
                      ].join(' ')}
                    >
                      <span className="text-base">{lang.nativeLabel}</span>
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full bg-[var(--color-primary-500)] text-white">
                          <Check size={13} className="shrink-0 stroke-[3]" />
                          <span>Selected</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
