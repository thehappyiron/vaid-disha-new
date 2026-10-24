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

import { syncUserProfileToSupabase, fetchSupabaseUser } from '../services/supabaseClient';

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
    name?: string
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

  // Attempt to refresh user data from Supabase in the background
  useEffect(() => {
    if (user?.id && !user.isGuest) {
      fetchSupabaseUser(user.id).then((cloudUser) => {
        if (cloudUser && cloudUser.name && cloudUser.name !== 'Patient') {
          setUser((prev) => (prev ? { ...prev, ...cloudUser } : cloudUser));
        }
      });
    }
  }, [user?.id, user?.isGuest]);

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      syncUserProfileToSupabase(updated);
      return updated;
    });
  };

  const loginAsPatientWithOtp = async (
    phone: string,
    _otp: string,
    email?: string,
    name?: string
  ): Promise<UserProfile> => {
    const normalizedEmail = email?.trim().toLowerCase();
    const patientId =
      phone && MOCK_REGISTERED_PATIENT.phone === phone
        ? MOCK_REGISTERED_PATIENT.id
        : `pat-${phone.slice(-4)}-${Date.now().toString().slice(-5)}`;

    // Determine clean authentic patient name
    const cleanName =
      name?.trim() ||
      (phone === MOCK_REGISTERED_PATIENT.phone ? MOCK_REGISTERED_PATIENT.name : '') ||
      deriveNameFromEmail(normalizedEmail) ||
      'Registered Patient';

    const registeredUser: UserProfile = {
      ...MOCK_REGISTERED_PATIENT,
      id: patientId,
      name: cleanName,
      phone: phone || MOCK_REGISTERED_PATIENT.phone,
      email: normalizedEmail,
      emailVerified: Boolean(normalizedEmail),
      visits: phone === MOCK_REGISTERED_PATIENT.phone ? MOCK_REGISTERED_PATIENT.visits : [],
      reports: phone === MOCK_REGISTERED_PATIENT.phone ? MOCK_REGISTERED_PATIENT.reports : [],
    };

    setUser(registeredUser);
    syncUserProfileToSupabase(registeredUser);
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
