import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStripe } from '@stripe/stripe-react-native';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';
import { createPaymentIntent } from '../../services/stripeBackend';
import { createPayPalOrder, capturePayPalPayment } from '../../services/paypalService';

const BLUE_COLOR = '#0358a8';

interface Props {
  onBack?: () => void;
  onPaymentSuccess?: (bookingId?: string, bookingData?: { date: string; time: string }, totalAmount?: number) => void;
  acceptedCenter?: any;
  bookingData?: {
    date?: string;
    time?: string;
    center?: any;
  };
}

const PaymentScreen: React.FC<Props> = ({ 
  onBack, 
  onPaymentSuccess,
  acceptedCenter = {
    id: '1',
    name: 'Premium Auto Wash',
    rating: 4.8,
    distance: '0.5 mi',
    address: 'Downtown, New York - 123 Main Street',
  },
  bookingData,
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [notes, setNotes] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [editableBookingTime, setEditableBookingTime] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'cash' | 'paypal' | null>(null);
  const [showPayPalWebView, setShowPayPalWebView] = useState(false);
  const [payPalApprovalUrl, setPayPalApprovalUrl] = useState<string | null>(null);
  const [payPalOrderId, setPayPalOrderId] = useState<string | null>(null);
  const { colors } = useTheme();
  const [userData, setUserData] = useState<any>(null);

  // Service center and service selection states
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [hasCheckedServices, setHasCheckedServices] = useState(false);

  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`; // DD-MM-YYYY
  };

  const getCurrentTime = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const convertTimeTo24Hour = (timeStr: string): string => {
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      return timeStr;
    }
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    return timeStr;
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          setUserData(user);
          if (user.vehicle_no) {
            setVehicleNumber(user.vehicle_no);
          }
          if (user.carmodel) {
            setCarModel(user.carmodel);
          }
        }
      } catch (error) {
        // Error loading user data
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (bookingData?.time) {
      setEditableBookingTime(bookingData.time);
    }
  }, [bookingData?.time]);

  useEffect(() => {
    const initialCenter = bookingData?.center || acceptedCenter;
    if (initialCenter) {
      // Check if the center already has services_offered data
      const hasServicesData = initialCenter?.services_offered && 
                             Array.isArray(initialCenter.services_offered);
      
      if (hasServicesData) {
        // Center already has services data, use it directly
        setSelectedServiceCenter(initialCenter);
        setHasCheckedServices(true);
      } else {
        // Center doesn't have services data, fetch it
        setSelectedServiceCenter(initialCenter);
        fetchServiceCenterDetails(initialCenter.id);
      }
      
      // Check if a service was pre-selected from ServiceCenterScreen
      if (initialCenter.selectedService) {
        setSelectedService(initialCenter.selectedService);
      }
    }
  }, []);

  // Validate that center has services - only check after loading is complete
  useEffect(() => {
    // Don't check if we're still loading or haven't finished the initial check
    if (loadingCenters || !hasCheckedServices) {
      return;
    }

    const centerHasServices = selectedServiceCenter?.services_offered && 
                              Array.isArray(selectedServiceCenter.services_offered) && 
                              selectedServiceCenter.services_offered.length > 0;
    
    // Only show error if we've checked and confirmed there are no services
    if (selectedServiceCenter && !centerHasServices && hasCheckedServices) {
      // Center has no services - show error and go back
      Alert.alert(
        'Service Center Unavailable',
        'This service center does not offer any services. Please select a different center.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back if possible
              if (onBack) {
                onBack();
              }
            }
          }
        ]
      );
    }
  }, [selectedServiceCenter, loadingCenters, hasCheckedServices]);

  // Helper to check if center has services
  const hasServices = (): boolean => {
    return selectedServiceCenter?.services_offered && 
           Array.isArray(selectedServiceCenter.services_offered) && 
           selectedServiceCenter.services_offered.length > 0;
  };

  const fetchServiceCenterDetails = async (centerId: number | string) => {
    setLoadingCenters(true);
    setHasCheckedServices(false);
    try {
      const result = await authService.getServiceCenters();
      if (result.success && result.serviceCenters) {
        const foundCenter = result.serviceCenters.find(
          (sc: any) => sc.id === Number(centerId) || String(sc.id) === String(centerId)
        );
        if (foundCenter) {
          setSelectedServiceCenter(foundCenter);
          // Mark that we've checked services after fetching
          setHasCheckedServices(true);
        } else {
          setHasCheckedServices(true);
        }
      } else {
        setHasCheckedServices(true);
      }
    } catch (error: any) {
      setHasCheckedServices(true);
    } finally {
      setLoadingCenters(false);
    }
  };

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setShowServiceDropdown(false);
  };

  const validateVehicleNumber = (): boolean => {
    if (!vehicleNumber.trim()) {
      setVehicleNumberError('Vehicle number is required');
      return false;
    }
    setVehicleNumberError('');
    return true;
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    
    if (!selectedPaymentMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to proceed.');
      return;
    }
    
    if (!validateVehicleNumber()) {
      Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
      return;
    }

    const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
    if (!centerId) {
      Alert.alert('Error', 'Please select a service center.');
      return;
    }

    // Validate that center has services - required for booking
    if (!hasServices()) {
      Alert.alert(
        'Service Center Unavailable',
        'This service center does not offer any services. Please select a different center.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Service selection is required
    if (!selectedService?.id) {
      Alert.alert('Error', 'Please select a service.');
      return;
    }

    if (selectedPaymentMethod === 'stripe') {
      handleStripePayment();
    } else if (selectedPaymentMethod === 'cash') {
      handleCashPayment();
    } else if (selectedPaymentMethod === 'paypal') {
      handlePayPalPayment();
    }
  };

  // Fresh Stripe Payment Implementation
  const handleStripePayment = async () => {
    if (isProcessing) return;

    if (!validateVehicleNumber()) {
      Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
      return;
    }

    const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
    if (!centerId) {
      Alert.alert('Error', 'Please select a service center.');
      return;
    }

    // Validate center has services - required for booking
    if (!hasServices()) {
      Alert.alert(
        'Service Center Unavailable',
        'This service center does not offer any services. Please select a different center.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      return;
    }

    // Service selection is required
    if (!selectedService?.id) {
      Alert.alert('Error', 'Please select a service to continue.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    try {
      const amount = selectedService.offer_price || selectedService.price;
      const amountInCents = Math.round(amount * 100);
      
      // Get user information for billing details (required for Indian regulations)
      const userName = userData?.fullName || userData?.name || '';
      const userEmail = userData?.email || '';
      const userPhone = userData?.phoneNumber || userData?.phone || '';
      
      // For Indian regulations, we need name and address
      // Address can be constructed from available data or use service center address
      const customerAddress = userData?.address 
        ? {
            line1: userData.address.line1 || userData.address || '',
            city: userData.address.city || '',
            state: userData.address.state || '',
            postal_code: userData.address.postal_code || userData.address.postalCode || '',
            country: 'IN',
          }
        : selectedServiceCenter?.address 
        ? {
            line1: selectedServiceCenter.address,
            city: '',
            state: '',
            postal_code: '',
            country: 'IN',
          }
        : undefined;

      // Step 1: Call backend to create PaymentIntent
      const serviceName = selectedService?.name || 'Car wash service';
      const clientSecret = await createPaymentIntent(
        amountInCents,
        'usd',
        `Car wash service - ${serviceName}`,
        {
          name: userName,
          email: userEmail,
          phone: userPhone,
          address: customerAddress,
        }
      );

      if (!clientSecret) {
        Alert.alert('Payment Error', 'Failed to create payment intent. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Prepare billing address for PaymentSheet
      const billingAddress = customerAddress ? {
        line1: customerAddress.line1 || '',
        city: customerAddress.city || '',
        state: customerAddress.state || '',
        postalCode: customerAddress.postal_code || '',
        country: customerAddress.country || 'IN',
      } : undefined;

      // Step 2: Initialize Stripe PaymentSheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'WashNow',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: userName || 'Customer',
          email: userEmail,
          phone: userPhone,
          ...(billingAddress && billingAddress.line1 ? { address: billingAddress } : {}),
        },
        allowsDelayedPaymentMethods: false,
        applePay: Platform.OS === 'ios' ? {
          merchantCountryCode: 'IN', // Changed to India for Indian regulations
        } : undefined,
        style: 'alwaysLight',
        appearance: {
          colors: {
            primary: BLUE_COLOR,
          },
        },
      });

      if (initError) {
        Alert.alert('Payment Error', initError.message || 'Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Step 3: Present PaymentSheet (Apple Pay + Card will be shown automatically)
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Error', presentError.message || 'Payment was not completed.');
        }
        setIsProcessing(false);
        return;
      }

      // Step 4: Payment successful - confirm booking
      const isScheduledBooking = bookingData?.date && bookingData?.time;
      let bookingDate: Date;
      let bookingTime: string;
      
      if (isScheduledBooking && bookingData.date && bookingData.time) {
        bookingDate = new Date(bookingData.date);
        bookingTime = editableBookingTime ? convertTimeTo24Hour(editableBookingTime) : convertTimeTo24Hour(bookingData.time);
      } else {
        const now = new Date();
        bookingDate = now;
        bookingTime = getCurrentTime(now);
      }
      
      // Build payload - ensure all required fields are present
      const payload: any = {
        service_centre_id: String(centerId || '').trim(),
        booking_date: formatDate(bookingDate),
        booking_time: bookingTime.trim(),
        vehicle_no: vehicleNumber.trim(),
        carmodel: (carModel || '').trim() || '',
        notes: (notes?.trim() || '').trim() || '',
      };
      
      // Validate center has services and service is selected
      if (!hasServices()) {
        Alert.alert(
          'Service Center Unavailable',
          'This service center does not offer any services. Please select a different center.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      if (!selectedService?.id) {
        Alert.alert('Error', 'Please select a service to continue.');
        setIsProcessing(false);
        return;
      }

      payload.service_id = String(selectedService.id).trim();

      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to complete your booking.');
        setIsProcessing(false);
        return;
      }
      
      const bookingResult = await authService.bookNow(payload);
      
      if (!bookingResult.success) {
        Alert.alert(
          'Booking Failed', 
          bookingResult.error || 'Payment succeeded but booking creation failed. Please contact support.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }
        
      const bookingNo = bookingResult.bookingNo || bookingResult.bookingId || '';

      // Fetch booking details to get the numeric ID and booking number
      let numericBookingId: number | null = null;
      let bookingNumber: string = bookingNo;
      
      try {
        // Fetch booking list to get the full booking details
        const bookingsResult = await authService.getBookingList(true); // Force refresh
        if (bookingsResult.success && bookingsResult.bookings) {
          // Find the booking by booking_id (booking number)
          const foundBooking = bookingsResult.bookings.find(
            (b: any) => b.booking_id === bookingNo || b.id?.toString() === bookingNo
          );
          if (foundBooking) {
            numericBookingId = foundBooking.id; // This is the numeric ID (e.g., 107)
            bookingNumber = foundBooking.booking_id || bookingNo; // This is the booking number (e.g., "B00106")
          }
        }
      } catch (error) {
        // Could not fetch booking details, will use booking number
      }

      // Initiate payment
      if (numericBookingId && bookingNumber) {
        const amount = selectedService.offer_price || selectedService.price;
        
        const paymentResult = await authService.initiatePayment({
          booking_id: numericBookingId,
          bookingno: bookingNumber,
          provider: 'Stripe',
          amount: amount.toString(),
        });

        // Payment initiation result - booking is already created, so don't fail if payment initiation fails
      }

      // Step 5: Notify success
      const bookingDataForResponse = {
        date: bookingDate.toISOString(),
        time: isScheduledBooking && (editableBookingTime || bookingData?.time) 
          ? (editableBookingTime || bookingData.time || getCurrentTime(bookingDate))
          : getCurrentTime(bookingDate),
      };
      
      setIsProcessing(false);
      onPaymentSuccess?.(bookingNo, bookingDataForResponse, amount);

    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'An error occurred during payment.');
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (isProcessing) return;

    if (!validateVehicleNumber()) {
      Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
      return;
    }

    const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
    if (!centerId) {
      Alert.alert('Error', 'Please select a service center.');
      return;
    }

    // Validate center has services - required for booking
    if (!hasServices()) {
      Alert.alert(
        'Service Center Unavailable',
        'This service center does not offer any services. Please select a different center.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      return;
    }

    // Service selection is required
    if (!selectedService?.id) {
      Alert.alert('Error', 'Please select a service to continue.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    try {
      // Validate service and amount before proceeding
      if (!selectedService) {
        Alert.alert('Error', 'Please select a service to continue.');
        setIsProcessing(false);
        return;
      }

      // Get amount and convert to number
      const rawAmount = selectedService.offer_price || selectedService.price;
      const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : Number(rawAmount);
      
      // Validate amount
      if (!rawAmount || isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Invalid service price. Please select a valid service.');
        setIsProcessing(false);
        return;
      }
      
      // Create PayPal order
      const orderResult = await createPayPalOrder({
        amount: amount,
        currency: 'USD',
        description: `Car wash service - ${selectedService?.name || 'Service'}`,
        returnUrl: 'washnow://paypal-success',
        cancelUrl: 'washnow://paypal-cancel',
      });

      if (!orderResult.success || !orderResult.approvalUrl || !orderResult.orderId) {
        Alert.alert('Payment Error', orderResult.error || 'Failed to create PayPal order. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Store order ID and open WebView
      setPayPalOrderId(orderResult.orderId);
      setPayPalApprovalUrl(orderResult.approvalUrl);
      setShowPayPalWebView(true);
      setIsProcessing(false);

    } catch (error: any) {
      Alert.alert('Payment Error', error.message || 'An error occurred during payment.');
      setIsProcessing(false);
    }
  };

  const handlePayPalWebViewNavigation = async (navState: any) => {
    const { url } = navState;
    
    console.log('🔍 PayPal WebView navigation detected:', url);
    
    // Only process non-PayPal URLs (these are redirects after approval/cancel)
    // PayPal domains should be allowed to load normally
    if (url.includes('paypal.com') || url.includes('paypal-sandbox.com')) {
      // This is still on PayPal's site - user is still in the approval process
      console.log('📍 Still on PayPal site, waiting for user to complete approval...');
      return;
    }
    
    // Check for cancel URL - our return URL with cancel
    if (url.includes('/paypal/cancel') || url.includes('paypal-cancel') || 
        (url.includes('cancel') && !url.includes('paypal.com'))) {
      console.log('❌ PayPal payment cancelled');
      setShowPayPalWebView(false);
      setPayPalOrderId(null);
      setPayPalApprovalUrl(null);
      Alert.alert('Payment Cancelled', 'You cancelled the PayPal payment.');
      return;
    }
    
    // Check for success URL - PayPal redirects to return_url ONLY after approval
    // The return_url will have token and PayerID parameters
    const hasToken = url.includes('token=');
    const hasPayerID = url.includes('PayerID=');
    const isReturnUrl = url.includes('/paypal/success') || url.includes('paypal-success');
    
    // Only proceed if we have BOTH token and PayerID, which means PayPal redirected after approval
    // OR if it's our specific return URL
    const isSuccessUrl = (isReturnUrl && (hasToken || hasPayerID)) || 
                        (hasToken && hasPayerID && !url.includes('paypal.com'));
    
    if (isSuccessUrl && payPalOrderId) {
      // Extract token and PayerID from URL
      const tokenMatch = url.match(/token=([^&]+)/);
      const payerIdMatch = url.match(/PayerID=([^&]+)/);
      
      console.log('✅ PayPal approval confirmed! PayPal redirected to return URL.');
      console.log('📝 Order ID:', payPalOrderId);
      console.log('📝 URL:', url);
      if (tokenMatch) console.log('📝 Token:', tokenMatch[1]);
      if (payerIdMatch) console.log('📝 Payer ID:', payerIdMatch[1]);
      
      // Close WebView
      setShowPayPalWebView(false);
      
      // Wait for PayPal to fully process the approval
      console.log('⏳ Waiting for PayPal to process approval (3 seconds)...');
      await new Promise<void>(resolve => setTimeout(() => resolve(), 3000));
      
      setIsProcessing(true);

        try {
          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('💳 PAYPAL PAYMENT CAPTURE - STARTING');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('🆔 Order ID:', payPalOrderId);
          console.log('⏳ Capturing payment...');
          console.log('═══════════════════════════════════════════════════════════\n');
          
          // Capture the payment
          const captureResult = await capturePayPalPayment(payPalOrderId);

          console.log('\n═══════════════════════════════════════════════════════════');
          console.log('💳 PAYPAL PAYMENT CAPTURE RESULT');
          console.log('═══════════════════════════════════════════════════════════');
          console.log('📥 Full Capture Result:', JSON.stringify(captureResult, null, 2));
          console.log('✅ Success:', captureResult.success);
          if (captureResult.success) {
            console.log('🆔 Transaction ID:', captureResult.transactionId);
            console.log('✅ Payment Successfully Verified!');
          } else {
            console.log('❌ Error:', captureResult.error);
          }
          console.log('═══════════════════════════════════════════════════════════\n');

          if (!captureResult.success) {
            Alert.alert('Payment Error', captureResult.error || 'Failed to capture PayPal payment. Please try again.');
            setIsProcessing(false);
            setPayPalOrderId(null);
            setPayPalApprovalUrl(null);
            return;
          }
          
          console.log('✅ PayPal payment verified successfully! Proceeding to create booking...');

          // Payment successful - create booking
          const isScheduledBooking = bookingData?.date && bookingData?.time;
          let bookingDate: Date;
          let bookingTime: string;
          
          if (isScheduledBooking && bookingData.date && bookingData.time) {
            bookingDate = new Date(bookingData.date);
            bookingTime = editableBookingTime ? convertTimeTo24Hour(editableBookingTime) : convertTimeTo24Hour(bookingData.time);
          } else {
            const now = new Date();
            bookingDate = now;
            bookingTime = getCurrentTime(now);
          }
          
          const payload: any = {
            service_centre_id: String(selectedServiceCenter?.id || '').trim(),
            booking_date: formatDate(bookingDate),
            booking_time: bookingTime.trim(),
            vehicle_no: vehicleNumber.trim(),
            carmodel: (carModel || '').trim() || '',
            notes: (notes?.trim() || '').trim() || '',
            service_id: String(selectedService.id).trim(),
          };

          const token = await authService.getToken();
          if (!token) {
            Alert.alert('Authentication Required', 'Please login to complete your booking.');
            setIsProcessing(false);
            setPayPalOrderId(null);
            setPayPalApprovalUrl(null);
            return;
          }
          
          const bookingResult = await authService.bookNow(payload);
          
          if (!bookingResult.success) {
            Alert.alert(
              'Booking Failed', 
              bookingResult.error || 'Payment succeeded but booking creation failed. Please contact support.',
              [{ text: 'OK' }]
            );
            setIsProcessing(false);
            setPayPalOrderId(null);
            setPayPalApprovalUrl(null);
            return;
          }
            
          const bookingNo = bookingResult.bookingNo || bookingResult.bookingId || '';

          // Fetch booking details to get the numeric ID and booking number
          let numericBookingId: number | null = null;
          let bookingNumber: string = bookingNo;
          
          try {
            const bookingsResult = await authService.getBookingList(true);
            if (bookingsResult.success && bookingsResult.bookings) {
              const foundBooking = bookingsResult.bookings.find(
                (b: any) => b.booking_id === bookingNo || b.id?.toString() === bookingNo
              );
              if (foundBooking) {
                numericBookingId = foundBooking.id;
                bookingNumber = foundBooking.booking_id || bookingNo;
              }
            }
          } catch (error) {
            // Could not fetch booking details, will use booking number
          }

          // Initiate payment
          if (numericBookingId && bookingNumber) {
            const amount = selectedService.offer_price || selectedService.price;
            
            await authService.initiatePayment({
              booking_id: numericBookingId,
              bookingno: bookingNumber,
              provider: 'PayPal',
              amount: amount.toString(),
            });
          }

          const bookingDataForResponse = {
            date: bookingDate.toISOString(),
            time: isScheduledBooking && (editableBookingTime || bookingData?.time) 
              ? (editableBookingTime || bookingData.time || getCurrentTime(bookingDate))
              : getCurrentTime(bookingDate),
          };
          
          const amount = selectedService.offer_price || selectedService.price;
          setIsProcessing(false);
          setPayPalOrderId(null);
          setPayPalApprovalUrl(null);
          onPaymentSuccess?.(bookingNo, bookingDataForResponse, amount);

        } catch (error: any) {
          Alert.alert('Payment Error', error.message || 'An error occurred during payment.');
          setIsProcessing(false);
          setPayPalOrderId(null);
          setPayPalApprovalUrl(null);
        }
      }
  };

  const handleCashPayment = async () => {
    if (isProcessing) return;

    if (!validateVehicleNumber()) {
      Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
      return;
    }

    const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
    if (!centerId) {
      Alert.alert('Error', 'Please select a service center.');
      return;
    }

    setIsProcessing(true);

    try {
      const isScheduledBooking = bookingData?.date && bookingData?.time;
      let bookingDate: Date;
      let bookingTime: string;
      
      if (isScheduledBooking && bookingData.date && bookingData.time) {
        bookingDate = new Date(bookingData.date);
        bookingTime = editableBookingTime ? convertTimeTo24Hour(editableBookingTime) : convertTimeTo24Hour(bookingData.time);
      } else {
        const now = new Date();
        bookingDate = now;
        bookingTime = getCurrentTime(now);
      }
      
      // Ensure centerId is valid
      if (!centerId) {
        Alert.alert('Error', 'Invalid service center. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      // Build payload - ensure all required fields are present
      const payload: any = {
        service_centre_id: String(centerId).trim(),
        booking_date: formatDate(bookingDate),
        booking_time: bookingTime.trim(),
        vehicle_no: vehicleNumber.trim(),
        carmodel: (carModel || '').trim() || '',
      };
      
      // Add notes with payment method
      const paymentNote = notes?.trim() 
        ? `${notes.trim()}\nPayment method: Cash` 
        : 'Payment method: Cash';
      payload.notes = paymentNote.trim();
      
      // Validate center has services before proceeding
      if (!hasServices()) {
        Alert.alert(
          'Service Center Unavailable',
          'This service center does not offer any services. Please select a different center.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }

      // Service ID is required - must be selected service
      if (!selectedService?.id) {
        Alert.alert('Error', 'Please select a service to continue.');
        setIsProcessing(false);
        return;
      }

      payload.service_id = String(selectedService.id).trim();

      const token = await authService.getToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to complete your booking.');
        setIsProcessing(false);
        return;
      }
      
      const bookingResult = await authService.bookNow(payload);
      
      if (!bookingResult.success) {
        // Show detailed error to user
        const errorMsg = bookingResult.error || 'Failed to create booking. Please try again.';
        Alert.alert(
          'Booking Failed', 
          errorMsg,
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        return;
      }
        
      const bookingNo = bookingResult.bookingNo || bookingResult.bookingId || '';

      // Fetch booking details to get the numeric ID and booking number
      let numericBookingId: number | null = null;
      let bookingNumber: string = bookingNo;
      
      try {
        // Fetch booking list to get the full booking details
        const bookingsResult = await authService.getBookingList(true); // Force refresh
        if (bookingsResult.success && bookingsResult.bookings) {
          // Find the booking by booking_id (booking number)
          const foundBooking = bookingsResult.bookings.find(
            (b: any) => b.booking_id === bookingNo || b.id?.toString() === bookingNo
          );
          if (foundBooking) {
            numericBookingId = foundBooking.id; // This is the numeric ID (e.g., 107)
            bookingNumber = foundBooking.booking_id || bookingNo; // This is the booking number (e.g., "B00106")
          }
        }
      } catch (error) {
        // Could not fetch booking details, will use booking number
      }

      // Get the amount for payment
      const amount = selectedService.offer_price || selectedService.price;

      // Initiate payment
      if (numericBookingId && bookingNumber) {
        const paymentResult = await authService.initiatePayment({
          booking_id: numericBookingId,
          bookingno: bookingNumber,
          provider: 'Cash',
          amount: amount.toString(),
        });

        // Payment initiation result - booking is already created, so don't fail if payment initiation fails
      }
      
      const bookingDataForResponse = {
        date: bookingDate.toISOString(),
        time: isScheduledBooking && (editableBookingTime || bookingData?.time) 
          ? (editableBookingTime || bookingData.time || getCurrentTime(bookingDate))
          : getCurrentTime(bookingDate),
      };
      
      setIsProcessing(false);
      onPaymentSuccess?.(bookingNo, bookingDataForResponse, amount);

    } catch (error: any) {
      let errorMessage = error.message || 'An error occurred during booking.';
      
      // Handle timeout errors specifically
      if (error.message && error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please check your internet connection and try again.';
      }
      
      Alert.alert(
        'Booking Error', 
        errorMessage,
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Book an Appointment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Summary Card */}
        <View style={[styles.bookingSummaryCard, { backgroundColor: '#F0F7FF', marginTop: 12 }]}>
          <View style={styles.bookingSummaryHeader}>
            <View style={[styles.bookingSummaryIconContainer, { backgroundColor: BLUE_COLOR + '20' }]}>
              <Ionicons name="calendar-outline" size={20} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.bookingSummaryTitle, { color: BLUE_COLOR }]}>Booking Summary</Text>
          </View>

          <View style={styles.bookingSummaryContent}>
            {/* Service */}
            {selectedService && (
              <View style={styles.bookingSummaryItem}>
                <View style={styles.bookingSummaryItemLeft}>
                  <View style={[styles.bookingSummaryItemIcon, { backgroundColor: BLUE_COLOR + '20' }]}>
                    <Ionicons name="water-outline" size={16} color={BLUE_COLOR} />
                  </View>
                  <Text style={[styles.bookingSummaryItemLabel, { color: colors.textSecondary }]}>Service</Text>
                </View>
                <Text style={[styles.bookingSummaryItemValue, { color: colors.text }]}>{selectedService.name}</Text>
              </View>
            )}

            {/* Divider */}
            {selectedService && (bookingData?.date || bookingData?.time) && (
              <View style={[styles.bookingSummaryDivider, { backgroundColor: colors.border }]} />
            )}

            {/* Price */}
            {selectedService && (
              <View style={styles.bookingSummaryItem}>
                <View style={styles.bookingSummaryItemLeft}>
                  <View style={[styles.bookingSummaryItemIcon, { backgroundColor: '#10B981' + '20' }]}>
                    <Ionicons name="pricetag-outline" size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.bookingSummaryItemLabel, { color: colors.textSecondary }]}>Price</Text>
                </View>
                <Text style={[styles.bookingSummaryItemValue, styles.bookingSummaryPrice, { color: '#10B981' }]}>
                  £{selectedService.offer_price ? parseFloat(selectedService.offer_price).toFixed(2) : parseFloat(selectedService.price || '0').toFixed(2)}
                </Text>
              </View>
            )}

            {/* Divider */}
            {bookingData?.date && bookingData?.time && (
              <View style={[styles.bookingSummaryDivider, { backgroundColor: colors.border }]} />
            )}

            {/* Date */}
            {bookingData?.date && (
              <View style={styles.bookingSummaryItem}>
                <View style={styles.bookingSummaryItemLeft}>
                  <View style={[styles.bookingSummaryItemIcon, { backgroundColor: '#9333EA' + '20' }]}>
                    <Ionicons name="calendar-outline" size={16} color="#9333EA" />
                  </View>
                  <Text style={[styles.bookingSummaryItemLabel, { color: colors.textSecondary }]}>Date</Text>
                </View>
                <Text style={[styles.bookingSummaryItemValue, { color: colors.text }]}>
                  {new Date(bookingData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
            )}

            {/* Divider */}
            {bookingData?.date && bookingData?.time && (
              <View style={[styles.bookingSummaryDivider, { backgroundColor: colors.border }]} />
            )}

            {/* Time */}
            {bookingData?.time && (
              <View style={styles.bookingSummaryItem}>
                <View style={styles.bookingSummaryItemLeft}>
                  <View style={[styles.bookingSummaryItemIcon, { backgroundColor: '#FF6B35' + '20' }]}>
                    <Ionicons name="time-outline" size={16} color="#FF6B35" />
                  </View>
                  <Text style={[styles.bookingSummaryItemLabel, { color: colors.textSecondary }]}>Time Slot</Text>
                </View>
                <Text style={[styles.bookingSummaryItemValue, { color: colors.text }]}>
                  {editableBookingTime || bookingData.time}
                </Text>
              </View>
            )}

            {/* Service Selection Button - Only show if no service selected */}
            {!selectedService && hasServices() && (
              <TouchableOpacity
                style={[
                  styles.serviceButton,
                  { 
                    borderColor: colors.border, 
                    backgroundColor: colors.surface,
                    marginTop: Platform.select({ ios: 16, android: 10 })
                  }
                ]}
                onPress={() => {
                  setShowServiceDropdown(true);
                }}
              >
                <View style={styles.serviceButtonContent}>
                  <Ionicons name="water" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.serviceButtonIcon} />
                  <Text style={[
                    styles.serviceButtonText,
                    { color: colors.textSecondary }
                  ]}>
                    Select Service
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={Platform.select({ ios: 18, android: 16 })} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Vehicle Details Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="car" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: BLUE_COLOR }]}>Vehicle Information</Text>
          </View>
          
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Vehicle Number <Text style={{ color: '#EF4444' }}>*</Text></Text>
            <View style={[
              styles.inputContainer,
              { 
                borderColor: vehicleNumberError ? '#EF4444' : colors.border,
                backgroundColor: colors.surface,
              }
            ]}>
              <Ionicons name="car" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.modernInput, 
                  { 
                    color: colors.text,
                    flex: 1,
                  }
                ]}
                placeholder="Enter vehicle number"
                placeholderTextColor={colors.textSecondary}
                value={vehicleNumber}
                onChangeText={(text) => {
                  setVehicleNumber(text);
                  if (vehicleNumberError && text.trim()) {
                    setVehicleNumberError('');
                  }
                }}
                autoCapitalize="characters"
              />
            </View>
            {vehicleNumberError ? (
              <Text style={styles.errorText}>{vehicleNumberError}</Text>
            ) : null}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Car Model</Text>
            <View style={[
              styles.inputContainer,
              { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }
            ]}>
              <Ionicons name="car-sport" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.modernInput, 
                  { 
                    color: colors.text,
                    flex: 1,
                  }
                ]}
                placeholder="Enter car model (e.g., Camry)"
                placeholderTextColor={colors.textSecondary}
                value={carModel}
                onChangeText={setCarModel}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
            <View style={[
              styles.inputContainer,
              { 
                borderColor: colors.border,
                backgroundColor: colors.surface,
                minHeight: Platform.select({ ios: 100, android: 80 }),
                alignItems: 'flex-start',
                paddingTop: Platform.select({ ios: 14, android: 12 }),
              }
            ]}>
              <Ionicons name="document-text" size={Platform.select({ ios: 18, android: 16 })} color="#FF6B35" style={[styles.inputIcon, { marginTop: 2 }]} />
              <TextInput
                style={[
                  styles.modernInput, 
                  { 
                    color: colors.text,
                    flex: 1,
                    textAlignVertical: 'top',
                  }
                ]}
                placeholder="Add any special instructions"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>

        {/* Payment Method - Card and Cash */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="card" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: BLUE_COLOR }]}>Payment Method</Text>
          </View>
          
          <View style={styles.paymentMethodsContainer}>
            {/* Card (Stripe with Apple Pay) Payment Method - Only show if center has services */}
            {hasServices() && (
              <TouchableOpacity
                style={[
                  styles.paymentCard,
                  { 
                    backgroundColor: selectedPaymentMethod === 'stripe' ? BLUE_COLOR : colors.surface,
                    borderColor: selectedPaymentMethod === 'stripe' ? BLUE_COLOR : colors.border,
                    borderWidth: selectedPaymentMethod === 'stripe' ? 2 : 1.5,
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('stripe')}
                activeOpacity={0.8}
              >
              <View style={styles.paymentCardLeft}>
                <View style={[styles.paymentIconWrapper, { backgroundColor: selectedPaymentMethod === 'stripe' ? '#FFFFFF' + '30' : BLUE_COLOR + '12' }]}>
                  <Ionicons 
                    name="card" 
                    size={Platform.select({ ios: 20, android: 18 })} 
                    color={selectedPaymentMethod === 'stripe' ? '#FFFFFF' : BLUE_COLOR} 
                  />
                </View>
                <View style={styles.paymentCardContent}>
                  <Text style={[
                    styles.paymentCardText, 
                    { color: selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.text }
                  ]}>
                    Card Payment
                  </Text>
                  <View style={styles.paymentMethodBadges}>
                    <View style={[styles.methodBadge, { backgroundColor: selectedPaymentMethod === 'stripe' ? '#FFFFFF' + '20' : colors.background, borderColor: selectedPaymentMethod === 'stripe' ? '#FFFFFF' + '40' : colors.border }]}>
                      <Ionicons 
                        name="card-outline" 
                        size={12} 
                        color={selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.textSecondary} 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.methodBadgeText, { color: selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.textSecondary }]}>
                        Stripe
                      </Text>
                    </View>
                    {Platform.OS === 'ios' && (
                      <View style={[styles.methodBadge, styles.applePayBadgeMain, { backgroundColor: selectedPaymentMethod === 'stripe' ? '#000000' + '40' : '#000000', borderColor: 'transparent' }]}>
                        <Ionicons name="logo-apple" size={13} color="#FFFFFF" />
                        <Text style={[styles.methodBadgeText, styles.applePayBadgeText, { color: '#FFFFFF' }]}>
                          Apple Pay
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {selectedPaymentMethod === 'stripe' && (
                <View style={styles.checkIcon}>
                  <View style={[styles.checkIconBackground, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                    <Ionicons name="checkmark" size={Platform.select({ ios: 16, android: 14 })} color={BLUE_COLOR} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            )}

            {/* PayPal Payment Method - Only show if center has services */}
            {hasServices() && (
              <TouchableOpacity
                style={[
                  styles.paymentCard,
                  { 
                    backgroundColor: selectedPaymentMethod === 'paypal' ? BLUE_COLOR : colors.surface,
                    borderColor: selectedPaymentMethod === 'paypal' ? BLUE_COLOR : colors.border,
                    borderWidth: selectedPaymentMethod === 'paypal' ? 2 : 1.5,
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('paypal')}
                activeOpacity={0.8}
              >
                <View style={styles.paymentCardLeft}>
                  <View style={[styles.paymentIconWrapper, { backgroundColor: selectedPaymentMethod === 'paypal' ? '#FFFFFF' + '30' : BLUE_COLOR + '12' }]}>
                    <Ionicons 
                      name="wallet" 
                      size={Platform.select({ ios: 20, android: 18 })} 
                      color={selectedPaymentMethod === 'paypal' ? '#FFFFFF' : BLUE_COLOR} 
                    />
                  </View>
                  <View style={styles.paymentCardContent}>
                    <Text style={[
                      styles.paymentCardText, 
                      { color: selectedPaymentMethod === 'paypal' ? '#FFFFFF' : colors.text }
                    ]}>
                      PayPal
                    </Text>
                    <Text style={[
                      styles.paymentCardSubtext, 
                      { color: selectedPaymentMethod === 'paypal' ? '#FFFFFF' + 'CC' : colors.textSecondary }
                    ]}>
                      Pay with PayPal account
                    </Text>
                  </View>
                </View>
                {selectedPaymentMethod === 'paypal' && (
                  <View style={styles.checkIcon}>
                    <View style={[styles.checkIconBackground, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                      <Ionicons name="checkmark" size={Platform.select({ ios: 16, android: 14 })} color={BLUE_COLOR} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Cash Payment Method */}
            <TouchableOpacity
              style={[
                styles.paymentCard,
                { 
                  backgroundColor: selectedPaymentMethod === 'cash' ? BLUE_COLOR : colors.surface,
                  borderColor: selectedPaymentMethod === 'cash' ? BLUE_COLOR : colors.border,
                  borderWidth: selectedPaymentMethod === 'cash' ? 2 : 1.5,
                }
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
              activeOpacity={0.8}
            >
              <View style={styles.paymentCardLeft}>
                <View style={[styles.paymentIconWrapper, { backgroundColor: selectedPaymentMethod === 'cash' ? '#FFFFFF' + '30' : BLUE_COLOR + '12' }]}>
                  <Ionicons 
                    name="cash" 
                    size={Platform.select({ ios: 20, android: 18 })} 
                    color={selectedPaymentMethod === 'cash' ? '#FFFFFF' : BLUE_COLOR} 
                  />
                </View>
                <View style={styles.paymentCardContent}>
                  <Text style={[
                    styles.paymentCardText, 
                    { color: selectedPaymentMethod === 'cash' ? '#FFFFFF' : colors.text }
                  ]}>
                    Pay at Center
                  </Text>
                  <Text style={[
                    styles.paymentCardSubtext, 
                    { color: selectedPaymentMethod === 'cash' ? '#FFFFFF' + 'CC' : colors.textSecondary }
                  ]}>
                    Cash or online
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'cash' && (
                <View style={styles.checkIcon}>
                  <View style={[styles.checkIconBackground, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }]}>
                    <Ionicons name="checkmark" size={Platform.select({ ios: 16, android: 14 })} color={BLUE_COLOR} />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary - Only show if service is selected */}
        {selectedService && hasServices() && (
          <View style={[styles.summaryCard, { backgroundColor: '#F0F7FF', marginTop: 12 }]}>
            <View style={styles.cardHeaderSection}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '20' }]}>
                <Ionicons name="receipt" size={20} color={BLUE_COLOR} />
              </View>
              <Text style={[styles.cardTitle, { color: BLUE_COLOR }]}>Payment Summary</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{selectedService.name}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                £{selectedService.offer_price ? parseFloat(selectedService.offer_price).toFixed(2) : parseFloat(selectedService.price || '0').toFixed(2)}
              </Text>
            </View>
            
            {selectedService.offer_price && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Fee</Text>
                <Text style={[styles.summaryDiscount, { color: colors.textSecondary }]}>
                  £0.00
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryDivider, { backgroundColor: colors.border, marginVertical: 12 }]} />
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.summaryTotalValue, { color: '#10B981' }]}>
                £{selectedService.offer_price ? parseFloat(selectedService.offer_price).toFixed(2) : parseFloat(selectedService.price || '0').toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Service Dropdown Modal */}
      <Modal
        visible={showServiceDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowServiceDropdown(false)}
        >
          <View 
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServiceDropdown(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedServiceCenter?.services_offered && selectedServiceCenter.services_offered.length > 0 ? (
              <ScrollView>
                {selectedServiceCenter.services_offered.map((item: any) => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: colors.border },
                      selectedService?.id === item.id && { backgroundColor: BLUE_COLOR + '10' }
                    ]}
                    onPress={() => handleServiceSelect(item)}
                  >
                    <View style={styles.modalItemContent}>
                      <Text style={[styles.modalItemTitle, { color: colors.text }]}>{item.name}</Text>
                      {item.description && (
                        <Text style={[styles.modalItemSubtitle, { color: colors.textSecondary }]} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <View style={styles.priceContainer}>
                        {item.offer_price ? (
                          <>
                            <Text style={[styles.offerPrice, { color: BLUE_COLOR }]}>${item.offer_price}</Text>
                            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>${item.price}</Text>
                          </>
                        ) : (
                          <Text style={[styles.offerPrice, { color: BLUE_COLOR }]}>${item.price}</Text>
                        )}
                      </View>
                    </View>
                    {selectedService?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color={BLUE_COLOR} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No services available
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PayPal WebView Modal */}
      <Modal
        visible={showPayPalWebView}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowPayPalWebView(false);
          setPayPalOrderId(null);
          setPayPalApprovalUrl(null);
        }}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.paypalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              onPress={() => {
                setShowPayPalWebView(false);
                setPayPalOrderId(null);
                setPayPalApprovalUrl(null);
              }} 
              style={styles.paypalBackButton} 
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={Platform.select({ ios: 18, android: 16 })} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.paypalTitle, { color: colors.text }]}>PayPal Checkout</Text>
            <View style={{ width: 28 }} />
          </View>
          {payPalApprovalUrl ? (
            <WebView
              source={{ uri: payPalApprovalUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={handlePayPalWebViewNavigation}
              onShouldStartLoadWithRequest={(request) => {
                const { url } = request;
                console.log('🔍 WebView shouldStartLoadWithRequest:', url);
                
                // Always allow PayPal domains - user needs to complete approval there
                if (url.includes('paypal.com') || url.includes('paypal-sandbox.com')) {
                  console.log('✅ Allowing PayPal domain navigation');
                  return true;
                }
                
                // For non-PayPal URLs, check if it's our return URL (after approval)
                // This means user completed approval and PayPal redirected
                const hasToken = url.includes('token=');
                const hasPayerID = url.includes('PayerID=');
                const isReturnUrl = url.includes('/paypal/success') || url.includes('paypal-success');
                const isCancelUrl = url.includes('/paypal/cancel') || url.includes('paypal-cancel');
                
                if (isReturnUrl || isCancelUrl || (hasToken && hasPayerID)) {
                  // This is PayPal's redirect after approval/cancel
                  console.log('🔄 PayPal redirect detected, will handle in onNavigationStateChange');
                  // Allow the navigation, we'll handle it in onNavigationStateChange
                  return true;
                }
                
                // Allow other navigations
                return true;
              }}
              injectedJavaScript={`
                (function() {
                  function injectStyles() {
                    const existingStyle = document.getElementById('paypal-custom-styles');
                    if (existingStyle) {
                      existingStyle.remove();
                    }
                    
                    const style = document.createElement('style');
                    style.id = 'paypal-custom-styles';
                    style.textContent = \`
                      /* Hide PayPal's internal back button */
                      button[aria-label*="Back"], 
                      button[aria-label*="back"],
                      a[aria-label*="Back"],
                      a[aria-label*="back"],
                      [class*="back"][class*="button"],
                      [class*="back-button"],
                      [id*="back-button"],
                      [class*="backButton"],
                      [id*="backButton"],
                      button[class*="back"],
                      a[class*="back"],
                      nav button:first-child,
                      header button:first-child,
                      [role="navigation"] button:first-child,
                      [class*="header"] button:first-child,
                      [class*="nav"] button:first-child {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        width: 0 !important;
                        height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }
                      
                      /* Hide back arrow icons inside PayPal */
                      svg[class*="back"],
                      svg[class*="arrow-left"],
                      [class*="back"] svg,
                      [class*="arrow-left"] svg,
                      button[class*="back"] svg,
                      a[class*="back"] svg {
                        display: none !important;
                        visibility: hidden !important;
                      }
                      
                      /* Reduce all font sizes in PayPal content */
                      * {
                        font-size: calc(1em * 0.75) !important;
                      }
                      body { 
                        font-size: 12px !important; 
                      }
                      h1, h2, h3, h4, h5, h6 { 
                        font-size: 14px !important; 
                        font-weight: 600 !important;
                        line-height: 1.3 !important;
                      }
                      .header, header, [class*="header"], [id*="header"], nav {
                        font-size: 12px !important;
                      }
                      .title, [class*="title"], [id*="title"], [class*="heading"] {
                        font-size: 14px !important;
                      }
                      .amount, [class*="amount"], [id*="amount"], [class*="price"], [class*="total"] {
                        font-size: 16px !important;
                      }
                      .button, button, [class*="button"], [id*="button"], [role="button"] {
                        font-size: 12px !important;
                        padding: 8px 14px !important;
                      }
                      input, textarea, select {
                        font-size: 12px !important;
                        padding: 8px !important;
                      }
                      label, .label, [class*="label"] {
                        font-size: 11px !important;
                      }
                      p, span, div, li {
                        font-size: 12px !important;
                        line-height: 1.4 !important;
                      }
                      /* Reduce back button and icons */
                      svg, [class*="icon"], [class*="arrow"], [class*="chevron"], 
                      button svg, a svg, [role="button"] svg {
                        width: 16px !important;
                        height: 16px !important;
                        max-width: 16px !important;
                        max-height: 16px !important;
                      }
                      /* Reduce logo size */
                      [class*="logo"], [id*="logo"], img[alt*="PayPal"], img[src*="logo"], 
                      [class*="brand"], [id*="brand"] {
                        max-width: 90px !important;
                        max-height: 30px !important;
                        width: auto !important;
                        height: auto !important;
                      }
                      /* Reduce spacing */
                      .container, [class*="container"], [class*="wrapper"] {
                        padding: 10px !important;
                      }
                    \`;
                    document.head.appendChild(style);
                  }
                  
                  function hideBackButtons() {
                    // Hide back buttons by various selectors
                    const selectors = [
                      'button[aria-label*="Back"]',
                      'button[aria-label*="back"]',
                      'a[aria-label*="Back"]',
                      'a[aria-label*="back"]',
                      '[class*="back"][class*="button"]',
                      '[class*="back-button"]',
                      '[id*="back-button"]',
                      '[class*="backButton"]',
                      '[id*="backButton"]',
                      'button[class*="back"]',
                      'a[class*="back"]',
                      'nav button:first-child',
                      'header button:first-child',
                      '[role="navigation"] button:first-child',
                      '[class*="header"] button:first-child',
                      '[class*="nav"] button:first-child'
                    ];
                    
                    selectors.forEach(selector => {
                      try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                          if (el && (el.textContent?.toLowerCase().includes('back') || 
                              el.getAttribute('aria-label')?.toLowerCase().includes('back') ||
                              el.className?.toLowerCase().includes('back'))) {
                            el.style.display = 'none';
                            el.style.visibility = 'hidden';
                            el.style.opacity = '0';
                            el.style.width = '0';
                            el.style.height = '0';
                            el.style.padding = '0';
                            el.style.margin = '0';
                          }
                        });
                      } catch(e) {}
                    });
                  }
                  
                  // Inject immediately
                  injectStyles();
                  hideBackButtons();
                  
                  // Re-inject after DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                      injectStyles();
                      hideBackButtons();
                    });
                  } else {
                    injectStyles();
                    hideBackButtons();
                  }
                  
                  // Re-inject after a short delay to catch dynamically loaded content
                  setTimeout(() => {
                    injectStyles();
                    hideBackButtons();
                  }, 500);
                  setTimeout(() => {
                    injectStyles();
                    hideBackButtons();
                  }, 1000);
                  setTimeout(() => {
                    injectStyles();
                    hideBackButtons();
                  }, 2000);
                })();
                true;
              `}
              onLoadEnd={() => {
                // Re-inject styles and hide back buttons after page loads
                setTimeout(() => {
                  // Styles and back button hiding will be re-injected via injectedJavaScript
                }, 100);
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={BLUE_COLOR} />
                  <Text style={[styles.webViewLoadingText, { color: colors.text }]}>Loading PayPal...</Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={BLUE_COLOR} />
              <Text style={[styles.webViewLoadingText, { color: colors.text }]}>Preparing PayPal checkout...</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Pay Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.payButton, 
            { backgroundColor: BLUE_COLOR }, 
            (isProcessing || !vehicleNumber.trim() || !selectedServiceCenter || (hasServices() && !selectedService) || !selectedPaymentMethod) && styles.payButtonDisabled
          ]} 
          onPress={handlePayment}
          disabled={isProcessing || !vehicleNumber.trim() || !selectedServiceCenter || (hasServices() && !selectedService) || !selectedPaymentMethod}
        >
          {isProcessing ? (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>Processing...</Text>
          ) : (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
              Confirm & Book →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 10, android: 8 }),
    paddingBottom: Platform.select({ ios: 10, android: 8 }),
    borderBottomWidth: 1,
  },
  backButton: {
    width: Platform.select({ ios: 36, android: 32 }),
    height: Platform.select({ ios: 36, android: 32 }),
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TEXT_STYLES.sectionHeading,
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  paypalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 14, android: 10 }),
    paddingTop: Platform.select({ ios: 6, android: 4 }),
    paddingBottom: Platform.select({ ios: 6, android: 4 }),
    borderBottomWidth: 1,
    minHeight: Platform.select({ ios: 44, android: 40 }),
  },
  paypalBackButton: {
    width: Platform.select({ ios: 28, android: 24 }),
    height: Platform.select({ ios: 28, android: 24 }),
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  paypalTitle: {
    ...TEXT_STYLES.cardTitle,
    letterSpacing: -0.1,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 16, android: 12 }),
    paddingBottom: Platform.select({ ios: 20, android: 16 }),
  },
  infoCard: {
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    padding: Platform.select({ ios: 22, android: 18 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(3, 88, 168, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: Platform.select({ ios: 44, android: 40 }),
    height: Platform.select({ ios: 44, android: 40 }),
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.select({ ios: 14, android: 12 }),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TEXT_STYLES.label,
    marginBottom: Platform.select({ ios: 6, android: 4 }),
  },
  infoValue: {
    ...TEXT_STYLES.bodyPrimaryLarge,
  },
  timeEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  timeInputContainer: {
    borderWidth: 1.5,
    borderRadius: Platform.select({ ios: 8, android: 6 }),
    paddingHorizontal: Platform.select({ ios: 10, android: 8 }),
    paddingVertical: Platform.select({ ios: 6, android: 5 }),
    minWidth: Platform.select({ ios: 80, android: 70 }),
    marginLeft: Platform.select({ ios: 4, android: 3 }),
  },
  timeInput: {
    ...TEXT_STYLES.input,
    padding: 0,
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    padding: Platform.select({ ios: 18, android: 16 }),
    minHeight: Platform.select({ ios: 60, android: 56 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceButtonIcon: {
    marginRight: Platform.select({ ios: 10, android: 8 }),
  },
  serviceButtonText: {
    ...TEXT_STYLES.bodyPrimaryLarge,
  },
  serviceButtonPrice: {
    ...TEXT_STYLES.bodyPrimary,
  },
  formCard: {
    borderRadius: 14,
    padding: 14, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12, // Reduced spacing
  },
  cardHeaderIcon: {
    width: 36, // Reduced size
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    flex: 1,
  },
  inputWrapper: {
    marginBottom: Platform.select({ ios: 20, android: 16 }),
  },
  inputLabel: {
    ...TEXT_STYLES.label,
    fontSize: FONT_SIZES.BODY_PRIMARY,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    paddingHorizontal: Platform.select({ ios: 14, android: 12 }),
    minHeight: Platform.select({ ios: 52, android: 48 }),
  },
  inputIcon: {
    marginRight: Platform.select({ ios: 10, android: 8 }),
  },
  modernInput: {
    ...TEXT_STYLES.input,
    paddingVertical: 12,
  },
  paymentMethodsContainer: {
    marginTop: Platform.select({ ios: 12, android: 10 }),
    gap: Platform.select({ ios: 10, android: 8 }),
  },
  paymentCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14, // Reduced padding
    minHeight: 70, // Reduced height
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Platform.select({ ios: 8, android: 6 }),
  },
  paymentIconWrapper: {
    width: 44, // Reduced size
    height: 44,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconContainer: {
    marginRight: Platform.select({ ios: 12, android: 10 }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  paymentCardText: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.BODY_PRIMARY_LARGE,
    marginBottom: Platform.select({ ios: 6, android: 5 }),
    letterSpacing: -0.2,
  },
  paymentMethodBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.select({ ios: 6, android: 5 }),
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Platform.select({ ios: 10, android: 9 }),
    paddingVertical: Platform.select({ ios: 5, android: 4 }),
    borderRadius: Platform.select({ ios: 8, android: 7 }),
    borderWidth: 1.5,
  },
  methodBadgeText: {
    ...TEXT_STYLES.bodySecondary,
  },
  applePayBadgeMain: {
    gap: Platform.select({ ios: 4, android: 3 }),
  },
  applePayBadgeText: {
    ...TEXT_STYLES.label,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.1,
  },
  applePayBadge: {
    marginTop: Platform.select({ ios: 4, android: 2 }),
    paddingHorizontal: Platform.select({ ios: 6, android: 5 }),
    paddingVertical: Platform.select({ ios: 2, android: 1 }),
    borderRadius: Platform.select({ ios: 4, android: 3 }),
  },
  applePayText: {
    ...TEXT_STYLES.bodySecondary,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  paymentCardSubtext: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  checkIcon: {
    position: 'absolute',
    top: Platform.select({ ios: 14, android: 12 }),
    right: Platform.select({ ios: 14, android: 12 }),
  },
  checkIconBackground: {
    width: Platform.select({ ios: 24, android: 22 }),
    height: Platform.select({ ios: 24, android: 22 }),
    borderRadius: Platform.select({ ios: 12, android: 11 }),
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  summaryCard: {
    borderRadius: 14,
    padding: 14, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  errorText: {
    ...TEXT_STYLES.bodySecondary,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
  },
  summaryLabel: {
    ...TEXT_STYLES.bodyPrimary,
  },
  summaryValue: {
    ...TEXT_STYLES.bodyPrimary,
  },
  summaryDiscount: {
    ...TEXT_STYLES.bodyPrimary,
    textDecorationLine: 'line-through',
  },
  summaryDivider: {
    height: 1,
    marginVertical: Platform.select({ ios: 12, android: 10 }),
  },
  bookingSummaryCard: {
    borderRadius: 14,
    padding: 14, // Reduced padding
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookingSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingSummaryIconContainer: {
    width: 36, // Reduced size
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bookingSummaryTitle: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    letterSpacing: -0.2,
  },
  bookingSummaryContent: {
    marginTop: 0,
  },
  bookingSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8, // Reduced padding
    minHeight: 40, // Reduced height
  },
  bookingSummaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bookingSummaryItemIcon: {
    width: 28, // Reduced size
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bookingSummaryItemLabel: {
    ...TEXT_STYLES.bodyPrimary,
    flex: 1,
  },
  bookingSummaryItemValue: {
    ...TEXT_STYLES.bodyPrimary,
    textAlign: 'right',
    flexShrink: 0,
    marginLeft: 8,
  },
  bookingSummaryPrice: {
    ...TEXT_STYLES.cardTitle,
  },
  bookingSummaryDivider: {
    height: 1,
    marginVertical: Platform.select({ ios: 2, android: 1 }),
  },
  summaryTotalLabel: {
    ...TEXT_STYLES.cardTitle,
  },
  summaryTotalValue: {
    ...TEXT_STYLES.cardTitle,
  },
  bottomContainer: {
    padding: Platform.select({ ios: 20, android: 16 }),
    borderTopWidth: 1,
    paddingBottom: Platform.select({ ios: 24, android: 20 }),
  },
  payButton: {
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    ...TEXT_STYLES.buttonProduction,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    ...TEXT_STYLES.sectionHeadingMedium,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemContent: {
    flex: 1,
    marginRight: 12,
  },
  modalItemTitle: {
    ...TEXT_STYLES.cardTitle,
    marginBottom: 4,
  },
  modalItemSubtitle: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    ...TEXT_STYLES.bodyPrimaryLarge,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPrice: {
    ...TEXT_STYLES.cardTitle,
  },
  originalPrice: {
    ...TEXT_STYLES.bodyPrimary,
    textDecorationLine: 'line-through',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  webViewLoadingText: {
    marginTop: 12,
    ...TEXT_STYLES.bodyPrimaryLarge,
  },
});

export default PaymentScreen;
