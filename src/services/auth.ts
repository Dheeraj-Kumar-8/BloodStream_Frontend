import apiClient from './api';
import { User } from '../types';

interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'donor' | 'recipient' | 'delivery' | 'admin';
  bloodType?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const register = async (payload: RegisterPayload) => {
  const normalizeIndianPhone = (raw: string) => {
    if (!raw) return raw;
    // strip non-digits
    const digits = raw.replace(/\D/g, '');
    // remove leading 0 if present
    let d = digits.replace(/^0+/, '');
    // if starts with 91 and length 12, drop leading 91 to make 10
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    // if length 10, prefix +91
    if (d.length === 10) return `+91${d}`;
    // if already like 91XXXXXXXXXX (11/12), coerce to +91XXXXXXXXXX when possible
    if (d.length === 11 && d.startsWith('91')) return `+${d}`;
    if (d.length === 12 && d.startsWith('91')) return `+${d}`;
    // fallback: if already starts with +, keep
    if (raw.trim().startsWith('+')) return raw.trim();
    return raw.trim();
  };

  const withNormalizedPhone = {
    ...payload,
    phoneNumber: normalizeIndianPhone(payload.phoneNumber),
  };

  const { data } = await apiClient.post('/auth/register', withNormalizedPhone);
  return data as { user: User; message: string; otp?: string };
};

export const sendOtp = async (payload: { email?: string; phoneNumber?: string; userId?: string }) => {
  const normalizeIndianPhone = (raw?: string) => {
    if (!raw) return raw;
    const digits = raw.replace(/\D/g, '');
    let d = digits.replace(/^0+/, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    if (d.length === 10) return `+91${d}`;
    if (d.length === 11 && d.startsWith('91')) return `+${d}`;
    if (d.length === 12 && d.startsWith('91')) return `+${d}`;
    if (raw.trim().startsWith('+')) return raw.trim();
    return raw.trim();
  };

  const withNormalized = {
    ...payload,
    phoneNumber: normalizeIndianPhone(payload.phoneNumber),
  };

  const { data } = await apiClient.post('/auth/otp/send', withNormalized);
  return data as { message: string; debugCode?: string };
};

export const verifyOtp = async (payload: { email: string; otp: string }) => {
  const { data } = await apiClient.post('/auth/otp/verify', {
    email: payload.email,
    code: payload.otp,
  });
  return data as { user: User };
};

export const login = async (payload: LoginPayload) => {
  const { data } = await apiClient.post('/auth/login', payload);
  return data as { user: User };
};

export const refreshSession = async () => {
  const { data } = await apiClient.post('/auth/refresh');
  return data as { user: User };
};

export const fetchSession = async () => {
  const { data } = await apiClient.get('/auth/session');
  return data as { user: User };
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
};
