import apiClient from './api';

export const fetchOverview = async () => {
  const { data } = await apiClient.get('/analytics/overview');
  return data as {
    users: Array<{ _id: string; count: number }>;
    requests: Array<{ _id: string; count: number }>;
    deliveries: Array<{ _id: string; count: number }>;
    appointments: Array<{ _id: string; count: number }>;
  };
};

export const fetchDonorPerformance = async () => {
  const { data } = await apiClient.get('/analytics/donor-performance');
  return data as {
    topDonors: Array<{
      firstName: string;
      lastName: string;
      bloodType: string;
      donorProfile: { totalDonations: number; lastDonationDate?: string };
    }>;
    availability: Array<{ _id: boolean; count: number }>;
  };
};

export const fetchRecipientInsights = async () => {
  const { data } = await apiClient.get('/analytics/recipient-insights');
  return data as Array<{
    _id: string;
    recipient: { firstName: string; lastName: string };
    totalRequests: number;
    completed: number;
    successRate: number;
  }>;
};

export const fetchDeliveryMetrics = async () => {
  const { data } = await apiClient.get('/analytics/delivery-metrics');
  return data as Array<{
    status: string;
    count: number;
    avgDurationMinutes: number | null;
  }>;
};
