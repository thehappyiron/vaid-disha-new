import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Building,
  User,
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Input,
  Select,
  StatusBadge,
  PageHeader,
  BottomActionBar,
  EmergencyCard,
} from '../components/ui';
import { BaseLayout } from '../components/layout';
import { useAccessibility } from '../context/AccessibilityContext';

export function ComponentDemoPage() {
  const { t } = useTranslation();
  const { settings } = useAccessibility();

  // State for interactive demo controls
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [cardClickCount, setCardClickCount] = useState(0);

  const toggleLoading = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  const departmentOptions = [
    { value: 'opd-general', label: 'General OPD (Dr. Verma)' },
    { value: 'cardiology', label: 'Cardiology (Dr. Sharma)' },
    { value: 'orthopaedics', label: 'Orthopaedics (Dr. Patel)' },
    { value: 'radiology', label: 'Radiology & X-Ray (Ground Floor)' },
    { value: 'emergency', label: 'Emergency & Casualty (24x7)' },
  ];

  return (
    <BaseLayout showHome={false} headerTitle={t('app.name')}>
      <div className="page-container">
        {/* Page Header Component */}
        <PageHeader
          title={t('demo.page_title')}
          subtitle={t('demo.page_subtitle')}
          showBack={false}
          actions={
            <StatusBadge
              variant="info"
              label={`v1.0 • ${settings.textSize.toUpperCase()}`}
              icon={<Sparkles size={14} aria-hidden="true" />}
            />
          }
        />

        {/* Accessibility Status Banner */}
        <Card noPadding className="bg-[var(--color-primary-50)] border-[var(--color-primary-200)] p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--color-primary-800)] text-sm tracking-wide uppercase">
                {t('demo.section_a11y')} Status
              </span>
            </div>
            <p className="text-sm text-[var(--color-primary-900)]">
              Use the <strong>Accessibility</strong> icon button in the top right header to adjust text size, toggle high contrast mode, activate colorblind patterns, or reduce animations.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <StatusBadge
                variant="info"
                label={`Text: ${settings.textSize}`}
              />
              <StatusBadge
                variant={settings.theme === 'light' ? 'neutral' : 'info'}
                label={`Theme: ${settings.theme}`}
              />
              <StatusBadge
                variant={settings.colorMode === 'standard' ? 'neutral' : 'warning'}
                label={`Mode: ${settings.colorMode}`}
              />
              <StatusBadge
                variant={settings.reduceMotion ? 'warning' : 'neutral'}
                label={settings.reduceMotion ? 'Reduced Motion: ON' : 'Reduced Motion: OFF'}
              />
            </div>
          </div>
        </Card>

        {/* Reusable EmergencyCard Demo */}
        <section aria-labelledby="section-emergency-card">
          <h2 id="section-emergency-card" className="section-label">
            Emergency Option Card (Reusable Component)
          </h2>
          <EmergencyCard to="/patient/emergency" />
        </section>

        {/* Section 1: Buttons */}
        <section aria-labelledby="section-buttons">
          <h2 id="section-buttons" className="section-label">
            {t('demo.section_buttons')}
          </h2>

          <div className="flex flex-col gap-4">
            {/* Primary & Secondary */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                icon={<ArrowRight size={20} />}
                iconPosition="right"
                onClick={() => alert('Primary button activated')}
              >
                {t('demo.btn_primary')}
              </Button>

              <Button
                variant="secondary"
                icon={<Building size={20} />}
                onClick={() => alert('Secondary button activated')}
              >
                {t('demo.btn_secondary')}
              </Button>

              <Button
                variant="danger"
                icon={<AlertCircle size={20} />}
                onClick={() => alert('Danger button clicked')}
              >
                {t('demo.btn_danger')}
              </Button>

              <Button
                variant="ghost"
                onClick={() => alert('Ghost button clicked')}
              >
                {t('demo.btn_ghost')}
              </Button>
            </div>

            {/* Sizes & States */}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Small (44px)
              </Button>

              <Button variant="primary" size="md">
                Medium (56px)
              </Button>

              <Button variant="primary" size="lg">
                Large (64px)
              </Button>

              <Button
                variant="secondary"
                loading={loadingBtn}
                onClick={toggleLoading}
              >
                {loadingBtn ? t('demo.btn_loading') : 'Click for Loading State'}
              </Button>

              <Button variant="primary" disabled>
                {t('demo.btn_disabled')}
              </Button>

              <Button
                variant="primary"
                iconOnly
                icon={<Heart size={20} />}
                aria-label="Favorite department"
                title="Favorite department"
              />
            </div>

            {/* Full-width CTA demo */}
            <Button
              variant="primary"
              fullWidth
              icon={<ArrowRight size={20} />}
              iconPosition="right"
            >
              Full Width Action Button
            </Button>
          </div>
        </section>

        <hr className="divider" aria-hidden="true" />

        {/* Section 2: Status Badges (Always Icon + Text + Color) */}
        <section aria-labelledby="section-badges">
          <h2 id="section-badges" className="section-label">
            {t('demo.section_badges')} (Always Icon + Color + Text)
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            In Colorblind-Friendly Mode, these badges automatically display semantic indicator symbols and distinct typographic treatments.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <StatusBadge
              variant="success"
              label={t('demo.badge_success')}
              icon={<CheckCircle size={15} aria-hidden="true" />}
            />
            <StatusBadge
              variant="danger"
              label={t('demo.badge_danger')}
              icon={<AlertCircle size={15} aria-hidden="true" />}
            />
            <StatusBadge
              variant="warning"
              label={t('demo.badge_warning')}
              icon={<AlertTriangle size={15} aria-hidden="true" />}
            />
            <StatusBadge
              variant="info"
              label={t('demo.badge_info')}
              icon={<Info size={15} aria-hidden="true" />}
            />
            <StatusBadge
              variant="neutral"
              label={t('demo.badge_neutral')}
            />
          </div>
        </section>

        <hr className="divider" aria-hidden="true" />

        {/* Section 3: Form Inputs & Selects */}
        <section aria-labelledby="section-inputs">
          <h2 id="section-inputs" className="section-label">
            {t('demo.section_inputs')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Text Input */}
            <Input
              id="demo-patient-name"
              label={t('demo.input_label')}
              placeholder={t('demo.input_placeholder')}
              hint={t('demo.input_hint')}
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
            />

            {/* Select Dropdown */}
            <Select
              id="demo-dept-select"
              label={t('demo.select_label')}
              placeholder={t('demo.select_placeholder')}
              hint="Select which clinic you are visiting today"
              options={departmentOptions}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              required
            />

            {/* Input with Accessible Error State */}
            <Input
              id="demo-patient-phone"
              label={t('demo.input_error_label')}
              placeholder="e.g. 9876543210"
              defaultValue="12345"
              error={t('demo.input_error_msg')}
              required
            />

            {/* Search Input style */}
            <Input
              id="demo-search"
              label="Hospital Directory Search"
              placeholder="Search doctors, wards, tests…"
              hint="Press Enter or search icon to search"
            />
          </div>
        </section>

        <hr className="divider" aria-hidden="true" />

        {/* Section 4: Cards */}
        <section aria-labelledby="section-cards">
          <h2 id="section-cards" className="section-label">
            {t('demo.section_cards')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Card with Structured Header/Body/Footer */}
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t('demo.card_title')}</CardTitle>
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Token #OPD-1042
                  </span>
                </div>
                <StatusBadge variant="success" label="Active" />
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-[var(--color-primary-500)]" aria-hidden="true" />
                    <span><strong>Doctor:</strong> Dr. Sharma (Cardiologist)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-[var(--color-primary-500)]" aria-hidden="true" />
                    <span><strong>Location:</strong> Building A, 2nd Floor, Room 204</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--color-primary-500)]" aria-hidden="true" />
                    <span><strong>Time:</strong> Today at 10:30 AM (Est. Wait: 15 min)</span>
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <Button variant="primary" size="sm" icon={<ArrowRight size={16} />} iconPosition="right">
                  View Directions
                </Button>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </CardFooter>
            </Card>

            {/* Interactive Card */}
            <Card
              interactive
              onClick={() => setCardClickCount((c) => c + 1)}
              tabIndex={0}
              role="button"
              aria-label="Interactive demonstration card"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setCardClickCount((c) => c + 1);
                }
              }}
            >
              <CardHeader>
                <CardTitle>{t('demo.card_interactive_title')}</CardTitle>
                <StatusBadge variant="info" label={`Clicks: ${cardClickCount}`} />
              </CardHeader>
              <CardBody>
                <p className="text-base">
                  {t('demo.card_interactive_body')}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  This card includes hover state styling, visible high-contrast focus rings, and keyboard accessibility via Enter/Space.
                </p>
              </CardBody>
              <CardFooter>
                <span className="text-sm font-semibold text-[var(--color-primary-500)]">
                  Click to increment counter →
                </span>
              </CardFooter>
            </Card>

            {/* Highlighted Card */}
            <Card highlighted className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle size={22} className="text-[var(--color-danger-500)]" aria-hidden="true" />
                  <CardTitle className="text-[var(--color-danger-700)]">
                    Emergency Protocols & Assistance
                  </CardTitle>
                </div>
                <StatusBadge variant="danger" label="Priority Care" />
              </CardHeader>
              <CardBody>
                <p className="text-base text-[var(--color-text)]">
                  If this is a medical emergency or trauma, do not wait in line. Proceed directly to Building E (Casualty & Emergency) or notify any hospital staff member immediately.
                </p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 5: Color Palette Verification */}
        <section aria-labelledby="section-palette">
          <h2 id="section-palette" className="section-label">
            Colorblind-Safe Design Tokens (Okabe-Ito Palette)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-3 border-l-8 border-l-[var(--color-primary-500)]">
              <span className="block text-xs text-[var(--color-text-muted)] uppercase font-bold">Primary Blue</span>
              <span className="font-bold text-sm">#0072B2</span>
              <span className="block text-xs mt-1 text-[var(--color-text-muted)]">Safe for all CVD types</span>
            </div>
            <div className="card p-3 border-l-8 border-l-[var(--color-accent-500)]">
              <span className="block text-xs text-[var(--color-text-muted)] uppercase font-bold">Accent Orange</span>
              <span className="font-bold text-sm">#E69F00</span>
              <span className="block text-xs mt-1 text-[var(--color-text-muted)]">Safe for deuteranopia</span>
            </div>
            <div className="card p-3 border-l-8 border-l-[var(--color-success-500)]">
              <span className="block text-xs text-[var(--color-text-muted)] uppercase font-bold">Success Teal</span>
              <span className="font-bold text-sm">#009E73</span>
              <span className="block text-xs mt-1 text-[var(--color-text-muted)]">Distinguishable from red</span>
            </div>
            <div className="card p-3 border-l-8 border-l-[var(--color-danger-500)]">
              <span className="block text-xs text-[var(--color-text-muted)] uppercase font-bold">Danger Vermillion</span>
              <span className="font-bold text-sm">#D55E00</span>
              <span className="block text-xs mt-1 text-[var(--color-text-muted)]">Distinguishable from green</span>
            </div>
          </div>
        </section>

        {/* Sticky Bottom Action Bar Component */}
        <BottomActionBar>
          <Button
            variant="primary"
            fullWidth
            icon={<ArrowRight size={20} />}
            iconPosition="right"
            onClick={() => alert('Bottom Action Bar confirmed')}
          >
            {t('common.confirm')} & {t('common.continue')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setPatientName('');
              setSelectedDept('');
              setCardClickCount(0);
            }}
          >
            {t('common.cancel')}
          </Button>
        </BottomActionBar>
      </div>
    </BaseLayout>
  );
}
