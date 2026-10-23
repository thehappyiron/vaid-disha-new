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
  const authUser = authRaw ? JSON.parse(authRaw) : null;
  const isGuest = authUser ? Boolean(authUser.isGuest) : true;

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
    patientName,
    patientAge,
    patientGender,
    accessibilityNeeds,
    isGuest,
    userId: authUser?.id,
    additionalNoteKey: department.category === 'emergency' ? 'slip.note_emergency' : undefined,
  };

  await saveSlip(slip, isGuest);

  return slip;
}

const SLIPS_STORAGE_KEY = 'vd-patient-slips';
const LATEST_SLIP_KEY = 'vd-latest-slip';

/** Save or update a slip in persistent localStorage */
export async function saveSlip(slip: Slip, isGuest?: boolean): Promise<Slip> {
  try {
    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const list: Slip[] = raw ? JSON.parse(raw) : [];

    const authRaw = localStorage.getItem('vd-auth-user');
    const authUser = authRaw ? JSON.parse(authRaw) : null;
    const determinedIsGuest = isGuest ?? (authUser ? Boolean(authUser.isGuest) : true);

    const enrichedSlip: Slip = {
      ...slip,
      isGuest: determinedIsGuest,
      userId: authUser?.id,
    };

    const existingIndex = list.findIndex((s) => s.id === slip.id);
    if (existingIndex >= 0) {
      list[existingIndex] = enrichedSlip;
    } else {
      list.unshift(enrichedSlip);
    }

    localStorage.setItem(SLIPS_STORAGE_KEY, JSON.stringify(list));
    localStorage.setItem(LATEST_SLIP_KEY, JSON.stringify(enrichedSlip));

    // If registered user, also append to visits in authUser
    if (authUser && !authUser.isGuest) {
      const existingVisits = authUser.visits || [];
      const hasVisit = existingVisits.some((v: any) => v.id === slip.id || v.tokenNumber === slip.token);
      if (!hasVisit) {
        authUser.visits = [
          {
            id: slip.id,
            date: new Date(slip.generatedAt).toISOString().split('T')[0],
            departmentName: slip.department.nameKey,
            doctorName: slip.doctorName || slip.department.doctorName || 'Doctor on Duty',
            tokenNumber: slip.token,
            diagnosisSummary: `Outpatient consultation. Queue Token #${slip.token}. Room ${slip.roomNumber || slip.department.roomNumbers[0]}.`,
            status: 'in_progress',
          },
          ...existingVisits,
        ];
        localStorage.setItem('vd-auth-user', JSON.stringify(authUser));
      }
    }

    return enrichedSlip;
  } catch (err) {
    console.warn('Failed to save slip to localStorage', err);
    return slip;
  }
}

/** Retrieve a slip by ID or get the latest active slip */
export async function getSlipById(id: string): Promise<Slip | null> {
  await sleep(100);
  try {
    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const list: Slip[] = raw ? JSON.parse(raw) : [];
    const found = list.find((s) => s.id === id);
    if (found) return found;

    // Check latest slip
    const latestRaw = localStorage.getItem(LATEST_SLIP_KEY);
    if (latestRaw) {
      const latest: Slip = JSON.parse(latestRaw);
      if (latest.id === id || id === 'latest') return latest;
    }

    // Fallback realistic mock slip if ID doesn't exist
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
      patientName: 'Ramesh Sharma',
      patientAge: 68,
      patientGender: 'Male',
      isGuest: false,
    };
    return fallbackSlip;
  } catch {
    return null;
  }
}

/** Get list of all previous slips for the patient */
export async function getPatientSlipHistory(userId?: string): Promise<Slip[]> {
  await sleep(150);
  try {
    const raw = localStorage.getItem(SLIPS_STORAGE_KEY);
    const list: Slip[] = raw ? JSON.parse(raw) : [];
    if (userId) {
      return list.filter((s) => s.userId === userId || !s.userId);
    }
    return list;
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
