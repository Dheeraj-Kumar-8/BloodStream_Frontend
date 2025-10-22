import apiClient from './api';
import { BloodBank } from '../types';

export const listBloodBanks = async (params?: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  search?: string;
}) => {
  const { data } = await apiClient.get('/bloodbanks', { params });
  return data as BloodBank[];
};

export const createBloodBank = async (payload: Partial<BloodBank>) => {
  const { data } = await apiClient.post('/bloodbanks', payload);
  return data as BloodBank;
};

export const updateBloodBank = async (bloodBankId: string, payload: Partial<BloodBank>) => {
  const { data } = await apiClient.put(`/bloodbanks/${bloodBankId}`, payload);
  return data as BloodBank;
};

export const getBloodBank = async (bloodBankId: string) => {
  const { data } = await apiClient.get(`/bloodbanks/${bloodBankId}`);
  return data as BloodBank;
};
