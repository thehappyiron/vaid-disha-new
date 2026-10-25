import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LogIn,
  UserX,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
} from 'lucide-react';
import { isValidEmail } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
  Button,
  Input,
  PageHeader,
  StatusBadge,
  OptionCard,
} from '../../components/ui';

export function PatientStartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAsPatientWithOtp, loginAsGuest } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !fullName.trim()) {
      setNameError(t('patient_entry.name_error', 'Please enter your full name'));
      return;
    }
    if (!phoneNumber || phoneNumber.trim().length < 10) {
      setPhoneError(t('demo.input_error_msg') || 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setNameError('');
    setPhoneError('');
    setEmailError('');
    setSubmitting(true);
    try {
      const effectiveName = fullName.trim() || 'Patient';
      await loginAsPatientWithOtp(phoneNumber, '', email, effectiveName);
      navigate('/patient/visit');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setEmailError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuestEntry = () => {
    loginAsGuest();
    navigate('/patient/visit');
  };

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
          {/* Page Header */}
          <PageHeader
            title={t('patient_entry.page_title')}
            subtitle={t('patient_entry.page_subtitle')}
            showBack={true}
            onBack={() => navigate('/')}
          />

        {/* Value Proposition Banner (one short sentence explaining benefit of login) */}
        <OptionCard
          as="div"
          icon={<ShieldCheck size={24} aria-hidden="true" />}
          iconBgClass="bg-[var(--color-primary-500)] text-white"
          title="Why Sign In?"
          description={t('patient_entry.login_benefit')}
          badge={
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[var(--color-primary-800)]">
              <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-[var(--color-primary-200)]">
                <FileText size={14} /> Medical Reports Saved
              </span>
              <span className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-[var(--color-primary-200)]">
                <Clock size={14} /> Revisit Past Prescriptions
              </span>
            </div>
          }
          className="bg-[var(--color-primary-50)] border-2 border-[var(--color-primary-200)]"
        />

        {/* Option 1: Login / Create Account */}
        <OptionCard
          as="div"
          highlighted
          icon={<LogIn size={24} aria-hidden="true" />}
          iconBgClass="bg-[var(--color-primary-50)] text-[var(--color-primary-500)]"
          title={t('patient_entry.login_tab')}
          description="Quick sign-in with your name, mobile number, and email"
          badge={
            <StatusBadge
              variant="info"
              label="Recommended"
              icon={<Sparkles size={12} />}
            />
          }
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-2">
            <Input
              id="patient-name"
              label={t('patient_entry.name_label', 'Full Name')}
              placeholder={t('patient_entry.name_placeholder', 'Enter your full name (e.g. Ramesh Sharma)')}
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setNameError('');
              }}
              error={nameError}
              required
            />

            <Input
              id="patient-phone"
              label={t('patient_entry.phone_label')}
              placeholder={t('patient_entry.phone_placeholder')}
              type="tel"
              maxLength={10}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value.replace(/\D/g, ''));
                setPhoneError('');
              }}
              error={phoneError}
              required
            />

            <Input
              id="patient-email"
              label={t('patient_entry.email_label')}
              placeholder={t('patient_entry.email_placeholder')}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.trim());
                setEmailError('');
              }}
              error={emailError}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting}
              icon={<LogIn size={18} />}
            >
              {t('patient_entry.login_tab', 'Sign In & Continue')}
            </Button>
          </form>
        </OptionCard>

        {/* Divider */}
        <div className="relative my-2 text-center min-w-0">
          <hr className="divider" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--color-bg)] px-3 text-xs font-bold text-[var(--color-text-muted)] tracking-wider">
            {t('patient_entry.or_divider')}
          </span>
        </div>

        {/* Option 2: Continue as Guest */}
        <OptionCard
          onClick={handleGuestEntry}
          ariaLabel={`${t('patient_entry.guest_title')}: ${t('patient_entry.guest_desc')}`}
          icon={<UserX size={24} aria-hidden="true" />}
          iconBgClass="bg-[var(--color-surface-2)] text-[var(--color-text)]"
          title={t('patient_entry.guest_title')}
          description={t('patient_entry.guest_desc')}
          badge={<StatusBadge variant="neutral" label="No Sign-in" />}
          footer={
            <div className="flex items-center justify-end gap-1 text-[var(--color-primary-500)] font-bold text-sm">
              <span>{t('patient_entry.guest_btn')}</span>
              <ArrowRight size={18} aria-hidden="true" />
            </div>
          }
        />
        </div>
      </div>
    </BaseLayout>
  );
}
