/**
 * Environment Configuration
 * Reads from .env file or process.env
 * 
 * To use .env file in React Native:
 * 1. Install: npm install react-native-dotenv
 * 2. Update babel.config.js to include the plugin
 * 3. Or use react-native-config for more advanced setup
 * 
 * For now, using direct imports with fallback to process.env
 */

// Read from process.env with fallback to hardcoded values for development
export const STRIPE_KEY = 
  process.env.STRIPE_KEY || 
  'pk_test_51InRkcSIysF6mDujsrNrwe4SIhOQiI9MTo7h8wL4SeTpTG133LAuq3gEAz1PCxru11GX7bPnnz8SSwkxnABlM8sM00lUf4pnAi';

export const STRIPE_SECRET = 
  process.env.STRIPE_SECRET || 
  'sk_test_YOUR_SECRET_KEY_HERE';

export const STRIPE_WEBHOOK_SECRET = 
  process.env.STRIPE_WEBHOOK_SECRET || 
  'whsec_ifud05eiKsEpmXYPKwpARXklb6udXHIU';

export const API_URL = 
  process.env.API_URL || 
  'https://carwashapp.shoppypie.in';

export const API_BASE_URL = 
  process.env.API_BASE_URL || 
  'https://carwashapp.shoppypie.in/api/v1';

// Merchant Identifier for Apple Pay
// This should match your app's bundle identifier in Xcode
// Default: org.reactjs.native.example.Cars (from Xcode project)
// Update this in .env file if your bundle identifier is different
export const MERCHANT_IDENTIFIER = 
  process.env.MERCHANT_IDENTIFIER || 
  'org.reactjs.native.example.Cars';

