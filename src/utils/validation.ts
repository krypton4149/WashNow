// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (supports various formats)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

// Password validation
const MIN_PASSWORD_LENGTH = 8;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
}

// Validate email format
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  return { isValid: true };
};

// Validate phone number (must include UK country code +44)
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone.trim()) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Remove spaces and special characters for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if phone number starts with UK country code
  if (!cleanPhone.startsWith('+44') && !cleanPhone.startsWith('44')) {
    return { isValid: false, message: 'Phone number must include UK country code (+44)' };
  }
  
  // Remove country code for length validation
  const phoneWithoutCode = cleanPhone.replace(/^\+?44/, '');
  
  // UK phone numbers (without country code) should be 10 digits
  if (phoneWithoutCode.length < 10 || phoneWithoutCode.length > 10) {
    return { isValid: false, message: 'UK phone number must be 10 digits (excluding country code)' };
  }
  
  // Check if remaining digits are valid
  if (!/^\d{10}$/.test(phoneWithoutCode)) {
    return { isValid: false, message: 'Please enter a valid UK phone number' };
  }
  
  return { isValid: true };
};

// Validate password
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { isValid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
};

// Validate password confirmation
export const validatePasswordConfirmation = (password: string, confirmation: string): ValidationResult => {
  if (!confirmation) {
    return { isValid: false, message: 'Password confirmation is required' };
  }
  
  if (password !== confirmation) {
    return { isValid: false, message: 'Passwords do not match' };
  }
  
  return { isValid: true };
};

// Validate name
export const validateName = (name: string): ValidationResult => {
  if (!name.trim()) {
    return { isValid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: 'Name must be less than 50 characters' };
  }
  
  return { isValid: true };
};

// Validate entire registration form
export const validateRegistrationForm = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}): { isValid: boolean; errors: FormErrors } => {
  const errors: FormErrors = {};
  
  // Validate name
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }
  
  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }
  
  // Validate phone
  const phoneValidation = validatePhone(data.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message;
  }
  
  // Validate password
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }
  
  // Validate password confirmation
  const passwordConfirmationValidation = validatePasswordConfirmation(data.password, data.password_confirmation);
  if (!passwordConfirmationValidation.isValid) {
    errors.password_confirmation = passwordConfirmationValidation.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

