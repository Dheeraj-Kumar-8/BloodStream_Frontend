import apiClient from './api';
import { Delivery, PaginatedResponse } from '../types';

export const listDeliveries = async (params?: { page?: number; limit?: number; status?: string }) => {
  const { data } = await apiClient.get('/deliveries', { params });
  return data as PaginatedResponse<Delivery>;
};

export const createDelivery = async (payload: {
  requestId: string;
  donorId?: string;
  deliveryPersonId: string;
  pickupEta?: string;
  dropoffEta?: string;
}) => {
  const { data } = await apiClient.post('/deliveries', payload);
  return data as Delivery;
};

export const updateDeliveryStatus = async (
  deliveryId: string,
  payload: { status: string; pickupEta?: string; dropoffEta?: string }
) => {
  const { data } = await apiClient.post(`/deliveries/${deliveryId}/status`, payload);
  return data as Delivery;
};

export const addTrackingEvent = async (
  deliveryId: string,
  payload: { status: string; coordinates?: [number, number]; notes?: string }
) => {
  const { data } = await apiClient.post(`/deliveries/${deliveryId}/track`, payload);
  return data as Delivery;
};
