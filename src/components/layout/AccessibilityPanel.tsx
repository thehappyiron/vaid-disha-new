import { useRef, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Type,
  Sun,
  Moon,
  Eye,
  Palette,
  Zap,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  useAccessibility,
  type TextSize,
  type AppTheme,
} from '../../context/AccessibilityContext';

interface AccessibilityPanelProps {
  onClose: () => void;
}

function ToggleRow({
  id,
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3.5 cursor-pointer py-3 px-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors min-w-0"
    >
      <span
        className="w-10 h-10 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <span className="block font-bold text-[var(--color-text)] leading-tight break-words">
          {label}
        </span>
        <span className="block text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5 break-words">
          {description}
        </span>
      </div>
      {/* Custom toggle */}
      <div className="flex-shrink-0 mt-0.5 ml-2">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          aria-hidden="true"
          className={[
            'w-12 h-6 rounded-full border-2 relative transition-colors',
            checked
              ? 'bg-[var(--color-primary-500)] border-[var(--color-primary-500)]'
              : 'bg-[var(--color-neutral-300)] border-[var(--color-neutral-400)]',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
              checked ? 'translate-x-6' : 'translate-x-0',
            ].join(' ')}
          />
        </div>
      </div>
    </label>
  );
}

export function AccessibilityPanel({ onClose }: AccessibilityPanelProps) {
  const { t } = useTranslation();
  const {
    settings,
    setTextSize,
    setColorMode,
    setTheme,
    setReduceMotion,
  } = useAccessibility();

  const closeRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const titleId = `${panelId}-title`;

  // Focus close button on open, trap focus inside panel
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const textSizes: { value: TextSize; label: string }[] = [
    { value: 'normal', label: t('a11y.text_normal') },
    { value: 'large',  label: t('a11y.text_large') },
    { value: 'xlarge', label: t('a11y.text_xlarge') },
  ];

  const themes: { value: AppTheme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('a11y.theme_light'), icon: <Sun size={17} /> },
    { value: 'dark', label: t('a11y.theme_dark'), icon: <Moon size={17} /> },
    { value: 'high-contrast', label: t('a11y.theme_high_contrast'), icon: <Eye size={17} /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface)] text-[var(--color-text)] rounded-t-2xl shadow-2xl max-h-[92dvh] overflow-y-auto max-w-2xl mx-auto border-t-2 border-[var(--color-border)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-surface)] z-10">
          <h2
            id={titleId}
            className="text-lg sm:text-xl font-extrabold text-[var(--color-text)]"
          >
            {t('a11y.settings_panel_title')}
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label={t('a11y.close_settings')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 flex flex-col gap-5 pb-8 min-w-0">
          {/* 1. Theme selector (Light / Dark / High contrast) */}
          <section aria-labelledby="a11y-theme-label" className="min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Sun size={18} className="text-[var(--color-primary-500)] shrink-0" aria-hidden="true" />
              <h3 id="a11y-theme-label" className="font-bold text-[var(--color-text)] text-sm sm:text-base">
                {t('a11y.theme_label')}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="a11y-theme-label">
              {themes.map(({ value, label, icon }) => {
                const isActive = settings.theme === value;
                return (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setTheme(value)}
                    className={[
                      'btn btn-sm px-2 flex-col sm:flex-row py-2.5 h-auto min-h-[3rem] text-xs sm:text-sm font-bold min-w-0',
                      isActive
                        ? 'btn-primary'
                        : 'btn-ghost border border-[var(--color-border)]',
                    ].join(' ')}
                  >
                    <span className="shrink-0">{icon}</span>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="divider" aria-hidden="true" />

          {/* 2. Colour mode selector (Standard vs Colorblind assist) */}
          <section aria-labelledby="a11y-color-mode-label" className="min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Palette size={18} className="text-[var(--color-primary-500)] shrink-0" aria-hidden="true" />
              <h3 id="a11y-color-mode-label" className="font-bold text-[var(--color-text)] text-sm sm:text-base">
                {t('a11y.color_mode_label')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-labelledby="a11y-color-mode-label">
              {/* Option A: Standard */}
              <button
                role="radio"
                aria-checked={settings.colorMode === 'standard'}
                onClick={() => setColorMode('standard')}
                className={[
                  'text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-w-0',
                  settings.colorMode === 'standard'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/40 text-[var(--color-text)] shadow-sm'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary-300)] text-[var(--color-text)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 min-w-0 mb-1">
                  <span className="font-bold text-sm sm:text-base break-words">
                    {t('a11y.color_mode_standard')}
                  </span>
                  {settings.colorMode === 'standard' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] break-words leading-relaxed">
                  {t('a11y.color_mode_standard_desc')}
                </span>
              </button>

              {/* Option B: Colorblind assist */}
              <button
                role="radio"
                aria-checked={settings.colorMode === 'colorblind-assist'}
                onClick={() => setColorMode('colorblind-assist')}
                className={[
                  'text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between min-w-0',
                  settings.colorMode === 'colorblind-assist'
                    ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/40 text-[var(--color-text)] shadow-sm'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary-300)] text-[var(--color-text)]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-2 min-w-0 mb-1">
                  <span className="font-bold text-sm sm:text-base break-words flex items-center gap-1.5">
                    {t('a11y.color_mode_assist')}
                    <Sparkles size={14} className="text-[var(--color-accent-500)] shrink-0" />
                  </span>
                  {settings.colorMode === 'colorblind-assist' && (
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary-500)] text-white flex items-center justify-center shrink-0">
                      <Check size={14} />
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-text-muted)] break-words leading-relaxed">
                  {t('a11y.color_mode_assist_desc')}
                </span>
              </button>
            </div>
          </section>

          <hr className="divider" aria-hidden="true" />

          {/* 3. Text size selector */}
          <section aria-labelledby="a11y-text-size-label" className="min-w-0">
            <div className="flex items-center gap-2 mb-2.5">
              <Type size={18} className="text-[var(--color-primary-500)] shrink-0" aria-hidden="true" />
              <h3 id="a11y-text-size-label" className="font-bold text-[var(--color-text)] text-sm sm:text-base">
                {t('a11y.text_size')}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="a11y-text-size-label">
              {textSizes.map(({ value, label }) => {
                const isActive = settings.textSize === value;
                return (
                  <button
                    key={value}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setTextSize(value)}
                    className={[
                      'btn btn-sm px-2 py-2.5 h-auto min-h-[3rem] text-xs sm:text-sm font-bold min-w-0',
                      isActive ? 'btn-primary' : 'btn-ghost border border-[var(--color-border)]',
                    ].join(' ')}
                  >
                    {isActive && <Check size={14} className="shrink-0 mr-1" aria-hidden="true" />}
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <hr className="divider" aria-hidden="true" />

          {/* 4. Motion toggle */}
          <section aria-label="Animation toggles" className="min-w-0">
            <ToggleRow
              id="a11y-reduce-motion"
              label={t('a11y.reduce_motion')}
              description="Turns off transitions and interface animations"
              icon={<Zap size={20} />}
              checked={settings.reduceMotion}
              onChange={setReduceMotion}
            />
          </section>
        </div>
      </div>
    </>
  );
}
