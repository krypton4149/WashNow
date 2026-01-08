/**
 * Stripe Service
 * Handles Stripe payment integration using PaymentSheet
 */

import { initStripe, useStripe, usePaymentSheet } from '@stripe/stripe-react-native';

// Your Stripe Publishable Key
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
export const STRIPE_SECRET_KEY = 'sk_test_YOUR_SECRET_KEY_HERE';

// Initialize Stripe
export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.washnow', // For Apple Pay
    });
    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Stripe initialization error:', error);
    throw error;
  }
};

export default {
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY,
  initializeStripe,
};


