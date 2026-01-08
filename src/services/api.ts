import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_BASE_URL } from '../config/env';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Reduced to 10s for faster response
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding common headers
apiClient.interceptors.request.use(
  (config) => {
    // Add any common headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common error responses
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      // Create error with message but preserve original error structure
      const customError: any = new Error(data?.message || getDefaultErrorMessage(status));
      customError.response = error.response;
      customError.status = status;
      customError.data = data;
      
      return Promise.reject(customError);
    } else if (error.request) {
      // Request was made but no response received (network error, timeout, CORS, etc.)
      // Status 0 typically indicates network failure
      const isStatusZero = error.request.status === 0 || error.request.readyState === 4;
      const networkError: any = new Error('Network Error - Please check your internet connection');
      networkError.request = error.request;
      networkError.status = error.request.status || 0;
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// Helper function to get default error messages
function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 422:
      return 'Validation Error';
    case 500:
      return 'Internal Server Error';
    default:
      return 'An error occurred';
  }
}

export default apiClient;

