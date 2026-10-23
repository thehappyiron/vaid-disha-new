import type { UserProfile } from '../types';

export const MOCK_REGISTERED_PATIENT: UserProfile = {
  id: 'pat-98765',
  name: 'Ramesh Sharma',
  phone: '9876543210',
  role: 'registered',
  isGuest: false,
  age: 68,
  gender: 'Male',
  bloodGroup: 'B+',
  abhaId: '12-3456-7890-1234',
  visits: [
    {
      id: 'vis-101',
      date: '2026-10-15',
      departmentName: 'Cardiology OPD',
      doctorName: 'Dr. S. Sharma',
      tokenNumber: 'CARD-102',
      diagnosisSummary: 'Routine hypertension follow-up. Blood pressure stabilized at 130/85. Prescription refilled.',
      status: 'completed',
    },
    {
      id: 'vis-102',
      date: '2026-09-02',
      departmentName: 'Blood Test Laboratory',
      doctorName: 'Dr. V. Rao',
      tokenNumber: 'LAB-44',
      diagnosisSummary: 'Complete Blood Count (CBC) and Lipid Profile. Normal values.',
      status: 'completed',
    },
    {
      id: 'vis-103',
      date: '2026-07-20',
      departmentName: 'General OPD',
      doctorName: 'Dr. A. Verma',
      tokenNumber: 'OPD-88',
      diagnosisSummary: 'Seasonal viral fever treatment and vitamin supplementation.',
      status: 'completed',
    },
  ],
  reports: [
    {
      id: 'rep-1',
      title: 'Lipid Profile & Serum Creatinine',
      date: '2026-09-03',
      department: 'Pathology Lab',
      fileSize: '1.2 MB',
    },
    {
      id: 'rep-2',
      title: 'Chest X-Ray Digital',
      date: '2026-07-21',
      department: 'Radiology',
      fileSize: '3.4 MB',
    },
    {
      id: 'rep-3',
      title: 'ECG Report (12-Lead)',
      date: '2026-10-15',
      department: 'Cardiology',
      fileSize: '850 KB',
    },
  ],
};

export function createMockGuestUser(): UserProfile {
  const guestId = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `guest-${guestId}`,
    name: `Guest Patient #${guestId}`,
    role: 'guest',
    isGuest: true,
    visits: [],
    reports: [],
  };
}

export const MOCK_STAFF_USER: UserProfile = {
  id: 'stf-402',
  staffId: 'STF-101',
  name: 'Dr. Ananya Iyer',
  phone: '9822012345',
  designation: 'Senior Medical Officer / OPD Registrar',
  department: 'General OPD & Triage',
  role: 'staff',
  isGuest: false,
};

/** Mock queue demonstrating (Guest) tagging for staff view */
export const MOCK_PATIENT_QUEUE: {
  token: string;
  patientName: string;
  isGuest: boolean;
  department: string;
  status: 'waiting' | 'in_consultation' | 'completed';
  time: string;
}[] = [
  {
    token: 'OPD-101',
    patientName: 'Ramesh Sharma',
    isGuest: false,
    department: 'General OPD',
    status: 'in_consultation',
    time: '10:00 AM',
  },
  {
    token: 'OPD-102',
    patientName: 'Priya Nair',
    isGuest: true,
    department: 'General OPD',
    status: 'waiting',
    time: '10:15 AM',
  },
  {
    token: 'OPD-103',
    patientName: 'Amit Patel',
    isGuest: true,
    department: 'General OPD',
    status: 'waiting',
    time: '10:20 AM',
  },
  {
    token: 'OPD-104',
    patientName: 'Sunita Deshmukh',
    isGuest: false,
    department: 'General OPD',
    status: 'waiting',
    time: '10:35 AM',
  },
];
