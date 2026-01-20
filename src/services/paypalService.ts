/**
 * PayPal Service
 * Handles PayPal payment integration using WebView-based checkout
 * 
 * Best Practice (2026): PayPal does NOT provide a native React Native SDK.
 * We use PayPal Checkout (Web-based) opened in an in-app WebView.
 * 
 * Flow:
 * 1. Backend creates PayPal order
 * 2. App opens PayPal Checkout in WebView
 * 3. User completes payment on PayPal
 * 4. Backend captures payment
 * 5. App receives success/failure
 */

import { PAYPAL_MODE, PAYPAL_CLIENT_ID, API_URL } from '../config/env';
import authService from './authService';

const PAYPAL_BASE_URL = PAYPAL_MODE === 'sandbox' 
  ? 'https://api.sandbox.paypal.com'
  : 'https://api.paypal.com';

const PAYPAL_CHECKOUT_URL = PAYPAL_MODE === 'sandbox'
  ? 'https://www.sandbox.paypal.com'
  : 'https://www.paypal.com';

export interface PayPalOrderData {
  amount: number; // Amount in dollars (not cents)
  currency?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PayPalOrderResponse {
  success: boolean;
  orderId?: string;
  approvalUrl?: string;
  error?: string;
}

/**
 * Create a PayPal order via backend
 * Backend should handle the PayPal API call for security
 */
export const createPayPalOrder = async (
  orderData: PayPalOrderData
): Promise<PayPalOrderResponse> => {
  try {
    // Validate orderData
    if (!orderData) {
      return {
        success: false,
        error: 'Order data is required',
      };
    }

    // Convert and validate amount - ensure it's a number
    const amount = typeof orderData.amount === 'string' 
      ? parseFloat(orderData.amount) 
      : Number(orderData.amount);

    // Validate amount
    if (orderData.amount === undefined || orderData.amount === null || isNaN(amount) || amount <= 0) {
      console.error('❌ Invalid amount:', orderData.amount);
      return {
        success: false,
        error: 'Valid amount is required',
      };
    }

    // Use the validated numeric amount
    const validatedAmount = amount;

    console.log('💳 Creating PayPal order...');
    console.log('📝 Amount: $' + validatedAmount.toFixed(2));
    console.log('📝 Currency:', orderData.currency || 'USD');
    
    const token = await authService.getToken();
    
    // Try to call backend API first
    let backendApiFailed = false;
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/create-paypal-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          amount: validatedAmount,
          currency: orderData.currency || 'USD',
          description: orderData.description || 'Car wash service payment',
          returnUrl: orderData.returnUrl || 'washnow://paypal-success',
          cancelUrl: orderData.cancelUrl || 'washnow://paypal-cancel',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.orderId && data.approvalUrl) {
          console.log('✅ PayPal order created via backend API');
          return {
            success: true,
            orderId: data.orderId,
            approvalUrl: data.approvalUrl,
          };
        }
      } else {
        // Backend API failed - log but don't return error, fall through to direct API
        const errorData = await response.json().catch(() => ({}));
        console.log('⚠️ Backend API error (will use direct PayPal API):', errorData.message || 'Backend endpoint not available');
        backendApiFailed = true;
      }
    } catch (apiError: any) {
      // Network error or other exception - fall through to direct API
      console.log('⚠️ Backend API not available, using direct PayPal API (testing only)');
      console.log('API Error:', apiError.message || apiError);
      backendApiFailed = true;
    }

    // If backend API failed or is not available, use direct PayPal API
    if (backendApiFailed) {
      console.log('🔄 Falling back to direct PayPal API...');
    }

    // Fallback: Direct PayPal API call (FOR TESTING ONLY - NOT FOR PRODUCTION!)
    // WARNING: This exposes your client secret. Move to backend for production!
    console.log('⚠️ WARNING: Using direct PayPal API call (testing only)');
    console.log('⚠️ For production, implement backend endpoint: POST /api/v1/payment/create-paypal-order');
    console.log('💳 Attempting to create PayPal order via direct API...');
    
    // Get access token first
    console.log('🔑 Getting PayPal access token...');
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      console.error('❌ Failed to get PayPal access token');
      return {
        success: false,
        error: 'Failed to authenticate with PayPal. Please check your PayPal credentials.',
      };
    }
    console.log('✅ PayPal access token obtained');

    // Create order
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: orderData.currency || 'USD',
            value: validatedAmount.toFixed(2),
          },
          description: orderData.description || 'Car wash service payment',
        },
      ],
      application_context: {
        brand_name: 'WashNow',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        // Use return URLs that we can detect in WebView
        // PayPal will redirect here after approval/cancellation
        return_url: orderData.returnUrl || 'https://carwashapp.shoppypie.in/paypal/success',
        cancel_url: orderData.cancelUrl || 'https://carwashapp.shoppypie.in/paypal/cancel',
      },
    };

    const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderResponseData = await orderResponse.json();

    if (orderResponse.ok && orderResponseData.id) {
      // Find approval URL from links
      const approvalLink = orderResponseData.links?.find((link: any) => link.rel === 'approve');
      const approvalUrl = approvalLink?.href;

      if (approvalUrl) {
        console.log('✅ PayPal order created successfully');
        return {
          success: true,
          orderId: orderResponseData.id,
          approvalUrl: approvalUrl,
        };
      }
    }

    console.error('❌ Failed to create PayPal order:', orderResponseData);
    return {
      success: false,
      error: orderResponseData.message || 'Failed to create PayPal order',
    };
  } catch (error: any) {
    console.error('Error creating PayPal order:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while creating PayPal order',
    };
  }
};

/**
 * Base64 encode helper for React Native
 */
const base64Encode = (str: string): string => {
  // Use btoa if available (some React Native environments have it)
  // @ts-ignore - btoa may be available in some React Native environments
  if (typeof btoa !== 'undefined') {
    // @ts-ignore
    return btoa(str);
  }
  // Fallback: simple base64 encoding
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const a = str.charCodeAt(i++);
    const b = i < str.length ? str.charCodeAt(i++) : 0;
    const c = i < str.length ? str.charCodeAt(i++) : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
  }
  return result;
};

/**
 * Get PayPal access token (for testing only - should be on backend)
 */
const getPayPalAccessToken = async (): Promise<string | null> => {
  try {
    const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = require('../config/env');
    
    const auth = base64Encode(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    
    if (response.ok && data.access_token) {
      return data.access_token;
    }
    
    console.error('Failed to get PayPal access token:', data);
    return null;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    return null;
  }
};

/**
 * Check PayPal order status
 */
const checkPayPalOrderStatus = async (
  orderId: string,
  accessToken: string
): Promise<{ status?: string; approved: boolean }> => {
  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const orderData = await response.json();
    
    if (response.ok && orderData.status) {
      const status = orderData.status;
      const approved = status === 'APPROVED' || status === 'COMPLETED';
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📊 [paypalService.checkPayPalOrderStatus] ORDER STATUS CHECK');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🆔 Order ID:', orderId);
      console.log('📊 Status:', status);
      console.log('✅ Approved:', approved);
      console.log('📥 Full Order Data:', JSON.stringify(orderData, null, 2));
      console.log('═══════════════════════════════════════════════════════════\n');
      
      return {
        status: status,
        approved: approved,
      };
    }
    
    console.warn('⚠️ Could not get order status:', orderData);
    return { approved: false };
  } catch (error) {
    console.error('❌ Error checking PayPal order status:', error);
    return { approved: false };
  }
};

/**
 * Capture PayPal payment via backend
 * Backend should handle the PayPal API call for security
 */
export const capturePayPalPayment = async (
  orderId: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    console.log('💳 Capturing PayPal payment for order:', orderId);
    
    const token = await authService.getToken();
    
    // Try to call backend API first
    let backendApiFailed = false;
    try {
      const response = await fetch(`${API_URL}/api/v1/payment/capture-paypal-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('💳 [paypalService.capturePayPalPayment] BACKEND API RESPONSE');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📥 Full Response:', JSON.stringify(data, null, 2));
        console.log('═══════════════════════════════════════════════════════════\n');
        
        if (data.success && data.transactionId) {
          console.log('✅ PayPal payment captured via backend API');
          console.log('🆔 Transaction ID:', data.transactionId);
          return {
            success: true,
            transactionId: data.transactionId,
          };
        }
      } else {
        // Backend API failed - log but don't return error, fall through to direct API
        const errorData = await response.json().catch(() => ({}));
        console.log('⚠️ Backend API error (will use direct PayPal API):', errorData.message || 'Backend endpoint not available');
        backendApiFailed = true;
      }
    } catch (apiError: any) {
      // Network error or other exception - fall through to direct API
      console.log('⚠️ Backend API not available, using direct PayPal API (testing only)');
      console.log('API Error:', apiError.message || apiError);
      backendApiFailed = true;
    }

    // If backend API failed or is not available, use direct PayPal API
    if (backendApiFailed) {
      console.log('🔄 Falling back to direct PayPal API for capture...');
    }

    // Fallback: Direct PayPal API call (FOR TESTING ONLY)
    console.log('⚠️ WARNING: Using direct PayPal API call (testing only)');
    console.log('⚠️ For production, implement backend endpoint: POST /api/v1/payment/capture-paypal-order');
    
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'Failed to authenticate with PayPal',
      };
    }

    // Check order status first - wait for approval if needed
    console.log('🔍 Checking PayPal order status...');
    let orderStatusCheck = await checkPayPalOrderStatus(orderId, accessToken);
    let retryCount = 0;
    const maxRetries = 15; // More retries since user just approved
    const retryDelay = 2000; // 2 seconds between checks

    console.log(`📊 Initial order status: ${orderStatusCheck.status || 'UNKNOWN'}`);

    // If order is already approved or completed, proceed immediately
    if (orderStatusCheck.approved || orderStatusCheck.status === 'COMPLETED') {
      console.log('✅ Order is already approved/completed, proceeding to capture...');
    } else {
      // Wait for order to be approved (with retries)
      console.log('⏳ Waiting for order to transition from CREATED to APPROVED...');
      while (!orderStatusCheck.approved && orderStatusCheck.status !== 'COMPLETED' && retryCount < maxRetries) {
        console.log(`⏳ Order status: ${orderStatusCheck.status || 'UNKNOWN'}, waiting for approval... (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), retryDelay));
        orderStatusCheck = await checkPayPalOrderStatus(orderId, accessToken);
        retryCount++;
        
        // If order is approved or completed, break out of loop
        if (orderStatusCheck.approved || orderStatusCheck.status === 'COMPLETED') {
          console.log(`✅ Order status changed to: ${orderStatusCheck.status}`);
          break;
        }
      }
    }

    if (!orderStatusCheck.approved && orderStatusCheck.status !== 'COMPLETED') {
      console.error('❌ Order not approved after waiting:', orderStatusCheck.status);
      console.error('💡 This usually means the user did not complete the approval on PayPal');
      return {
        success: false,
        error: `Order is not approved. Current status: ${orderStatusCheck.status || 'UNKNOWN'}. Please make sure you clicked "Pay Now" on the PayPal page. If you did, the payment may still be processing. Please try again.`,
      };
    }

    console.log('✅ Order is approved, proceeding to capture...');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💳 [paypalService.capturePayPalPayment] CAPTURE REQUEST');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌐 Endpoint:', `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`);
    console.log('📤 Method: POST');
    console.log('🆔 Order ID:', orderId);
    console.log('═══════════════════════════════════════════════════════════\n');

    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const captureData = await captureResponse.json();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💳 [paypalService.capturePayPalPayment] CAPTURE RESPONSE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 HTTP Status:', captureResponse.status, captureResponse.ok ? '(OK)' : '(ERROR)');
    console.log('📥 Full Capture Response:');
    console.log(JSON.stringify(captureData, null, 2));
    console.log('═══════════════════════════════════════════════════════════\n');

    // Extract capture details
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureOrderStatus = captureData.status; // Order-level status
    const captureStatus = capture?.status; // Individual capture status (this is what matters!)
    const transactionId = capture?.id;
    const captureAmount = capture?.amount;
    const processorResponse = capture?.processor_response;
    const paymentSource = captureData.payment_source;
    const cardInfo = paymentSource?.card;

    // Log card payment details if present
    if (cardInfo) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('💳 CARD PAYMENT DETAILS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('💳 Card Brand:', cardInfo.brand || 'N/A');
      console.log('💳 Card Type:', cardInfo.type || 'N/A');
      console.log('💳 Last 4 Digits:', cardInfo.last_digits || 'N/A');
      console.log('═══════════════════════════════════════════════════════════\n');
    }

    // Log processor response if present (for card payments)
    if (processorResponse) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('💳 PROCESSOR RESPONSE (Card Payment)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📊 AVS Code:', processorResponse.avs_code || 'N/A');
      console.log('📊 CVV Code:', processorResponse.cvv_code || 'N/A');
      console.log('📊 Response Code:', processorResponse.response_code || 'N/A');
      console.log('═══════════════════════════════════════════════════════════\n');
    }

    // CRITICAL: Check capture status, not just order status
    // Order can be "COMPLETED" but capture can be "DECLINED" (payment failed)
    // The capture status is what actually matters for payment success
    if (captureResponse.ok && captureOrderStatus === 'COMPLETED' && captureStatus === 'COMPLETED') {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('✅ PAYPAL PAYMENT VERIFICATION - SUCCESS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉 Order Status: COMPLETED');
      console.log('✅ Capture Status: COMPLETED');
      console.log('🆔 Order ID:', orderId);
      console.log('💳 Transaction ID:', transactionId || orderId);
      console.log('💰 Amount:', captureAmount?.value, captureAmount?.currency_code || 'USD');
      if (cardInfo) {
        console.log('💳 Payment Method: Card', `(${cardInfo.brand} ${cardInfo.type})`);
        console.log('💳 Card Last 4:', cardInfo.last_digits);
      }
      console.log('✅ Payment Successfully Captured and Verified!');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Final verification: Check order status one more time to confirm
      console.log('🔍 Performing final payment verification...');
      const finalStatusCheck = await checkPayPalOrderStatus(orderId, accessToken);
      if (finalStatusCheck.status === 'COMPLETED') {
        console.log('✅ Final Verification: Payment is COMPLETED and verified!');
      } else {
        console.warn('⚠️ Final Verification: Order status is', finalStatusCheck.status, '(expected COMPLETED)');
      }
      console.log('');
      
      return {
        success: true,
        transactionId: transactionId || orderId,
      };
    }

    // Handle DECLINED capture status (payment failed)
    // This is critical - even if order status is COMPLETED, if capture is DECLINED, payment failed
    if (captureStatus === 'DECLINED' || captureStatus === 'FAILED') {
      const errorMessage = processorResponse?.response_code 
        ? `Payment declined by card processor. Response code: ${processorResponse.response_code}. Please try a different payment method.`
        : `Payment was ${captureStatus}. Please try a different payment method.`;
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('❌ PAYPAL PAYMENT VERIFICATION - DECLINED/FAILED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️ Order Status:', captureOrderStatus, '(may show COMPLETED but payment failed)');
      console.log('❌ Capture Status:', captureStatus, '(THIS IS THE ACTUAL PAYMENT STATUS)');
      console.log('🆔 Order ID:', orderId);
      console.log('💳 Transaction ID:', transactionId || 'N/A');
      if (cardInfo) {
        console.log('💳 Card:', cardInfo.brand, cardInfo.type, 'ending in', cardInfo.last_digits);
      }
      if (processorResponse) {
        console.log('📊 Processor Response Code:', processorResponse.response_code);
        console.log('📊 AVS Code:', processorResponse.avs_code);
        console.log('📊 CVV Code:', processorResponse.cvv_code);
        console.log('💡 Response code 5400 typically means card was declined');
      }
      console.log('❌ Payment was declined or failed!');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    // Handle PENDING status (payment is processing)
    if (captureStatus === 'PENDING') {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('⏳ PAYPAL PAYMENT VERIFICATION - PENDING');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️ Order Status:', captureOrderStatus);
      console.log('⏳ Capture Status: PENDING (payment is processing)');
      console.log('🆔 Order ID:', orderId);
      console.log('💳 Transaction ID:', transactionId || 'N/A');
      console.log('⏳ Payment is still processing. Please wait...');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      return {
        success: false,
        error: 'Payment is still processing. Please wait a moment and try again, or check your payment status.',
      };
    }

    // Handle other capture statuses
    if (captureStatus && captureStatus !== 'COMPLETED') {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('⚠️ PAYPAL PAYMENT VERIFICATION - UNKNOWN STATUS');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('⚠️ Order Status:', captureOrderStatus);
      console.log('⚠️ Capture Status:', captureStatus);
      console.log('🆔 Order ID:', orderId);
      console.log('💳 Transaction ID:', transactionId || 'N/A');
      console.log('⚠️ Payment status is not COMPLETED');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      return {
        success: false,
        error: `Payment status is ${captureStatus}. Payment may not have been completed successfully.`,
      };
    }

    // Handle specific PayPal errors
    if (captureData.name === 'UNPROCESSABLE_ENTITY') {
      const errorDetails = captureData.details?.[0];
      const errorMessage = errorDetails?.description || errorDetails?.issue || captureData.message;
      console.error('❌ PayPal validation error:', errorMessage);
      return {
        success: false,
        error: errorMessage || 'Payment validation failed. Please try again.',
      };
    }

    // If we get here, something unexpected happened
    console.error('❌ Failed to capture PayPal payment - unexpected response:', captureData);
    console.error('❌ Order Status:', captureOrderStatus);
    console.error('❌ Capture Status:', captureStatus || 'NOT FOUND');
    return {
      success: false,
      error: captureData.message || captureData.details?.[0]?.description || 'Failed to capture PayPal payment. Please try again.',
    };
  } catch (error: any) {
    console.error('Error capturing PayPal payment:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while capturing PayPal payment',
    };
  }
};

export default {
  createPayPalOrder,
  capturePayPalPayment,
};
