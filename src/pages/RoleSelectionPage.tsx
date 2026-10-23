import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Volume2,
  User,
  Stethoscope,
  Building2,
  ArrowRight,
  Languages,
  Check,
  Building,
  Sparkles,
} from 'lucide-react';
import { LANGUAGES, type LanguageCode } from '../i18n';
import { BaseLayout } from '../components/layout';
import { Button, StatusBadge } from '../components/ui';

const STORAGE_LANG_CHOSEN = 'vd-lang-selected';

export function RoleSelectionPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Check if first-time user needs language selection
  const [showLanguageScreen, setShowLanguageScreen] = useState(() => {
    return !localStorage.getItem(STORAGE_LANG_CHOSEN);
  });

  const [speakingCode, setSpeakingCode] = useState<string | null>(null);

  // Web Speech API text-to-speech for language names
  const speakLanguage = (text: string, langCode: LanguageCode, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === 'hi' ? 'hi-IN' : langCode === 'mr' ? 'mr-IN' : 'en-US';
      utterance.rate = 0.85;

      setSpeakingCode(langCode);
      utterance.onend = () => setSpeakingCode(null);
      utterance.onerror = () => setSpeakingCode(null);

      window.speechSynthesis.speak(utterance);
    } catch {
      setSpeakingCode(null);
    }
  };

  const handleSelectLanguage = (code: LanguageCode) => {
    i18n.changeLanguage(code);
    localStorage.setItem('vd-lang', code);
    localStorage.setItem(STORAGE_LANG_CHOSEN, 'true');
    document.documentElement.lang = code;
    setShowLanguageScreen(false);
  };

  const handleSkipLanguage = () => {
    localStorage.setItem(STORAGE_LANG_CHOSEN, 'true');
    setShowLanguageScreen(false);
  };

  const currentLang = i18n.language as LanguageCode;

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN A – Language Selection (First-time / On demand)
  // ══════════════════════════════════════════════════════════════════════════
  if (showLanguageScreen) {
    return (
      <BaseLayout showHome={false} headerTitle={t('app.name')}>
        <div className="page-container">
          <div className="flex flex-col gap-2 text-center pt-2 pb-1">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] flex items-center justify-center mb-1">
              <Languages size={28} aria-hidden="true" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)]">
              {t('language_select.title')}
            </h1>
            <p className="text-[var(--color-text-muted)] text-base max-w-md mx-auto">
              {t('language_select.subtitle')}
            </p>
          </div>

          {/* Large Language Cards */}
          <div className="flex flex-col gap-3 my-2" role="group" aria-label={t('language_select.title')}>
            {LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              const isSpeaking = speakingCode === lang.code;

              return (
                <div
                  key={lang.code}
                  className={[
                    'card card-interactive p-4 flex items-center justify-between gap-3 border-2 transition-all',
                    isSelected
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/40 shadow-md'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary-300)]',
                  ].join(' ')}
                  onClick={() => handleSelectLanguage(lang.code)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectLanguage(lang.code);
                    }
                  }}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={[
                        'w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0',
                        isSelected
                          ? 'bg-[var(--color-primary-500)] text-white'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
                      ].join(' ')}
                    >
                      {isSelected ? <Check size={20} aria-hidden="true" /> : lang.code.toUpperCase()}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-[var(--color-text)] leading-tight">
                        {lang.nativeLabel}
                      </span>
                      <span className="text-sm text-[var(--color-text-muted)] font-medium">
                        {lang.code === 'en' ? 'English' : lang.code === 'hi' ? 'Hindi' : 'Marathi'}
                      </span>
                    </div>
                  </div>

                  {/* Speaker TTS button */}
                  <button
                    type="button"
                    onClick={(e) => speakLanguage(lang.nativeLabel, lang.code, e)}
                    className={[
                      'btn btn-icon btn-sm rounded-full flex-shrink-0 transition-transform active:scale-95',
                      isSpeaking
                        ? 'btn-primary animate-pulse'
                        : 'btn-ghost border border-[var(--color-border)]',
                    ].join(' ')}
                    aria-label={`${t('language_select.listen_label')} ${lang.nativeLabel}`}
                    title={`${t('language_select.listen_label')} ${lang.nativeLabel}`}
                  >
                    <Volume2 size={20} className={isSpeaking ? 'text-white' : 'text-[var(--color-primary-500)]'} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<ArrowRight size={22} />}
              iconPosition="right"
              onClick={() => handleSelectLanguage(currentLang)}
            >
              {t('language_select.confirm')}
            </Button>

            <Button
              variant="ghost"
              fullWidth
              onClick={handleSkipLanguage}
            >
              {t('language_select.skip')}
            </Button>
          </div>
        </div>
      </BaseLayout>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCREEN B – Role Selection at route "/"
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <BaseLayout showHome={false} headerTitle={t('app.name')}>
      <div className="page-container">
        {/* Hospital Branding & Logo Placeholder */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] border-2 border-[var(--color-primary-200)] shadow-sm mb-3">
            <Building size={36} aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] tracking-tight">
            {t('roles.hospital_name')}
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm sm:text-base font-medium mt-1">
            {t('roles.hospital_tagline')}
          </p>
        </div>

        {/* Headline */}
        <div className="flex items-center justify-between mt-2 mb-1">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text)] leading-tight">
              {t('roles.select_role_title')}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
              {t('roles.select_role_subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowLanguageScreen(true)}
            className="btn btn-ghost btn-sm text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            aria-label={t('roles.change_lang')}
          >
            <Languages size={16} />
            <span className="hidden sm:inline">{t('roles.change_lang')}</span>
          </button>
        </div>

        {/* Exactly 3 Equal-Sized Role Buttons */}
        <div className="flex flex-col gap-4 my-1" role="group" aria-label={t('roles.select_role_title')}>
          {/* 1. Patient Role (Most prominent) */}
          <div
            onClick={() => navigate('/patient/start')}
            role="button"
            tabIndex={0}
            aria-label={`${t('roles.patient_title')}: ${t('roles.patient_desc')}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/patient/start');
              }
            }}
            className="card card-interactive p-4 sm:p-5 border-2 border-[var(--color-primary-500)] bg-gradient-to-r from-[var(--color-primary-50)]/30 to-[var(--color-surface)] shadow-md hover:shadow-lg transition-all flex flex-col justify-between min-h-[140px] min-w-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2.5 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-500)] text-white flex items-center justify-center flex-shrink-0 shadow-sm p-2.5">
                  <User size={26} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight break-words">
                    {t('roles.patient_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1 break-words">
                    {t('roles.patient_desc')}
                  </p>
                </div>
              </div>
              <StatusBadge
                variant="info"
                label={t('roles.patient_badge')}
                icon={<Sparkles size={13} aria-hidden="true" />}
                className="shrink-0 self-start sm:self-auto"
              />
            </div>

            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-[var(--color-border)] text-[var(--color-primary-500)] font-bold text-sm">
              <span>{t('common.continue')}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </div>

          {/* 2. Hospital Staff Role */}
          <div
            onClick={() => navigate('/staff/login')}
            role="button"
            tabIndex={0}
            aria-label={`${t('roles.staff_title')}: ${t('roles.staff_desc')}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/staff/login');
              }
            }}
            className="card card-interactive p-4 sm:p-5 border-2 border-[var(--color-border)] hover:border-[var(--color-primary-400)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] min-w-0"
          >
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-primary-600)] flex items-center justify-center flex-shrink-0 p-2.5">
                  <Stethoscope size={26} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight break-words">
                    {t('roles.staff_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1 break-words">
                    {t('roles.staff_desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-[var(--color-border)] text-[var(--color-primary-500)] font-bold text-sm">
              <span>{t('common.continue')}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </div>

          {/* 3. Hospital Administration Role */}
          <div
            onClick={() => navigate('/admin/coming-soon')}
            role="button"
            tabIndex={0}
            aria-label={`${t('roles.admin_title')}: ${t('roles.admin_desc')}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate('/admin/coming-soon');
              }
            }}
            className="card card-interactive p-4 sm:p-5 border-2 border-[var(--color-border)] hover:border-[var(--color-primary-400)] shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] min-w-0"
          >
            <div className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-2)] text-[var(--color-neutral-700)] flex items-center justify-center flex-shrink-0 p-2.5">
                  <Building2 size={26} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] leading-tight break-words">
                    {t('roles.admin_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1 break-words">
                    {t('roles.admin_desc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 mt-4 pt-3 border-t border-[var(--color-border)] text-[var(--color-primary-500)] font-bold text-sm">
              <span>{t('common.continue')}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Emergency Assistance Quick Link */}
        <div className="text-center pt-2">
          <p className="text-xs text-[var(--color-text-muted)]">
            Medical emergency or critical care? Proceed directly to Building E (Casualty & Emergency) or dial 108.
          </p>
        </div>
      </div>
    </BaseLayout>
  );
}
