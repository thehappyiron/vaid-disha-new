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

interface AuthContextValue {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  loginAsPatientWithOtp: (phone: string, otp: string) => Promise<boolean>;
  loginAsGuest: () => UserProfile;
  loginAsStaff: (staffId: string, password?: string) => Promise<boolean>;
  logout: () => void;
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
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const loginAsPatientWithOtp = async (phone: string, _otp: string): Promise<boolean> => {
    // Simulate brief network delay
    await new Promise((resolve) => setTimeout(resolve, 350));
    // Any 4 digits are accepted for demo; create or return registered patient profile
    const registeredUser: UserProfile = {
      ...MOCK_REGISTERED_PATIENT,
      phone: phone || MOCK_REGISTERED_PATIENT.phone,
    };
    setUser(registeredUser);
    return true;
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
