import { create, StoreApi } from 'zustand';
import { User } from '../types';
import {
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyOtp as verifyOtpRequest,
  refreshSession,
} from '../services/auth';
import { updateProfile as updateProfileRequest } from '../services/users';

export interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  otpHint?: string;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: Parameters<typeof registerRequest>[0]) => Promise<string | undefined>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  updateProfile: (payload: Parameters<typeof updateProfileRequest>[0]) => Promise<void>;
}

type AuthStoreCreator = (
  set: StoreApi<AuthState>['setState'],
  get: StoreApi<AuthState>['getState']
) => AuthState;

const authStore: AuthStoreCreator = (set) => ({
  user: null,
  status: 'idle',
  otpHint: undefined,
  initialize: async () => {
    set({ status: 'loading' });
    try {
      const { user } = await fetchSession();
      set({ user, status: 'authenticated' });
    } catch (error) {
      try {
        const { user } = await refreshSession();
        set({ user, status: 'authenticated' });
      } catch (innerError) {
        set({ user: null, status: 'unauthenticated' });
      }
    }
  },
  login: async (email: string, password: string) => {
    const { user } = await loginRequest({ email, password });
    set({ user, status: 'authenticated' });
  },
  logout: async () => {
    await logoutRequest();
    set({ user: null, status: 'unauthenticated' });
  },
  register: async (payload: Parameters<typeof registerRequest>[0]) => {
    const { otp } = await registerRequest(payload);
    set({ otpHint: otp });
    return otp;
  },
  verifyOtp: async (email: string, otp: string) => {
    const { user } = await verifyOtpRequest({ email, otp });
    set({ user, status: 'authenticated', otpHint: undefined });
  },
  updateProfile: async (payload: Parameters<typeof updateProfileRequest>[0]) => {
    const updatedUser = await updateProfileRequest(payload);
    set({ user: updatedUser });
  },
});

export const useAuthStore = create<AuthState>()(authStore);
