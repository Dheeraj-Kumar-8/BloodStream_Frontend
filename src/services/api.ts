import axios, { AxiosError, AxiosResponse } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('API error', error.response.data);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
