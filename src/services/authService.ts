import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://carwashapp.shoppypie.in';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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

  // Login method
  async login(emailOrPhone: string, password: string, loginType: 'email' | 'phone' = 'email'): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      // For phone OTP login, we'll simulate success since we don't have the actual API
      if (loginType === 'phone') {
        // Simulate phone OTP login success
        const mockToken = 'phone_otp_token_' + Date.now();
        const mockUser = {
          id: '1',
          email: emailOrPhone + '@phone.com', // Use phone as email for now
          fullName: 'Phone User',
          phoneNumber: emailOrPhone,
          type: 'customer',
          status: 'Active'
        };

        await this.setToken(mockToken);
        await this.setUser(mockUser);

        return { success: true, token: mockToken, user: mockUser };
      }

      // Regular email login
      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/login`, {
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

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
        const token = data.data?.token;
        const userData = data.data?.userData;
        const loginType = data.data?.loginType || 'visitor';
        
        const user = {
          id: userData?.id?.toString() || '1',
          email: userData?.email || emailOrPhone,
          fullName: userData?.name || 'User',
          phoneNumber: userData?.phone || '',
          type: 'customer',
          loginType: loginType, // Store loginType from API
          status: userData?.status || 'Active',
          createdAt: userData?.created_at || userData?.createdAt || new Date().toISOString()
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
        return {
          success: false,
          error: data.message || data.error || 'Login failed. Please check your credentials.'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
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
        password_confirmation: userData.passwordConfirmation || userData.password, // Add password confirmation
        device_token: 'mobile-app', // Add device_token to prevent validation error
      };

      console.log('=== API REQUEST ===');
      console.log('Endpoint:', `${BASE_URL}/api/v1/auth/visitor/register`);
      console.log('Request Payload:', {
        name: requestPayload.name,
        email: requestPayload.email,
        phone: requestPayload.phone,
        password: requestPayload.password ? '***' : ''
      });

      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      console.log('=== API RESPONSE ===');
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response OK:', response.ok);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      
      // Debug: Log API response for troubleshooting
      console.log('API Response Data:', JSON.stringify(data, null, 2));
      console.log('API Response Summary:', {
        status: response.status,
        ok: response.ok,
        success: data.success,
        message: data.message,
        error: data.error,
        hasErrors: !!data.errors,
        errorsKeys: data.errors ? Object.keys(data.errors) : null,
        errors: data.errors
      });

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

        console.log('=== ERROR PARSING ===');
        console.log('Is Validation Error:', isValidationError);
        console.log('Error Message:', errorMessage);
        console.log('Validation Errors Object:', validationErrors);
        console.log('Original API Message:', data.message);
        console.log('Original API Errors (data.errors):', data.errors);
        console.log('Nested API Errors (data.data.errors):', data.data?.errors);
        console.log('Found Errors (from all locations):', errors);
        console.log('Final Return Object:', {
          success: false,
          error: errorMessage,
          hasValidationErrors: !!validationErrors,
          validationErrorsKeys: validationErrors ? Object.keys(validationErrors) : null
        });

        return {
          success: false,
          error: errorMessage,
          validationErrors: validationErrors
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Request OTP for phone login
  async requestOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/request-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
        }),
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
    } catch (error) {
      console.error('Request OTP error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Resend OTP for phone login
  async resendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/request-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to resend OTP. Please try again.'
        };
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Verify OTP for phone login
  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/verify-otp`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token and user data
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
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
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
  }): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to book a service' };
      }

      // Create FormData for the API
      const formData = new FormData();
      formData.append('service_centre_id', bookingData.service_centre_id);
      formData.append('booking_date', bookingData.booking_date);
      formData.append('booking_time', bookingData.booking_time);
      formData.append('vehicle_no', bookingData.vehicle_no);
      if (bookingData.notes) {
        formData.append('notes', bookingData.notes);
      }

      console.log('Sending form data:', {
        service_centre_id: bookingData.service_centre_id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        vehicle_no: bookingData.vehicle_no,
        notes: bookingData.notes
      });

      const response = await fetch(`${BASE_URL}/api/v1/visitor/booknow`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
    } catch (error) {
      console.error('Book now error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Service Centers API
  async getServiceCenters(): Promise<{ success: boolean; serviceCenters?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view service centers' };
      }

      const response = await fetch(`${BASE_URL}/api/v1/visitor/servicecentrelist`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { 
          success: true, 
          serviceCenters: data.data?.list || []
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch service centers. Please try again.'
        };
      }
    } catch (error) {
      console.error('Get service centers error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Logout API
  async logout(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        // Treat as already logged out locally
        await this.removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        return { success: true, message: 'Logged out' };
      }

      const response = await fetch(`${BASE_URL}/api/v1/visitor/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_) {
        // no-op: some backends return empty body
      }

      const backendIndicatesSuccess = data?.success === true || typeof data?.message === 'string';

      if (response.ok || response.status === 401 || backendIndicatesSuccess) {
        // Treat 2xx and 401 (already invalid/expired) as success locally
        await this.removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        return {
          success: true,
          message: (data && data.message) || 'Logged out successfully'
        };
      }

      return {
        success: false,
        error: (data && (data.message || data.error)) || 'Failed to logout. Please try again.'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Change Password API
  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to change password' };
      }

      const response = await fetch(`${BASE_URL}/api/v1/visitor/change-password`, {
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

  // Booking List API
  async getBookingList(): Promise<{ success: boolean; bookings?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      console.log('Token for booking list:', token ? 'Present' : 'Missing');
      
      if (!token) {
        return { success: false, error: 'Please login to view your bookings' };
      }

      console.log('Making API call to:', `${BASE_URL}/api/v1/visitor/bookinglist`);
      
      const response = await fetch(`${BASE_URL}/api/v1/visitor/bookinglist`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API response status:', response.status);
      const data = await response.json();

      console.log('Booking list API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Handle the correct structure: data.data.bookinglist
        console.log('Raw data structure:', JSON.stringify(data, null, 2));
        console.log('data.data:', data.data);
        console.log('data.data.bookinglist:', data.data?.bookinglist);
        
        const bookings = data.data?.bookinglist || [];
        console.log('Extracted bookings:', bookings.length, 'items');
        console.log('First booking:', bookings[0]);
        
        return { 
          success: true, 
          bookings: bookings
        };
      } else {
        console.log('API call failed:', data.message || data.error);
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch bookings. Please try again.'
        };
      }
    } catch (error) {
      console.error('Get booking list error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
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

      const response = await fetch(`${BASE_URL}/api/v1/visitor/cancle-booking`, {
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
    } catch (error) {
      console.error('Cancel booking error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Edit Profile API
  async editProfile(name: string, phone: string): Promise<{ success: boolean; message?: string; user?: any; error?: string; validationErrors?: any; isAuthError?: boolean }> {
    try {
      const token = await this.getToken();
      
      console.log('=== EDIT PROFILE API REQUEST ===');
      console.log('Endpoint:', `${BASE_URL}/api/v1/visitor/editprofile`);
      console.log('Token Status:', token ? `Token present (${token.substring(0, 20)}...)` : 'Token MISSING');
      console.log('Request Body:', { name, phone });
      
      if (!token) {
        console.log('❌ NO TOKEN - Cannot proceed');
        return { success: false, error: 'Please login to edit your profile', isAuthError: true };
      }

      // Validate inputs before creating request body
      let trimmedName = (name || '').trim();
      let trimmedPhone = (phone || '').trim();
      
      console.log('=== AUTH SERVICE: EDIT PROFILE ===');
      console.log('Input parameters:', {
        name: name,
        nameLength: name?.length || 0,
        nameTrimmed: trimmedName,
        nameTrimmedLength: trimmedName.length,
        phone: phone,
        phoneLength: phone?.length || 0,
        phoneTrimmed: trimmedPhone,
        phoneTrimmedLength: trimmedPhone.length
      });
      
      // Extract digits from phone
      let phoneDigits = trimmedPhone.replace(/\D/g, '');
      
      console.log('Phone processing:', {
        original: trimmedPhone,
        digitsOnly: phoneDigits,
        digitsLength: phoneDigits.length
      });
      
      // Don't validate here - EditProfileScreen already validated changed fields
      // The API will do its own validation and return specific errors
      // Just ensure we have values (not null/undefined)
      if (!trimmedName) {
        console.log('⚠️ AUTH SERVICE: Name is empty after trim');
        trimmedName = '';
      }
      
      if (!phoneDigits) {
        console.log('⚠️ AUTH SERVICE: Phone digits empty after processing');
        phoneDigits = '';
      }
      
      console.log('✅ AUTH SERVICE: Passing data to API (validation handled by EditProfileScreen)');
      console.log('Final request values:', {
        name: trimmedName,
        nameLength: trimmedName.length,
        phone: phoneDigits,
        phoneLength: phoneDigits.length
      });
      
      const requestBody = {
        name: trimmedName,
        phone: phoneDigits,
      };
      
      console.log('Request body to send:', JSON.stringify(requestBody, null, 2));
      console.log('Request body validation:', {
        nameLength: requestBody.name.length,
        phoneLength: requestBody.phone.length,
        nameIsEmpty: !requestBody.name || requestBody.name.length === 0,
        phoneIsEmpty: !requestBody.phone || requestBody.phone.length === 0
      });

      const response = await fetch(`${BASE_URL}/api/v1/visitor/editprofile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('=== EDIT PROFILE API RESPONSE ===');
      console.log('Response Status:', response.status, response.statusText);
      console.log('Response OK:', response.ok);

      // Get response text first to see raw response
      const responseText = await response.text();
      console.log('Raw API Response Text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return {
          success: false,
          error: 'Invalid response from server. Please try again.'
        };
      }
      
      console.log('API Response Data:', JSON.stringify(data, null, 2));
      console.log('Response Data Keys:', Object.keys(data));
      console.log('Response Data Structure:', {
        hasData: !!data.data,
        hasErrors: !!data.errors,
        hasMessage: !!data.message,
        dataType: typeof data.data,
        errorsType: typeof data.errors,
        fullStructure: data
      });

      // Success case - API returns { success: true, message: "Profile updated successfully" }
      if (response.ok && data.success) {
        console.log('✅ Profile updated successfully');
        
        // Get current user data to update with new values
        const currentUser = await this.getUser();
        
        // Update user data in storage
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
        console.log('User data updated in storage:', updatedUser);

        return {
          success: true,
          message: data.message || 'Profile updated successfully',
          user: updatedUser
        };
      }

      // Error case
      console.log('=== EDIT PROFILE ERROR ===');
      console.log('Status:', response.status);
      console.log('Response Data:', data);
      console.log('Full Response Object:', JSON.stringify(data, null, 2));
      console.log('Request that was sent:', {
        name: requestBody.name,
        phone: requestBody.phone,
        nameLength: requestBody.name.length,
        phoneLength: requestBody.phone.length
      });

      // Check for errors in ALL possible nested locations
      console.log('=== SEARCHING FOR ERRORS ===');
      console.log('data.errors:', data.errors);
      console.log('data.data:', data.data);
      console.log('data.data?.errors:', data.data?.errors);
      console.log('data.data?.data?.errors:', data.data?.data?.errors);
      
      // Deep search for errors
      let errors = null;
      if (data.errors) {
        errors = data.errors;
        console.log('✅ Found errors in data.errors');
      } else if (data.data?.errors) {
        errors = data.data.errors;
        console.log('✅ Found errors in data.data.errors');
      } else if (data.data?.data?.errors) {
        errors = data.data.data.errors;
        console.log('✅ Found errors in data.data.data.errors');
      } else if (data.data && typeof data.data === 'object') {
        // Try to find errors object in data.data
        const dataDataKeys = Object.keys(data.data);
        console.log('data.data keys:', dataDataKeys);
        for (const key of dataDataKeys) {
          const value = data.data[key];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const valueKeys = Object.keys(value);
            if (valueKeys.length > 0 && valueKeys.some(k => Array.isArray(value[k]) || typeof value[k] === 'string')) {
              errors = value;
              console.log('✅ Found errors in data.data.' + key);
              break;
            }
          }
        }
      }
      
      console.log('Errors found:', {
        hasErrors: !!errors,
        errorsType: typeof errors,
        errorsKeys: errors ? Object.keys(errors) : null,
        errors: errors
      });

      let errorMessage = 'Failed to update profile. Please try again.';
      let validationErrors = null;
      let isAuthError = false;

      // Handle 401 - check if it's validation or authentication
      if (response.status === 401) {
        const isValidationMessage = data.message && data.message.toLowerCase().includes('validation');
        
        console.log('Processing 401 response:', {
          isValidationMessage,
          hasErrors: !!errors,
          errorsType: typeof errors,
          errorsKeys: errors ? Object.keys(errors) : null
        });
        
        if (errors && typeof errors === 'object' && Object.keys(errors).length > 0) {
          // Has validation errors - treat as validation error
          validationErrors = errors;
          const errorKeys = Object.keys(errors);
          const firstError = errors[errorKeys[0]];
          errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
          isAuthError = false;
          console.log('✅ 401 with validation errors found:', errorMessage);
        } else if (isValidationMessage) {
          // Message says validation but no structured errors
          // Provide a more specific helpful message based on what we sent
          const sentName = requestBody.name;
          const sentPhone = requestBody.phone;
          
          let specificMessage = 'Validation failed. ';
          const issues = [];
          
          // Only check phone validation (name validation removed)
          if (!sentPhone || sentPhone.trim().length < 10) {
            issues.push('Phone number must be at least 10 digits');
          }
          if (sentPhone && !/^[1-9]/.test(sentPhone)) {
            issues.push('Phone number must start with 1-9');
          }
          
          if (issues.length > 0) {
            errorMessage = specificMessage + issues.join('. ') + '.';
          } else {
            // If no specific issues found, show generic message but mention phone only
            errorMessage = 'Validation failed. Please check your phone number format.';
          }
          
          isAuthError = false;
          console.log('⚠️ 401 with validation message but no structured errors');
          console.log('Sent data:', { name: sentName, phone: sentPhone });
          console.log('Providing specific validation message:', errorMessage);
        } else {
          // True authentication error
          errorMessage = data.message || 'Your session has expired. Please login again.';
          isAuthError = true;
          console.log('❌ 401 authentication error:', errorMessage);
        }
      } else {
        // Handle other error statuses (422, 400, etc.)
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

      console.log('Final Error Object:', {
        errorMessage,
        validationErrors,
        isAuthError,
        hasValidationErrors: !!validationErrors
      });

      return {
        success: false,
        error: errorMessage,
        validationErrors: validationErrors,
        isAuthError: isAuthError
      };

    } catch (error) {
      console.error('Edit profile network error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
      };
    }
  }

  // Get Alerts/Notifications API
  async getAlerts(): Promise<{ success: boolean; alerts?: any[]; error?: string }> {
    try {
      const token = await this.getToken();
      if (!token) {
        return { success: false, error: 'Please login to view notifications' };
      }

      const response = await fetch(`${BASE_URL}/api/v1/visitor/alerts`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Get alerts API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        // Handle various response structures - API returns data.alertslist
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
        
        console.log('Parsed alerts array:', alertsArray);
        
        return {
          success: true,
          alerts: alertsArray
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to fetch notifications. Please try again.'
        };
      }
    } catch (error) {
      console.error('Get alerts error:', error);
      return {
        success: false,
        error: 'Network error. Please check your internet connection and try again.'
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

      console.log('Marking alert as read, ID:', alertId);

      const response = await fetch(`${BASE_URL}/api/v1/visitor/alerts/${alertId}/read`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Mark alert as read API response:', JSON.stringify(data, null, 2));

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Notification marked as read'
        };
      } else {
        // Handle the specific error case where alert might not exist
        const errorMessage = data.message || data.error || 'Failed to mark notification as read. Please try again.';
        
        // If alert doesn't exist, we can still treat it as success (optimistic update)
        if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
          console.log('Alert not found in database, treating as success (already read or deleted)');
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

      const response = await fetch(`${BASE_URL}/api/v1/visitor/alerts/read-all`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
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

}

const authService = new AuthService();
export default authService;