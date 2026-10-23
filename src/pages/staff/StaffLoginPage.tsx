import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stethoscope, UserCheck, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { BaseLayout } from '../../components/layout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Input,
  PageHeader,
  StatusBadge,
} from '../../components/ui';

export function StaffLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginAsStaff } = useAuth();

  const [staffId, setStaffId] = useState('STF-101');
  const [password, setPassword] = useState('demo123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId.trim()) {
      setError('Please enter your Staff ID');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginAsStaff(staffId, password);
      navigate('/staff/dashboard');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseLayout showHome={true} headerTitle={t('app.name')}>
      <div className="page-container">
        <PageHeader
          title={t('staff_login.page_title')}
          subtitle={t('staff_login.page_subtitle')}
          showBack={true}
          onBack={() => navigate('/')}
        />

        {/* Demo Hint Banner */}
        <div className="p-3.5 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-start gap-3 shadow-sm">
          <Info size={20} className="text-[var(--color-primary-500)] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-[var(--color-primary-900)]">
            <span className="font-bold block mb-0.5">Demo Staff Access</span>
            {t('staff_login.demo_hint')}
          </div>
        </div>

        {/* Staff Login Card */}
        <Card className="p-5">
          <CardHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--color-primary-50)] text-[var(--color-primary-500)] flex-shrink-0">
                <Stethoscope size={24} aria-hidden="true" />
              </div>
              <div>
                <CardTitle>Staff Credentials</CardTitle>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">
                  Authorised hospital personnel only
                </span>
              </div>
            </div>
            <StatusBadge variant="info" label="Staff Portal" />
          </CardHeader>

          <CardBody>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                id="staff-id"
                label={t('staff_login.staff_id_label')}
                placeholder={t('staff_login.staff_id_placeholder')}
                value={staffId}
                onChange={(e) => {
                  setStaffId(e.target.value);
                  setError('');
                }}
                error={error}
                required
              />

              <Input
                id="staff-password"
                type="password"
                label={t('staff_login.password_label')}
                placeholder={t('staff_login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                icon={<UserCheck size={20} />}
                className="mt-2"
              >
                {t('staff_login.login_btn')}
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Security Notice */}
        <div className="text-center pt-3 text-xs text-[var(--color-text-muted)]">
          <p>City General Hospital EHR System • HIPAA & NDHM Compliant</p>
        </div>
      </div>
    </BaseLayout>
  );
}
