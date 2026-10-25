import type {
  Department,
  NavigationStep,
  PurposeOption,
  Slip,
  WayfindingResult,
  KnownLocation,
  PatientVisitData,
} from '../types';
import {
  DEPARTMENTS,
  PURPOSE_OPTIONS,
  KNOWN_LOCATIONS,
  SYMPTOM_DEPARTMENT_RULES,
} from '../data/hospitalData';
import { ensurePatientInQueue } from './liveStore';
import {
  syncSlipToSupabase,
  syncVisitToSupabase,
  fetchSupabaseSlips,
  fetchSupabaseSlipById,
  syncUserProfileToSupabase,
} from './supabaseClient';

// ─── Utility ─────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let tokenCounter = 1000;

function generateToken(prefix: string): string {
  tokenCounter += 1;
  return `${prefix}-${tokenCounter}`;
}

function generateStepsFromEntrance(dept: Department, isAccessibleRoute = false): NavigationStep[] {
  const steps: NavigationStep[] = [];

  if (dept.building === 'A' && dept.floor === 0) {
    steps.push({
      stepNumber: 1,
      instructionKey: 'nav.enter_main_entrance',
      directionIcon: 'arrow-up',
    });
    steps.push({
      stepNumber: 2,
      instructionKey: 'nav.turn_left',
      landmark: dept.landmark,
      directionIcon: 'arrow-left',
    });
    steps.push({
      stepNumber: 3,
      instructionKey: 'nav.arrive_dept',
      instructionParams: { room: dept.roomNumbers[0] },
      directionIcon: 'map-pin',
    });
  } else if (dept.building === 'A') {
    steps.push({
      stepNumber: 1,
      instructionKey: 'nav.enter_main_entrance',
      directionIcon: 'arrow-up',
    });
    steps.push({
      stepNumber: 2,
      instructionKey: 'nav.take_stairs_or_elevator',
      instructionParams: { floor: dept.floor },
      directionIcon: isAccessibleRoute ? 'elevator' : (dept.floor > 0 ? 'elevator' : 'stairs'),
    });
    steps.push({
      stepNumber: 3,
      instructionKey: 'nav.arrive_dept',
      instructionParams: { room: dept.roomNumbers[0] },
      landmark: dept.landmark,
      directionIcon: 'map-pin',
    });
  } else if (dept.building === 'E') {
    steps.push({
      stepNumber: 1,
      instructionKey: 'nav.exit_main_gate',
      directionIcon: 'arrow-up',
    });
    steps.push({
      stepNumber: 2,
      instructionKey: 'nav.turn_left_building_e',
      landmark: dept.landmark,
      directionIcon: 'arrow-left',
    });
    steps.push({
      stepNumber: 3,
      instructionKey: 'nav.arrive_dept',
      instructionParams: { room: dept.roomNumbers[0] },
      directionIcon: 'map-pin',
    });
  } else {
    // Multi-building route
    steps.push({
      stepNumber: 1,
      instructionKey: 'nav.enter_main_entrance',
      directionIcon: 'arrow-up',
    });
    steps.push({
      stepNumber: 2,
      instructionKey: 'nav.walk_to_building',
      instructionParams: { building: dept.building },
      directionIcon: 'arrow-right',
    });
    if (dept.floor !== 0) {
      steps.push({
        stepNumber: 3,
        instructionKey: 'nav.take_stairs_or_elevator',
        instructionParams: { floor: dept.floor },
        directionIcon: 'elevator',
      });
      steps.push({
        stepNumber: 4,
        instructionKey: 'nav.arrive_dept',
        instructionParams: { room: dept.roomNumbers[0] },
        landmark: dept.landmark,
        directionIcon: 'map-pin',
      });
    } else {
      steps.push({
        stepNumber: 3,
        instructionKey: 'nav.arrive_dept',
        instructionParams: { room: dept.roomNumbers[0] },
        landmark: dept.landmark,
        directionIcon: 'map-pin',
      });
    }
  }

  return steps;
}

function generateHumanReadableDirection(dept: Department, isAccessible: boolean): string {
  const room = dept.roomNumbers[0] || '101';
  const turnDirection = dept.wing?.includes('West') ? 'left' : 'right';

  if (dept.floor === 0) {
    if (dept.building === 'E') {
      return `Exit the main gate, take the covered ramp on your left directly into Building E (Casualty & Emergency), Room ${room}.`;
    }
    if (isAccessible) {
      return `Use the step-free entrance ramp at Main Lobby A, proceed straight 20 meters, turn left past the Reception Desk to Room ${room}.`;
    }
    return `Enter through the main hospital entrance, proceed straight past the main lobby, turn left to Room ${room}.`;
  }

  if (isAccessible) {
    return `Take the ramp on your left to the Main Elevator Bank, take the lift to Floor ${dept.floor}, turn ${turnDirection} down the accessible corridor to Room ${room} (Priority lift access, step-free route).`;
  }

  return `Take the lift on your left to Floor ${dept.floor}, turn ${turnDirection}, Room ${room}.`;
}

function generateStepsFromLocation(from: KnownLocation, dept: Department): NavigationStep[] {
  const steps: NavigationStep[] = [];
  let stepNum = 1;

  // If same building and floor
  if (from.building === dept.building && from.floor === dept.floor) {
    steps.push({
      stepNumber: stepNum++,
      instructionKey: 'nav.you_are_close',
      directionIcon: 'arrow-right',
    });
    steps.push({
      stepNumber: stepNum++,
      instructionKey: 'nav.arrive_dept',
      instructionParams: { room: dept.roomNumbers[0] },
      landmark: dept.landmark,
      directionIcon: 'map-pin',
    });
    return steps;
  }

  // Different building
  if (from.building !== dept.building) {
    steps.push({
      stepNumber: stepNum++,
      instructionKey: 'nav.go_to_main_corridor',
      directionIcon: 'arrow-right',
    });
    steps.push({
      stepNumber: stepNum++,
      instructionKey: 'nav.walk_to_building',
      instructionParams: { building: dept.building },
      directionIcon: 'arrow-right',
    });
  }

  // Different floor
  if (from.floor !== dept.floor) {
    steps.push({
      stepNumber: stepNum++,
      instructionKey: 'nav.take_stairs_or_elevator',
      instructionParams: { floor: dept.floor },
      directionIcon: dept.floor > from.floor ? 'elevator' : 'stairs',
    });
  }

  steps.push({
    stepNumber: stepNum++,
    instructionKey: 'nav.arrive_dept',
    instructionParams: { room: dept.roomNumbers[0] },
    landmark: dept.landmark,
    directionIcon: 'map-pin',
  });

  return steps;
}

// ─── Public service functions (async mock — ready for API replacement) ────────

export interface SymptomMatchResult {
  department: Department;
  matchedKeyword: string;
  reason: string;
  confidence: 'high' | 'medium' | 'fallback';
}

/** Suggest an appropriate hospital department based on patient symptom description */
export async function suggestDepartmentFromSymptoms(symptoms: string): Promise<SymptomMatchResult> {
  await sleep(250);
  const cleanInput = symptoms.toLowerCase().trim();

  for (const rule of SYMPTOM_DEPARTMENT_RULES) {
    const matched = rule.keywords.find((k) => cleanInput.includes(k.toLowerCase()));
    if (matched) {
      const dept = DEPARTMENTS.find((d) => d.id === rule.departmentId);
      if (dept) {
        return {
          department: dept,
          matchedKeyword: matched,
          reason: rule.reason,
          confidence: 'high',
        };
      }
    }
  }

  // Fallback to General OPD Triage
  const fallbackDept = DEPARTMENTS.find((d) => d.id === 'opd-general') || DEPARTMENTS[0];
  return {
    department: fallbackDept,
    matchedKeyword: 'general health triage',
    reason: 'General Medicine triage can examine your condition and refer you to specialized hospital wings as needed.',
    confidence: 'fallback',
  };
}

/** Get all available purpose options */
export async function getPurposeOptions(): Promise<PurposeOption[]> {
  await sleep(200);
  return PURPOSE_OPTIONS;
}

/** Search purpose options by query string */
export async function searchPurposes(query: string): Promise<PurposeOption[]> {
  await sleep(150);
  if (!query.trim()) return PURPOSE_OPTIONS;
  const q = query.toLowerCase();
  return PURPOSE_OPTIONS.filter(
    (p) =>
      p.keywords.some((k) => k.includes(q)) ||
      p.labelKey.toLowerCase().includes(q)
  );
}

/** Get departments by purpose */
export async function getDepartmentsByPurpose(purposeId: string): Promise<Department[]> {
  await sleep(200);
  const purpose = PURPOSE_OPTIONS.find((p) => p.id === purposeId);
  if (!purpose) return [];
  return DEPARTMENTS.filter((d) => purpose.departmentIds.includes(d.id));
}

/** Get all departments */
export async function getAllDepartments(): Promise<Department[]> {
  await sleep(150);
  return DEPARTMENTS;
}

/**
 * Generate a patient slip.
 * Supports both modern PatientVisitData object and legacy (purposeId, departmentId) strings.
 */
export async function generateSlip(
  visitDataOrPurposeId: PatientVisitData | string,
  maybeDepartmentId?: string
): Promise<Slip> {
  await sleep(400);

  let departmentId: string;
  let purposeKey = 'purpose.new_opd';
  let patientName = 'Patient';
  let patientAge: number | undefined;
  let patientGender: string | undefined;
  let accessibilityNeeds: PatientVisitData['accessibilityNeeds'] = [];
  let patientEmail: string | undefined;
  let abhaId: string | undefined;

  if (typeof visitDataOrPurposeId === 'string') {
    const purpose = PURPOSE_OPTIONS.find((p) => p.id === visitDataOrPurposeId);
    purposeKey = purpose?.labelKey || 'purpose.new_opd';
    departmentId = maybeDepartmentId || 'opd-general';
  } else {
    const v = visitDataOrPurposeId;
    patientName = v.patientName || 'Patient';
    patientAge = v.patientAge ? Number(v.patientAge) : undefined;
    patientGender = v.patientGender;
    accessibilityNeeds = v.accessibilityNeeds || [];
    departmentId = v.departmentId || 'opd-general';
    patientEmail = v.email;
    abhaId = v.abhaId;

    const purposeMap: Record<string, string> = {
      consultation: 'purpose.new_opd',
      lab_test: 'purpose.blood_test',
      pharmacy: 'purpose.pharmacy',
      follow_up: 'purpose.followup',
      admission_visitor: 'purpose.admission',
      other: 'purpose.billing',
    };
    purposeKey = purposeMap[v.purposeId] || 'purpose.new_opd';
  }

  const department = DEPARTMENTS.find((d) => d.id === departmentId) || DEPARTMENTS[0];

  const prefixLookup: Record<string, string> = {
    'opd-cardiology': 'CARD',
    'opd-ortho': 'ORTH',
    'opd-neuro': 'NEUR',
    'opd-eye': 'EYE',
    'opd-ent': 'ENT',
    'opd-derma': 'DERM',
    'opd-pediatrics': 'PED',
    'lab-blood': 'LAB',
    'lab-radiology': 'SCAN',
    'pharmacy': 'PHR',
    'admission': 'ADM',
    'discharge': 'DIS',
    'emergency': 'EMG',
    'billing': 'BIL',
  };

  const prefix = prefixLookup[department.id] || (department.category === 'consultation' ? 'OPD' : 'GEN');

  const waitMap: Record<string, number> = {
    emergency: 0,
    pharmacy: 5,
    diagnostics: 15,
    consultation: 25,
    support: 10,
    admission: 15,
    discharge: 15,
  };

  const isAccessible = accessibilityNeeds.some((need) =>
    ['wheelchair', 'walking_difficulty', 'elderly_assistance'].includes(need)
  );

  const humanDirection = generateHumanReadableDirection(department, isAccessible);
  const steps = generateStepsFromEntrance(department, isAccessible);

  const waitMinutes = waitMap[department.category] ?? 20;
  const peopleAhead = department.category === 'emergency' ? 0 : Math.max(1, Math.round(waitMinutes / 5));
  const queueStatus = department.category === 'emergency'
    ? 'in_progress'
    : (waitMinutes <= 5 ? 'turn_soon' : 'waiting');

  const authRaw = typeof window !== 'undefined' ? localStorage.getItem('vd-auth-user') : null;
  const rawParsed = authRaw ? JSON.parse(authRaw) : null;
  const authUser = rawParsed && rawParsed.role !== 'staff' && !rawParsed.id?.startsWith('stf-') ? rawParsed : null;
  const isGuest = authUser ? Boolean(authUser.isGuest) : true;

  const resolvedName =
    patientName && patientName !== 'Patient' && patientName !== 'Guest Patient'
      ? patientName
      : authUser?.name && authUser.name !== 'Patient' && authUser.name !== 'Registered Patient'
      ? authUser.name
      : patientName || 'Patient';

  const resolvedAge =
    patientAge !== undefined && patientAge !== null && !isNaN(Number(patientAge))
      ? Number(patientAge)
      : authUser?.age !== undefined && authUser?.age !== null && !isNaN(Number(authUser.age))
      ? Number(authUser.age)
      : undefined;

  const resolvedGender = patientGender || authUser?.gender || undefined;
  const resolvedEmail = patientEmail || authUser?.email || undefined;
  const resolvedAbhaId = abhaId || authUser?.abhaId || undefined;

  const slip: Slip = {
    id: `slip-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    patientPurposeKey: purposeKey,
    department,
    token: generateToken(prefix),
    estimatedWait: waitMinutes,
    peopleAhead,
    status: queueStatus,
    steps,
    doctorName: department.doctorName,
    roomNumber: department.roomNumbers[0],
    floor: department.floor,
    wing: department.wing,
    humanReadableDirection: humanDirection,
    patientName: resolvedName,
    patientAge: resolvedAge,
    patientGender: resolvedGender,
    accessibilityNeeds,
    isGuest,
    userId: authUser?.id,
    patientEmail: resolvedEmail,
    abhaId: resolvedAbhaId,
    additionalNoteKey: department.category === 'emergency' ? 'slip.note_emergency' : undefined,
  };

  await saveSlip(slip, isGuest);

  return slip;
}

const SLIPS_STORAGE_KEY = 'vd-patient-slips';
const LATEST_SLIP_KEY = 'vd-latest-slip';

/** Save or update a slip in persistent localStorage and Supabase */
export async function saveSlip(slip: Slip, isGuest?: boolean): Promise<Slip> {
  try {
    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const list: Slip[] = raw ? JSON.parse(raw) : [];

    const authRaw = localStorage.getItem('vd-auth-user');
    const rawParsed = authRaw ? JSON.parse(authRaw) : null;
    const authUser = rawParsed && rawParsed.role !== 'staff' && !rawParsed.id?.startsWith('stf-') ? rawParsed : null;
    const determinedIsGuest = isGuest ?? (authUser ? Boolean(authUser.isGuest) : true);

    const enrichedSlip: Slip = {
      ...slip,
      isGuest: determinedIsGuest,
      userId: authUser?.id || slip.userId,
      patientEmail: slip.patientEmail || authUser?.email,
      patientName: slip.patientName || authUser?.name || 'Patient',
      patientAge: slip.patientAge !== undefined ? slip.patientAge : authUser?.age,
      abhaId: slip.abhaId || authUser?.abhaId,
    };

    const existingIndex = list.findIndex((s) => s.id === slip.id || (s.token && s.token === slip.token));
    if (existingIndex >= 0) {
      list[existingIndex] = enrichedSlip;
    } else {
      list.unshift(enrichedSlip);
    }

    localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(LATEST_SLIP_KEY, JSON.stringify(enrichedSlip));

    // If registered user provided an age or updated name on this slip, save to user profile
    if (authUser && !authUser.isGuest) {
      let profileUpdated = false;
      if (enrichedSlip.patientAge !== undefined && enrichedSlip.patientAge !== authUser.age) {
        authUser.age = enrichedSlip.patientAge;
        profileUpdated = true;
      }
      if (enrichedSlip.patientName && enrichedSlip.patientName !== 'Patient' && enrichedSlip.patientName !== authUser.name) {
        authUser.name = enrichedSlip.patientName;
        profileUpdated = true;
      }
      if (enrichedSlip.abhaId && enrichedSlip.abhaId !== authUser.abhaId) {
        authUser.abhaId = enrichedSlip.abhaId;
        profileUpdated = true;
      }
      if (profileUpdated) {
        localStorage.setItem('vd-auth-user', JSON.stringify(authUser));
        syncUserProfileToSupabase(authUser);
      }
    }

    // Persist slip to Supabase cloud database
    syncSlipToSupabase(enrichedSlip);

    // Register into reactive live queue store
    if (enrichedSlip.token && enrichedSlip.department?.id) {
      ensurePatientInQueue({
        token: enrichedSlip.token,
        patientName: enrichedSlip.patientName || 'Patient',
        departmentId: enrichedSlip.department.id,
        roomNumber: enrichedSlip.roomNumber || enrichedSlip.department.roomNumbers?.[0],
        email: enrichedSlip.patientEmail,
        age: enrichedSlip.patientAge,
      }).catch((e) => console.warn('Failed to register slip in liveStore', e));
    }

    // Trigger OPD Slip confirmation email & schedule visit reminders
    const recipientEmail = enrichedSlip.patientEmail || authUser?.email;
    if (recipientEmail && enrichedSlip.token) {
      void import('./emailService').then((mail) => {
        const genDate = new Date(enrichedSlip.generatedAt);
        const etaStart = new Date(genDate.getTime() + (enrichedSlip.estimatedWait || 15) * 60 * 1000);
        const etaEnd = new Date(etaStart.getTime() + 15 * 60 * 1000);
        const deptLabel = enrichedSlip.department?.nameKey || 'General Consultation';
        const docLabel = enrichedSlip.doctorName || enrichedSlip.department?.doctorName || 'Doctor on Duty';

        void mail.sendOpdSlipEmail({
          email: recipientEmail,
          patientName: enrichedSlip.patientName || 'Patient',
          token: enrichedSlip.token,
          department: deptLabel,
          doctorName: docLabel,
          room: enrichedSlip.roomNumber || 'Room 101',
          floor: mail.formatFloor(enrichedSlip.floor),
          date: mail.formatDate(genDate),
          etaStart: mail.formatClock(etaStart),
          etaEnd: mail.formatClock(etaEnd),
          routeText: enrichedSlip.humanReadableDirection || 'Follow hospital OPD wayfinding signs.',
          slipId: enrichedSlip.id,
        });

        mail.scheduleVisitReminders({
          token: enrichedSlip.token,
          email: recipientEmail,
          patientName: enrichedSlip.patientName || 'Patient',
          department: deptLabel,
          doctorName: docLabel,
          expectedAt: etaStart,
          slipId: enrichedSlip.id,
        });
      });
    }

    // If registered user, also append to visits in authUser and sync to Supabase
    if (authUser && !authUser.isGuest) {
      const existingVisits = authUser.visits || [];
      const hasVisit = existingVisits.some((v: any) => v.id === slip.id || v.tokenNumber === slip.token);
      if (!hasVisit) {
        const newVisit = {
          id: slip.id,
          date: new Date(slip.generatedAt).toISOString().split('T')[0],
          departmentName: slip.department.nameKey,
          doctorName: slip.doctorName || slip.department.doctorName || 'Doctor on Duty',
          tokenNumber: slip.token,
          diagnosisSummary: `Outpatient consultation. Queue Token #${slip.token}. Room ${slip.roomNumber || slip.department.roomNumbers[0]}.`,
          status: 'in_progress' as const,
        };
        authUser.visits = [newVisit, ...existingVisits];
        localStorage.setItem('vd-auth-user', JSON.stringify(authUser));
        if (authUser.id) {
          syncVisitToSupabase(newVisit, authUser.id, enrichedSlip.patientName);
        }
      }
    }

    return enrichedSlip;
  } catch (err) {
    console.warn('Failed to save slip to localStorage', err);
    return slip;
  }
}

/** Retrieve a slip by ID or get the latest active slip (checks localStorage first, then Supabase) */
export async function getSlipById(id: string): Promise<Slip | null> {
  await sleep(100);
  try {
    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const list: Slip[] = raw ? JSON.parse(raw) : [];
    const found = list.find((s) => s.id === id || s.token === id);
    if (found) return found;

    // Check latest slip
    const latestRaw = localStorage.getItem(LATEST_SLIP_KEY);
    if (latestRaw) {
      const latest: Slip = JSON.parse(latestRaw);
      if (latest.id === id || latest.token === id || id === 'latest') return latest;
    }

    // Check Supabase cloud database
    const cloudSlip = await fetchSupabaseSlipById(id);
    if (cloudSlip) {
      const updatedList = [cloudSlip, ...list.filter((s) => s.id !== cloudSlip.id)];
      localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(updatedList));
      return cloudSlip;
    }

    // If user is logged in, use their real profile details for realistic fallback
    const authRaw = typeof window !== 'undefined' ? localStorage.getItem('vd-auth-user') : null;
    const authUser = authRaw ? JSON.parse(authRaw) : null;
    const dept = DEPARTMENTS[1] || DEPARTMENTS[0];

    const fallbackSlip: Slip = {
      id: id || `slip-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      patientPurposeKey: 'purpose.new_opd',
      department: dept,
      token: 'CARD-1042',
      estimatedWait: 15,
      peopleAhead: 3,
      status: 'waiting',
      steps: generateStepsFromEntrance(dept, false),
      doctorName: dept.doctorName,
      roomNumber: dept.roomNumbers[0],
      floor: dept.floor,
      wing: dept.wing,
      humanReadableDirection: generateHumanReadableDirection(dept, false),
      patientName: authUser?.name || 'Registered Patient',
      patientAge: authUser?.age,
      patientGender: authUser?.gender || 'Male',
      isGuest: Boolean(authUser?.isGuest),
      userId: authUser?.id,
      patientEmail: authUser?.email,
    };
    return fallbackSlip;
  } catch {
    return null;
  }
}

/** Get list of all previous slips for the patient (strictly isolated by email or userId) */
export async function getPatientSlipHistory(
  userId?: string,
  userEmail?: string
): Promise<Slip[]> {
  await sleep(60);
  try {
    const cleanEmail = userEmail?.trim().toLowerCase();
    const cleanUserId = userId && !userId.startsWith('stf-') ? userId.trim() : undefined;

    // Strict privacy: if neither identifier is provided, return empty
    if (!cleanUserId && !cleanEmail) {
      return [];
    }

    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const localList: Slip[] = raw ? JSON.parse(raw) : [];

    // Filter local slips strictly: never leak slips from other emails
    const filteredLocal = localList.filter((s) => {
      const slipEmail = s.patientEmail ? s.patientEmail.trim().toLowerCase() : null;
      if (cleanEmail) {
        if (slipEmail) return slipEmail === cleanEmail;
        return Boolean(cleanUserId && s.userId === cleanUserId);
      }
      if (cleanUserId) {
        return s.userId === cleanUserId && !slipEmail;
      }
      return false;
    });

    // Fetch from Supabase cloud database
    const cloudSlips = await fetchSupabaseSlips(cleanUserId, cleanEmail);

    const slipMap = new Map<string, Slip>();
    // Priority: cloud slips first
    for (const s of cloudSlips) {
      slipMap.set(s.token || s.id, s);
    }
    // Merge filtered local slips
    for (const s of filteredLocal) {
      const key = s.token || s.id;
      if (!slipMap.has(key)) {
        slipMap.set(key, s);
      }
    }

    return Array.from(slipMap.values());
  } catch {
    return [];
  }
}

/** Get all known locations for wayfinding */
export async function getKnownLocations(): Promise<KnownLocation[]> {
  await sleep(150);
  return KNOWN_LOCATIONS;
}

/** Get wayfinding steps from a known location to a department */
export async function getWayfinding(
  fromLocationId: string,
  departmentId: string
): Promise<WayfindingResult> {
  await sleep(350);

  const location = KNOWN_LOCATIONS.find((l) => l.id === fromLocationId);
  const department = DEPARTMENTS.find((d) => d.id === departmentId);

  if (!location || !department) {
    throw new Error('Invalid location or department');
  }

  const steps = generateStepsFromLocation(location, department);
  const totalMinutes = Math.max(1, department.estimatedWalkMinutes - 2);

  return {
    fromLocation: location.labelKey,
    department,
    steps,
    totalEstimatedMinutes: totalMinutes,
  };
}

/** Search departments by name query */
export async function searchDepartments(query: string): Promise<Department[]> {
  await sleep(150);
  if (!query.trim()) return DEPARTMENTS;
  const q = query.toLowerCase();
  return DEPARTMENTS.filter(
    (d) =>
      d.nameKey.toLowerCase().includes(q) ||
      d.landmark.toLowerCase().includes(q) ||
      d.building.toLowerCase().includes(q)
  );
}
