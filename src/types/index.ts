export type ScreenType =
  | 'onboarding'
  | 'user-choice'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'verification'
  | 'create-new-password'
  | 'customer'
  | 'service-owner'
  | 'dashboard'
  | 'book-wash'
  | 'available-now'
  | 'booking-history'
  | 'profile'
  | 'help-support'
  | 'settings'
  | 'notifications';

export type UserType = 'customer' | 'service-owner';

export interface OnboardingScreenData {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface AuthData {
  phoneNumber: string;
  countryCode: string;
  verificationCode?: string;
}

