import { useState, useEffect, useCallback } from 'react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type QueueStatus = 'waiting' | 'turn_soon' | 'in_progress' | 'completed' | 'cancelled';

export type DepartmentStatusCode =
  | 'normal'     // On time / operating normally
  | 'busy'       // Doctor with another patient
  | 'break'      // Doctor on break until __
  | 'delayed'    // Lab or department delayed by __ min
  | 'emergency'; // Emergency case priority

export interface QueueEntry {
  id: string;
  token: string;
  patientName: string;
  departmentId: string;
  roomNumber?: string;
  status: QueueStatus;
  position: number;              // Position among waiting patients (0 if in_progress or completed)
  estimatedWaitMinutes: number;  // Specific estimated wait for this patient
  calledAt?: string;
  createdAt: string;
}

export interface DepartmentLiveStatus {
  departmentId: string;
  departmentName: string;
  roomNumber: string;
  floor: number;
  building: string;
  activeDoctorName: string;
  currentToken: string | null;     // e.g. "CARD-1041"
  statusMessage: string;          // e.g. "Doctor with another patient", "Doctor on break until 3:15 PM"
  statusCode: DepartmentStatusCode;
  breakUntil?: string;            // e.g. "3:15 PM"
  delayMinutes?: number;          // e.g. 20
  estimatedWaitPerPatientMinutes: number; // e.g. 10
  lastUpdated: string;
}

export interface LiveAlert {
  id: string;
  type: 'emergency' | 'delay' | 'announcement' | 'info';
  title: string;
  message: string;
  departmentId?: string;
  active: boolean;
  timestamp: string;
}

export interface LiveStoreState {
  queue: QueueEntry[];
  departments: Record<string, DepartmentLiveStatus>;
  alerts: LiveAlert[];
  lastUpdated: string;
}

// ─── INITIAL MOCK DATA ───────────────────────────────────────────────────────

const INITIAL_DEPARTMENTS: Record<string, DepartmentLiveStatus> = {
  'opd-cardio': {
    departmentId: 'opd-cardio',
    departmentName: 'Cardiology OPD',
    roomNumber: '204',
    floor: 2,
    building: 'Super Speciality Block',
    activeDoctorName: 'Dr. S. Sharma',
    currentToken: 'CARD-1041',
    statusMessage: 'Doctor with another patient',
    statusCode: 'busy',
    estimatedWaitPerPatientMinutes: 10,
    lastUpdated: new Date().toISOString(),
  },
  'opd-general': {
    departmentId: 'opd-general',
    departmentName: 'General OPD',
    roomNumber: '101',
    floor: 0,
    building: 'Main OPD Block',
    activeDoctorName: 'Dr. Ananya Iyer',
    currentToken: 'OPD-102',
    statusMessage: 'Doctor on break until 3:15 PM',
    statusCode: 'break',
    breakUntil: '3:15 PM',
    estimatedWaitPerPatientMinutes: 12,
    lastUpdated: new Date().toISOString(),
  },
  'lab-blood': {
    departmentId: 'lab-blood',
    departmentName: 'Blood Test Laboratory',
    roomNumber: 'Basement Lab 1',
    floor: -1,
    building: 'Diagnostics Wing',
    activeDoctorName: 'Dr. V. Rao',
    currentToken: 'LAB-48',
    statusMessage: 'Lab delayed by 20 min',
    statusCode: 'delayed',
    delayMinutes: 20,
    estimatedWaitPerPatientMinutes: 8,
    lastUpdated: new Date().toISOString(),
  },
  'opd-ortho': {
    departmentId: 'opd-ortho',
    departmentName: 'Orthopedics OPD',
    roomNumber: '108',
    floor: 1,
    building: 'Main OPD Block',
    activeDoctorName: 'Dr. R. Gupta',
    currentToken: 'ORT-205',
    statusMessage: 'Consultations running on time',
    statusCode: 'normal',
    estimatedWaitPerPatientMinutes: 10,
    lastUpdated: new Date().toISOString(),
  },
  'emergency': {
    departmentId: 'emergency',
    departmentName: 'Emergency & Casualty',
    roomNumber: 'ER Bay 1',
    floor: 0,
    building: 'Emergency Trauma Block',
    activeDoctorName: 'Dr. K. Saxena',
    currentToken: 'EMG-08',
    statusMessage: 'Emergency Triage Active — Immediate Care',
    statusCode: 'emergency',
    estimatedWaitPerPatientMinutes: 0,
    lastUpdated: new Date().toISOString(),
  },
  'pharmacy': {
    departmentId: 'pharmacy',
    departmentName: 'Hospital Pharmacy',
    roomNumber: 'Counter 3',
    floor: 0,
    building: 'Main OPD Block',
    activeDoctorName: 'Chief Pharmacist',
    currentToken: 'PHR-55',
    statusMessage: 'Dispensing medicines normally',
    statusCode: 'normal',
    estimatedWaitPerPatientMinutes: 5,
    lastUpdated: new Date().toISOString(),
  },
  'opd-eye': {
    departmentId: 'opd-eye',
    departmentName: 'Eye / Ophthalmology OPD',
    roomNumber: '210',
    floor: 2,
    building: 'Main OPD Block',
    activeDoctorName: 'Dr. M. Chawla',
    currentToken: 'EYE-33',
    statusMessage: 'Doctor with another patient',
    statusCode: 'busy',
    estimatedWaitPerPatientMinutes: 15,
    lastUpdated: new Date().toISOString(),
  },
  'opd-pediatrics': {
    departmentId: 'opd-pediatrics',
    departmentName: 'Pediatrics OPD',
    roomNumber: '105',
    floor: 1,
    building: 'Mother & Child Care Wing',
    activeDoctorName: 'Dr. S. Kulkarni',
    currentToken: 'PED-19',
    statusMessage: 'Vaccination batch in progress',
    statusCode: 'normal',
    estimatedWaitPerPatientMinutes: 10,
    lastUpdated: new Date().toISOString(),
  },
  'lab-radiology': {
    departmentId: 'lab-radiology',
    departmentName: 'Radiology / X-Ray',
    roomNumber: 'Room 012',
    floor: 0,
    building: 'Diagnostics Wing',
    activeDoctorName: 'Dr. N. Roy',
    currentToken: 'SCAN-72',
    statusMessage: 'Digital X-Ray running on schedule',
    statusCode: 'normal',
    estimatedWaitPerPatientMinutes: 12,
    lastUpdated: new Date().toISOString(),
  },
};

const INITIAL_QUEUE: QueueEntry[] = [
  // Cardiology OPD Queue
  {
    id: 'q-card-1',
    token: 'CARD-1041',
    patientName: 'Sunita Mehra',
    departmentId: 'opd-cardio',
    roomNumber: '204',
    status: 'in_progress',
    position: 0,
    estimatedWaitMinutes: 0,
    calledAt: new Date(Date.now() - 5 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'q-card-2',
    token: 'CARD-1042',
    patientName: 'Ramesh Sharma',
    departmentId: 'opd-cardio',
    roomNumber: '204',
    status: 'turn_soon',
    position: 1,
    estimatedWaitMinutes: 10,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'q-card-3',
    token: 'CARD-1043',
    patientName: 'Priya Joshi',
    departmentId: 'opd-cardio',
    roomNumber: '204',
    status: 'waiting',
    position: 2,
    estimatedWaitMinutes: 20,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: 'q-card-4',
    token: 'CARD-1044',
    patientName: 'Amit Verma',
    departmentId: 'opd-cardio',
    roomNumber: '204',
    status: 'waiting',
    position: 3,
    estimatedWaitMinutes: 30,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },

  // General OPD Queue
  {
    id: 'q-opd-1',
    token: 'OPD-101',
    patientName: 'Geeta Devi',
    departmentId: 'opd-general',
    roomNumber: '101',
    status: 'completed',
    position: 0,
    estimatedWaitMinutes: 0,
    calledAt: new Date(Date.now() - 25 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
  },
  {
    id: 'q-opd-2',
    token: 'OPD-102',
    patientName: 'Suresh Patel',
    departmentId: 'opd-general',
    roomNumber: '101',
    status: 'in_progress',
    position: 0,
    estimatedWaitMinutes: 0,
    calledAt: new Date(Date.now() - 10 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'q-opd-3',
    token: 'OPD-103',
    patientName: 'Kavita Joshi',
    departmentId: 'opd-general',
    roomNumber: '101',
    status: 'waiting',
    position: 1,
    estimatedWaitMinutes: 25,
    createdAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },

  // Blood Lab Queue
  {
    id: 'q-lab-1',
    token: 'LAB-48',
    patientName: 'Mohd. Salim',
    departmentId: 'lab-blood',
    roomNumber: 'Basement Lab 1',
    status: 'in_progress',
    position: 0,
    estimatedWaitMinutes: 0,
    calledAt: new Date(Date.now() - 4 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'q-lab-2',
    token: 'LAB-49',
    patientName: 'Anil Deshmukh',
    departmentId: 'lab-blood',
    roomNumber: 'Basement Lab 1',
    status: 'waiting',
    position: 1,
    estimatedWaitMinutes: 28, // 8 min wait + 20 min lab delay
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
];

const INITIAL_ALERTS: LiveAlert[] = [
  {
    id: 'alert-initial-1',
    type: 'info',
    title: 'Real-Time Hospital Queue Connected',
    message: 'Live status and wait times sync automatically between department counters and patient slips.',
    active: true,
    timestamp: new Date().toISOString(),
  },
];

// ─── STORAGE & BROADCAST SYNC CORE ──────────────────────────────────────────

const STORAGE_KEY = 'vd_live_store_v1';
const BROADCAST_CHANNEL_NAME = 'vd_live_store_sync_channel';

type Subscriber = (state: LiveStoreState) => void;
const subscribers = new Set<Subscriber>();

let broadcastChannel: BroadcastChannel | null = null;

// Initialize BroadcastChannel safely in browser
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'LIVE_STORE_SYNC' && event.data.payload) {
        memoryState = event.data.payload;
        notifySubscribers();
      }
    };
  } catch (err) {
    console.warn('Could not initialize BroadcastChannel for live store sync', err);
  }
}

// Fallback storage event listener for cross-tab sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const parsed: LiveStoreState = JSON.parse(event.newValue);
        memoryState = parsed;
        notifySubscribers();
      } catch {
        // ignore parse error
      }
    }
  });
}

function loadFromStorage(): LiveStoreState {
  if (typeof window === 'undefined') {
    return {
      queue: INITIAL_QUEUE,
      departments: INITIAL_DEPARTMENTS,
      alerts: INITIAL_ALERTS,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: LiveStoreState = JSON.parse(raw);
      // Ensure essential fields exist
      if (parsed.queue && parsed.departments) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse live store from localStorage, using initial mock data', err);
  }

  const initial: LiveStoreState = {
    queue: INITIAL_QUEUE,
    departments: INITIAL_DEPARTMENTS,
    alerts: INITIAL_ALERTS,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }

  return initial;
}

// In-memory cache for fast, synchronous reads
let memoryState: LiveStoreState = loadFromStorage();

function notifySubscribers() {
  subscribers.forEach((callback) => {
    try {
      callback(memoryState);
    } catch (err) {
      console.error('Error in live store subscriber', err);
    }
  });
}

/** Commit state to memory, localStorage, and broadcast across tabs */
function commitState(newState: LiveStoreState) {
  newState.lastUpdated = new Date().toISOString();
  memoryState = newState;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (err) {
      console.warn('Failed to persist live store to localStorage', err);
    }
  }

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'LIVE_STORE_SYNC',
        payload: newState,
      });
    } catch (err) {
      console.warn('BroadcastChannel postMessage failed', err);
    }
  }

  notifySubscribers();
}

/** Helper: recompute queue positions and estimated wait times for a department */
function recomputeDepartmentQueue(
  state: LiveStoreState,
  departmentId: string
): LiveStoreState {
  const dept = state.departments[departmentId];
  const waitPerPatient = dept ? dept.estimatedWaitPerPatientMinutes : 10;
  const delayMinutes = dept && dept.statusCode === 'delayed' ? (dept.delayMinutes || 0) : 0;
  const isBreak = dept && dept.statusCode === 'break';

  let position = 1;
  const updatedQueue = state.queue.map((entry) => {
    if (entry.departmentId !== departmentId) return entry;

    if (entry.status === 'in_progress') {
      return {
        ...entry,
        position: 0,
        estimatedWaitMinutes: 0,
      };
    }

    if (entry.status === 'completed' || entry.status === 'cancelled') {
      return {
        ...entry,
        position: 0,
        estimatedWaitMinutes: 0,
      };
    }

    // Is waiting or turn_soon
    const myPos = position++;
    const isNext = myPos === 1;
    const baseWait = myPos * waitPerPatient;
    const totalWait = baseWait + delayMinutes + (isBreak ? 10 : 0);

    return {
      ...entry,
      position: myPos,
      status: isNext ? ('turn_soon' as QueueStatus) : ('waiting' as QueueStatus),
      estimatedWaitMinutes: totalWait,
    };
  });

  return {
    ...state,
    queue: updatedQueue,
  };
}

// ─── PUBLIC ASYNC API (Ready for future REST / WebSocket replacement) ─────────

/** Subscribe to all live store updates (BroadcastChannel + LocalStorage) */
export function subscribeToLiveStore(listener: Subscriber): () => void {
  subscribers.add(listener);
  // Send current state immediately on subscription
  listener(memoryState);
  return () => {
    subscribers.delete(listener);
  };
}

/** Get snapshot of complete live store state */
export async function getLiveStoreState(): Promise<LiveStoreState> {
  return memoryState;
}

/** Synchronous snapshot reader */
export function getLiveStoreSnapshot(): LiveStoreState {
  return memoryState;
}

/** Get live status for a specific department */
export async function getDepartmentLiveStatus(
  departmentId: string
): Promise<DepartmentLiveStatus | null> {
  return memoryState.departments[departmentId] || null;
}

/** Get all queue entries for a specific department */
export async function getDepartmentQueue(
  departmentId: string
): Promise<QueueEntry[]> {
  return memoryState.queue.filter((q) => q.departmentId === departmentId);
}

/** Get live status and queue details for a specific patient token or slip ID */
export async function getPatientLiveDetails(
  tokenOrSlipId: string,
  departmentId?: string
): Promise<{
  queueEntry: QueueEntry | null;
  department: DepartmentLiveStatus | null;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  status: QueueStatus;
  nowServingToken: string | null;
  activeAlerts: LiveAlert[];
}> {
  const norm = tokenOrSlipId.trim().toUpperCase();
  const queueEntry =
    memoryState.queue.find((q) => q.token.toUpperCase() === norm || q.id === tokenOrSlipId) || null;

  const targetDeptId = queueEntry?.departmentId || departmentId || 'opd-cardio';
  const dept = memoryState.departments[targetDeptId] || null;

  let peopleAhead = 0;
  let estimatedWaitMinutes = 15;
  let status: QueueStatus = 'waiting';

  if (queueEntry) {
    status = queueEntry.status;
    peopleAhead = Math.max(0, queueEntry.position - 1);
    estimatedWaitMinutes = queueEntry.estimatedWaitMinutes;
  } else if (dept) {
    peopleAhead = 1;
    estimatedWaitMinutes = dept.estimatedWaitPerPatientMinutes;
  }

  const activeAlerts = memoryState.alerts.filter(
    (a) => a.active && (!a.departmentId || a.departmentId === targetDeptId)
  );

  return {
    queueEntry,
    department: dept,
    peopleAhead,
    estimatedWaitMinutes,
    status,
    nowServingToken: dept?.currentToken || null,
    activeAlerts,
  };
}

/** Ensure a patient exists in the live queue (creates entry if missing) */
export async function ensurePatientInQueue(params: {
  token: string;
  patientName: string;
  departmentId: string;
  roomNumber?: string;
}): Promise<QueueEntry> {
  const existing = memoryState.queue.find(
    (q) => q.token.toUpperCase() === params.token.toUpperCase()
  );
  if (existing) {
    return existing;
  }

  const dept = memoryState.departments[params.departmentId];
  const waitPerPatient = dept ? dept.estimatedWaitPerPatientMinutes : 10;
  const currentWaitingCount = memoryState.queue.filter(
    (q) => q.departmentId === params.departmentId && (q.status === 'waiting' || q.status === 'turn_soon')
  ).length;

  const newPosition = currentWaitingCount + 1;
  const newEntry: QueueEntry = {
    id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    token: params.token,
    patientName: params.patientName,
    departmentId: params.departmentId,
    roomNumber: params.roomNumber || dept?.roomNumber || 'Room 101',
    status: newPosition === 1 ? 'turn_soon' : 'waiting',
    position: newPosition,
    estimatedWaitMinutes: newPosition * waitPerPatient,
    createdAt: new Date().toISOString(),
  };

  let nextState: LiveStoreState = {
    ...memoryState,
    queue: [...memoryState.queue, newEntry],
  };

  nextState = recomputeDepartmentQueue(nextState, params.departmentId);
  commitState(nextState);

  return nextState.queue.find((q) => q.token === params.token) || newEntry;
}

/** Update department live status message, code, doctor, or token */
export async function updateDepartmentStatus(
  departmentId: string,
  updates: Partial<DepartmentLiveStatus>
): Promise<DepartmentLiveStatus> {
  const current = memoryState.departments[departmentId] || {
    departmentId,
    departmentName: departmentId,
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

  const updatedDept: DepartmentLiveStatus = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };

  let nextState: LiveStoreState = {
    ...memoryState,
    departments: {
      ...memoryState.departments,
      [departmentId]: updatedDept,
    },
  };

  nextState = recomputeDepartmentQueue(nextState, departmentId);
  commitState(nextState);

  return updatedDept;
}

/** Set department estimated wait time per patient or delay */
export async function setDepartmentWaitTime(
  departmentId: string,
  waitPerPatientMinutes: number,
  delayMinutes?: number
): Promise<void> {
  await updateDepartmentStatus(departmentId, {
    estimatedWaitPerPatientMinutes: Math.max(0, waitPerPatientMinutes),
    delayMinutes: delayMinutes !== undefined ? Math.max(0, delayMinutes) : undefined,
  });
}

/** Set custom status message and status code (break, delayed, busy, normal, emergency) */
export async function setDepartmentCustomStatus(
  departmentId: string,
  statusMessage: string,
  statusCode: DepartmentStatusCode,
  options?: { breakUntil?: string; delayMinutes?: number }
): Promise<void> {
  await updateDepartmentStatus(departmentId, {
    statusMessage,
    statusCode,
    breakUntil: options?.breakUntil,
    delayMinutes: options?.delayMinutes,
  });
}

/** Advance queue: complete current token and call the next waiting patient */
export async function callNextPatient(
  departmentId: string
): Promise<{ completedToken: string | null; nextToken: string | null }> {
  const dept = memoryState.departments[departmentId];
  const currentToken = dept?.currentToken || null;

  // Find next waiting patient
  const waitingPatients = memoryState.queue.filter(
    (q) => q.departmentId === departmentId && (q.status === 'waiting' || q.status === 'turn_soon')
  );

  const nextPatient = waitingPatients[0] || null;

  const updatedQueue = memoryState.queue.map((entry) => {
    if (entry.departmentId !== departmentId) return entry;

    // Complete the previous in_progress patient
    if (entry.token === currentToken && entry.status === 'in_progress') {
      return {
        ...entry,
        status: 'completed' as QueueStatus,
        position: 0,
        estimatedWaitMinutes: 0,
      };
    }

    // Mark next patient as in_progress
    if (nextPatient && entry.id === nextPatient.id) {
      return {
        ...entry,
        status: 'in_progress' as QueueStatus,
        position: 0,
        estimatedWaitMinutes: 0,
        calledAt: new Date().toISOString(),
      };
    }

    return entry;
  });

  const updatedDept: DepartmentLiveStatus = {
    ...(dept || {
      departmentId,
      departmentName: departmentId,
      roomNumber: '101',
      floor: 0,
      building: 'Main',
      activeDoctorName: 'Doctor on Duty',
      estimatedWaitPerPatientMinutes: 10,
      lastUpdated: new Date().toISOString(),
    }),
    currentToken: nextPatient ? nextPatient.token : null,
    statusMessage: nextPatient ? 'Doctor with another patient' : 'Consultations running on time',
    statusCode: nextPatient ? 'busy' : 'normal',
    lastUpdated: new Date().toISOString(),
  };

  let nextState: LiveStoreState = {
    ...memoryState,
    departments: {
      ...memoryState.departments,
      [departmentId]: updatedDept,
    },
    queue: updatedQueue,
  };

  nextState = recomputeDepartmentQueue(nextState, departmentId);
  commitState(nextState);

  return {
    completedToken: currentToken,
    nextToken: nextPatient ? nextPatient.token : null,
  };
}

/** Set an individual queue entry status directly */
export async function updateQueueEntryStatus(
  token: string,
  status: QueueStatus
): Promise<QueueEntry | null> {
  const entry = memoryState.queue.find((q) => q.token.toUpperCase() === token.toUpperCase());
  if (!entry) return null;

  const updatedQueue = memoryState.queue.map((q) => {
    if (q.token.toUpperCase() === token.toUpperCase()) {
      return {
        ...q,
        status,
        position: status === 'in_progress' || status === 'completed' ? 0 : q.position,
        estimatedWaitMinutes: status === 'in_progress' || status === 'completed' ? 0 : q.estimatedWaitMinutes,
      };
    }
    return q;
  });

  let nextState: LiveStoreState = {
    ...memoryState,
    queue: updatedQueue,
  };

  nextState = recomputeDepartmentQueue(nextState, entry.departmentId);
  commitState(nextState);

  return nextState.queue.find((q) => q.token.toUpperCase() === token.toUpperCase()) || null;
}

/** Publish a live hospital alert (emergency, delay, announcement) */
export async function publishLiveAlert(
  alert: Omit<LiveAlert, 'id' | 'timestamp'>
): Promise<LiveAlert> {
  const newAlert: LiveAlert = {
    ...alert,
    id: `alert-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };

  const nextState: LiveStoreState = {
    ...memoryState,
    alerts: [newAlert, ...memoryState.alerts],
  };

  commitState(nextState);
  return newAlert;
}

/** Dismiss an active alert */
export async function dismissLiveAlert(alertId: string): Promise<void> {
  const nextState: LiveStoreState = {
    ...memoryState,
    alerts: memoryState.alerts.map((a) => (a.id === alertId ? { ...a, active: false } : a)),
  };
  commitState(nextState);
}

/** Reset live store back to default mock data */
export async function resetLiveStore(): Promise<LiveStoreState> {
  const defaultState: LiveStoreState = {
    queue: INITIAL_QUEUE,
    departments: INITIAL_DEPARTMENTS,
    alerts: INITIAL_ALERTS,
    lastUpdated: new Date().toISOString(),
  };

  commitState(defaultState);
  return defaultState;
}

// ─── REACT HOOKS ─────────────────────────────────────────────────────────────

/**
 * useLiveStore: Main hook that subscribes to real-time changes
 * across tabs via BroadcastChannel & localStorage
 */
export function useLiveStore() {
  const [state, setState] = useState<LiveStoreState>(() => memoryState);

  useEffect(() => {
    setState(memoryState);
    const unsubscribe = subscribeToLiveStore((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const updateDept = useCallback(
    (deptId: string, updates: Partial<DepartmentLiveStatus>) => updateDepartmentStatus(deptId, updates),
    []
  );

  const setWaitTime = useCallback(
    (deptId: string, wait: number, delay?: number) => setDepartmentWaitTime(deptId, wait, delay),
    []
  );

  const setCustomStatus = useCallback(
    (
      deptId: string,
      msg: string,
      code: DepartmentStatusCode,
      opts?: { breakUntil?: string; delayMinutes?: number }
    ) => setDepartmentCustomStatus(deptId, msg, code, opts),
    []
  );

  const callNext = useCallback((deptId: string) => callNextPatient(deptId), []);

  const updateEntry = useCallback(
    (token: string, status: QueueStatus) => updateQueueEntryStatus(token, status),
    []
  );

  const publishAlert = useCallback(
    (alert: Omit<LiveAlert, 'id' | 'timestamp'>) => publishLiveAlert(alert),
    []
  );

  const dismissAlert = useCallback((id: string) => dismissLiveAlert(id), []);

  const reset = useCallback(() => resetLiveStore(), []);

  return {
    state,
    updateDepartmentStatus: updateDept,
    setDepartmentWaitTime: setWaitTime,
    setDepartmentCustomStatus: setCustomStatus,
    callNextPatient: callNext,
    updateQueueEntryStatus: updateEntry,
    publishLiveAlert: publishAlert,
    dismissLiveAlert: dismissAlert,
    resetLiveStore: reset,
  };
}

/**
 * usePatientLiveStatus: Specialized hook for patient view (SlipPage, PatientLivePage).
 * Subscribes to real-time updates for a specific token and department.
 */
export function usePatientLiveStatus(token?: string, departmentId?: string) {
  const [liveData, setLiveData] = useState(() => ({
    queueEntry: null as QueueEntry | null,
    department: null as DepartmentLiveStatus | null,
    peopleAhead: 1,
    estimatedWaitMinutes: 15,
    status: 'waiting' as QueueStatus,
    nowServingToken: null as string | null,
    activeAlerts: [] as LiveAlert[],
    lastUpdated: memoryState.lastUpdated,
  }));

  const evaluateStatus = useCallback(() => {
    if (!token && !departmentId) return;

    const norm = token ? token.trim().toUpperCase() : '';
    const queueEntry =
      memoryState.queue.find((q) => q.token.toUpperCase() === norm) || null;

    const targetDeptId = queueEntry?.departmentId || departmentId || 'opd-cardio';
    const dept = memoryState.departments[targetDeptId] || null;

    let peopleAhead = 0;
    let estimatedWaitMinutes = 15;
    let status: QueueStatus = 'waiting';

    if (queueEntry) {
      status = queueEntry.status;
      peopleAhead = Math.max(0, queueEntry.position - 1);
      estimatedWaitMinutes = queueEntry.estimatedWaitMinutes;
    } else if (dept) {
      peopleAhead = 1;
      estimatedWaitMinutes = dept.estimatedWaitPerPatientMinutes + (dept.delayMinutes || 0);
      if (dept.statusCode === 'emergency') {
        estimatedWaitMinutes = 0;
        status = 'in_progress';
      }
    }

    const activeAlerts = memoryState.alerts.filter(
      (a) => a.active && (!a.departmentId || a.departmentId === targetDeptId)
    );

    setLiveData({
      queueEntry,
      department: dept,
      peopleAhead,
      estimatedWaitMinutes,
      status,
      nowServingToken: dept?.currentToken || null,
      activeAlerts,
      lastUpdated: memoryState.lastUpdated,
    });
  }, [token, departmentId]);

  useEffect(() => {
    evaluateStatus();
    const unsubscribe = subscribeToLiveStore(() => {
      evaluateStatus();
    });
    return unsubscribe;
  }, [evaluateStatus]);

  return liveData;
}
