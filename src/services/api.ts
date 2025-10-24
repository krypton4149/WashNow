import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Base API configuration
const API_BASE_URL = 'https://carwashapp.shoppypie.in/api/v1';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Bad Request');
        case 401:
          throw new Error('Unauthorized');
        case 422:
          throw new Error(data.message || 'Validation Error');
        case 500:
          throw new Error('Internal Server Error');
        default:
          throw new Error(data.message || 'An error occurred');
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network Error - Please check your internet connection');
    } else {
      // Something else happened
      throw new Error('An unexpected error occurred');
    }
  }
);

export default apiClient;

