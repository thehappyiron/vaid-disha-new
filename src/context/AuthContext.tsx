import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserProfile, UserRole } from '../types';
import {
  MOCK_REGISTERED_PATIENT,
  MOCK_STAFF_USER,
  createMockGuestUser,
} from '../data/mockUserData';

import {
  syncUserProfileToSupabase,
  fetchSupabaseUser,
  fetchSupabaseUserByEmailOrPhone,
  consolidateUserSlips,
  subscribeToRealtimeUser,
} from '../services/supabaseClient';

export function deriveNameFromEmail(email?: string): string {
  if (!email) return 'Registered Patient';
  const localPart = email.split('@')[0];
  if (!localPart) return 'Registered Patient';
  const cleaned = localPart.replace(/[0-9]+/g, ' ').replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Registered Patient';
  const words = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length > 0 ? words.join(' ') : 'Registered Patient';
}

interface AuthContextValue {
  user: UserProfile | null;
  staffUser: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isStaff: boolean;
  loginAsPatientWithOtp: (
    phone: string,
    otp: string,
    email?: string,
    name?: string,
    age?: number,
    gender?: string
  ) => Promise<UserProfile>;
  loginAsGuest: () => UserProfile;
  loginAsStaff: (staffId: string, password?: string) => Promise<boolean>;
  logout: (scope?: 'all' | 'patient' | 'staff') => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  getDisplayName: (customUser?: UserProfile | null) => string;
  switchPatientAccountByEmail: (email: string) => Promise<UserProfile | null>;
}

const STORAGE_KEY = 'vd-auth-user';
const PATIENT_BACKUP_KEY = 'vd-patient-user';
const STAFF_STORAGE_KEY = 'vd-auth-staff';

function loadStoredUser(): UserProfile | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as UserProfile;
      // If corrupted with staff credentials (e.g. Dr. Ananya Iyer / stf-402)
      if (parsed.role === 'staff' || parsed.id === 'stf-402' || parsed.id?.startsWith('stf-')) {
        // Move to staff key so staff login stays intact in staff portal
        localStorage.setItem(STAFF_STORAGE_KEY, raw);
        localStorage.removeItem(STORAGE_KEY);

        // Try to recover patient from backup key
        const backupRaw = localStorage.getItem(PATIENT_BACKUP_KEY);
        if (backupRaw) {
          try {
            const bUser = JSON.parse(backupRaw) as UserProfile;
            if (bUser && bUser.role !== 'staff' && !bUser.id?.startsWith('stf-')) {
              localStorage.setItem(STORAGE_KEY, backupRaw);
              return bUser;
            }
          } catch {}
        }

        // Try to recover from saved patient email
        const savedEmail = localStorage.getItem('vd-patient-email');
        if (savedEmail) {
          const derivedName = deriveNameFromEmail(savedEmail);
          const recoveredUser: UserProfile = {
            id: `pat-${savedEmail.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`,
            name: derivedName,
            email: savedEmail.toLowerCase().trim(),
            emailVerified: true,
            role: 'registered',
            isGuest: false,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveredUser));
          return recoveredUser;
        }

        return null;
      }
      return parsed;
    }

    // If STORAGE_KEY was empty, check backup
    const backupRaw = typeof window !== 'undefined' ? localStorage.getItem(PATIENT_BACKUP_KEY) : null;
    if (backupRaw) {
      try {
        const bUser = JSON.parse(backupRaw) as UserProfile;
        if (bUser && bUser.role !== 'staff' && !bUser.id?.startsWith('stf-')) {
          localStorage.setItem(STORAGE_KEY, backupRaw);
          return bUser;
        }
      } catch {}
    }

    const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('vd-patient-email') : null;
    if (savedEmail) {
      return {
        id: `pat-${savedEmail.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`,
        name: deriveNameFromEmail(savedEmail),
        email: savedEmail.toLowerCase().trim(),
        emailVerified: true,
        role: 'registered',
        isGuest: false,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function loadStoredStaff(): UserProfile | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STAFF_STORAGE_KEY) : null;
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(loadStoredUser);
  const [staffUser, setStaffUser] = useState<UserProfile | null>(loadStoredStaff);

  useEffect(() => {
    if (user) {
      // Ensure we NEVER write a staff user into the patient storage key
      if (user.role !== 'staff' && !user.id?.startsWith('stf-')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(PATIENT_BACKUP_KEY, JSON.stringify(user));
        if (user.email) {
          localStorage.setItem('vd-patient-email', user.email.toLowerCase().trim());
        }
        syncUserProfileToSupabase(user);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PATIENT_BACKUP_KEY);
    }
  }, [user]);

  // Attempt to refresh patient user data from Supabase and subscribe to realtime updates
  useEffect(() => {
    if (!user?.id || user.isGuest || user.role === 'staff' || user.id.startsWith('stf-')) return;

    let isMounted = true;
    fetchSupabaseUser(user.id).then((cloudUser) => {
      if (cloudUser && isMounted) {
        setUser((prev) => {
          if (!prev) return cloudUser;
          return {
            ...prev,
            ...cloudUser,
            // Keep local age/name if cloud was null
            age: cloudUser.age !== undefined ? cloudUser.age : prev.age,
            name: cloudUser.name && cloudUser.name !== 'Patient' ? cloudUser.name : prev.name,
          };
        });
      }
    });

    const unsubscribe = subscribeToRealtimeUser(user.id, (cloudUpdatedUser) => {
      if (!isMounted) return;
      setUser((prev) => (prev ? { ...prev, ...cloudUpdatedUser } : cloudUpdatedUser));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.id, user?.isGuest, user?.role]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      if (updated.role !== 'staff' && !updated.id?.startsWith('stf-')) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem(PATIENT_BACKUP_KEY, JSON.stringify(updated));
        if (updated.email) {
          localStorage.setItem('vd-patient-email', updated.email.toLowerCase().trim());
        }
        syncUserProfileToSupabase(updated);
      }
      return updated;
    });
  };

  const loginAsPatientWithOtp = async (
    phone: string,
    _otp: string,
    email?: string,
    name?: string,
    age?: number,
    gender?: string
  ): Promise<UserProfile> => {
    const cleanPhone = phone?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    // 1. Check if user already exists in Supabase
    let existingCloudUser: UserProfile | null = null;
    if (normalizedEmail || cleanPhone) {
      existingCloudUser = await fetchSupabaseUserByEmailOrPhone(normalizedEmail, cleanPhone);
    }

    // 2. Persistent stable ID: reuse existing ID or generate deterministic ID based on phone/email
    let patientId = existingCloudUser?.id;
    if (!patientId) {
      if (cleanPhone && cleanPhone === MOCK_REGISTERED_PATIENT.phone) {
        patientId = MOCK_REGISTERED_PATIENT.id;
      } else if (cleanPhone && cleanPhone.length >= 10) {
        patientId = `pat-${cleanPhone.slice(-10)}`;
      } else if (normalizedEmail) {
        patientId = `pat-${normalizedEmail.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;
      } else {
        patientId = `pat-${Date.now().toString().slice(-6)}`;
      }
    }

    // 3. Determine clean authentic patient name
    const cleanName =
      name?.trim() ||
      existingCloudUser?.name ||
      (cleanPhone === MOCK_REGISTERED_PATIENT.phone ? MOCK_REGISTERED_PATIENT.name : '') ||
      deriveNameFromEmail(normalizedEmail) ||
      'Registered Patient';

    // 4. Determine actual age (DO NOT default to 68 for everyone!)
    const resolvedAge =
      age !== undefined && age !== null && !isNaN(Number(age))
        ? Number(age)
        : existingCloudUser?.age !== undefined && existingCloudUser?.age !== null
        ? Number(existingCloudUser.age)
        : cleanPhone === MOCK_REGISTERED_PATIENT.phone
        ? MOCK_REGISTERED_PATIENT.age
        : undefined;

    // 5. Determine gender
    const resolvedGender =
      gender ||
      existingCloudUser?.gender ||
      (cleanPhone === MOCK_REGISTERED_PATIENT.phone ? MOCK_REGISTERED_PATIENT.gender : undefined);

    const isMockDemo = cleanPhone === MOCK_REGISTERED_PATIENT.phone;

    const registeredUser: UserProfile = {
      id: patientId,
      name: cleanName,
      phone: cleanPhone || existingCloudUser?.phone || (isMockDemo ? MOCK_REGISTERED_PATIENT.phone : undefined),
      email: normalizedEmail || existingCloudUser?.email,
      emailVerified: true,
      role: 'registered',
      isGuest: false,
      age: resolvedAge,
      gender: resolvedGender,
      bloodGroup: existingCloudUser?.bloodGroup || (isMockDemo ? MOCK_REGISTERED_PATIENT.bloodGroup : undefined),
      abhaId: existingCloudUser?.abhaId || (isMockDemo ? MOCK_REGISTERED_PATIENT.abhaId : undefined),
      visits: existingCloudUser?.visits || (isMockDemo ? MOCK_REGISTERED_PATIENT.visits : []),
      reports: existingCloudUser?.reports || (isMockDemo ? MOCK_REGISTERED_PATIENT.reports : []),
    };

    setUser(registeredUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser));
    await syncUserProfileToSupabase(registeredUser);

    // Consolidate any previous slips created with this email to the stable patientId
    if (registeredUser.email) {
      void consolidateUserSlips(registeredUser.id, registeredUser.email);
    }

    return registeredUser;
  };

  const loginAsGuest = (): UserProfile => {
    const guestUser = createMockGuestUser();
    setUser(guestUser);
    return guestUser;
  };

  const loginAsStaff = async (staffId: string, _password?: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const newStaffUser: UserProfile = {
      ...MOCK_STAFF_USER,
      staffId: staffId || MOCK_STAFF_USER.staffId,
    };
    setStaffUser(newStaffUser);
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(newStaffUser));
    return true;
  };

  const logout = (scope?: 'all' | 'patient' | 'staff') => {
    if (!scope || scope === 'patient' || scope === 'all') {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PATIENT_BACKUP_KEY);
      localStorage.removeItem('vd-patient-email');
    }
    if (!scope || scope === 'staff' || scope === 'all') {
      setStaffUser(null);
      localStorage.removeItem(STAFF_STORAGE_KEY);
    }
  };

  const switchPatientAccountByEmail = async (email: string): Promise<UserProfile | null> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    // 1. Fetch user from Supabase
    const cloudUser = await fetchSupabaseUserByEmailOrPhone(cleanEmail);
    if (cloudUser) {
      setUser(cloudUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudUser));
      localStorage.setItem(PATIENT_BACKUP_KEY, JSON.stringify(cloudUser));
      localStorage.setItem('vd-patient-email', cleanEmail);
      return cloudUser;
    }

    // 2. Fallback: check if there are slips for this email to derive patient details
    const derivedName = deriveNameFromEmail(cleanEmail);
    const deterministicId = `pat-${cleanEmail.replace(/[^a-z0-9]/gi, '').slice(0, 10)}`;

    const newUser: UserProfile = {
      id: deterministicId,
      name: derivedName,
      email: cleanEmail,
      emailVerified: true,
      role: 'registered',
      isGuest: false,
    };

    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(PATIENT_BACKUP_KEY, JSON.stringify(newUser));
    localStorage.setItem('vd-patient-email', cleanEmail);
    await syncUserProfileToSupabase(newUser);
    return newUser;
  };

  const getDisplayName = (customUser?: UserProfile | null): string => {
    const target = customUser !== undefined ? customUser : user;
    if (!target) return 'Not signed in';
    return target.isGuest ? `${target.name} (Guest)` : target.name;
  };

  const isStaff = !!staffUser || user?.role === 'staff';

  const value: AuthContextValue = {
    user,
    staffUser,
    role: user?.role ?? (staffUser ? 'staff' : null),
    isAuthenticated: !!user || !!staffUser,
    isGuest: !!user?.isGuest,
    isStaff,
    loginAsPatientWithOtp,
    loginAsGuest,
    loginAsStaff,
    logout,
    updateUserProfile,
    getDisplayName,
    switchPatientAccountByEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
