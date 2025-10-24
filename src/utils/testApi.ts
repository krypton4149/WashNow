// Test utility to verify API integration
import authService from '../services/authService';

export const testRegistrationAPI = async () => {
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    password: 'TestPassword123',
    password_confirmation: 'TestPassword123',
    device_token: 'test_device_token',
  };

  try {
    console.log('Testing registration API with data:', testData);
    const response = await authService.registerCustomer(testData);
    console.log('Registration API test successful:', response);
    return { success: true, data: response };
  } catch (error) {
    console.error('Registration API test failed:', error);
    return { success: false, error };
  }
};

export const testAuthService = async () => {
  try {
    // Test token storage
    await authService.storeToken('test_token');
    const storedToken = await authService.getToken();
    console.log('Stored token:', storedToken);
    
    // Test login check
    const isLoggedIn = await authService.isLoggedIn();
    console.log('Is logged in:', isLoggedIn);
    
    // Test token removal
    await authService.removeToken();
    const tokenAfterRemoval = await authService.getToken();
    console.log('Token after removal:', tokenAfterRemoval);
    
    return { success: true };
  } catch (error) {
    console.error('Auth service test failed:', error);
    return { success: false, error };
  }
};

