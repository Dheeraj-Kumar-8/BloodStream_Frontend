import apiClient from './api';
import { Appointment, PaginatedResponse } from '../types';

export const createAppointment = async (payload: {
  bloodBankId: string;
  scheduledAt: string;
  notes?: string;
}) => {
  const { data } = await apiClient.post('/appointments', payload);
  return data as Appointment;
};

export const listAppointments = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  donorId?: string;
}) => {
  const { data } = await apiClient.get('/appointments', { params });
  return data as PaginatedResponse<Appointment>;
};

export const updateAppointment = async (
  appointmentId: string,
  payload: { status?: string; scheduledAt?: string; notes?: string }
) => {
  const { data } = await apiClient.put(`/appointments/${appointmentId}`, payload);
  return data as Appointment;
};
