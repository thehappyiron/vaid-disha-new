import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Play,
  Check,
  ArrowUp,
  ArrowDown,
  Info,
  MapPin,
  Building2,
  Sliders,
  HelpCircle,
  Coffee,
  X,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import {
  Button,
  PageHeader,
  StatusBadge,
} from '../../components/ui';
import {
  useLiveStore,
  type QueueEntry,
  type DepartmentLiveStatus,
  type EmergencyRequest,
} from '../../services/liveStore';
import {
  sortQueueWithEngine,
  getPatientPriorityExplanation,
  type SmartQueueSettings,
  DEFAULT_SMART_QUEUE_SETTINGS,
} from '../../services/queueEngine';

export function StaffDashboardPage() {
  const navigate = useNavigate();
  const {
    state,
    setDepartmentWaitTime,
    setDepartmentCustomStatus,
    startPatientConsultation,
    completePatientConsultation,
    postponePatient,
    movePatientQueue,
    acknowledgeEmergencyAlert,
    resolveEmergencyAlert,
  } = useLiveStore();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [smartSettings, setSmartSettings] = useState<SmartQueueSettings>(DEFAULT_SMART_QUEUE_SETTINGS);
  const [activeWhyPopover, setActiveWhyPopover] = useState<string | null>(null);
  const [customWaitInput, setCustomWaitInput] = useState<string>('');
  const prevEmergencyCountRef = useRef<number>(0);

  // Play audio chime for new emergency alerts if sound is enabled
  useEffect(() => {
    const activeAlertsCount = state.emergencyRequests?.filter((e) => e.status === 'alerted').length || 0;
    if (activeAlertsCount > prevEmergencyCountRef.current && soundEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch {
        // AudioContext not allowed or not supported
      }
    }
    prevEmergencyCountRef.current = activeAlertsCount;
  }, [state.emergencyRequests, soundEnabled]);

  // Department list
  const departments = Object.values(state.departments);
  const activeDept: DepartmentLiveStatus | undefined =
    selectedDeptId === 'all' ? departments[0] : state.departments[selectedDeptId];

  // Filter and sort queue
  const rawQueue = state.queue.filter(
    (q) => selectedDeptId === 'all' || q.departmentId === selectedDeptId
  );
  const queueEntries = sortQueueWithEngine(rawQueue, smartSettings);

  // Summary counts
  const totalWaiting = state.queue.filter((q) => q.status === 'waiting' || q.status === 'turn_soon').length;
  const totalInProgress = state.queue.filter((q) => q.status === 'in_progress').length;
  const totalCompleted = state.queue.filter((q) => q.status === 'completed').length;
  const activeEmergencies = (state.emergencyRequests || []).filter((e) => e.status !== 'resolved');

  // Format time ago
  const formatTimeAgo = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff === 1) return '1 min ago';
    if (diff < 60) return `${diff} mins ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  // Helper to format patient name showing (Guest) ONCE, never duplicated
  const renderPatientName = (patient: QueueEntry) => {
    const rawName = patient.patientName || 'Patient';
    const isGuest = patient.isGuest || rawName.includes('(Guest)');
    const cleanName = rawName.replace(/\s*\(Guest\)\s*/gi, '').trim();

    return (
      <span className="font-bold text-[var(--color-text)] break-words">
        {cleanName}
        {isGuest && (
          <span className="font-extrabold text-amber-700 dark:text-amber-400 ml-1.5 text-xs">
            (Guest)
          </span>
        )}
      </span>
    );
  };

  return (
    <BaseLayout showHome={true} headerTitle="Staff Queue Management" isStaff={true}>
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-5 sm:gap-6">
        {/* ── 1. PAGE TITLE & HEADER (Exact title on full row layout) ───────── */}
        <PageHeader
          title="Clinical Queue & Duty Desk"
          subtitle="Real-time patient intake, smart priority dispatch & room status"
          showBack={true}
          onBack={() => navigate('/')}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Building2 size={16} />}
                onClick={() => navigate('/staff/patients')}
                className="whitespace-normal break-words font-bold"
              >
                Patient Records
              </Button>
            </div>
          }
        />

        {/* ── 2. SUMMARY METRICS ROW (Waiting, In Progress, Completed, Emergencies) ── */}
        <section aria-label="Queue Summary Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center shrink-0">
              <Clock size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                Waiting
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
                {totalWaiting}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center shrink-0">
              <UserCheck size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                In Progress
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
                {totalInProgress}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                Completed Today
              </span>
              <span className="text-2xl sm:text-3xl font-black text-[var(--color-text)]">
                {totalCompleted}
              </span>
            </div>
          </div>

          <div
            className={`p-4 rounded-2xl border-2 shadow-xs flex items-center gap-3.5 transition-colors ${
              activeEmergencies.length > 0
                ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-900 dark:text-red-200 animate-pulse'
                : 'bg-[var(--color-surface)] border-[var(--color-border)]'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                Active Emergencies
              </span>
              <span className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
                {activeEmergencies.length}
              </span>
            </div>
          </div>
        </section>

        {/* ── 3. PINNED EMERGENCY ALERTS PANEL ───────────────────────────────── */}
        {activeEmergencies.length > 0 && (
          <section
            aria-labelledby="emergency-panel-title"
            className="p-4 sm:p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border-3 border-red-500 shadow-md flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={22} className="text-red-600 animate-bounce shrink-0" aria-hidden="true" />
                <h2 id="emergency-panel-title" className="text-base sm:text-lg font-black text-red-950 dark:text-red-100">
                  CRITICAL PATIENT ALERTS ({activeEmergencies.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="btn btn-sm btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-800 text-xs font-bold text-red-900 dark:text-red-200"
                aria-label={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Sound: {soundEnabled ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {activeEmergencies.map((emg: EmergencyRequest) => {
                const isResponding = emg.status === 'responding';

                return (
                  <div
                    key={emg.id}
                    className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm px-2 py-0.5 rounded-md bg-red-100 text-red-900">
                          {emg.patientToken || 'EMG'}
                        </span>
                        <span className="font-black text-base text-[var(--color-text)]">
                          {emg.patientName || 'Patient in Distress'}
                        </span>
                        <span className="text-xs font-bold text-red-700 dark:text-red-400 ml-auto sm:ml-0 font-mono">
                          • {formatTimeAgo(emg.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text)] font-semibold flex-wrap">
                        <span className="inline-flex items-center gap-1 text-[var(--color-primary-600)] font-bold">
                          <MapPin size={15} />
                          {emg.landmark}
                        </span>
                        {emg.symptoms?.length > 0 && (
                          <span className="text-red-600 dark:text-red-400 font-bold">
                            [{emg.symptoms.join(', ')}]
                          </span>
                        )}
                      </div>

                      {emg.note && (
                        <p className="text-xs text-[var(--color-text-muted)] italic">
                          "{emg.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isResponding ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => acknowledgeEmergencyAlert(emg.id)}
                          className="font-bold border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 whitespace-normal break-words"
                        >
                          Acknowledge
                        </Button>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900">
                          Attending Now
                        </span>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => resolveEmergencyAlert(emg.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-normal break-words"
                      >
                        Mark Attended
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 4. DEPARTMENT FILTER & STATUS CONTROLS ──────────────────────────── */}
        <section
          aria-labelledby="dept-controls-title"
          className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xs flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3.5">
            <div>
              <h2 id="dept-controls-title" className="text-lg font-black text-[var(--color-text)]">
                Department Wait Times & Status
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                Changes persist to live store and sync instantly to open patient tabs
              </p>
            </div>

            {/* Department selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedDeptId('all')}
                className={[
                  'btn btn-sm px-3 py-1.5 rounded-xl text-xs font-bold whitespace-normal break-words transition-all shrink-0',
                  selectedDeptId === 'all'
                    ? 'btn-primary shadow-xs'
                    : 'btn-ghost border border-[var(--color-border)] text-[var(--color-text)]',
                ].join(' ')}
              >
                All Departments
              </button>
              {departments.map((dept) => (
                <button
                  key={dept.departmentId}
                  type="button"
                  onClick={() => setSelectedDeptId(dept.departmentId)}
                  className={[
                    'btn btn-sm px-3 py-1.5 rounded-xl text-xs font-bold whitespace-normal break-words transition-all shrink-0',
                    selectedDeptId === dept.departmentId
                      ? 'btn-primary shadow-xs'
                      : 'btn-ghost border border-[var(--color-border)] text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {dept.departmentName}
                </button>
              ))}
            </div>
          </div>

          {/* Active department controls (when a specific dept or first is selected) */}
          {activeDept && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wait Time Inline Adjuster */}
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Estimated Wait per Patient: {activeDept.departmentName}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentWaitTime(
                        activeDept.departmentId,
                        Math.max(2, activeDept.estimatedWaitPerPatientMinutes - 5)
                      )
                    }
                    className="btn btn-secondary min-h-12 w-14 rounded-xl font-black text-lg p-0"
                    aria-label="Decrease wait time by 5 minutes"
                  >
                    −5m
                  </button>

                  <div className="flex-1 text-center py-2 px-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
                    <span className="text-2xl font-black text-[var(--color-text)]">
                      {activeDept.estimatedWaitPerPatientMinutes}
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-muted)] ml-1">mins / patient</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentWaitTime(
                        activeDept.departmentId,
                        activeDept.estimatedWaitPerPatientMinutes + 5
                      )
                    }
                    className="btn btn-secondary min-h-12 w-14 rounded-xl font-black text-lg p-0"
                    aria-label="Increase wait time by 5 minutes"
                  >
                    +5m
                  </button>
                </div>

                {/* Custom wait entry */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Custom mins"
                    value={customWaitInput}
                    onChange={(e) => setCustomWaitInput(e.target.value)}
                    className="input input-sm flex-1 text-sm rounded-xl py-2 px-3 border border-[var(--color-border)] bg-[var(--color-surface)]"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const val = parseInt(customWaitInput, 10);
                      if (!isNaN(val) && val > 0) {
                        setDepartmentWaitTime(activeDept.departmentId, val);
                        setCustomWaitInput('');
                      }
                    }}
                    className="font-bold whitespace-normal break-words shrink-0"
                  >
                    Set Time
                  </Button>
                </div>
              </div>

              {/* Status Preset Setters */}
              <div className="p-3.5 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex flex-col gap-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                  Quick Status Setters (Broadcasts live alert)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentCustomStatus(
                        activeDept.departmentId,
                        'Consultations running on schedule',
                        'normal'
                      )
                    }
                    className="btn btn-secondary min-h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 p-2 bg-emerald-50 text-emerald-950 border border-emerald-300 hover:bg-emerald-100"
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>On Schedule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentCustomStatus(
                        activeDept.departmentId,
                        'Lab delayed by 20 min',
                        'delayed',
                        { delayMinutes: 20 }
                      )
                    }
                    className="btn btn-secondary min-h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 p-2 bg-amber-50 text-amber-950 border border-amber-300 hover:bg-amber-100"
                  >
                    <Clock size={16} className="shrink-0" />
                    <span>Lab Delayed (+20m)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentCustomStatus(
                        activeDept.departmentId,
                        'Doctor on break until 3:15 PM',
                        'break',
                        { breakUntil: '3:15 PM' }
                      )
                    }
                    className="btn btn-secondary min-h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 p-2 bg-purple-50 text-purple-950 border border-purple-300 hover:bg-purple-100"
                  >
                    <Coffee size={16} className="shrink-0" />
                    <span>Doctor Break (3:15 PM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentCustomStatus(
                        activeDept.departmentId,
                        'Emergency Cases Prioritized',
                        'emergency'
                      )
                    }
                    className="btn btn-secondary min-h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 p-2 bg-red-50 text-red-950 border border-red-300 hover:bg-red-100"
                  >
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>Emergency Priority</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── 5. SMART QUEUE PANEL (Priority Settings & Toggles) ──────────────── */}
        <section
          aria-labelledby="smart-queue-title"
          className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-xs flex flex-col gap-3"
        >
          <div className="flex items-center gap-2">
            <Sliders size={20} className="text-[var(--color-primary-500)]" aria-hidden="true" />
            <h2 id="smart-queue-title" className="text-base sm:text-lg font-black text-[var(--color-text)]">
              Smart Triage & Priority Rules Engine
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
              <input
                type="checkbox"
                checked={smartSettings.prioritizeEmergency}
                onChange={(e) =>
                  setSmartSettings({ ...smartSettings, prioritizeEmergency: e.target.checked })
                }
                className="w-5 h-5 text-[var(--color-primary-500)] rounded-md cursor-pointer shrink-0"
              />
              <div>
                <span className="font-bold text-sm text-[var(--color-text)] block">
                  Prioritise emergency
                </span>
                <span className="text-xs text-[var(--color-text-muted)] block">
                  Acute symptoms automatically triage to the top
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
              <input
                type="checkbox"
                checked={smartSettings.prioritizeElderlyDisabled}
                onChange={(e) =>
                  setSmartSettings({ ...smartSettings, prioritizeElderlyDisabled: e.target.checked })
                }
                className="w-5 h-5 text-[var(--color-primary-500)] rounded-md cursor-pointer shrink-0"
              />
              <div>
                <span className="font-bold text-sm text-[var(--color-text)] block">
                  Prioritise elderly & disabled
                </span>
                <span className="text-xs text-[var(--color-text-muted)] block">
                  Age 65+ and wheelchair/mobility needs next
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] cursor-pointer">
              <input
                type="checkbox"
                checked={smartSettings.autoRecalculateWaitTimes}
                onChange={(e) =>
                  setSmartSettings({ ...smartSettings, autoRecalculateWaitTimes: e.target.checked })
                }
                className="w-5 h-5 text-[var(--color-primary-500)] rounded-md cursor-pointer shrink-0"
              />
              <div>
                <span className="font-bold text-sm text-[var(--color-text)] block">
                  Auto-recalculate wait times
                </span>
                <span className="text-xs text-[var(--color-text-muted)] block">
                  Dynamically adjust patient countdowns
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* ── 6. QUEUE TABLE & ACTIONS ────────────────────────────────────────── */}
        <section aria-labelledby="queue-table-title" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 id="queue-table-title" className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
                Live Queue Roster ({queueEntries.length})
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
                Select patient actions to update live consultations and notify patients
              </p>
            </div>
          </div>

          {/* ── DESKTOP TABLE (md: and above, max-w-7xl) ─────────────────────── */}
          <div className="hidden md:block w-full overflow-hidden rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)] border-b-2 border-[var(--color-border)] text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th scope="col" className="px-4 py-3.5">Token</th>
                    <th scope="col" className="px-4 py-3.5">Patient Name</th>
                    <th scope="col" className="px-4 py-3.5">Purpose</th>
                    <th scope="col" className="px-4 py-3.5">A11y Needs</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5">Wait Time</th>
                    <th scope="col" className="px-4 py-3.5">Priority Logic</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-sm">
                  {queueEntries.map((patient) => {
                    const isInConsult = patient.status === 'in_progress';
                    const isTurnSoon = patient.status === 'turn_soon';
                    const isCompleted = patient.status === 'completed';
                    const explanation = getPatientPriorityExplanation(patient, smartSettings);

                    return (
                      <tr
                        key={patient.id}
                        className={[
                          'transition-colors hover:bg-[var(--color-surface-2)]/50',
                          patient.isEmergency ? 'bg-red-50/60 dark:bg-red-950/20' : '',
                          isInConsult ? 'bg-blue-50/50 dark:bg-blue-950/20 font-semibold' : '',
                        ].join(' ')}
                      >
                        {/* Token */}
                        <td className="px-4 py-3.5">
                          <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]">
                            {patient.token}
                          </span>
                        </td>

                        {/* Patient Name (single '(Guest)' tag, not duplicated) */}
                        <td className="px-4 py-3.5">
                          {renderPatientName(patient)}
                          {patient.age && (
                            <span className="text-xs text-[var(--color-text-muted)] ml-1">
                              ({patient.age}y)
                            </span>
                          )}
                        </td>

                        {/* Purpose */}
                        <td className="px-4 py-3.5 text-[var(--color-text-muted)] max-w-xs break-words">
                          {patient.purpose || 'General Consultation'}
                        </td>

                        {/* Accessibility Needs */}
                        <td className="px-4 py-3.5">
                          {patient.accessibilityNeeds && patient.accessibilityNeeds.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {patient.accessibilityNeeds.map((need, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300"
                                >
                                  ♿ {need.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-text-muted)] font-mono">—</span>
                          )}
                        </td>

                        {/* Live Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge
                            variant={
                              patient.isEmergency
                                ? 'danger'
                                : isInConsult
                                ? 'success'
                                : isTurnSoon
                                ? 'info'
                                : isCompleted
                                ? 'neutral'
                                : 'warning'
                            }
                            label={
                              patient.isEmergency
                                ? 'Emergency'
                                : isInConsult
                                ? 'In Consultation'
                                : isTurnSoon
                                ? 'Next in Line'
                                : isCompleted
                                ? 'Completed'
                                : 'Waiting'
                            }
                          />
                        </td>

                        {/* Wait Time */}
                        <td className="px-4 py-3.5 font-bold text-[var(--color-text)]">
                          {isInConsult || isCompleted ? (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">—</span>
                          ) : (
                            `${patient.estimatedWaitMinutes} min`
                          )}
                        </td>

                        {/* Priority Explanation ("Why is this patient here?") */}
                        <td className="px-4 py-3.5">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveWhyPopover(activeWhyPopover === patient.id ? null : patient.id)
                              }
                              className={[
                                'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer',
                                explanation.level === 'emergency'
                                  ? 'bg-red-100 text-red-900 border-red-300'
                                  : explanation.level === 'priority'
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border)]',
                              ].join(' ')}
                              aria-label={`Why is patient ${patient.token} in this position?`}
                            >
                              <HelpCircle size={13} />
                              <span>{explanation.badge}</span>
                            </button>

                            {/* Tooltip / Popover */}
                            {activeWhyPopover === patient.id && (
                              <div className="absolute left-0 top-full mt-1.5 z-30 w-64 p-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-xl text-xs text-[var(--color-text)] animate-in fade-in zoom-in-95 duration-150">
                                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--color-border)]">
                                  <span className="font-black text-[var(--color-primary-600)]">
                                    Priority Breakdown
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveWhyPopover(null)}
                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <p className="leading-snug">{explanation.reason}</p>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Row Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isInConsult ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={<Check size={14} />}
                                onClick={() => completePatientConsultation(patient.token)}
                                className="font-bold bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 whitespace-normal break-words"
                              >
                                Mark Completed
                              </Button>
                            ) : !isCompleted ? (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={<Play size={13} />}
                                  onClick={() => startPatientConsultation(patient.token)}
                                  className="font-bold whitespace-normal break-words"
                                >
                                  Start
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => postponePatient(patient.token)}
                                  className="border border-[var(--color-border)] font-bold whitespace-normal break-words"
                                  title="Postpone patient"
                                >
                                  Postpone
                                </Button>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => movePatientQueue(patient.token, 'up')}
                                    className="p-1 rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text)]"
                                    aria-label="Move patient up in queue"
                                  >
                                    <ArrowUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => movePatientQueue(patient.token, 'down')}
                                    className="p-1 rounded bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text)]"
                                    aria-label="Move patient down in queue"
                                  >
                                    <ArrowDown size={12} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">Archived</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── MOBILE STACKED CARDS (under md) ──────────────────────────────── */}
          <div className="flex md:hidden flex-col gap-3">
            {queueEntries.map((patient) => {
              const isInConsult = patient.status === 'in_progress';
              const isTurnSoon = patient.status === 'turn_soon';
              const isCompleted = patient.status === 'completed';
              const explanation = getPatientPriorityExplanation(patient, smartSettings);

              return (
                <div
                  key={patient.id}
                  className={[
                    'p-4 rounded-2xl border-2 bg-[var(--color-surface)] shadow-xs flex flex-col gap-3',
                    patient.isEmergency ? 'border-red-400 bg-red-50/40' : 'border-[var(--color-border)]',
                    isInConsult ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]/30' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)]">
                      {patient.token}
                    </span>
                    <StatusBadge
                      variant={
                        patient.isEmergency
                          ? 'danger'
                          : isInConsult
                          ? 'success'
                          : isTurnSoon
                          ? 'info'
                          : isCompleted
                          ? 'neutral'
                          : 'warning'
                      }
                      label={
                        patient.isEmergency
                          ? 'Emergency'
                          : isInConsult
                          ? 'In Consultation'
                          : isTurnSoon
                          ? 'Next in Line'
                          : isCompleted
                          ? 'Completed'
                          : 'Waiting'
                      }
                    />
                  </div>

                  <div>
                    {renderPatientName(patient)}
                    <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                      {patient.purpose || 'General Consultation'} • {isInConsult ? 'Attending now' : `Wait: ${patient.estimatedWaitMinutes} min`}
                    </p>
                  </div>

                  {/* Accessibility badge */}
                  {patient.accessibilityNeeds && patient.accessibilityNeeds.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {patient.accessibilityNeeds.map((need, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300"
                        >
                          ♿ {need.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Plain language priority explanation */}
                  <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)] text-xs text-[var(--color-text)] leading-snug flex items-start gap-1.5">
                    <Info size={15} className="shrink-0 text-[var(--color-primary-500)] mt-0.5" />
                    <span>
                      <strong>{explanation.badge}:</strong> {explanation.reason}
                    </span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-[var(--color-border)] flex-wrap">
                    {isInConsult ? (
                      <Button
                        variant="secondary"
                        fullWidth
                        icon={<Check size={16} />}
                        onClick={() => completePatientConsultation(patient.token)}
                        className="font-bold min-h-12 bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 whitespace-normal break-words"
                      >
                        Mark Consultation Complete
                      </Button>
                    ) : !isCompleted ? (
                      <>
                        <Button
                          variant="primary"
                          icon={<Play size={15} />}
                          onClick={() => startPatientConsultation(patient.token)}
                          className="flex-1 font-bold min-h-12 whitespace-normal break-words"
                        >
                          Start
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => postponePatient(patient.token)}
                          className="font-bold min-h-12 border border-[var(--color-border)] whitespace-normal break-words px-3"
                        >
                          Postpone
                        </Button>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePatientQueue(patient.token, 'up')}
                            className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                            aria-label="Move up"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePatientQueue(patient.token, 'down')}
                            className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                            aria-label="Move down"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </BaseLayout>
  );
}
