import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://carwashapp.shoppypie.in';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

// Cache configuration
const CACHE_KEYS = {
  BOOKINGS: 'cached_bookings',
  SERVICE_CENTERS: 'cached_service_centers',
  ALERTS: 'cached_alerts',
  OWNER_BOOKINGS: 'cached_owner_bookings',
  LOGIN_RESPONSE: 'cached_login_response',
};

const CACHE_DURATION = {
  BOOKINGS: 120000, // 2 minutes - increased for faster response
  SERVICE_CENTERS: 300000, // 5 minutes - increased for faster response
  ALERTS: 120000, // 2 minutes - increased for faster response
  OWNER_BOOKINGS: 120000, // 2 minutes - increased for faster response
  LOGIN_RESPONSE: 300000, // 5 minutes - cache login response
};

// Request timeout - increased for better reliability on slower connections
const REQUEST_TIMEOUT = 20000; // 20 seconds
const MAX_RETRIES = 2; // Maximum number of retry attempts for failed requests

class AuthService {
  // Store authentication token
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
      throw error;
    }
  }

  // Get authentication token
  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Remove authentication token
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  }

  // Store user data
  async setUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
      throw error;
    }
  }

  // Get user data
  async getUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Remove user data
  async removeUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Optionally validate token with backend
      // For now, just check if token exists
      return true;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Validate token with backend
  async validateToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      const response = await fetch(`${BASE_URL}/api/v1/auth/validate`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Clear all authentication data
  async clearAuth(): Promise<void> {
    try {
      await Promise.all([
        this.removeToken(),
        this.removeUser(),
      ]);
    } catch (error) {
      console.error('Error clearing auth:', error);
      throw error;
    }
  }

  // Helper method for fetch with timeout and retry logic
  private async fetchWithTimeout(
    url: string, 
    options: RequestInit, 
    timeout: number = REQUEST_TIMEOUT,
    retries: number = MAX_RETRIES
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Check if response is valid (status 0 usually means network error)
      if (!response || response.status === 0) {
        throw new Error('Network Error - Please check your internet connection');
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Check if it's a timeout or network error that can be retried
      const isRetryableError = 
        error.name === 'AbortError' || 
        error.message?.includes('Network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch');
      
      // Retry logic for network errors
      if (isRetryableError && retries > 0) {
        console.log(`Retrying request (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1)));
        return this.fetchWithTimeout(url, options, timeout, retries - 1);
      }
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your internet connection.');
      }
      
      // Handle network errors (no response, connection refused, etc.)
      if (error.message && error.message.includes('Network')) {
        throw error;
      }
      
      if (!error.response && !error.status) {
        throw new Error('Network Error - Please check your internet connection');
      }
      
      throw error;
    }
  }

  // Helper method to get cached data
  private async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      return { data, timestamp };
    } catch {
      return null;
    }
  }

  // Helper method to get cached data immediately (even if stale)
  private async getCachedDataImmediate(key: string): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;
      
      const { data } = JSON.parse(cached);
      return data; // Return data immediately, even if stale
    } catch {
      return null;
    }
  }

  // Helper method to set cached data
  private async setCachedData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      // Ignore cache errors
    }
  }

  // Helper method to check if cache is valid
  private isCacheValid(timestamp: number, duration: number): boolean {
    return Date.now() - timestamp < duration;
  }

  // Login method
  async login(emailOrPhone: string, password: string, loginType: 'email' | 'phone' = 'email'): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      // For phone OTP login, we'll simulate success since we don't have the actual API
      if (loginType === 'phone') {
        const mockToken = 'phone_otp_token_' + Date.now();
        const mockUser = {
          id: '1',
          email: emailOrPhone + '@phone.com',
          fullName: 'Phone User',
          phoneNumber: emailOrPhone,
          type: 'customer',
          status: 'Active'
        };

        await this.setToken(mockToken);
        await this.setUser(mockUser);

        return { success: true, token: mockToken, user: mockUser };
      }

      // Regular email login with timeout and retry
      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/auth/visitor/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailOrPhone,
          password: password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error parsing login response:', parseError);
        // If response is not ok, try to get error message from status
        if (!response.ok) {
          return {
            success: false,
            error: `Login failed with status ${response.status}. Please try again.`
          };
        }
        return {
          success: false,
          error: 'Invalid response from server. Please try again.'
        };
      }

      if (response.ok && data.success) {
        const token = data.data?.token;
        const userData = data.data?.userData;
        const loginType = data.data?.loginType || 'visitor';
        
        const user = {
          id: userData?.id?.toString() || '1',
          email: userData?.email || emailOrPhone,
          fullName: userData?.name || 'User',
          phoneNumber: userData?.phone || '',
          type: 'customer',
          loginType: loginType,
          status: userData?.status || 'Active',
          createdAt: userData?.created_at || userData?.createdAt || new Date().toISOString()
        };

        if (token) {
          await this.setToken(token);
        }
        await this.setUser(user);

        // Clear caches on login
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.SERVICE_CENTERS),
          AsyncStorage.removeItem(CACHE_KEYS.ALERTS),
        ]);

        return {
          success: true,
          token: token,
          user: user
        };
      } else {
        // Handle non-success responses
        const errorMessage = data.message || data.error || 'Login failed. Please check your credentials.';
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Register method
  async register(userData: any): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const requestPayload = {
        name: userData.fullName,
        email: userData.email,
        phone: userData.phoneNumber,
        password: userData.password,
        password_confirmation: userData.passwordConfirmation || userData.password,
        device_token: 'mobile-app',
      };

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/auth/visitor/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        const token = data.data?.token;
        const apiUserData = data.data?.userData;
        
        const user = {
          id: apiUserData?.id?.toString() || '1',
          email: apiUserData?.email || userData.email,
          fullName: apiUserData?.name || userData.fullName,
          phoneNumber: apiUserData?.phone || userData.phoneNumber,
          type: 'customer',
          loginType: data.data?.loginType || 'visitor',
          status: apiUserData?.status || 'Active',
          createdAt: apiUserData?.created_at || apiUserData?.createdAt || new Date().toISOString()
        };

        if (token) {
          await this.setToken(token);
        }
        await this.setUser(user);

        return {
          success: true,
          token: token,
          user: user
        };
      } else {
        // Handle validation errors from backend
        // Check for errors in multiple possible locations: data.errors, data.data.errors, data.data.data.errors
        const errors = data.errors || data.data?.errors || data.data?.data?.errors;
        
        // Check if this is a validation error (422 status code is common for validation)
        const isValidationError = response.status === 422 || 
                                  (data.message && data.message.toLowerCase().includes('validation')) ||
                                  (errors && typeof errors === 'object' && Object.keys(errors).length > 0);
        
        let errorMessage = 'Registration failed. Please try again.';
        let validationErrors = null;
        
        // Check for validation errors in various possible formats
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
          validationErrors = errors;
          // Extract first validation error message for the alert
          const errorKeys = Object.keys(errors);
          if (errorKeys.length > 0) {
            const firstError = errors[errorKeys[0]];
            errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
          }
        } else if (data.message) {
          // If message is "Validation failed" but we might not have structured errors
          if (isValidationError && errors) {
            // Try to use errors if available
            if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
              const errorKeys = Object.keys(errors);
              const firstError = errors[errorKeys[0]];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
              validationErrors = errors;
            } else {
              // If message is "Validation failed" without structured errors, create a generic structure
              errorMessage = data.message;
              // Create a generic validation error structure
              validationErrors = {
                general: [data.message]
              };
            }
          } else {
            errorMessage = data.message;
            // If it's a validation error but no structured errors, create generic structure
            if (isValidationError) {
              validationErrors = {
                general: [data.message]
              };
            }
          }
        } else if (data.error) {
          errorMessage = data.error;
          if (isValidationError) {
            validationErrors = {
              general: [data.error]
            };
          }
        }
        
        // Ensure validationErrors is set if this is a validation error
        if (isValidationError && !validationErrors) {
          validationErrors = {
            general: [errorMessage]
          };
        }

        return {
          success: false,
          error: errorMessage,
          validationErrors: validationErrors
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Request OTP for phone login
  async requestOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/auth/visitor/request-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to send OTP. Please try again.'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Resend OTP for phone login
  async resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    return this.requestOTP(phone);
  }

  // Verify OTP for phone login
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/auth/visitor/verify-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.data?.token;
        const apiUserData = data.data?.userData;
        
        const user = {
          id: apiUserData?.id?.toString() || '1',
          email: apiUserData?.email || phone + '@phone.com',
          fullName: apiUserData?.name || 'Phone User',
          phoneNumber: phone,
          type: 'customer',
          loginType: data.data?.loginType || 'visitor',
          status: apiUserData?.status || 'Active',
          createdAt: apiUserData?.created_at || apiUserData?.createdAt || new Date().toISOString()
        };

        if (token) {
          await this.setToken(token);
        }
        await this.setUser(user);

        // Clear caches on login
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.SERVICE_CENTERS),
          AsyncStorage.removeItem(CACHE_KEYS.ALERTS),
        ]);

        return {
          success: true,
          token: token,
          user: user
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Invalid OTP. Please try again.'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Book Now API
  async bookNow(bookingData: {
    service_centre_id: string;
    booking_date: string;
    booking_time: string;
    vehicle_no: string;
    notes?: string;
    service_id?: string;
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to book a service' };
      }

      const formData = new FormData();
      formData.append('service_centre_id', bookingData.service_centre_id);
      formData.append('booking_date', bookingData.booking_date);
      formData.append('booking_time', bookingData.booking_time);
      formData.append('vehicle_no', bookingData.vehicle_no);
      if (bookingData.notes) {
        formData.append('notes', bookingData.notes);
      }
      if (bookingData.service_id) {
        formData.append('service_id', bookingData.service_id);
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/booknow`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate booking caches
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        ]);
        
        return { 
          success: true, 
          bookingId: data.data?.bookingData?.booking_id || data.data?.booking_id || 'unknown'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to book service. Please try again.'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Service Centers API with caching - optimized for fast response
  async getServiceCenters(forceRefresh: boolean = false): Promise<{ success: boolean; serviceCenters?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view service centers' };
      }

      // Return cached data immediately if available (stale-while-revalidate pattern)
      if (!forceRefresh) {
        const cachedData = await this.getCachedDataImmediate(CACHE_KEYS.SERVICE_CENTERS);
        if (cachedData) {
          // Return cached data immediately, then refresh in background
          this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/servicecentrelist`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }).then(async (response) => {
            try {
              const data = await response.json();
              if (response.ok && data.success) {
                const serviceCenters = data.data?.list || [];
                await this.setCachedData(CACHE_KEYS.SERVICE_CENTERS, serviceCenters);
              }
            } catch (e) {
              // Ignore background refresh errors
            }
          }).catch(() => {
            // Ignore background refresh errors
          });

          return {
            success: true,
            serviceCenters: cachedData,
          };
        }

        // Check if cache is still valid
        const cached = await this.getCachedData(CACHE_KEYS.SERVICE_CENTERS);
        if (cached && this.isCacheValid(cached.timestamp, CACHE_DURATION.SERVICE_CENTERS)) {
          return {
            success: true,
            serviceCenters: cached.data,
          };
        }
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/servicecentrelist`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const serviceCenters = data.data?.list || [];
        
        // Cache the result
        await this.setCachedData(CACHE_KEYS.SERVICE_CENTERS, serviceCenters);
        
        return { 
          success: true, 
          serviceCenters: serviceCenters
        };
      } else {
        // Try to return cached data on API error
        const cached = await this.getCachedDataImmediate(CACHE_KEYS.SERVICE_CENTERS);
        if (cached) {
          return {
            success: true,
            serviceCenters: cached,
          };
        }
        
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch service centers. Please try again.'
        };
      }
    } catch (error: any) {
      // Try to return cached data on network error
      const cached = await this.getCachedDataImmediate(CACHE_KEYS.SERVICE_CENTERS);
      if (cached) {
        return {
          success: true,
          serviceCenters: cached,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Logout API - optimized for fast response
  async logout(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      
      // Clear local data immediately for fast response
      await Promise.all([
        this.removeToken(),
        this.removeUser(),
        AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
        AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        AsyncStorage.removeItem(CACHE_KEYS.SERVICE_CENTERS),
        AsyncStorage.removeItem(CACHE_KEYS.ALERTS),
        AsyncStorage.removeItem(CACHE_KEYS.LOGIN_RESPONSE),
      ]);

      if (!token) {
        return { success: true, message: 'Logged out' };
      }

      // Fire logout request in background (don't wait for response)
      this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore errors - we've already cleared local data
      });

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, clear local data
      await Promise.all([
        this.removeToken().catch(() => {}),
        this.removeUser().catch(() => {}),
      ]);
      return {
        success: true,
        message: 'Logged out'
      };
    }
  }

  // Owner logout API (service owner / user) - optimized for fast response
  async logoutOwner(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      
      // Clear local data immediately for fast response
      await Promise.all([
        this.removeToken(),
        this.removeUser(),
        AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
        AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        AsyncStorage.removeItem(CACHE_KEYS.SERVICE_CENTERS),
        AsyncStorage.removeItem(CACHE_KEYS.ALERTS),
        AsyncStorage.removeItem(CACHE_KEYS.LOGIN_RESPONSE),
      ]);

      if (!token) {
        return { success: true, message: 'Logged out' };
      }

      // Fire logout request in background (don't wait for response)
      this.fetchWithTimeout(`${BASE_URL}/api/v1/user/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(() => {
        // Ignore errors - we've already cleared local data
      });

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      console.error('Owner logout error:', error);
      // Even on error, clear local data
      await Promise.all([
        this.removeToken().catch(() => {}),
        this.removeUser().catch(() => {}),
      ]);
      return {
        success: true,
        message: 'Logged out'
      };
    }
  }

  // Change Password API (visitor default)
  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to change password' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/change-password`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: newPasswordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { 
          success: true, 
          message: data.message || 'Password changed successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to change password. Please try again.'
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  async changeOwnerPassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to change password' };
      }

      const formData = new FormData();
      formData.append('current_password', currentPassword);
      formData.append('new_password', newPassword);
      formData.append('new_password_confirmation', newPasswordConfirmation);

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/change-password`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData as any,
      }, 10000);

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log('[authService.changeOwnerPassword] response', {
        status: response.status,
        ok: response.ok,
        data,
        request: { current_password: '***', new_password: '***', new_password_confirmation: '***' }
      });

      if (response.ok && (data?.success !== false)) {
        return {
          success: true,
          message: data?.message || 'Password changed successfully',
        };
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (data && typeof data === 'object' && JSON.stringify(data)) ||
        'Failed to change password. Please try again.';

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error: any) {
      console.error('[authService.changeOwnerPassword] error', error);
      return {
        success: false,
        error: error?.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Booking List API with caching - optimized for fast response
  async getBookingList(forceRefresh: boolean = false): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'Please login to view your bookings' };
      }

      // Return cached data immediately if available (stale-while-revalidate pattern)
      if (!forceRefresh) {
        const cachedData = await this.getCachedDataImmediate(CACHE_KEYS.BOOKINGS);
        if (cachedData) {
          // Return cached data immediately, then refresh in background
          this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/bookinglist`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }).then(async (response) => {
            try {
              const data = await response.json();
              if (response.ok && data.success) {
                const bookings = data.data?.bookinglist || [];
                await this.setCachedData(CACHE_KEYS.BOOKINGS, bookings);
              }
            } catch (e) {
              // Ignore background refresh errors
            }
          }).catch(() => {
            // Ignore background refresh errors
          });

          return {
            success: true,
            bookings: cachedData,
          };
        }

        // Check if cache is still valid
        const cached = await this.getCachedData(CACHE_KEYS.BOOKINGS);
        if (cached && this.isCacheValid(cached.timestamp, CACHE_DURATION.BOOKINGS)) {
          return {
            success: true,
            bookings: cached.data,
          };
        }
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/bookinglist`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const bookings = data.data?.bookinglist || [];
        
        // Cache the result
        await this.setCachedData(CACHE_KEYS.BOOKINGS, bookings);
        
        return { 
          success: true, 
          bookings: bookings
        };
      } else {
        // Try to return cached data on API error
        const cached = await this.getCachedDataImmediate(CACHE_KEYS.BOOKINGS);
        if (cached) {
          return {
            success: true,
            bookings: cached,
          };
        }
        
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch bookings. Please try again.'
        };
      }
    } catch (error: any) {
      // Try to return cached data on network error
      const cached = await this.getCachedDataImmediate(CACHE_KEYS.BOOKINGS);
      if (cached) {
        return {
          success: true,
          bookings: cached,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Cancel Booking API
  async cancelBooking(bookingId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to cancel a booking' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/cancle-booking`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          status: 'cancelled',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Invalidate booking caches
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        ]);
        
        return {
          success: true,
          message: data.message || 'Booking cancelled successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to cancel booking. Please try again.'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Get Owner Bookings List API - optimized for fast response
  async getOwnerBookings(forceRefresh: boolean = false): Promise<{ success: boolean; bookings?: any[]; bookingStatusTotals?: any; error?: string }> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'Please login to view your bookings' };
      }

      // Return cached data immediately if available (stale-while-revalidate pattern)
      if (!forceRefresh) {
        const cachedData = await this.getCachedDataImmediate(CACHE_KEYS.OWNER_BOOKINGS);
        if (cachedData) {
          // Return cached data immediately, then refresh in background
          this.fetchWithTimeout(`${BASE_URL}/api/v1/user/bookings`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }).then(async (response) => {
            try {
              const data = await response.json();
              if (response.ok && data.success) {
                let bookings = [];
                let bookingStatusTotals = null;

                if (data.data?.bookingsList) {
                  if (Array.isArray(data.data.bookingsList.bookings)) {
                    bookings = data.data.bookingsList.bookings;
                  } else if (Array.isArray(data.data.bookingsList)) {
                    bookings = data.data.bookingsList;
                  }
                  
                  if (data.data.bookingsList.booking_status_totals) {
                    bookingStatusTotals = data.data.bookingsList.booking_status_totals;
                  }
                } else if (Array.isArray(data.data?.bookings)) {
                  bookings = data.data.bookings;
                } else if (Array.isArray(data.data)) {
                  bookings = data.data;
                }

                await this.setCachedData(CACHE_KEYS.OWNER_BOOKINGS, {
                  bookings,
                  bookingStatusTotals,
                });
              }
            } catch (e) {
              // Ignore background refresh errors
            }
          }).catch(() => {
            // Ignore background refresh errors
          });

          return {
            success: true,
            bookings: cachedData?.bookings || cachedData || [],
            bookingStatusTotals: cachedData?.bookingStatusTotals,
          };
        }

        // Check if cache is still valid
        const cached = await this.getCachedData(CACHE_KEYS.OWNER_BOOKINGS);
        if (cached && this.isCacheValid(cached.timestamp, CACHE_DURATION.OWNER_BOOKINGS)) {
          return {
            success: true,
            bookings: cached.data?.bookings || cached.data || [],
            bookingStatusTotals: cached.data?.bookingStatusTotals,
          };
        }
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/bookings`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log('[authService.getOwnerBookings] API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Handle the response structure: data.bookingsList.bookings
        let bookings = [];
        let bookingStatusTotals = null;

        if (data.data?.bookingsList) {
          if (Array.isArray(data.data.bookingsList.bookings)) {
            bookings = data.data.bookingsList.bookings;
          } else if (Array.isArray(data.data.bookingsList)) {
            bookings = data.data.bookingsList;
          }
          
          if (data.data.bookingsList.booking_status_totals) {
            bookingStatusTotals = data.data.bookingsList.booking_status_totals;
          }
        } else if (Array.isArray(data.data?.bookings)) {
          bookings = data.data.bookings;
        } else if (Array.isArray(data.data)) {
          bookings = data.data;
        } else if (Array.isArray(data.bookings)) {
          bookings = data.bookings;
        }

        console.log('[authService.getOwnerBookings] Parsed bookings:', bookings.length);
        console.log('[authService.getOwnerBookings] Booking status totals:', bookingStatusTotals);
        
        // Cache the result
        const cacheData = {
          bookings,
          bookingStatusTotals,
        };
        await this.setCachedData(CACHE_KEYS.OWNER_BOOKINGS, cacheData);
        
        return { 
          success: true, 
          bookings: bookings,
          bookingStatusTotals: bookingStatusTotals,
        };
      } else {
        // Try to return cached data on API error
        const cached = await this.getCachedDataImmediate(CACHE_KEYS.OWNER_BOOKINGS);
        if (cached) {
          return {
            success: true,
            bookings: cached?.bookings || cached || [],
            bookingStatusTotals: cached?.bookingStatusTotals,
          };
        }
        
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch bookings. Please try again.'
        };
      }
    } catch (error: any) {
      // Try to return cached data on network error
      const cached = await this.getCachedDataImmediate(CACHE_KEYS.OWNER_BOOKINGS);
      if (cached) {
        return {
          success: true,
          bookings: cached?.bookings || cached || [],
          bookingStatusTotals: cached?.bookingStatusTotals,
        };
      }
      console.error('[authService.getOwnerBookings] Error:', error);
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  async cancelOwnerBooking(bookingId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to cancel a booking' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/cancle-booking`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: (() => {
          const form = new FormData();
          form.append('booking_id', bookingId);
          form.append('status', 'cancelled');
          return form as any;
        })(),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log('[authService.cancelOwnerBooking] response', {
        status: response.status,
        ok: response.ok,
        data,
        request: {
          booking_id: bookingId,
          status: 'cancelled',
        },
      });

      if (response.ok && (data?.success !== false)) {
        // Invalidate booking caches
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        ]);
        return {
          success: true,
          message: data?.message || 'Booking cancelled successfully',
        };
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (data && typeof data === 'object' && JSON.stringify(data)) ||
        'Failed to cancel booking. Please try again.';

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Network error. Please check your internet connection and try again.',
      };
    }
  }

  async completeOwnerBooking(bookingId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to continue.' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/completed-booking`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: (() => {
          const form = new FormData();
          form.append('booking_id', bookingId);
          form.append('status', 'completed');
          return form as any;
        })(),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log('[authService.completeOwnerBooking] response', {
        status: response.status,
        ok: response.ok,
        data,
        request: {
          booking_id: bookingId,
          status: 'completed',
        },
      });

      if (response.ok && (data?.success !== false)) {
        // Invalidate booking caches
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        ]);
        return {
          success: true,
          message: data?.message || 'Booking marked as completed successfully.',
        };
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (data && typeof data === 'object' && JSON.stringify(data)) ||
        'Failed to mark booking as completed. Please try again.';

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Network error. Please check your internet connection and try again.',
      };
    }
  }

  async completeOwnerBooking(bookingId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to complete a booking' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/completed-booking`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: (() => {
          const form = new FormData();
          form.append('booking_id', bookingId);
          form.append('status', 'completed');
          return form as any;
        })(),
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log('[authService.completeOwnerBooking] response', {
        status: response.status,
        ok: response.ok,
        data,
        request: {
          booking_id: bookingId,
          status: 'completed',
        },
      });

      if (response.ok && (data?.success !== false)) {
        // Invalidate booking caches
        await Promise.all([
          AsyncStorage.removeItem(CACHE_KEYS.BOOKINGS),
          AsyncStorage.removeItem(CACHE_KEYS.OWNER_BOOKINGS),
        ]);
        return {
          success: true,
          message: data?.message || 'Booking marked as completed.',
        };
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (data && typeof data === 'object' && JSON.stringify(data)) ||
        'Failed to complete booking. Please try again.';

      return {
        success: false,
        error: errorMessage,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Network error. Please check your internet connection and try again.',
      };
    }
  }

  // Edit Profile API
  async editProfile(name: string, phone: string): Promise<{ success: boolean; message?: string; user?: any; error?: string; validationErrors?: any; isAuthError?: boolean }> {
    try {
      const token = await this.getToken();
      
      if (!token) {
        return { success: false, error: 'Please login to edit your profile', isAuthError: true };
      }

      const trimmedName = (name || '').trim();
      const trimmedPhone = (phone || '').trim();
      const phoneDigits = trimmedPhone.replace(/\D/g, '');
      
      const requestBody = {
        name: trimmedName,
        phone: phoneDigits,
      };

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/editprofile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const currentUser = await this.getUser();
        
        const updatedUser = {
          id: currentUser?.id || '1',
          email: currentUser?.email || '',
          fullName: name.trim(),
          phoneNumber: phone.trim(),
          type: currentUser?.type || 'customer',
          status: currentUser?.status || 'Active',
          createdAt: currentUser?.createdAt || new Date().toISOString()
        };
        
        await this.setUser(updatedUser);

        return {
          success: true,
          message: data.message || 'Profile updated successfully',
          user: updatedUser
        };
      }

      // Error handling
      let errors = data.errors || data.data?.errors || data.data?.data?.errors;
      
      // Deep search for errors if not found in common locations
      if (!errors && data.data && typeof data.data === 'object') {
        for (const key of Object.keys(data.data)) {
          const value = data.data[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const valueKeys = Object.keys(value);
            if (valueKeys.length > 0 && valueKeys.some(k => Array.isArray(value[k]) || typeof value[k] === 'string')) {
              errors = value;
              break;
            }
          }
        }
      }

      let errorMessage = 'Failed to update profile. Please try again.';
      let validationErrors = null;
      let isAuthError = false;

      if (response.status === 401) {
        const isValidationMessage = data.message && data.message.toLowerCase().includes('validation');
        
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
          validationErrors = errors;
          const errorKeys = Object.keys(errors);
          const firstError = errors[errorKeys[0]];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
          isAuthError = false;
        } else if (isValidationMessage) {
          const sentPhone = requestBody.phone;
          const issues = [];
          
          if (!sentPhone || sentPhone.trim().length < 10) {
            issues.push('Phone number must be at least 10 digits');
          }
          if (sentPhone && !/^[1-9]/.test(sentPhone)) {
            issues.push('Phone number must start with 1-9');
          }
          
          if (issues.length > 0) {
            errorMessage = 'Validation failed. ' + issues.join('. ') + '.';
          } else {
            errorMessage = 'Validation failed. Please check your phone number format.';
          }
          
          isAuthError = false;
        } else {
          errorMessage = data.message || 'Your session has expired. Please login again.';
          isAuthError = true;
        }
      } else {
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
          validationErrors = errors;
          const errorKeys = Object.keys(errors);
          const firstError = errors[errorKeys[0]];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        }
      }
        
      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors,
        isAuthError: isAuthError
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  async editOwnerProfile(name: string, phone: string): Promise<{ success: boolean; message?: string; user?: any; error?: string; validationErrors?: any; isAuthError?: boolean }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to edit your profile', isAuthError: true };
      }

      const trimmedName = (name || '').trim();
      const trimmedPhone = (phone || '').trim();
      const phoneDigits = trimmedPhone.replace(/\D/g, '');

      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('phone', phoneDigits);

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/editprofile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData as any,
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      console.log('[authService.editOwnerProfile] response', {
        status: response.status,
        ok: response.ok,
        data,
      });

      if (response.ok && data?.success !== false) {
        const currentUser = await this.getUser();
        const updatedRawUser = {
          ...(currentUser?.rawUserData || {}),
          ownerName: trimmedName,
          owner_name: trimmedName,
          contactName: trimmedName,
          contact_name: trimmedName,
          name: trimmedName,
          phone: phoneDigits,
          phoneNumber: phoneDigits,
          phone_number: phoneDigits,
        };

        const updatedUserData = {
          ...(currentUser?.userData || {}),
          ownerName: trimmedName,
          owner_name: trimmedName,
          contactName: trimmedName,
          contact_name: trimmedName,
          name: trimmedName,
          phone: phoneDigits,
          phoneNumber: phoneDigits,
          phone_number: phoneDigits,
        };

        const updatedUser = {
          ...(currentUser || {}),
          name: trimmedName,
          ownerName: trimmedName,
          owner_name: trimmedName,
          fullName: trimmedName,
          phone: phoneDigits,
          phoneNumber: phoneDigits,
          phone_number: phoneDigits,
          rawUserData: updatedRawUser,
          userData: updatedUserData,
        };

        await this.setUser(updatedUser);

        return {
          success: true,
          message: data?.message || 'Profile updated successfully',
          user: updatedUser,
        };
      }

      const errors =
        data?.errors ||
        data?.data?.errors ||
        data?.data?.data?.errors ||
        (data && typeof data === 'object' && (data.validationErrors || data.error));

      let errorMessage = data?.message || data?.error || 'Failed to update profile. Please try again.';
      if (errors && typeof errors === 'object') {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          const first = errors[errorKeys[0]];
          errorMessage = Array.isArray(first) ? first[0] : String(first);
        }
      }

      return {
        success: false,
        error: errorMessage,
        validationErrors: errors,
        isAuthError: response.status === 401,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Network error. Please check your internet connection and try again.',
      };
    }
  }

  // Get Alerts/Notifications API with caching
  async getAlerts(forceRefresh: boolean = false): Promise<{ success: boolean; alerts?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view notifications' };
      }

      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
        if (cached && this.isCacheValid(cached.timestamp, CACHE_DURATION.ALERTS)) {
          return {
            success: true,
            alerts: cached.data,
          };
        }
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/alerts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        let alertsArray = [];
        
        if (data.data && Array.isArray(data.data.alertslist)) {
          alertsArray = data.data.alertslist;
        } else if (Array.isArray(data.data)) {
          alertsArray = data.data;
        } else if (data.data && Array.isArray(data.data.alerts)) {
          alertsArray = data.data.alerts;
        } else if (Array.isArray(data.alerts)) {
          alertsArray = data.alerts;
        } else if (data.data && Array.isArray(data.data.data)) {
          alertsArray = data.data.data;
        } else if (Array.isArray(data)) {
          alertsArray = data;
        }
        
        // Cache the result
        await this.setCachedData(CACHE_KEYS.ALERTS, alertsArray);
        
        return {
          success: true,
          alerts: alertsArray
        };
      } else {
        // Try to return cached data on error
        const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
        if (cached) {
          return {
            success: true,
            alerts: cached.data,
          };
        }
        
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch notifications. Please try again.'
        };
      }
    } catch (error: any) {
      // Try to return cached data on network error
      const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
      if (cached) {
        return {
          success: true,
          alerts: cached.data,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Mark Alert as Read API
  async markAlertAsRead(alertId: string | number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to mark notification as read' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/alerts/${alertId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate alerts cache
        await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
        return {
          success: true,
          message: data.message || 'Notification marked as read'
        };
      } else {
        // Handle the specific error case where alert might not exist
        const errorMessage = data.message || data.error || 'Failed to mark notification as read. Please try again.';
        
        // If alert doesn't exist, we can still treat it as success (optimistic update)
        if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
          // Invalidate alerts cache
          await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
          return {
            success: true,
            message: 'Notification marked as read'
          };
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('Mark alert as read error:', error);
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Mark All Alerts as Read API
  async markAllAlertsAsRead(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to mark all notifications as read' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/visitor/alerts/read-all`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Invalidate alerts cache
        await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
        return {
          success: true,
          message: data.message || 'All notifications marked as read'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to mark all notifications as read. Please try again.'
        };
      }
    } catch (error) {
      console.error('Mark all alerts as read error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Get Owner Alerts/Notifications API with caching
  async getOwnerAlerts(forceRefresh: boolean = false): Promise<{ success: boolean; alerts?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view notifications' };
      }

      // Check cache first
      if (!forceRefresh) {
        const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
        if (cached && this.isCacheValid(cached.timestamp, CACHE_DURATION.ALERTS)) {
          return {
            success: true,
            alerts: cached.data,
          };
        }
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/alerts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      console.log('[authService.getOwnerAlerts] API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        let alertsArray = [];
        
        if (data.data && Array.isArray(data.data.alertslist)) {
          alertsArray = data.data.alertslist;
          console.log('[authService.getOwnerAlerts] Found alerts in data.data.alertslist');
        } else if (data.data && Array.isArray(data.data)) {
          alertsArray = data.data;
          console.log('[authService.getOwnerAlerts] Found alerts in data.data');
        } else if (data.data && Array.isArray(data.data.alerts)) {
          alertsArray = data.data.alerts;
          console.log('[authService.getOwnerAlerts] Found alerts in data.data.alerts');
        } else if (Array.isArray(data.alertslist)) {
          alertsArray = data.alertslist;
          console.log('[authService.getOwnerAlerts] Found alerts in data.alertslist');
        } else if (Array.isArray(data.alerts)) {
          alertsArray = data.alerts;
          console.log('[authService.getOwnerAlerts] Found alerts in data.alerts');
        } else if (Array.isArray(data)) {
          alertsArray = data;
          console.log('[authService.getOwnerAlerts] Found alerts in root data');
        }
        
        console.log('[authService.getOwnerAlerts] Parsed alerts array:', alertsArray.length, 'items');
        
        // Cache the result
        await this.setCachedData(CACHE_KEYS.ALERTS, alertsArray);
        
        return {
          success: true,
          alerts: alertsArray
        };
      } else {
        // Try to return cached data on error
        const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
        if (cached) {
          return {
            success: true,
            alerts: cached.data,
          };
        }
        
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch notifications. Please try again.'
        };
      }
    } catch (error: any) {
      console.error('[authService.getOwnerAlerts] Error:', error);
      // Try to return cached data on network error
      const cached = await this.getCachedData(CACHE_KEYS.ALERTS);
      if (cached) {
        return {
          success: true,
          alerts: cached.data,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Mark Owner Alert as Read API
  async markOwnerAlertAsRead(alertId: string | number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to mark notification as read' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/alerts/${alertId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      console.log('[authService.markOwnerAlertAsRead] API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Invalidate alerts cache
        await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
        return {
          success: true,
          message: data.message || 'Notification marked as read'
        };
      } else {
        // Handle the specific error case where alert might not exist
        const errorMessage = data.message || data.error || 'Failed to mark notification as read. Please try again.';
        
        // If alert doesn't exist, we can still treat it as success (optimistic update)
        if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
          // Invalidate alerts cache
          await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
          return {
            success: true,
            message: 'Notification marked as read'
          };
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }
    } catch (error: any) {
      console.error('[authService.markOwnerAlertAsRead] Error:', error);
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Mark All Owner Alerts as Read API
  async markAllOwnerAlertsAsRead(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to mark all notifications as read' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/alerts/read-all`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      console.log('[authService.markAllOwnerAlertsAsRead] API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Invalidate alerts cache
        await AsyncStorage.removeItem(CACHE_KEYS.ALERTS);
        return {
          success: true,
          message: data.message || 'All notifications marked as read'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to mark all notifications as read. Please try again.'
        };
      }
    } catch (error: any) {
      console.error('[authService.markAllOwnerAlertsAsRead] Error:', error);
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Get FAQ List API (for owner/user)
  async getFaqList(): Promise<{ success: boolean; faqs?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view FAQs' };
      }

      const response = await this.fetchWithTimeout(`${BASE_URL}/api/v1/user/faqlist`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log('[authService.getFaqList] API response status:', response.status, 'ok:', response.ok);
      console.log('[authService.getFaqList] API response data:', JSON.stringify(data, null, 2));

      // Check if response is successful (either HTTP 200-299 or success: true in data)
      const isSuccess = (response.ok || response.status === 200) && data.success === true;
      
      console.log('[authService.getFaqList] Response check:', {
        status: response.status,
        ok: response.ok,
        dataSuccess: data.success,
        isSuccess
      });

      if (isSuccess) {
        // Handle different possible response structures
        let faqsArray = [];
        
        // Check for data.data.faqslist first (most common structure based on API response)
        if (data.data && data.data.faqslist && Array.isArray(data.data.faqslist)) {
          faqsArray = data.data.faqslist;
          console.log('[authService.getFaqList] Found FAQs in data.data.faqslist:', faqsArray.length);
        } else if (data.data && data.data.faqlist && Array.isArray(data.data.faqlist)) {
          faqsArray = data.data.faqlist;
          console.log('[authService.getFaqList] Found FAQs in data.data.faqlist:', faqsArray.length);
        } else if (data.data && Array.isArray(data.data)) {
          faqsArray = data.data;
          console.log('[authService.getFaqList] Found FAQs in data.data (direct array):', faqsArray.length);
        } else if (data.faqslist && Array.isArray(data.faqslist)) {
          faqsArray = data.faqslist;
          console.log('[authService.getFaqList] Found FAQs in data.faqslist:', faqsArray.length);
        } else if (data.faqlist && Array.isArray(data.faqlist)) {
          faqsArray = data.faqlist;
          console.log('[authService.getFaqList] Found FAQs in data.faqlist:', faqsArray.length);
        } else if (data.data && data.data.list && Array.isArray(data.data.list)) {
          faqsArray = data.data.list;
          console.log('[authService.getFaqList] Found FAQs in data.data.list:', faqsArray.length);
        } else if (Array.isArray(data)) {
          faqsArray = data;
          console.log('[authService.getFaqList] Found FAQs in root data:', faqsArray.length);
        } else {
          console.warn('[authService.getFaqList] No FAQs array found in response structure');
          console.log('[authService.getFaqList] Available keys in data:', Object.keys(data));
          if (data.data) {
            console.log('[authService.getFaqList] Available keys in data.data:', Object.keys(data.data));
          }
        }
        
        console.log('[authService.getFaqList] Final parsed FAQs array:', faqsArray.length, 'items');
        
        if (faqsArray.length === 0) {
          console.warn('[authService.getFaqList] No FAQs found in response');
        }
        
        return {
          success: true,
          faqs: faqsArray
        };
      } else {
        console.error('[authService.getFaqList] API call failed:', {
          status: response.status,
          ok: response.ok,
          success: data.success,
          message: data.message || data.error
        });
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch FAQs. Please try again.'
        };
      }
    } catch (error: any) {
      console.error('[authService.getFaqList] Error:', error);
      
      // Handle network errors specifically
      if (error.message && error.message.includes('Network Error')) {
        return {
          success: false,
          error: 'Network Error - Please check your internet connection'
        };
      }
      
      if (error.message && error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout. Please check your internet connection and try again.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error. Please check your internet connection and try again.'
      };
    }
  }

}

const authService = new AuthService();
export default authService;