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
import { PRIMARY_LANGUAGES, OTHER_INDIAN_LANGUAGES, getBcp47Language, type LanguageCode } from '../i18n';
import { BaseLayout } from '../components/layout';
import { Button, StatusBadge, OptionCard } from '../components/ui';

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
  const speakLanguage = (text: string, langCode: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getBcp47Language(langCode);
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

          {/* Large Language Cards: English, Hindi, Marathi + Other Indian Languages Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-2" role="group" aria-label={t('language_select.title')}>
            {PRIMARY_LANGUAGES.map((lang) => {
              const isSelected = currentLang === lang.code;
              const isSpeaking = speakingCode === lang.code;

              return (
                <OptionCard
                  key={lang.code}
                  as="div"
                  selected={isSelected}
                  onClick={() => handleSelectLanguage(lang.code)}
                  ariaLabel={`${lang.nativeLabel} - ${lang.englishLabel}`}
                  ariaPressed={isSelected}
                  icon={
                    <div className="font-bold text-base">
                      {isSelected ? <Check size={22} aria-hidden="true" /> : lang.code.toUpperCase()}
                    </div>
                  }
                  iconBgClass={
                    isSelected
                      ? 'bg-[var(--color-primary-500)] text-white'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                  }
                  title={lang.nativeLabel}
                  description={lang.englishLabel}
                  rightSlot={
                    <button
                      type="button"
                      onClick={(e) => speakLanguage(lang.nativeLabel, lang.code, e)}
                      className={[
                        'btn btn-icon btn-sm rounded-full shrink-0 transition-transform active:scale-95',
                        isSpeaking
                          ? 'btn-primary animate-pulse'
                          : 'btn-ghost border border-[var(--color-border)]',
                      ].join(' ')}
                      aria-label={`${t('language_select.listen_label')} ${lang.nativeLabel}`}
                      title={`${t('language_select.listen_label')} ${lang.nativeLabel}`}
                    >
                      <Volume2 size={20} className={isSpeaking ? 'text-white' : 'text-[var(--color-primary-500)]'} />
                    </button>
                  }
                />
              );
            })}

            {/* 4th Card: Dropdown for 9 Other Indian Languages */}
            {(() => {
              const activeOtherLang = OTHER_INDIAN_LANGUAGES.find((l) => l.code === currentLang);
              const isOtherSelected = Boolean(activeOtherLang);
              const isSpeakingOther = speakingCode === (activeOtherLang?.code || 'other');

              return (
                <div
                  className={[
                    'relative rounded-2xl p-4 transition-all border-2 flex flex-col justify-between gap-3',
                    isOtherSelected
                      ? 'bg-[var(--color-surface)] border-[var(--color-primary-500)] shadow-md ring-2 ring-[var(--color-primary-200)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-primary-300)]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={[
                          'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0',
                          isOtherSelected
                            ? 'bg-[var(--color-primary-500)] text-white'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
                        ].join(' ')}
                      >
                        {isOtherSelected ? <Check size={20} aria-hidden="true" /> : <Languages size={20} aria-hidden="true" />}
                      </div>
                      <div>
                        <h2 className="font-bold text-base text-[var(--color-text)] leading-tight">
                          {activeOtherLang ? activeOtherLang.nativeLabel : 'More Languages'}
                        </h2>
                        <p className="text-xs text-[var(--color-text-muted)] font-medium">
                          {activeOtherLang ? activeOtherLang.englishLabel : `${OTHER_INDIAN_LANGUAGES.length} Indian Languages`}
                        </p>
                      </div>
                    </div>

                    {activeOtherLang && (
                      <button
                        type="button"
                        onClick={(e) => speakLanguage(activeOtherLang.nativeLabel, activeOtherLang.code, e)}
                        className={[
                          'btn btn-icon btn-sm rounded-full shrink-0 transition-transform active:scale-95',
                          isSpeakingOther
                            ? 'btn-primary animate-pulse'
                            : 'btn-ghost border border-[var(--color-border)]',
                        ].join(' ')}
                        aria-label={`${t('language_select.listen_label')} ${activeOtherLang.nativeLabel}`}
                        title={`${t('language_select.listen_label')} ${activeOtherLang.nativeLabel}`}
                      >
                        <Volume2 size={18} className={isSpeakingOther ? 'text-white' : 'text-[var(--color-primary-500)]'} />
                      </button>
                    )}
                  </div>

                  {/* Accessible Select Dropdown with active other Indian languages */}
                  <div className="mt-1">
                    <label htmlFor="other-language-dropdown" className="sr-only">
                      Select other Indian language
                    </label>
                    <div className="relative">
                      <select
                        id="other-language-dropdown"
                        value={isOtherSelected ? currentLang : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) handleSelectLanguage(val);
                        }}
                        className="w-full h-11 px-3 pr-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-primary-500)] cursor-pointer appearance-none"
                      >
                        <option value="" disabled>
                          -- Choose Indian Language ({OTHER_INDIAN_LANGUAGES.length} Available) --
                        </option>
                        {OTHER_INDIAN_LANGUAGES.map((item) => (
                          <option key={item.code} value={item.code} className="text-black bg-white dark:text-white dark:bg-neutral-900 py-1">
                            {item.nativeLabel} ({item.englishLabel})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[var(--color-text-muted)]">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2" role="group" aria-label={t('roles.select_role_title')}>
          {/* 1. Patient Role (Most prominent) */}
          <OptionCard
            highlighted
            onClick={() => navigate('/patient/start')}
            ariaLabel={`${t('roles.patient_title')}: ${t('roles.patient_desc')}`}
            icon={<User size={26} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-primary-500)] text-white shadow-sm"
            title={t('roles.patient_title')}
            description={t('roles.patient_desc')}
            badge={
              <StatusBadge
                variant="info"
                label={t('roles.patient_badge')}
                icon={<Sparkles size={13} aria-hidden="true" />}
              />
            }
            footer={
              <div className="flex items-center justify-end gap-1 text-[var(--color-primary-500)] font-bold text-sm">
                <span>{t('common.continue')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
            }
          />

          {/* 2. Hospital Staff Role */}
          <OptionCard
            onClick={() => navigate('/staff/login')}
            ariaLabel={`${t('roles.staff_title')}: ${t('roles.staff_desc')}`}
            icon={<Stethoscope size={26} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-surface-2)] text-[var(--color-primary-600)]"
            title={t('roles.staff_title')}
            description={t('roles.staff_desc')}
            footer={
              <div className="flex items-center justify-end gap-1 text-[var(--color-primary-500)] font-bold text-sm">
                <span>{t('common.continue')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
            }
          />

          {/* 3. Hospital Administration Role */}
          <OptionCard
            onClick={() => navigate('/admin')}
            ariaLabel={`${t('roles.admin_title')}: ${t('roles.admin_desc')}`}
            icon={<Building2 size={26} aria-hidden="true" />}
            iconBgClass="bg-[var(--color-surface-2)] text-[var(--color-neutral-700)]"
            title={t('roles.admin_title')}
            description={t('roles.admin_desc')}
            footer={
              <div className="flex items-center justify-end gap-1 text-[var(--color-primary-500)] font-bold text-sm">
                <span>{t('common.continue')}</span>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
            }
          />
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
