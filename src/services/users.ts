import apiClient from './api';
import { PaginatedResponse, User } from '../types';

export const fetchCurrentUser = async () => {
  const { data } = await apiClient.get('/users/me');
  return data as User;
};

export const updateProfile = async (payload: Partial<User>) => {
  const { data } = await apiClient.put('/users/me', payload);
  return data as User;
};

export const listUsers = async (params?: { role?: string; page?: number; limit?: number }) => {
  const { data } = await apiClient.get('/users', { params });
  return data as PaginatedResponse<User>;
};

export const nearbyDonors = async (params: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  recipientBloodType?: string;
}) => {
  const { data } = await apiClient.get('/users/donors/nearby', { params });
  return data as Array<User & { distanceKm?: number; compatibilityScore?: number }>;
};

export const donorAvailabilitySummary = async () => {
  const { data } = await apiClient.get('/users/donors/availability');
  return data as { availability: { available: number; unavailable: number }; topDonors: User[] };
};

export const getHealthMetrics = async (params?: { limit?: number }) => {
  const { data } = await apiClient.get('/users/me/health', { params });
  return data as Array<{
    hemoglobin?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    pulse?: number;
    weight?: number;
    notes?: string;
    recordedAt: string;
  }>;
};

export const addHealthMetric = async (payload: {
  hemoglobin?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  pulse?: number;
  weight?: number;
  notes?: string;
  recordedAt?: string;
}) => {
  const { data } = await apiClient.post('/users/me/health', payload);
  return data;
};
