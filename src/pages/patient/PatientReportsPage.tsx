import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  CheckCircle2,
  Clock,
  Hourglass,
  AlertTriangle,
  Volume2,
  VolumeX,
  Download,
  Share2,
  ArrowLeft,
  ChevronRight,
  LogIn,
  UserCheck,
  Check,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { PageHeader, Button, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import {
  MOCK_LAB_REPORTS,
  type LabReport,
  type ReportStatus,
} from '../../data/labReportsData';
import { textToSpeech } from '../../services/voice';
import type { Slip } from '../../types';

function getStoredSlip(): Slip | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vd-latest-slip');
    if (!raw) return null;
    return JSON.parse(raw) as Slip;
  } catch {
    return null;
  }
}

export function PatientReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const slip = getStoredSlip();

  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Filter reports: if guest, only show reports associated with current visit slip
  const visibleReports = isGuest
    ? MOCK_LAB_REPORTS.filter((r) => r.slipToken === (slip?.token || 'CARD-1042'))
    : MOCK_LAB_REPORTS;

  // Handle TTS Read Summary Aloud
  const handleReadAloud = (report: LabReport) => {
    if (isSpeaking) {
      textToSpeech.stop();
      setIsSpeaking(false);
      return;
    }

    const currentLang = i18n.language || 'en';
    setIsSpeaking(true);
    textToSpeech.speak(report.summary, currentLang, {
      rate: 0.9,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Handle Mock PDF Download
  const handleDownloadPdf = (report: LabReport) => {
    setDownloadSuccess(true);
    // Trigger mock file download for user feedback
    try {
      const element = document.createElement('a');
      const file = new Blob(
        [
          `VAID DISHA MEMORIAL HOSPITAL - DIAGNOSTIC LAB REPORT\n` +
            `====================================================\n` +
            `Test Name: ${report.testName}\n` +
            `Date: ${report.date}\n` +
            `Department: ${report.department}\n` +
            `Doctor: ${report.doctorName}\n` +
            `Sample ID: ${report.sampleId}\n\n` +
            `SUMMARY:\n${report.summary}\n\n` +
            `PARAMETERS:\n` +
            report.parameters
              .map(
                (p) =>
                  `- ${p.name}: ${p.value} ${p.unit} (Normal Range: ${p.normalRange}) [${p.isNormal ? 'WITHIN NORMAL RANGE' : 'OUTSIDE NORMAL RANGE'}]`
              )
              .join('\n'),
        ],
        { type: 'text/plain' }
      );
      element.href = URL.createObjectURL(file);
      element.download = `${report.testName.replace(/\s+/g, '_')}_Report.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch {
      // ignore
    }
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  // Handle Share Report
  const handleShare = async (report: LabReport) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Lab Report: ${report.testName}`,
          text: `Diagnostic Lab Report for ${report.testName} from Vaid Disha Hospital: ${report.summary}`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    // Fallback: Copy summary to clipboard
    try {
      await navigator.clipboard.writeText(
        `Vaid Disha Hospital Lab Report: ${report.testName}\n${report.summary}`
      );
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch {
      // ignore
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Ready</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700">
            <Clock size={15} className="text-amber-600 animate-spin" />
            <span>In progress</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600">
            <Hourglass size={15} className="text-slate-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <BaseLayout headerTitle="Lab Reports">
      <div className="mx-auto w-full px-4 sm:px-6 py-4 md:py-6 max-w-3xl lg:max-w-4xl flex flex-col gap-5 sm:gap-6">
        {/* Guest Prompt Banner */}
        {isGuest && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl text-amber-950 dark:text-amber-100">
            <div className="flex items-start gap-3">
              <LogIn size={24} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-black">
                  {t('reports.guest_banner_title', 'You are currently browsing as a Guest')}
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 mt-0.5 font-medium">
                  {t(
                    'reports.guest_banner_desc',
                    'Only reports tied to your current visit slip are displayed. Log in with your mobile number to permanently save and access your lifetime medical history.'
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/patient/start')}
              className="shrink-0 font-black border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
            >
              <UserCheck size={16} className="mr-1.5" />
              <span>{t('reports.login_to_save', 'Log in to Save')}</span>
            </Button>
          </div>
        )}

        {/* DETAIL VIEW: OPEN REPORT */}
        {selectedReport ? (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Back button */}
            <div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  textToSpeech.stop();
                  setIsSpeaking(false);
                  setSelectedReport(null);
                }}
                className="flex items-center gap-1.5 font-bold"
              >
                <ArrowLeft size={16} />
                <span>{t('reports.back_to_list', 'Back to reports list')}</span>
              </Button>
            </div>

            {/* Main Report Card */}
            <Card
              className="p-5 sm:p-7 rounded-2xl border-2 border-[var(--color-border)] flex flex-col gap-6 bg-[var(--color-surface)]"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-500)]">
                    {selectedReport.category}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)] mt-1">
                    {selectedReport.testName}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1">
                    {selectedReport.department} • Ref Doctor: {selectedReport.doctorName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Sample ID: <span className="font-mono font-bold">{selectedReport.sampleId}</span> • Recorded: {selectedReport.date}
                  </p>
                </div>
                <div className="shrink-0">{getStatusBadge(selectedReport.status)}</div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 pb-2">
                <Button
                  variant={isSpeaking ? 'primary' : 'secondary'}
                  size="md"
                  onClick={() => handleReadAloud(selectedReport)}
                  className="flex items-center gap-2 font-bold"
                  aria-label="Read report summary aloud"
                >
                  {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span>{isSpeaking ? 'Stop reading' : 'Read summary aloud'}</span>
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleDownloadPdf(selectedReport)}
                  className="flex items-center gap-2 font-bold"
                  aria-label="Download PDF report"
                >
                  {downloadSuccess ? (
                    <>
                      <Check size={18} className="text-green-600" />
                      <span className="text-green-600 font-black">Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span>Download PDF</span>
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleShare(selectedReport)}
                  className="flex items-center gap-2 font-bold"
                  aria-label="Share report"
                >
                  {shareSuccess ? (
                    <>
                      <Check size={18} className="text-green-600" />
                      <span className="text-green-600 font-black">Shared / Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={18} />
                      <span>Share</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Summary Box */}
              <div className="p-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  Doctor's Clinical Summary
                </h3>
                <p className="text-sm sm:text-base text-[var(--color-text)] font-semibold leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              {/* Parameter Values View with Large Text & Explicit Non-Color Flags */}
              {selectedReport.parameters.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                    Test Results & Parameters
                  </h3>

                  <div className="flex flex-col gap-3">
                    {selectedReport.parameters.map((param, idx) => {
                      return (
                        <div
                          key={idx}
                          className={[
                            'p-4 rounded-xl border-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--color-surface)]',
                            param.isNormal
                              ? 'border-emerald-200 dark:border-emerald-900/60'
                              : 'border-amber-300 dark:border-amber-800/80 bg-amber-50/30',
                          ].join(' ')}
                        >
                          <div>
                            <span className="text-base sm:text-lg font-black text-[var(--color-text)]">
                              {param.name}
                            </span>
                            <div className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-0.5">
                              Standard Normal Range: <strong>{param.normalRange} {param.unit}</strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            {/* Observed Value in LARGE TEXT */}
                            <div className="text-right">
                              <span className="text-xl sm:text-2xl font-black text-[var(--color-text)] tracking-tight">
                                {param.value}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-[var(--color-text-muted)] ml-1">
                                {param.unit}
                              </span>
                            </div>

                            {/* Easy Flag with ICON + TEXT (not color only) */}
                            {param.isNormal ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-100 text-emerald-900 border-2 border-emerald-400 dark:bg-emerald-950 dark:text-emerald-200"
                                aria-label="Within normal range"
                              >
                                <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>Within normal range</span>
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-amber-100 text-amber-950 border-2 border-amber-500 dark:bg-amber-950 dark:text-amber-200"
                                aria-label="Outside normal range"
                              >
                                <AlertTriangle size={18} className="text-amber-700 dark:text-amber-400 shrink-0" />
                                <span>Outside normal range</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm font-semibold text-[var(--color-text-muted)]">
                  {selectedReport.status === 'in_progress'
                    ? 'Lab analysis is currently underway. Values will appear automatically once tests are finalized.'
                    : 'Sample is scheduled for testing. Results will be published here upon completion.'}
                </div>
              )}
            </Card>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="flex flex-col gap-4">
            <PageHeader
              title={t('reports.title', 'My Lab Reports')}
              subtitle={t(
                'reports.subtitle',
                'View previous and current diagnostic tests, read summaries aloud, or download report copies.'
              )}
            />

            <div className="flex flex-col gap-3">
              {visibleReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="p-4 sm:p-5 rounded-2xl border-2 border-[var(--color-border)] hover:border-[var(--color-primary-400)] transition-all bg-[var(--color-surface)] cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs hover:shadow-sm"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedReport(report);
                    }
                  }}
                  aria-label={`View report for ${report.testName}`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-50)] dark:bg-slate-800 text-[var(--color-primary-600)] flex items-center justify-center shrink-0 border border-[var(--color-border)] mt-0.5">
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-[var(--color-text)]">
                        {report.testName}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-0.5">
                        {report.date} • {report.department}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                        Ref: {report.doctorName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[var(--color-border)]">
                    {getStatusBadge(report.status)}
                    <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
