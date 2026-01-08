/**
 * Stripe Backend Service
 * Creates payment intents for Stripe PaymentSheet
 * 
 * IMPORTANT: For production, move this to your backend server!
 * Never expose your secret key in production mobile apps.
 * This is for testing only.
 */

import { STRIPE_SECRET, API_URL } from '../config/env';

const STRIPE_SECRET_KEY = STRIPE_SECRET;

/**
 * Create a payment intent
 * In production, this should call your backend API
 */
export const createPaymentIntent = async (
  amount: number, // Amount in cents
  currency: string = 'usd',
  description?: string,
  customerDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  }
): Promise<string | null> => {
  try {
    console.log('💳 Creating Stripe payment intent...');
    console.log('📝 Amount:', amount, 'cents ($' + (amount / 100).toFixed(2) + ')');
    console.log('📝 Currency:', currency);
    
    // Try to call backend API first
    try {
      const authService = require('./authService').default;
      const token = await authService.getToken();
      
      const response = await fetch(`${API_URL}/api/v1/payment/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          description: description || 'Car wash service payment',
          ...(customerDetails && {
            metadata: {
              customer_name: customerDetails.name || '',
              customer_email: customerDetails.email || '',
            },
          }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clientSecret) {
          console.log('✅ Payment intent created via backend API');
          return data.clientSecret;
        }
      }
    } catch (apiError) {
      console.log('⚠️ Backend API not available, using direct Stripe API (testing only)');
    }

    // Fallback: Direct Stripe API call (FOR TESTING ONLY - NOT FOR PRODUCTION!)
    // WARNING: This exposes your secret key. Move to backend for production!
    console.log('⚠️ WARNING: Using direct Stripe API call (testing only)');
    console.log('⚠️ For production, implement backend endpoint: POST /api/v1/payment/create-intent');
    
    // Construct form-encoded body with proper bracket notation for nested parameters
    const formData = new URLSearchParams();
    formData.append('amount', amount.toString());
    formData.append('currency', currency.toLowerCase());
    formData.append('description', description || 'Car wash service payment');
    // Enable automatic payment methods (includes Apple Pay, Google Pay, Card, etc.)
    // NOTE: Cannot use both automatic_payment_methods and payment_method_types together
    formData.append('automatic_payment_methods[enabled]', 'true');
    
    // Add customer information for Indian regulations (export transactions require name and address)
    if (customerDetails?.name) {
      formData.append('metadata[customer_name]', customerDetails.name);
    }
    if (customerDetails?.email) {
      formData.append('metadata[customer_email]', customerDetails.email);
    }
    // Add shipping address if available (required for Indian export regulations)
    if (customerDetails?.address) {
      if (customerDetails.address.line1) {
        formData.append('shipping[address][line1]', customerDetails.address.line1);
      }
      if (customerDetails.address.city) {
        formData.append('shipping[address][city]', customerDetails.address.city);
      }
      if (customerDetails.address.state) {
        formData.append('shipping[address][state]', customerDetails.address.state);
      }
      if (customerDetails.address.postal_code) {
        formData.append('shipping[address][postal_code]', customerDetails.address.postal_code);
      }
      formData.append('shipping[address][country]', customerDetails.address.country || 'IN');
      if (customerDetails.name) {
        formData.append('shipping[name]', customerDetails.name);
      }
    }
    
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    
    if (response.ok && data.client_secret) {
      console.log('✅ Payment intent created successfully');
      console.log('📝 Client Secret:', data.client_secret.substring(0, 20) + '...');
      return data.client_secret;
    } else {
      console.error('❌ Failed to create payment intent:', data);
      return null;
    }
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return null;
  }
};
