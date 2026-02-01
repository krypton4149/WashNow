export type ScreenType =
  | 'onboarding'
  | 'user-choice'
  | 'auth'
  | 'customer'
  | 'service-owner'
  | 'book-wash'
  | 'available-now'
  | 'payment'
  | 'payment-confirmed'
  | 'location-selection'
  | 'service-center'
  | 'schedule-booking'
  | 'confirm-booking'
  | 'schedule-payment'
  | 'schedule-booking-payment-confirmed'
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

