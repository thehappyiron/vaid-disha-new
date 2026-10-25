import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Check, X, Search } from 'lucide-react';
import { PRIMARY_LANGUAGES, OTHER_INDIAN_LANGUAGES, getLanguageItem } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
}

const SHORT_CODE: Record<string, string> = {
  en: 'EN',
  hi: 'हि',
  mr: 'मरा',
  te: 'తెలు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  as: 'অসমী',
  bn: 'বাংলা',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  ml: 'മല',
  gu: 'ગુજ',
};

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownBtnRef = useRef<HTMLButtonElement>(null);
  const listboxMobileRef = useRef<HTMLDivElement>(null);
  const listboxDesktopRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);

  const currentCode = (i18n.language || 'en').toLowerCase().trim();
  const currentItem = getLanguageItem(currentCode);
  const currentShort = SHORT_CODE[currentItem.code] || currentItem.code.toUpperCase();
  const isOtherActive = OTHER_INDIAN_LANGUAGES.some((l) => l.code === currentItem.code);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('vd-lang', code);
    document.documentElement.lang = code;
    setIsOpen(false);
    setSearchQuery('');
  };

  // Measure button position for desktop popover
  const updateCoords = () => {
    const target = dropdownBtnRef.current || buttonRef.current;
    if (target) {
      const rect = target.getBoundingClientRect();
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

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
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

  // Filter other languages if user types in search
  const filteredOtherLanguages = useMemo(() => {
    if (!searchQuery.trim()) return OTHER_INDIAN_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return OTHER_INDIAN_LANGUAGES.filter(
      (l) => l.englishLabel.toLowerCase().includes(q) || l.nativeLabel.toLowerCase().includes(q)
    );
  }, [searchQuery]);

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

      {/* ── DESKTOP: INLINE PRIMARY BUTTONS + MORE LANGUAGES DROPDOWN (>= lg) ── */}
      <nav
        aria-label={t('a11y.language_switcher')}
        className="hidden lg:flex items-center gap-1"
      >
        {PRIMARY_LANGUAGES.map((lang) => {
          const isActive = currentItem.code === lang.code;
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
                isActive ? 'btn-primary shadow-xs' : 'btn-ghost border border-[var(--color-border)]',
              ].join(' ')}
            >
              {lang.nativeLabel}
            </button>
          );
        })}

        {/* Dropdown button for Other Indian Languages */}
        <button
          ref={dropdownBtnRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="More Indian Languages"
          className={[
            'btn btn-sm min-h-[44px] px-3 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer',
            isOtherActive
              ? 'btn-primary shadow-xs ring-2 ring-[var(--color-primary-300)]'
              : 'btn-ghost border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-primary-400)]',
          ].join(' ')}
        >
          <Globe size={14} className="shrink-0" />
          <span>{isOtherActive ? currentItem.nativeLabel : 'More Languages'}</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </nav>

      {/* ── REACT PORTAL: OPTIONS PANEL (immune to header overflow / clipping) ── */}
      {isOpen &&
        createPortal(
          <div className="language-selector-portal">
            {/* Dimmed backdrop z-[90] */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] transition-opacity animate-in fade-in"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery('');
              }}
              aria-hidden="true"
            />

            {/* Bottom Sheet on mobile (< md) */}
            <div
              ref={listboxMobileRef}
              role="listbox"
              aria-label={t('a11y.choose_language', 'Choose language')}
              className="md:hidden fixed inset-x-0 bottom-0 z-[100] bg-[var(--color-surface)] rounded-t-2xl border-t-2 border-[var(--color-border)] shadow-2xl p-4 sm:p-5 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
              style={{
                paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem))',
              }}
            >
              {/* Grab handle */}
              <div className="w-12 h-1.5 rounded-full bg-[var(--color-border)] mx-auto mb-3 shrink-0" aria-hidden="true" />

              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--color-border)] shrink-0">
                <div className="flex items-center gap-2">
                  <Globe size={20} className="text-[var(--color-primary-500)]" aria-hidden="true" />
                  <h2 className="text-lg font-black text-[var(--color-text)]">
                    {t('a11y.choose_language', 'Choose language')}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="btn btn-ghost btn-icon btn-sm min-h-[44px] min-w-[44px] rounded-full"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search input for 20+ languages */}
              <div className="relative mb-3 shrink-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search Indian language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Primary 3 Languages */}
                {!searchQuery && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 block mb-1.5">
                      Primary
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {PRIMARY_LANGUAGES.map((lang) => {
                        const isSelected = currentItem.code === lang.code;
                        return (
                          <button
                            key={lang.code}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleChange(lang.code)}
                            lang={lang.code}
                            className={[
                              'w-full min-h-12 px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all border-2',
                              isSelected
                                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-black'
                                : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] font-bold',
                            ].join(' ')}
                          >
                            <span className="text-base">{lang.nativeLabel} ({lang.englishLabel})</span>
                            {isSelected && <Check size={16} className="text-[var(--color-primary-600)] stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other 20 Indian Languages */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 block mb-1.5">
                    Other Indian Languages ({filteredOtherLanguages.length})
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {filteredOtherLanguages.map((lang) => {
                      const isSelected = currentItem.code === lang.code;
                      return (
                        <button
                          key={lang.code}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleChange(lang.code)}
                          lang={lang.code}
                          className={[
                            'w-full min-h-11 px-3.5 py-2 rounded-xl flex items-center justify-between text-left transition-all border',
                            isSelected
                              ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-black'
                              : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border-[var(--color-border)] hover:border-[var(--color-primary-300)] font-medium',
                          ].join(' ')}
                        >
                          <span className="text-sm font-semibold">
                            {lang.nativeLabel} <span className="text-xs text-[var(--color-text-muted)] font-normal">({lang.englishLabel})</span>
                          </span>
                          {isSelected && <Check size={16} className="text-[var(--color-primary-600)] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
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
              className="hidden md:flex flex-col fixed z-[100] w-80 max-h-[75vh] bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="pb-2 border-b border-[var(--color-border)] mb-2 flex items-center justify-between shrink-0">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  {t('a11y.choose_language', 'Choose language')} (12 Available)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="btn btn-ghost btn-icon btn-xs"
                  aria-label={t('common.close', 'Close')}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Search filter input */}
              <div className="relative mb-2 shrink-0">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="Search language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              {/* Scrollable list of languages */}
              <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
                {!searchQuery && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 block mb-1">
                      Primary
                    </span>
                    <div className="flex flex-col gap-1">
                      {PRIMARY_LANGUAGES.map((lang) => {
                        const isSelected = currentItem.code === lang.code;
                        return (
                          <button
                            key={lang.code}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleChange(lang.code)}
                            lang={lang.code}
                            className={[
                              'w-full min-h-9 px-3 py-1.5 rounded-lg flex items-center justify-between text-left transition-all border',
                              isSelected
                                ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-bold'
                                : 'bg-transparent text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)] font-medium text-xs',
                            ].join(' ')}
                          >
                            <span className="text-xs font-semibold">{lang.nativeLabel} ({lang.englishLabel})</span>
                            {isSelected && <Check size={14} className="text-[var(--color-primary-600)] stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1 block mb-1">
                    Other Indian Languages ({filteredOtherLanguages.length})
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {filteredOtherLanguages.map((lang) => {
                      const isSelected = currentItem.code === lang.code;
                      return (
                        <button
                          key={lang.code}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleChange(lang.code)}
                          lang={lang.code}
                          className={[
                            'w-full min-h-8 px-2.5 py-1 rounded-lg flex items-center justify-between text-left transition-all border',
                            isSelected
                              ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border-[var(--color-primary-500)] font-bold'
                              : 'bg-transparent text-[var(--color-text)] border-transparent hover:bg-[var(--color-surface-2)] font-medium text-xs',
                          ].join(' ')}
                        >
                          <span className="text-xs">
                            {lang.nativeLabel} <span className="text-[11px] text-[var(--color-text-muted)]">({lang.englishLabel})</span>
                          </span>
                          {isSelected && <Check size={13} className="text-[var(--color-primary-600)] stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
