export type ScreenType =
  | 'onboarding'
  | 'user-choice'
  | 'auth'
  | 'customer'
  | 'service-owner'
  | 'book-wash'
  | 'available-now'
  | 'finding-car-wash'
  | 'booking-confirmed'
  | 'payment'
  | 'payment-confirmed'
  | 'location-selection'
  | 'schedule-for-later'
  | 'schedule-booking'
  | 'confirm-booking'
  | 'booking-history'
  | 'profile'
  | 'edit-profile'
  | 'change-password'
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

