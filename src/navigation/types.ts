import { ScreenType } from '../types';

export interface NavigationState {
  currentScreen: ScreenType;
  currentOnboardingIndex: number;
  phoneNumber: string;
  userType: 'customer' | 'service-owner' | null;
}

export interface NavigationActions {
  setCurrentScreen: (screen: ScreenType) => void;
  setCurrentOnboardingIndex: (index: number) => void;
  setPhoneNumber: (phone: string) => void;
  setUserType: (type: 'customer' | 'service-owner' | null) => void;
  reset: () => void;
}

