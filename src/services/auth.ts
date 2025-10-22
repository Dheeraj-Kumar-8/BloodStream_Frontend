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
  const { data } = await apiClient.post('/auth/register', payload);
  return data as { user: User; message: string; otp?: string };
};

export const sendOtp = async (payload: { email?: string; phoneNumber?: string; userId?: string }) => {
  const { data } = await apiClient.post('/auth/otp/send', payload);
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
