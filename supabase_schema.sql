-- ==============================================================================
-- VAID DISHA HOSPITAL MANAGEMENT - SUPABASE DATABASE SCHEMA
-- Project ID: ebbuihktuumeazkyuscg
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. USERS & PATIENT PROFILES
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'registered',
  is_guest BOOLEAN DEFAULT FALSE,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  abha_id TEXT,
  staff_id TEXT,
  designation TEXT,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. OPD & DIAGNOSTIC VISIT SLIPS
CREATE TABLE IF NOT EXISTS public.slips (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  patient_email TEXT,
  department_id TEXT,
  department_name TEXT,
  doctor_name TEXT,
  room_number TEXT,
  floor INTEGER,
  wing TEXT,
  purpose_id TEXT,
  status TEXT DEFAULT 'waiting',
  estimated_wait INTEGER DEFAULT 15,
  people_ahead INTEGER DEFAULT 3,
  accessibility_needs TEXT[] DEFAULT '{}',
  navigation_steps JSONB DEFAULT '[]'::jsonb,
  human_readable_direction TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PAST VISITS & CONSULTATION RECORDS
CREATE TABLE IF NOT EXISTS public.visits (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  token_number TEXT,
  patient_name TEXT,
  department_name TEXT,
  doctor_name TEXT,
  date TEXT,
  diagnosis_summary TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DIAGNOSTIC MEDICAL LAB REPORTS
CREATE TABLE IF NOT EXISTS public.medical_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  department TEXT,
  date TEXT,
  file_size TEXT,
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ATTENDANT NOTIFICATION CONTACTS
CREATE TABLE IF NOT EXISTS public.attendant_contacts (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL,
  patient_name TEXT,
  patient_email TEXT,
  attendant_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. EMAIL LOGS & DELIVERY AUDIT
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  token TEXT,
  subject TEXT,
  status TEXT DEFAULT 'sent',
  resend_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & REAL-TIME QUEUE LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_slips_user_id ON public.slips(user_id);
CREATE INDEX IF NOT EXISTS idx_slips_token ON public.slips(token);
CREATE INDEX IF NOT EXISTS idx_slips_status ON public.slips(status);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_attendants_token ON public.attendant_contacts(token);
CREATE INDEX IF NOT EXISTS idx_email_logs_token ON public.email_notifications(token);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients full read/write access for web app functionality
DO $$
BEGIN
  -- users
  DROP POLICY IF EXISTS "Public access on users" ON public.users;
  CREATE POLICY "Public access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

  -- slips
  DROP POLICY IF EXISTS "Public access on slips" ON public.slips;
  CREATE POLICY "Public access on slips" ON public.slips FOR ALL USING (true) WITH CHECK (true);

  -- visits
  DROP POLICY IF EXISTS "Public access on visits" ON public.visits;
  CREATE POLICY "Public access on visits" ON public.visits FOR ALL USING (true) WITH CHECK (true);

  -- medical_reports
  DROP POLICY IF EXISTS "Public access on medical_reports" ON public.medical_reports;
  CREATE POLICY "Public access on medical_reports" ON public.medical_reports FOR ALL USING (true) WITH CHECK (true);

  -- attendant_contacts
  DROP POLICY IF EXISTS "Public access on attendant_contacts" ON public.attendant_contacts;
  CREATE POLICY "Public access on attendant_contacts" ON public.attendant_contacts FOR ALL USING (true) WITH CHECK (true);

  -- email_notifications
  DROP POLICY IF EXISTS "Public access on email_notifications" ON public.email_notifications;
  CREATE POLICY "Public access on email_notifications" ON public.email_notifications FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- INITIAL SAMPLE DATA (DEMO PATIENT)
-- ==============================================================================
INSERT INTO public.users (id, name, phone, email, email_verified, role, is_guest, age, gender, blood_group, abha_id)
VALUES (
  'pat-98765',
  'Ramesh Sharma',
  '9876543210',
  'ramesh.sharma@example.com',
  true,
  'registered',
  false,
  68,
  'Male',
  'B+',
  '12-3456-7890-1234'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone;

INSERT INTO public.visits (id, user_id, token_number, patient_name, department_name, doctor_name, date, diagnosis_summary, status)
VALUES
  ('vis-101', 'pat-98765', 'CARD-102', 'Ramesh Sharma', 'Cardiology OPD', 'Dr. S. Sharma', '2026-10-15', 'Routine hypertension follow-up. Blood pressure stabilized at 130/85. Prescription refilled.', 'completed'),
  ('vis-102', 'pat-98765', 'LAB-44', 'Ramesh Sharma', 'Blood Test Laboratory', 'Dr. V. Rao', '2026-09-02', 'Complete Blood Count (CBC) and Lipid Profile. Normal values.', 'completed'),
  ('vis-103', 'pat-98765', 'OPD-88', 'Ramesh Sharma', 'General OPD', 'Dr. A. Verma', '2026-07-20', 'Seasonal viral fever treatment and vitamin supplementation.', 'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.medical_reports (id, user_id, title, department, date, file_size, summary)
VALUES
  ('rep-1', 'pat-98765', 'Lipid Profile & Serum Creatinine', 'Pathology Lab', '2026-09-03', '1.2 MB', 'Cholesterol levels optimal. Creatinine 0.9 mg/dL within normal range.'),
  ('rep-2', 'pat-98765', 'Chest X-Ray Digital', 'Radiology', '2026-07-21', '3.4 MB', 'Bilateral lung fields clear. No active pulmonary infiltration.'),
  ('rep-3', 'pat-98765', 'ECG Report (12-Lead)', 'Cardiology', '2026-10-15', '850 KB', 'Normal sinus rhythm. Heart rate 72 bpm.')
ON CONFLICT (id) DO NOTHING;
