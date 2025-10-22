import apiClient from './api';
import { BloodRequest, PaginatedResponse } from '../types';

export const createRequest = async (payload: {
  bloodType: string;
  unitsNeeded: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  hospital?: {
    name?: string;
    address?: string;
    location?: {
      coordinates?: [number, number];
    };
  };
  notes?: string;
}) => {
  const { data } = await apiClient.post('/requests', payload);
  return data as BloodRequest;
};

export const listRequests = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  urgency?: string;
}) => {
  const { data } = await apiClient.get('/requests', { params });
  return data as PaginatedResponse<BloodRequest>;
};

export const getRequest = async (requestId: string) => {
  const { data } = await apiClient.get(`/requests/${requestId}`);
  return data as BloodRequest;
};

export const matchDonors = async (requestId: string) => {
  const { data } = await apiClient.post(`/requests/${requestId}/match`);
  return data as BloodRequest;
};

export const escalateEmergency = async (requestId: string) => {
  const { data } = await apiClient.post(`/requests/${requestId}/escalate`);
  return data as BloodRequest;
};

export const acceptRequest = async (requestId: string) => {
  const { data } = await apiClient.post(`/requests/${requestId}/accept`);
  return data as BloodRequest;
};

export const declineRequest = async (requestId: string) => {
  const { data } = await apiClient.post(`/requests/${requestId}/decline`);
  return data as BloodRequest;
};
