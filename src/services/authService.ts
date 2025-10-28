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
        
        const user = {
          id: userData?.id?.toString() || '1',
          email: userData?.email || email,
          fullName: userData?.name || 'User',
          phoneNumber: userData?.phone || '',
          type: 'customer',
          status: userData?.status || 'Active'
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
      const response = await fetch(`${BASE_URL}/api/v1/auth/visitor/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.fullName,
          email: userData.email,
          phone: userData.phoneNumber,
          password: userData.password,
        }),
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
          status: apiUserData?.status || 'Active'
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
          error: data.message || data.error || 'Registration failed. Please try again.'
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
          status: apiUserData?.status || 'Active'
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
        return { success: false, error: 'No token found' };
      }

      const response = await fetch(`${BASE_URL}/api/v1/visitor/logout`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.message) {
        // Clear local storage after successful logout
        await this.removeToken();
        await AsyncStorage.removeItem(USER_KEY);
        
        return { 
          success: true, 
          message: data.message || 'Logged out successfully'
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Failed to logout. Please try again.'
        };
      }
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

}

const authService = new AuthService();
export default authService;