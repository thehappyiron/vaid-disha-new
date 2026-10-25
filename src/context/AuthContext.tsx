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
  role: UserRole | null;
  isAuthenticated: boolean;
  isGuest: boolean;
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
  logout: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  getDisplayName: (customUser?: UserProfile | null) => string;
}

const STORAGE_KEY = 'vd-auth-user';

function loadStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(loadStoredUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      syncUserProfileToSupabase(user);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  // Attempt to refresh user data from Supabase and subscribe to realtime updates
  useEffect(() => {
    if (!user?.id || user.isGuest) return;

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
  }, [user?.id, user?.isGuest]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      syncUserProfileToSupabase(updated);
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
    const staffUser: UserProfile = {
      ...MOCK_STAFF_USER,
      staffId: staffId || MOCK_STAFF_USER.staffId,
    };
    setUser(staffUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const getDisplayName = (customUser?: UserProfile | null): string => {
    const target = customUser !== undefined ? customUser : user;
    if (!target) return 'Not signed in';
    return target.isGuest ? `${target.name} (Guest)` : target.name;
  };

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    isAuthenticated: !!user,
    isGuest: !!user?.isGuest,
    loginAsPatientWithOtp,
    loginAsGuest,
    loginAsStaff,
    logout,
    updateUserProfile,
    getDisplayName,
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
