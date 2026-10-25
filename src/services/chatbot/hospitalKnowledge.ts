/**
 * Vaid Disha Hospital Context & Knowledge Base
 * 
 * Provides verified hospital navigation, departments, doctors, facilities,
 * patient live queue details, and strict contextual guardrails for Groq AI.
 */

import type { ChatAction, ChatContext } from './types';
import type { Slip } from '../../types';
import { getPatientLiveDetails } from '../liveStore';

export interface PatientLiveContext {
  patientName?: string;
  token?: string;
  departmentName?: string;
  doctorName?: string;
  roomNumber?: string;
  peopleAhead?: number;
  estimatedWaitMinutes?: number;
  accessibilityNeeds?: string[];
  currentLocation?: string;
  reportsReady?: boolean;
}

export function getStoredSlip(): Slip | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('vd-latest-slip');
    if (!raw) return null;
    return JSON.parse(raw) as Slip;
  } catch {
    return null;
  }
}

/**
 * Fetch real-time patient queue details from liveStore
 */
export async function getLivePatientContext(context?: ChatContext): Promise<PatientLiveContext> {
  const slip = getStoredSlip();
  const res: PatientLiveContext = {
    patientName: slip?.patientName,
    token: slip?.token,
    departmentName: slip?.department?.nameKey || 'Consultation OPD',
    doctorName: slip?.department?.doctorName,
    roomNumber: slip?.roomNumber || slip?.department?.roomNumbers?.[0] || 'Room A-101',
    peopleAhead: slip?.peopleAhead ?? 1,
    estimatedWaitMinutes: slip?.estimatedWait ?? 15,
    accessibilityNeeds: slip?.accessibilityNeeds || context?.accessibilityNeeds,
    currentLocation: context?.currentLocation || (typeof window !== 'undefined' ? localStorage.getItem('vd-last-location') || undefined : undefined),
    reportsReady: true,
  };

  if (slip?.token) {
    try {
      const live = await getPatientLiveDetails(slip.token, slip.department?.id);
      if (live.estimatedWaitMinutes !== undefined) {
        res.estimatedWaitMinutes = live.estimatedWaitMinutes;
        res.peopleAhead = live.peopleAhead;
      }
      if (live.department?.roomNumber) {
        res.roomNumber = live.department.roomNumber;
      }
      if (live.department?.activeDoctorName) {
        res.doctorName = live.department.activeDoctorName;
      }
    } catch {
      // fallback to slip values
    }
  }

  return res;
}

/**
 * Strict Off-Topic Pre-Filter
 * Blocks general math (e.g. 2+2), coding, politics, and non-hospital queries with 0 latency.
 */
export function checkOffTopicQuery(query: string, lang = 'en'): string | null {
  const q = query.trim().toLowerCase();

  // Obvious math queries like "2+2", "what is 2+2", "calculate 4*5"
  const mathPattern = /^(what\s+is\s+)?(\d+\s*[\+\-\*\/xX÷]\s*\d+)|^\d+\s*[\+\-\*\/xX÷]\s*\d+/;
  // Marathi math queries like "२ अधिक २", "२+२", etc.
  const indicMathPattern = /^[०-९\d\s\+\-\*\/xX÷=]+$|^(२\s*अधिक\s*२|2\s*plus\s*2)/i;

  // General random topics not related to a hospital
  const randomTopics = /^(who\s+is\s+(the\s+)?president|who\s+won|write\s+(a\s+)?code|write\s+(a\s+)?python|tell\s+me\s+a\s+joke|what\s+is\s+the\s+capital|recipe\s+for|weather\s+in)/i;

  if (mathPattern.test(q) || indicMathPattern.test(q) || randomTopics.test(q)) {
    if (lang.startsWith('mr')) {
      return 'मी वैद्य दिशा आहे, आपला रुग्णालय सहाय्यक. मी केवळ रुग्णालय मार्गदर्शन, विभाग, रांगेची स्थिती, अहवाल आणि सुविधांशी संबंधित प्रश्नांमध्येच मदत करू शकतो.';
    }
    if (lang.startsWith('hi')) {
      return 'मैं वैद्य दिशा हूँ, आपका अस्पताल सहायक। मैं केवल अस्पताल मार्गदर्शन, विभागों, कतार की स्थिति, रिपोर्ट और सुविधाओं से संबंधित प्रश्नों में ही मदद कर सकता हूँ।';
    }
    return 'I am Vaid Disha, your hospital assistant. I can only assist with hospital navigation, departments, queue status, lab reports, and facilities.';
  }

  return null;
}

/**
 * Build the Comprehensive Hospital System Prompt for Groq AI
 */
export function buildHospitalSystemPrompt(patientContext?: PatientLiveContext): string {
  const patientInfo = patientContext && patientContext.token
    ? `\nCURRENT PATIENT ACTIVE SESSION:
- Patient Name: ${patientContext.patientName || 'Registered Patient'}
- Token ID: ${patientContext.token}
- Department: ${patientContext.departmentName || 'OPD'}
- Assigned Doctor: ${patientContext.doctorName || 'Consultant Doctor'}
- Consultation Room: ${patientContext.roomNumber || 'Room A-101'}
- Queue Status: ${patientContext.peopleAhead ?? 1} patients ahead in queue
- Estimated Wait Time: ${patientContext.estimatedWaitMinutes ?? 15} minutes
- Accessibility Needs: ${patientContext.accessibilityNeeds?.length ? patientContext.accessibilityNeeds.join(', ') : 'None reported'}
- Current / Last Location: ${patientContext.currentLocation || 'Ground Floor Main Lobby'}
- Diagnostic Reports: Complete Blood Count (CBC) and Urine Examination reports are ready in Pathology Lab.`
    : `\nCURRENT PATIENT SESSION:
- Guest/Unregistered Visitor: No active token yet. If they ask about room or wait, advise them to register or generate a visit slip at Registration Desk or online via 'Register Visit'.`;

  return `You are Vaid Disha (वैद्य दिशा), the smart AI hospital wayfinding and patient assistant for Vaid Disha Multi-Specialty Hospital and its web application.

YOUR PURPOSE AND SCOPE:
- You answer questions related to the hospital: medical departments, clinics, doctors, symptoms/reasons for visit, physical room locations, floors, facilities, queue wait times, visit slips, lab reports, and how to use the Vaid Disha web app (such as login, role selection, registering visits, and emergency routing).
- For ANY hospital department (like Dermatology, Cardiology, etc.), doctor, room, symptom, or app feature (like login, registration, slip, reports), ALWAYS answer helpfully with the exact details.

STRICT BOUNDARY (MANDATORY):
- ONLY refuse questions that are completely unrelated to the hospital, medical care, or the Vaid Disha web app (e.g. math puzzles like "what is 2+2", coding, recipes, general trivia, politics).
- If and only if a question is totally unrelated to the hospital or app (like "what is 2+2"), politely say: "I am Vaid Disha, your hospital and patient navigation assistant. I can only assist with hospital services, departments, clinics, queue status, reports, facilities, and app navigation." (in the user's language).
- Reply in the language of the user's query (English, Hindi, or Marathi).
- Keep answers concise, clear, and under 60 words. Never prescribe medication or give clinical diagnoses.

VERIFIED HOSPITAL DIRECTORY:
- Dermatology Clinic (Skin, Rash, Allergy, Hair): Building C, Floor 1, Room C-102 (East Wing, next to allergy testing room, Dr. K. Saxena).
- Cardiology Clinic (Heart, Chest Pain, BP): Building B, Floor 2, Rooms B-201 & B-202 (West Wing, blue signs, Dr. S. Sharma).
- Orthopaedics Clinic (Bones, Joints, Knee, Back): Building B, Floor 3, Rooms B-301 to B-303 (West Wing, follow orange floor tape, Dr. R. Patel).
- General Medicine OPD (Fever, Cold, Cough, Infection): Building A, Floor 1, Rooms A-101 to A-103 (North Wing, Dr. A. Verma).
- Pediatrics Clinic (Child Care & Vaccination): Building A, Floor 1, Rooms A-106 & A-107 (North Wing, next to play area, Dr. S. Gupta).
- Eye Clinic / Ophthalmology (Vision, Cataract): Building B, Floor 1, Room B-104 (West Wing, yellow corridor, Dr. N. Mehta).
- ENT Clinic (Ear, Nose, Throat): Building A, Floor 2, Rooms A-205 & A-206 (North Wing, Dr. P. Joshi).
- Neurology Clinic (Brain, Nerves, Spine, Headache): Building C, Floor 2, Rooms C-201 & C-202 (East Wing, Dr. M. Kulkarni).
- Emergency & Trauma Care (Casualty): Building E, Floor 0, Room E-01 (Red building left of main gate, 24/7 open, Dr. K. Deshmukh).
- Central Pathology Lab (Blood/Urine/CBC Tests): Building A, Floor 0, Rooms A-B01 & A-B02 (Dr. V. Rao).
- Radiology & Imaging (X-Ray, CT, Ultrasound, MRI): Building A, Floor 0, Room A-B05 (Dr. H. Balsara).
- Central Pharmacy: Building A, Floor 0, Room A-G12 (Right side of ground floor lobby).
- Wheelchair Stand: Ground floor main entrance (Pillar code: F0-WC1).
- Main Entrance Ramp: Step-free access at the main entrance.
- Accessible Washrooms: Ground Floor (washroom-f0) and First Floor (washroom-f1-acc). Regular washrooms on all floors.
- IPD Admissions: Building A, Floor 1, Room A-110.
- Discharge Services: Building A, Floor 1, Room A-112.
- Billing Counter: Building A, Floor 1, Room A-115.
- Canteen / Dining: Building D, Room D-G1.

VAID DISHA APP & WEB NAVIGATION:
- Login & Role Selection: Accessible at the home route ('/') or Role Selection ('/role') to sign in as a Patient or Hospital Staff.
- Staff Portal: Available at '/staff' for doctors, nurses, and hospital staff.
- Patient Home / Start: '/patient/start'
- Visit Registration: '/patient/visit' to register an OPD visit and generate a digital visit slip.
- Turn-by-turn Navigation: '/patient/guidance' with step-by-step directions to any room.
- Live Queue & Wait Times: '/patient/live' to view live token countdowns and queue position.
- Lab Reports: '/patient/reports' to view digital blood test and diagnostic reports.
- Hospital Facilities & Maps: '/patient/facilities' (washrooms, wheelchair stands, ramps, lifts, canteen).
- Emergency SOS: '/patient/emergency' to instantly alert emergency staff.
${patientInfo}`;
}

/**
 * Determine interactive deep links and quick action buttons based on query & response
 */
export function generateChatActions(
  query: string,
  replyText: string,
  patientContext?: PatientLiveContext
): ChatAction[] {
  const text = (query + ' ' + replyText).toLowerCase();
  const actions: ChatAction[] = [];
  const slipId = patientContext?.token;

  // Login / Role / Sign-in intent
  if (
    text.includes('login') ||
    text.includes('sign in') ||
    text.includes('signin') ||
    text.includes('role') ||
    text.includes('account') ||
    text.includes('लॉगिन') ||
    text.includes('साइन इन')
  ) {
    actions.push({ label: 'Login / Role Selection', route: '/role' });
    actions.push({ label: 'Patient Start', route: '/patient/start' });
    return actions;
  }

  // Emergency intent
  if (
    text.includes('emergency') ||
    text.includes('trauma') ||
    text.includes('urgent') ||
    text.includes('आपात') ||
    text.includes('तातडी')
  ) {
    actions.push({ label: 'Emergency Assistance', route: '/patient/emergency' });
    return actions;
  }

  // Room / Direction / Guidance / Clinic locations (including Dermatology, Cardiology, etc.)
  if (
    text.includes('room') ||
    text.includes('cabin') ||
    text.includes('where is') ||
    text.includes('direction') ||
    text.includes('reach') ||
    text.includes('guidance') ||
    text.includes('dermatology') ||
    text.includes('cardiology') ||
    text.includes('clinic') ||
    text.includes('कमरा') ||
    text.includes('खोली') ||
    text.includes('मार्ग') ||
    text.includes('रस्ता')
  ) {
    actions.push({
      label: 'Turn-by-turn Guidance',
      route: slipId ? `/patient/guidance/${slipId}` : '/patient/guidance',
    });
    if (slipId) {
      actions.push({ label: 'View Visit Slip', route: `/patient/slip/${slipId}` });
    } else {
      actions.push({ label: 'Hospital Facilities Map', route: '/patient/facilities' });
    }
  }

  // Queue / Wait time / Token
  if (
    text.includes('queue') ||
    text.includes('wait') ||
    text.includes('token') ||
    text.includes('turn') ||
    text.includes('कतार') ||
    text.includes('प्रतीक्षा') ||
    text.includes('रांग') ||
    text.includes('वेळ')
  ) {
    actions.push({ label: 'Live Queue Status', route: '/patient/live' });
    if (slipId && !actions.some((a) => a.route.includes('/slip'))) {
      actions.push({ label: 'View Visit Slip', route: `/patient/slip/${slipId}` });
    }
  }

  // Washroom / Toilet
  if (
    text.includes('washroom') ||
    text.includes('toilet') ||
    text.includes('restroom') ||
    text.includes('शौचालय') ||
    text.includes('प्रसाधन')
  ) {
    actions.push({ label: 'Washrooms Map', route: '/patient/facilities?filter=washroom' });
  }

  // Wheelchair / Ramp / Accessibility
  if (
    text.includes('wheelchair') ||
    text.includes('ramp') ||
    text.includes('lift') ||
    text.includes('elevator') ||
    text.includes('accessible') ||
    text.includes('अपंग') ||
    text.includes('दिव्यांग')
  ) {
    actions.push({ label: 'Accessibility & Ramps', route: '/patient/facilities?filter=wheelchair' });
  }

  // Lab reports
  if (
    text.includes('report') ||
    text.includes('test') ||
    text.includes('blood') ||
    text.includes('cbc') ||
    text.includes('pathology') ||
    text.includes('अहवाल') ||
    text.includes('तपासणी')
  ) {
    actions.push({ label: 'My Lab Reports', route: '/patient/reports' });
  }

  // Pharmacy / Medicine
  if (
    text.includes('pharmacy') ||
    text.includes('medicine') ||
    text.includes('drug') ||
    text.includes('दवा') ||
    text.includes('औषध')
  ) {
    actions.push({ label: 'Pharmacy Location', route: '/patient/facilities?filter=pharmacy' });
  }

  // Default fallback if no actions matched
  if (actions.length === 0) {
    if (slipId) {
      actions.push({ label: 'Help me find the way', route: `/patient/guidance/${slipId}` });
      actions.push({ label: 'View Live Queue', route: '/patient/live' });
    } else {
      actions.push({ label: 'Hospital Facilities Map', route: '/patient/facilities' });
      actions.push({ label: 'Register Visit', route: '/patient/visit' });
    }
  }

  // Limit to 2 primary actions for clean mobile UI
  return actions.slice(0, 2);
}
