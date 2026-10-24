import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  Radio,
  RotateCcw,
  BellRing,
  UserCheck,
  Coffee,
  AlertTriangle,
  TriangleAlert,
  Plus,
  Building2,
  Stethoscope,
  Trash2,
  Sparkles,
  Users,
} from 'lucide-react';
import { BaseLayout } from '../../components/layout';
import { Button, StatusBadge } from '../../components/ui';
import {
  useLiveStore,
  ensurePatientInQueue,
  type DepartmentStatusCode,
  type QueueStatus,
} from '../../services/liveStore';

export function DevStorePage() {
  const navigate = useNavigate();
  const {
    state,
    setDepartmentWaitTime,
    setDepartmentCustomStatus,
    callNextPatient,
    updateQueueEntryStatus,
    publishLiveAlert,
    dismissLiveAlert,
    resetLiveStore,
  } = useLiveStore();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('opd-cardio');
  const [customWaitMinutes, setCustomWaitMinutes] = useState<number>(15);
  const [customStatusMsg, setCustomStatusMsg] = useState<string>('');
  const [customStatusCode, setCustomStatusCode] = useState<DepartmentStatusCode>('normal');
  const [newPatientName, setNewPatientName] = useState<string>('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const currentDept = state.departments[selectedDeptId] || {
    departmentId: selectedDeptId,
    departmentName: selectedDeptId,
    roomNumber: '101',
    floor: 0,
    building: 'Main Block',
    activeDoctorName: 'Doctor on Duty',
    currentToken: null,
    statusMessage: 'Operational',
    statusCode: 'normal' as DepartmentStatusCode,
    estimatedWaitPerPatientMinutes: 10,
    lastUpdated: new Date().toISOString(),
  };

  const deptQueue = state.queue.filter((q) => q.departmentId === selectedDeptId);

  // Quick preset actions
  const handleApplyPresetStatus = async (
    msg: string,
    code: DepartmentStatusCode,
    opts?: { breakUntil?: string; delayMinutes?: number }
  ) => {
    await setDepartmentCustomStatus(selectedDeptId, msg, code, opts);
    showToast(`Status updated: "${msg}" [${code}]`);
  };

  const handleAdjustWait = async (delta: number) => {
    const newWait = Math.max(0, currentDept.estimatedWaitPerPatientMinutes + delta);
    await setDepartmentWaitTime(selectedDeptId, newWait);
    showToast(`Wait time adjusted to ${newWait} min per patient`);
  };

  const handleSetExactWait = async (mins: number) => {
    await setDepartmentWaitTime(selectedDeptId, mins);
    showToast(`Wait time set to ${mins} min per patient`);
  };

  const handleCallNext = async () => {
    const res = await callNextPatient(selectedDeptId);
    if (res.nextToken) {
      showToast(`Called token ${res.nextToken} for ${currentDept.departmentName}`);
    } else {
      showToast(`No more waiting patients in ${currentDept.departmentName}`);
    }
  };

  const handleSetPatientStatus = async (token: string, status: QueueStatus) => {
    await updateQueueEntryStatus(token, status);
    showToast(`Set token ${token} to ${status}`);
  };

  const handleAddNewPatient = async () => {
    const name = newPatientName.trim() || `Walk-in Patient #${Math.floor(100 + Math.random() * 900)}`;
    const prefix = selectedDeptId === 'opd-cardio' ? 'CARD' : selectedDeptId === 'lab-blood' ? 'LAB' : 'OPD';
    const token = `${prefix}-${Math.floor(1050 + Math.random() * 50)}`;

    await ensurePatientInQueue({
      token,
      patientName: name,
      departmentId: selectedDeptId,
      roomNumber: currentDept.roomNumber,
    });

    setNewPatientName('');
    showToast(`Added ${token} (${name}) to queue`);
  };

  const handleBroadcastAlert = async (type: 'emergency' | 'delay' | 'announcement') => {
    if (type === 'emergency') {
      await publishLiveAlert({
        type: 'emergency',
        title: 'Emergency Trauma Code Blue',
        message: 'Critical emergency incoming. Priority triage enabled for ER Bay 1.',
        departmentId: selectedDeptId,
        active: true,
      });
      showToast('Emergency alert broadcasted!');
    } else if (type === 'delay') {
      await publishLiveAlert({
        type: 'delay',
        title: 'Department Operational Delay Notice',
        message: 'Consultation schedule running with extended wait times due to complex cases.',
        departmentId: selectedDeptId,
        active: true,
      });
      showToast('Delay notice broadcasted!');
    } else {
      await publishLiveAlert({
        type: 'announcement',
        title: 'Hospital OPD Announcement',
        message: 'Please keep your OPD slip and ID handy at the counter.',
        active: true,
      });
      showToast('General announcement broadcasted!');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all queues and department live statuses back to default mock data?')) {
      await resetLiveStore();
      showToast('Live store reset to default data');
    }
  };

  return (
    <BaseLayout showHome={true} headerTitle="Dev Store Testbench">
      <div className="page-container gap-5 max-w-4xl">
        {/* Toast */}
        {feedbackToast && (
          <div
            role="status"
            className="fixed top-20 right-4 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-xl font-bold text-sm animate-bounce flex items-center gap-2"
          >
            <Sparkles size={18} />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Instructions Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[var(--color-primary-50)] border-2 border-[var(--color-primary-300)] flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--color-primary-800)] flex items-center gap-1.5">
              <Radio size={16} className="text-red-500 animate-pulse" />
              Multi-Tab Live Testing Playground
            </span>
            <div className="flex items-center gap-2">
              <Link
                to="/patient/slip"
                target="_blank"
                className="btn btn-sm btn-secondary text-xs font-bold bg-white"
              >
                Open /patient/slip in Tab 2 ↗
              </Link>
              <Link
                to="/patient/live"
                target="_blank"
                className="btn btn-sm btn-primary text-xs font-bold"
              >
                Open /patient/live in Tab 2 ↗
              </Link>
            </div>
          </div>
          <p className="text-sm font-semibold text-[var(--color-primary-950)] leading-relaxed">
            <strong>How to test real-time sync:</strong> Keep this tab open on <code>/dev/store</code>.
            Open <code>/patient/slip</code> or <code>/patient/live</code> in another browser tab.
            Click any button below to adjust wait times, call the next patient, or change doctor statuses.
            Watch the other tab update instantly via <strong>BroadcastChannel</strong> without page reload!
          </p>
        </div>

        {/* Department Switcher Tabs */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">
            Select Active Department to Control
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Object.keys(state.departments).map((deptId) => {
              const d = state.departments[deptId];
              const isSelected = deptId === selectedDeptId;
              return (
                <button
                  key={deptId}
                  type="button"
                  onClick={() => setSelectedDeptId(deptId)}
                  className={[
                    'btn btn-sm px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                    isSelected
                      ? 'btn-primary shadow-sm'
                      : 'btn-secondary bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {d.departmentName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Department State Card */}
        <div className="card p-5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Building2 size={20} className="text-[var(--color-primary-600)]" />
              <h2 className="text-lg font-black text-[var(--color-text)]">
                {currentDept.departmentName} (Room {currentDept.roomNumber})
              </h2>
            </div>
            <StatusBadge
              variant={
                currentDept.statusCode === 'emergency'
                  ? 'danger'
                  : currentDept.statusCode === 'busy'
                    ? 'warning'
                    : currentDept.statusCode === 'break'
                      ? 'warning'
                      : currentDept.statusCode === 'delayed'
                        ? 'warning'
                        : 'success'
              }
              label={currentDept.statusCode.toUpperCase()}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
              <span className="font-bold text-[var(--color-text-muted)] block">Now Serving Token</span>
              <span className="font-mono font-black text-base text-[var(--color-primary-600)]">
                {currentDept.currentToken || 'None'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
              <span className="font-bold text-[var(--color-text-muted)] block">Wait Per Patient</span>
              <span className="font-black text-base text-[var(--color-text)]">
                ~{currentDept.estimatedWaitPerPatientMinutes} min
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
              <span className="font-bold text-[var(--color-text-muted)] block">Doctor on Duty</span>
              <span className="font-extrabold text-sm text-[var(--color-text)] truncate block">
                {currentDept.activeDoctorName}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[var(--color-surface-2)]">
              <span className="font-bold text-[var(--color-text-muted)] block">Queue Length</span>
              <span className="font-black text-base text-[var(--color-text)]">
                {deptQueue.filter((q) => q.status === 'waiting' || q.status === 'turn_soon').length} waiting
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-xs font-semibold">
            <span className="text-[var(--color-text-muted)] font-bold">Current Broadcast Message: </span>
            <span className="text-[var(--color-text)] font-extrabold">"{currentDept.statusMessage}"</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CONTROLS SECTION 1: WAIT TIME ADJUSTMENT
            ══════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-primary-700)]">
            <Clock size={16} />
            Wait Time Controls (Adjusts Estimated Wait Times Live)
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleAdjustWait(-5)}>
              -5 min
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAdjustWait(5)}>
              +5 min
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAdjustWait(15)}>
              +15 min (Delay)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleSetExactWait(0)}>
              Set 0 min (Immediate)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleSetExactWait(10)}>
              Set 10 min
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleSetExactWait(25)}>
              Set 25 min
            </Button>
          </div>

          {/* Custom wait input */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="number"
              min={0}
              max={120}
              value={customWaitMinutes}
              onChange={(e) => setCustomWaitMinutes(Number(e.target.value))}
              className="input input-sm w-28 font-mono font-bold"
              placeholder="Minutes"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSetExactWait(customWaitMinutes)}
            >
              Apply Exact Wait
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CONTROLS SECTION 2: DEPARTMENT STATUS PRESETS
            ══════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-primary-700)]">
            <Stethoscope size={16} />
            Department Status Presets
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Busy: Doctor with another patient */}
            <button
              type="button"
              onClick={() => handleApplyPresetStatus('Doctor with another patient', 'busy')}
              className="p-3 rounded-xl border border-indigo-300 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 font-bold text-xs flex items-center gap-2.5 text-left transition-colors"
            >
              <Stethoscope size={18} className="text-indigo-700 shrink-0" />
              <div>
                <span className="block font-black">"Doctor with another patient"</span>
                <span className="text-[11px] opacity-80">Sets status code to Busy</span>
              </div>
            </button>

            {/* Break: Doctor on break */}
            <button
              type="button"
              onClick={() =>
                handleApplyPresetStatus('Doctor on break until 3:15 PM', 'break', {
                  breakUntil: '3:15 PM',
                })
              }
              className="p-3 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold text-xs flex items-center gap-2.5 text-left transition-colors"
            >
              <Coffee size={18} className="text-amber-700 shrink-0" />
              <div>
                <span className="block font-black">"Doctor on break until 3:15 PM"</span>
                <span className="text-[11px] opacity-80">Sets status code to Break</span>
              </div>
            </button>

            {/* Delayed: Lab delayed */}
            <button
              type="button"
              onClick={() =>
                handleApplyPresetStatus('Lab delayed by 20 min', 'delayed', {
                  delayMinutes: 20,
                })
              }
              className="p-3 rounded-xl border border-orange-300 bg-orange-50/80 hover:bg-orange-100 text-orange-950 font-bold text-xs flex items-center gap-2.5 text-left transition-colors"
            >
              <AlertTriangle size={18} className="text-orange-700 shrink-0" />
              <div>
                <span className="block font-black">"Lab delayed by 20 min"</span>
                <span className="text-[11px] opacity-80">Sets status code to Delayed (+20m wait)</span>
              </div>
            </button>

            {/* Normal: Consultations running on time */}
            <button
              type="button"
              onClick={() => handleApplyPresetStatus('Consultations running on time', 'normal')}
              className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-950 font-bold text-xs flex items-center gap-2.5 text-left transition-colors"
            >
              <UserCheck size={18} className="text-emerald-700 shrink-0" />
              <div>
                <span className="block font-black">"Consultations running on time"</span>
                <span className="text-[11px] opacity-80">Sets status code to Normal</span>
              </div>
            </button>
          </div>

          {/* Custom status message input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[var(--color-border)]">
            <input
              type="text"
              value={customStatusMsg}
              onChange={(e) => setCustomStatusMsg(e.target.value)}
              placeholder="Custom status message..."
              className="input input-sm flex-1 font-semibold text-xs"
            />
            <select
              value={customStatusCode}
              onChange={(e) => setCustomStatusCode(e.target.value as DepartmentStatusCode)}
              className="input input-sm text-xs font-bold"
            >
              <option value="normal">Normal</option>
              <option value="busy">Busy</option>
              <option value="break">Break</option>
              <option value="delayed">Delayed</option>
              <option value="emergency">Emergency</option>
            </select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (customStatusMsg.trim()) {
                  handleApplyPresetStatus(customStatusMsg, customStatusCode);
                }
              }}
            >
              Apply Status
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CONTROLS SECTION 3: QUEUE PROGRESSION & PATIENT TOKEN TRIGGER
            ══════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-primary-700)]">
              <Users size={16} />
              Queue Progression & Patient Triggers
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<BellRing size={16} />}
              onClick={handleCallNext}
            >
              📢 Call Next Patient
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {/* Quick 1-click trigger to make CARD-1042 In Consultation */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSetPatientStatus('CARD-1042', 'in_progress')}
              className="bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
            >
              🎯 Set CARD-1042 to "Attending Now"
            </Button>

            {/* Quick 1-click trigger to make CARD-1042 Turn Soon */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSetPatientStatus('CARD-1042', 'turn_soon')}
              className="bg-blue-50 border-blue-300 text-blue-950 font-bold"
            >
              🔔 Set CARD-1042 to "Turn Soon"
            </Button>

            {/* Quick 1-click trigger to make CARD-1042 Waiting */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSetPatientStatus('CARD-1042', 'waiting')}
            >
              ⏳ Set CARD-1042 to "Waiting"
            </Button>
          </div>

          {/* Current tokens in this department */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Active Tokens in Queue:</span>
            <div className="flex flex-wrap gap-2">
              {deptQueue.map((entry) => (
                <div
                  key={entry.id}
                  className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs flex items-center gap-2"
                >
                  <span className="font-mono font-black">{entry.token}</span>
                  <span className="font-semibold text-[var(--color-text-muted)]">({entry.patientName})</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white">
                    {entry.status}
                  </span>
                  <button
                    type="button"
                    title="Advance to In Consultation"
                    onClick={() => handleSetPatientStatus(entry.token, 'in_progress')}
                    className="text-emerald-600 hover:text-emerald-800 font-bold ml-1"
                  >
                    ▶ Call
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add walk-in patient */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={newPatientName}
              onChange={(e) => setNewPatientName(e.target.value)}
              placeholder="Add patient name..."
              className="input input-sm flex-1 font-semibold text-xs"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={handleAddNewPatient}
            >
              Add to Queue
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            CONTROLS SECTION 4: BROADCAST HOSPITAL ALERTS
            ══════════════════════════════════════════════════════════════════ */}
        <div className="card p-5 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-primary-700)]">
            <TriangleAlert size={16} />
            Emergency & Hospital Announcements
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-red-50 border-red-300 text-red-950 font-bold"
              onClick={() => handleBroadcastAlert('emergency')}
            >
              🚨 Broadcast Emergency Code
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="bg-amber-50 border-amber-300 text-amber-950 font-bold"
              onClick={() => handleBroadcastAlert('delay')}
            >
              ⚠️ Broadcast Delay Alert
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBroadcastAlert('announcement')}
            >
              📢 Broadcast Announcement
            </Button>
          </div>

          {/* Active alerts list */}
          {state.alerts.filter((a) => a.active).length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
              <span className="text-xs font-bold text-[var(--color-text-muted)]">Active Broadcasts:</span>
              {state.alerts
                .filter((a) => a.active)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-black mr-2">[{alert.type.toUpperCase()}]</span>
                      <span className="font-bold">{alert.title}:</span> {alert.message}
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissLiveAlert(alert.id)}
                      className="text-amber-800 hover:text-red-700 font-bold p-1"
                      title="Dismiss alert"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            GLOBAL CONTROLS
            ══════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3 pt-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={handleReset}
            className="text-red-600 hover:bg-red-50"
          >
            Reset Store to Default Mock Data
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/patient/live')}
            >
              Go to /patient/live →
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/patient/slip')}
            >
              Go to /patient/slip →
            </Button>
          </div>
        </div>
      </div>
    </BaseLayout>
  );
}
