import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform, Modal, Image, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import paymentService, { PaymentMethod } from '../../services/paymentService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface Props {
  onBack?: () => void;
  onPaymentSuccess?: (bookingId?: string, bookingData?: { date: string; time: string }) => void;
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [carModel, setCarModel] = useState('');
  const [notes, setNotes] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [editableBookingTime, setEditableBookingTime] = useState<string>('');
  const { colors } = useTheme();

  // Service center and service selection states
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);

  // Payment details modal states
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  
  // Card details states (for Stripe payments)
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardErrors, setCardErrors] = useState<{
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardholderName?: string;
  }>({});

  // PayPal details states
  const [paypalEmail, setPaypalEmail] = useState('');
  const [paypalPassword, setPaypalPassword] = useState('');
  const [paypalErrors, setPaypalErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Apple Pay details states (for testing/demo)
  const [applePayEmail, setApplePayEmail] = useState('');
  const [applePayErrors, setApplePayErrors] = useState<{
    email?: string;
  }>({});

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

  // Convert time from "HH:MM AM/PM" format to "HH:MM" format for API
  const convertTimeTo24Hour = (timeStr: string): string => {
    // If already in 24-hour format (HH:MM), return as is
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      return timeStr;
    }
    // If in 12-hour format (HH:MM AM/PM), convert to 24-hour
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
    // If format not recognized, return as is
    return timeStr;
  };

  // Load user data and pre-fill vehicle number and car model
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getUser();
        if (user) {
          if (user.vehicle_no) {
            setVehicleNumber(user.vehicle_no);
          }
          if (user.carmodel) {
            setCarModel(user.carmodel);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Initialize editable booking time from bookingData
  useEffect(() => {
    if (bookingData?.time) {
      setEditableBookingTime(bookingData.time);
    }
  }, [bookingData?.time]);

  // Fetch service center details on mount
  useEffect(() => {
    // Set initial service center from props
    const initialCenter = bookingData?.center || acceptedCenter;
    if (initialCenter) {
      setSelectedServiceCenter(initialCenter);
      // Fetch service centers to get services_offered for the selected center
      fetchServiceCenterDetails(initialCenter.id);
    }
  }, []);

  const fetchServiceCenterDetails = async (centerId: number | string) => {
    setLoadingCenters(true);
    try {
      const result = await authService.getServiceCenters();
      if (result.success && result.serviceCenters) {
        // Find the selected center in the list to get its services_offered
        const foundCenter = result.serviceCenters.find(
          (sc: any) => sc.id === Number(centerId) || String(sc.id) === String(centerId)
        );
        if (foundCenter) {
          // Update the selected center with full details including services_offered
          setSelectedServiceCenter(foundCenter);
        }
      }
    } catch (error: any) {
      console.error('Error loading service center details:', error);
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

  // Format card number with spaces (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted.substring(0, 19); // Max 16 digits + 3 spaces
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  // Validate card details
  const validateCardDetails = (): boolean => {
    const errors: typeof cardErrors = {};

    // Validate card number (should be 16 digits)
    const cardNumberDigits = cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits || cardNumberDigits.length !== 16) {
      errors.cardNumber = 'Card number must be 16 digits';
    } else if (!/^\d{16}$/.test(cardNumberDigits)) {
      errors.cardNumber = 'Invalid card number';
    }

    // Validate expiry date (MM/YY format)
    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      errors.expiryDate = 'Invalid expiry date (MM/YY)';
        } else {
      const [month, year] = expiryDate.split('/').map(Number);
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (month < 1 || month > 12) {
        errors.expiryDate = 'Invalid month';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiryDate = 'Card has expired';
      }
    }

    // Validate CVV (3 or 4 digits)
    if (!cvv || !/^\d{3,4}$/.test(cvv)) {
      errors.cvv = 'CVV must be 3 or 4 digits';
    }

    // Validate cardholder name
    if (!cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle card number input
  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    setCardNumber(formatted);
    if (cardErrors.cardNumber) {
      setCardErrors({ ...cardErrors, cardNumber: undefined });
    }
  };

  // Handle expiry date input
  const handleExpiryDateChange = (text: string) => {
    const formatted = formatExpiryDate(text);
    setExpiryDate(formatted);
    if (cardErrors.expiryDate) {
      setCardErrors({ ...cardErrors, expiryDate: undefined });
    }
  };

  // Handle CVV input
  const handleCvvChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    setCvv(cleaned);
    if (cardErrors.cvv) {
      setCardErrors({ ...cardErrors, cvv: undefined });
    }
  };

  // Handle cardholder name input
  const handleCardholderNameChange = (text: string) => {
    setCardholderName(text);
    if (cardErrors.cardholderName) {
      setCardErrors({ ...cardErrors, cardholderName: undefined });
    }
  };

  const handlePayment = async () => {
    if (isProcessing) return;
    
    // Validate vehicle number for all payment methods
    if (!validateVehicleNumber()) {
          Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
          return;
        }

    // Validate service center and service
        const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
        if (!centerId) {
          Alert.alert('Error', 'Please select a service center.');
          return;
        }

        if (!selectedService?.id) {
          Alert.alert('Error', 'Please select a service.');
          return;
        }
        
    // For Stripe, PayPal, and Apple Pay, show payment details modal first
    if (selectedPaymentMethod === 'stripe' || selectedPaymentMethod === 'paypal' || selectedPaymentMethod === 'applepay') {
      setShowPaymentDetailsModal(true);
      return;
    }

    // For cash, proceed directly
    processPayment();
  };

  // Validate PayPal details
  const validatePayPalDetails = (): boolean => {
    const errors: typeof paypalErrors = {};

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!paypalEmail.trim()) {
      errors.email = 'PayPal email is required';
    } else if (!emailRegex.test(paypalEmail.trim())) {
      errors.email = 'Invalid email address';
    }

    // Validate password
    if (!paypalPassword.trim()) {
      errors.password = 'PayPal password is required';
    } else if (paypalPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setPaypalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Apple Pay details
  const validateApplePayDetails = (): boolean => {
    const errors: typeof applePayErrors = {};

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!applePayEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(applePayEmail.trim())) {
      errors.email = 'Invalid email address';
    }

    setApplePayErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Process payment after payment details are entered
  const processPayment = async () => {
    if (isProcessing) return;
    
    // Validate service center and service
        const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
        if (!centerId) {
          Alert.alert('Error', 'Please select a service center.');
          return;
        }

        if (!selectedService?.id) {
          Alert.alert('Error', 'Please select a service.');
          return;
        }

    setIsProcessing(true);

    try {
        // Determine if this is a scheduled booking or instant booking
        const isScheduledBooking = bookingData?.date && bookingData?.time;
        
        let bookingDate: Date;
        let bookingTime: string;
        
        if (isScheduledBooking && bookingData.date && bookingData.time) {
          // Use scheduled date and time (use editable time if changed)
          bookingDate = new Date(bookingData.date);
          bookingTime = editableBookingTime ? convertTimeTo24Hour(editableBookingTime) : convertTimeTo24Hour(bookingData.time);
        } else {
          // Use current date and time for instant booking
          const now = new Date();
          bookingDate = now;
          bookingTime = getCurrentTime(now);
        }
        
      const amount = selectedService.offer_price || selectedService.price;
      
      // Process payment based on selected method
      const paymentDetails = {
        amount,
        currency: 'USD',
        description: `Car wash service: ${selectedService.name}`,
        vehicleNumber: vehicleNumber.trim(),
        carModel: carModel.trim() || '',
        notes: notes?.trim() || '',
      };

      console.log(`\n🔄 Processing ${selectedPaymentMethod} payment...`);
      
      // For Stripe, pass card token (in real implementation, this would be a token from Stripe SDK)
      const cardToken = selectedPaymentMethod === 'stripe' && cardNumber 
        ? `card_token_${cardNumber.replace(/\s/g, '').substring(0, 4)}_${Date.now()}`
        : undefined;
      
      const paymentResult = await paymentService.processPayment(
        selectedPaymentMethod,
        paymentDetails,
        cardToken
      );

      if (!paymentResult.success) {
        console.error('❌ Payment Failed:', paymentResult.error);
        Alert.alert(
          'Payment Failed',
          paymentResult.error || `Failed to process ${paymentService.getPaymentMethodName(selectedPaymentMethod)} payment. Please try again.`
        );
        setIsProcessing(false);
        return;
      }

      // Payment successful, proceed with booking
      const paymentNote = `Payment method: ${paymentService.getPaymentMethodName(selectedPaymentMethod)}${paymentResult.transactionId ? ` (Transaction ID: ${paymentResult.transactionId})` : ''}`;
      
      console.log('\n📦 Creating booking with payment details...');
        
        // Ensure all required fields are present and valid
        const payload = {
          service_centre_id: String(centerId || '').trim(),
          booking_date: formatDate(bookingDate),
          booking_time: bookingTime.trim(),
          vehicle_no: vehicleNumber.trim(),
          carmodel: (carModel.trim() || '').trim(),
          notes: (notes?.trim() ? `${notes.trim()}\n${paymentNote}` : paymentNote).trim(),
          service_id: String(selectedService.id || '').trim(),
        };

        // Validate payload before sending
        if (!payload.service_centre_id || payload.service_centre_id === '') {
          Alert.alert('Validation Error', 'Service center ID is required.');
          setIsProcessing(false);
          return;
        }

        if (!payload.vehicle_no || payload.vehicle_no === '') {
          Alert.alert('Validation Error', 'Vehicle number is required.');
          setIsProcessing(false);
          return;
        }

        if (!payload.service_id || payload.service_id === '') {
          Alert.alert('Validation Error', 'Service ID is required.');
          setIsProcessing(false);
          return;
        }

        if (!payload.booking_date || !payload.booking_time) {
          Alert.alert('Validation Error', 'Booking date and time are required.');
          setIsProcessing(false);
          return;
        }

      console.log('📤 Booking Payload:', JSON.stringify(payload, null, 2));
      console.log('📤 Payload validation:', {
        hasServiceCentreId: !!payload.service_centre_id,
        hasVehicleNo: !!payload.vehicle_no,
        hasServiceId: !!payload.service_id,
        hasBookingDate: !!payload.booking_date,
        hasBookingTime: !!payload.booking_time,
      });
      
      // Get token before making the call to verify it exists
      const token = await authService.getToken();
      if (!token) {
        Alert.alert(
          'Authentication Required',
          'Please login to complete your booking.',
          [
            {
              text: 'OK',
              onPress: () => {
                onBack?.();
              }
            }
          ]
        );
        setIsProcessing(false);
        return;
      }
      
      console.log('\n🌐 Calling bookNow API...');
        const result = await authService.bookNow(payload);
      
        if (result.success) {
          const bookingId = result.bookingId || 'N/A';
        
        console.log('\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 BOOKING CONFIRMED SUCCESSFULLY!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 BOOKING DETAILS:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🆔 Booking ID:', bookingId);
        console.log('📅 Booking Date:', formatDate(bookingDate));
        console.log('⏰ Booking Time:', bookingTime);
        console.log('🚗 Vehicle Number:', vehicleNumber.trim());
        console.log('🚙 Car Model:', carModel.trim() || 'N/A');
        console.log('🏢 Service Center ID:', centerId);
        console.log('🔧 Service ID:', selectedService.id);
        console.log('📝 Service Name:', selectedService.name);
        console.log('💵 Service Price: $' + (selectedService.offer_price || selectedService.price));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 PAYMENT INFORMATION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 Payment Method:', paymentService.getPaymentMethodName(selectedPaymentMethod));
        console.log('🆔 Transaction ID:', paymentResult.transactionId || 'N/A');
        console.log('✅ Payment Status: SUCCESS');
        console.log('💵 Amount Paid: $' + amount);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ BOOKING STATUS: CONFIRMED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n');
        
          // Pass booking date and time (either scheduled or current for instant)
          const bookingDataForResponse = {
            date: bookingDate.toISOString(),
            time: isScheduledBooking && (editableBookingTime || bookingData?.time) ? (editableBookingTime || bookingData.time) : getCurrentTime(bookingDate),
          };
          onPaymentSuccess?.(bookingId, bookingDataForResponse);
        } else {
        console.error('\n❌ Booking Failed:', result.error);
        console.error('📦 Full error details:', JSON.stringify(result, null, 2));
        
        // Show error message from API
        let errorMessage = result.error || 'Payment was successful but booking failed. Please contact support.';
        
        // Check if it's a validation error and provide helpful message
        if (errorMessage.toLowerCase().includes('validation')) {
          errorMessage = errorMessage + '\n\nPlease check:\n• All required fields are filled\n• Vehicle number is correct\n• Service and center are selected\n• Date and time are valid';
        }
        
        // Only show session expired alert if the error specifically mentions session expiration
        // Check for exact phrases to avoid false positives
        const isSessionError = 
          errorMessage.toLowerCase().includes('session expired') || 
          errorMessage.toLowerCase().includes('session has expired') ||
          errorMessage.toLowerCase().includes('please login again');
        
        if (isSessionError) {
          Alert.alert(
            'Session Expired',
            errorMessage,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate back to allow user to login again
                  onBack?.();
                }
              }
            ]
          );
        } else {
          // For validation and other errors, show detailed message
          Alert.alert(
            'Booking Failed', 
            errorMessage,
            [{ text: 'OK' }]
          );
        }
          setIsProcessing(false);
        }
    } catch (e: any) {
      console.error('Payment error:', e);
      const errorMessage = e.message || 'Unable to process payment. Please try again.';
      if (errorMessage.toLowerCase().includes('session') || errorMessage.toLowerCase().includes('expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again to complete your booking.',
          [
            {
              text: 'OK',
              onPress: () => {
                onBack?.();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
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
        <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Information Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 16, android: 12 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="calendar" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Booking Details</Text>
          </View>

          <View style={[styles.infoRow, { marginTop: Platform.select({ ios: 16, android: 12 }) }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="time" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service Date & Time</Text>
              {bookingData?.date && bookingData?.time ? (
                <View style={styles.timeEditContainer}>
                  <Text style={[styles.infoValue, { color: colors.text, flex: 1 }]}>
                    {new Date(bookingData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at{' '}
                  </Text>
                  <View style={[styles.timeInputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <TextInput
                      style={[styles.timeInput, { color: colors.text }]}
                      value={editableBookingTime || bookingData.time}
                      onChangeText={setEditableBookingTime}
                      placeholder="Time"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                </View>
              ) : (
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  Service starts immediately
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: Platform.select({ ios: 16, android: 12 }) }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="location" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service Center</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {selectedServiceCenter 
                  ? selectedServiceCenter.name 
                  : acceptedCenter?.name || 'Service Center'}
              </Text>
            </View>
          </View>

          {/* Service Selection */}
          {selectedServiceCenter && selectedServiceCenter.services_offered && selectedServiceCenter.services_offered.length > 0 && (
            <TouchableOpacity
              style={[
                styles.serviceButton,
                { 
                  borderColor: selectedService ? BLUE_COLOR : colors.border, 
                  backgroundColor: selectedService ? BLUE_COLOR + '08' : colors.surface,
                  marginTop: Platform.select({ ios: 16, android: 10 })
                }
              ]}
              onPress={() => setShowServiceDropdown(true)}
            >
              <View style={styles.serviceButtonContent}>
                <Text style={[
                  styles.serviceButtonText,
                  { color: selectedService ? colors.text : colors.textSecondary }
                ]}>
                  {selectedService ? selectedService.name : 'Select Service'}
                </Text>
                {selectedService && (
                  <Text style={[styles.serviceButtonPrice, { color: BLUE_COLOR }]}>
                    ${selectedService.offer_price || selectedService.price}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} />
            </TouchableOpacity>
          )}
          {selectedServiceCenter && (!selectedServiceCenter.services_offered || selectedServiceCenter.services_offered.length === 0) && (
            <Text style={[styles.noServicesText, { color: colors.textSecondary, marginTop: Platform.select({ ios: 12, android: 8 }) }]}>
              No services available
            </Text>
          )}
        </View>

        {/* Vehicle Details Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="car" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vehicle Information</Text>
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
              <Ionicons name="car-sport" size={Platform.select({ ios: 18, android: 16 })} color={colors.textSecondary} style={styles.inputIcon} />
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
              <Ionicons name="construct" size={Platform.select({ ios: 18, android: 16 })} color={colors.textSecondary} style={styles.inputIcon} />
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
              <Ionicons name="document-text" size={Platform.select({ ios: 18, android: 16 })} color={colors.textSecondary} style={[styles.inputIcon, { marginTop: 2 }]} />
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

        {/* Payment Method Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="wallet" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Method</Text>
          </View>
          
          <View style={styles.paymentMethodsContainer}>
            {/* Stripe Payment Method */}
            <TouchableOpacity 
              style={[
                styles.paymentCard,
                { 
                  backgroundColor: selectedPaymentMethod === 'stripe' ? BLUE_COLOR : colors.surface,
                  borderColor: selectedPaymentMethod === 'stripe' ? BLUE_COLOR : colors.border
                }
              ]}
              onPress={() => setSelectedPaymentMethod('stripe')}
              activeOpacity={0.7}
            >
                <Ionicons 
                name="card" 
                size={Platform.select({ ios: 24, android: 20 })} 
                color={selectedPaymentMethod === 'stripe' ? '#FFFFFF' : BLUE_COLOR} 
              />
              <Text style={[
                styles.paymentCardText,
                { color: selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.text }
              ]}>
                Stripe
              </Text>
              {selectedPaymentMethod === 'stripe' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* PayPal Payment Method */}
            <TouchableOpacity 
              style={[
                styles.paymentCard,
                { 
                  backgroundColor: selectedPaymentMethod === 'paypal' ? BLUE_COLOR : colors.surface,
                  borderColor: selectedPaymentMethod === 'paypal' ? BLUE_COLOR : colors.border
                }
              ]}
              onPress={() => setSelectedPaymentMethod('paypal')}
              activeOpacity={0.7}
            >
                <Ionicons 
                name="logo-paypal" 
                size={Platform.select({ ios: 24, android: 20 })} 
                color={selectedPaymentMethod === 'paypal' ? '#FFFFFF' : BLUE_COLOR} 
              />
              <Text style={[
                styles.paymentCardText,
                { color: selectedPaymentMethod === 'paypal' ? '#FFFFFF' : colors.text }
              ]}>
                PayPal
              </Text>
              {selectedPaymentMethod === 'paypal' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Apple Pay Payment Method (iOS only) */}
            {paymentService.isPaymentMethodAvailable('applepay') && (
              <TouchableOpacity 
                style={[
                  styles.paymentCard,
                  { 
                    backgroundColor: selectedPaymentMethod === 'applepay' ? BLUE_COLOR : colors.surface,
                    borderColor: selectedPaymentMethod === 'applepay' ? BLUE_COLOR : colors.border
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('applepay')}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="logo-apple" 
                  size={Platform.select({ ios: 24, android: 20 })} 
                  color={selectedPaymentMethod === 'applepay' ? '#FFFFFF' : BLUE_COLOR} 
                />
                <Text style={[
                  styles.paymentCardText,
                  { color: selectedPaymentMethod === 'applepay' ? '#FFFFFF' : colors.text }
                ]}>
                  Apple Pay
                </Text>
                {selectedPaymentMethod === 'applepay' && (
                  <View style={styles.checkIcon}>
                    <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
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
                  borderColor: selectedPaymentMethod === 'cash' ? BLUE_COLOR : colors.border
                }
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
              activeOpacity={0.7}
            >
                <Ionicons 
                name="cash" 
                size={Platform.select({ ios: 24, android: 20 })} 
                color={selectedPaymentMethod === 'cash' ? '#FFFFFF' : BLUE_COLOR} 
              />
              <Text style={[
                styles.paymentCardText,
                { color: selectedPaymentMethod === 'cash' ? '#FFFFFF' : colors.text }
              ]}>
                Cash
              </Text>
              {selectedPaymentMethod === 'cash' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary (hidden for Cash) */}
        {selectedPaymentMethod !== 'cash' && selectedService && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 16, android: 12 }) }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{selectedService.name}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ${selectedService.offer_price || selectedService.price}
              </Text>
            </View>
            
            {selectedService.offer_price && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Original Price</Text>
                <Text style={[styles.summaryDiscount, { color: colors.textSecondary }]}>
                  ${selectedService.price}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.summaryTotalValue, { color: BLUE_COLOR }]}>
                ${selectedService.offer_price || selectedService.price}
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
              <FlatList
                data={selectedServiceCenter.services_offered}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
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
                )}
              />
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

      {/* Payment Details Modal (Stripe, PayPal, Apple Pay) */}
      <Modal
        visible={showPaymentDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentDetailsModal(false);
          setCardErrors({});
          setPaypalErrors({});
          setApplePayErrors({});
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setShowPaymentDetailsModal(false);
              setCardErrors({});
              setPaypalErrors({});
              setApplePayErrors({});
            }}
          />
          <View 
            style={[styles.paymentModalContent, { backgroundColor: colors.card }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
                  <Ionicons 
                    name={
                      selectedPaymentMethod === 'stripe' ? 'card' :
                      selectedPaymentMethod === 'paypal' ? 'logo-paypal' :
                      'logo-apple'
                    } 
                    size={24} 
                    color={BLUE_COLOR} 
                  />
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedPaymentMethod === 'stripe' ? 'Enter Card Details' :
                   selectedPaymentMethod === 'paypal' ? 'PayPal Login' :
                   'Apple Pay'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => {
                setShowPaymentDetailsModal(false);
                setCardErrors({});
                setPaypalErrors({});
                setApplePayErrors({});
              }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.cardDetailsScroll}
              contentContainerStyle={[styles.cardDetailsContent, { paddingBottom: Platform.select({ ios: 20, android: 16 }) }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Stripe Card Details Form */}
              {selectedPaymentMethod === 'stripe' && (
                <>
                  <View style={styles.paymentMethodInfo}>
                    <Ionicons name="shield-checkmark" size={20} color={BLUE_COLOR} />
                    <Text style={[styles.paymentMethodInfoText, { color: colors.textSecondary }]}>
                      Your card details are secure and encrypted
                    </Text>
                  </View>

                  {/* Card Number */}
                  <View style={styles.cardInputWrapper}>
                <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                  Card Number <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={[
                  styles.cardInputContainer,
                  { 
                    borderColor: cardErrors.cardNumber ? '#EF4444' : colors.border,
                    backgroundColor: colors.surface,
                  }
                ]}>
                  <Ionicons name="card" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                  <TextInput
                    style={[styles.cardInput, { color: colors.text }]}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.textSecondary}
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    keyboardType="number-pad"
                    maxLength={19}
                    autoComplete="cc-number"
                  />
                </View>
                {cardErrors.cardNumber && (
                  <Text style={styles.cardErrorText}>{cardErrors.cardNumber}</Text>
                )}
              </View>

              {/* Cardholder Name */}
              <View style={styles.cardInputWrapper}>
                <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                  Cardholder Name <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={[
                  styles.cardInputContainer,
                  { 
                    borderColor: cardErrors.cardholderName ? '#EF4444' : colors.border,
                    backgroundColor: colors.surface,
                  }
                ]}>
                  <Ionicons name="person" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                  <TextInput
                    style={[styles.cardInput, { color: colors.text }]}
                    placeholder="John Doe"
                    placeholderTextColor={colors.textSecondary}
                    value={cardholderName}
                    onChangeText={handleCardholderNameChange}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
                {cardErrors.cardholderName && (
                  <Text style={styles.cardErrorText}>{cardErrors.cardholderName}</Text>
                )}
              </View>

              {/* Expiry Date and CVV Row */}
              <View style={styles.cardRow}>
                {/* Expiry Date */}
                <View style={[styles.cardInputWrapper, { flex: 1, marginRight: Platform.select({ ios: 12, android: 8 }) }]}>
                  <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                    Expiry Date <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <View style={[
                    styles.cardInputContainer,
                    { 
                      borderColor: cardErrors.expiryDate ? '#EF4444' : colors.border,
                      backgroundColor: colors.surface,
                    }
                  ]}>
                    <Ionicons name="calendar" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                    <TextInput
                      style={[styles.cardInput, { color: colors.text }]}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.textSecondary}
                      value={expiryDate}
                      onChangeText={handleExpiryDateChange}
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  {cardErrors.expiryDate && (
                    <Text style={styles.cardErrorText}>{cardErrors.expiryDate}</Text>
                  )}
                </View>

                {/* CVV */}
                <View style={[styles.cardInputWrapper, { flex: 1 }]}>
                  <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                    CVV <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <View style={[
                    styles.cardInputContainer,
                    { 
                      borderColor: cardErrors.cvv ? '#EF4444' : colors.border,
                      backgroundColor: colors.surface,
                    }
                  ]}>
                    <Ionicons name="lock-closed" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                    <TextInput
                      style={[styles.cardInput, { color: colors.text }]}
                      placeholder="123"
                      placeholderTextColor={colors.textSecondary}
                      value={cvv}
                      onChangeText={handleCvvChange}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                  {cardErrors.cvv && (
                    <Text style={styles.cardErrorText}>{cardErrors.cvv}</Text>
                  )}
                </View>
              </View>

                  {/* Pay Button */}
                  <TouchableOpacity
                    style={[styles.cardPayButton, { backgroundColor: BLUE_COLOR }]}
                    onPress={() => {
                      if (validateCardDetails()) {
                        setShowPaymentDetailsModal(false);
                        processPayment();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="lock-closed" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.cardPayButtonText}>
                      Pay ${selectedService?.offer_price || selectedService?.price || '0.00'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* PayPal Login Form */}
              {selectedPaymentMethod === 'paypal' && (
                <>
                  <View style={styles.paymentMethodInfo}>
                    <Ionicons name="logo-paypal" size={24} color={BLUE_COLOR} />
                    <Text style={[styles.paymentMethodInfoText, { color: colors.textSecondary }]}>
                      Sign in to your PayPal account to continue
                    </Text>
                  </View>

                  {/* PayPal Email */}
                  <View style={styles.cardInputWrapper}>
                    <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                      PayPal Email <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <View style={[
                      styles.cardInputContainer,
                      { 
                        borderColor: paypalErrors.email ? '#EF4444' : colors.border,
                        backgroundColor: colors.surface,
                      }
                    ]}>
                      <Ionicons name="mail" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                      <TextInput
                        style={[styles.cardInput, { color: colors.text }]}
                        placeholder="your.email@example.com"
                        placeholderTextColor={colors.textSecondary}
                        value={paypalEmail}
                        onChangeText={(text) => {
                          setPaypalEmail(text);
                          if (paypalErrors.email) {
                            setPaypalErrors({ ...paypalErrors, email: undefined });
                          }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                    {paypalErrors.email && (
                      <Text style={styles.cardErrorText}>{paypalErrors.email}</Text>
                    )}
                  </View>

                  {/* PayPal Password */}
                  <View style={styles.cardInputWrapper}>
                    <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                      PayPal Password <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <View style={[
                      styles.cardInputContainer,
                      { 
                        borderColor: paypalErrors.password ? '#EF4444' : colors.border,
                        backgroundColor: colors.surface,
                      }
                    ]}>
                      <Ionicons name="lock-closed" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                      <TextInput
                        style={[styles.cardInput, { color: colors.text }]}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textSecondary}
                        value={paypalPassword}
                        onChangeText={(text) => {
                          setPaypalPassword(text);
                          if (paypalErrors.password) {
                            setPaypalErrors({ ...paypalErrors, password: undefined });
                          }
                        }}
                        secureTextEntry
                        autoComplete="password"
                      />
                    </View>
                    {paypalErrors.password && (
                      <Text style={styles.cardErrorText}>{paypalErrors.password}</Text>
                    )}
                  </View>

                  {/* Pay Button */}
                  <TouchableOpacity
                    style={[styles.cardPayButton, { backgroundColor: '#0070BA' }]}
                    onPress={() => {
                      if (validatePayPalDetails()) {
                        setShowPaymentDetailsModal(false);
                        processPayment();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-paypal" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.cardPayButtonText}>
                      Pay ${selectedService?.offer_price || selectedService?.price || '0.00'} with PayPal
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Apple Pay Form */}
              {selectedPaymentMethod === 'applepay' && (
                <>
                  <View style={styles.paymentMethodInfo}>
                    <Ionicons name="logo-apple" size={24} color={BLUE_COLOR} />
                    <Text style={[styles.paymentMethodInfoText, { color: colors.textSecondary }]}>
                      Use your Apple ID to complete payment
                    </Text>
                  </View>

                  {/* Apple Pay Email */}
                  <View style={styles.cardInputWrapper}>
                    <Text style={[styles.cardInputLabel, { color: colors.text }]}>
                      Apple ID Email <Text style={{ color: '#EF4444' }}>*</Text>
                    </Text>
                    <View style={[
                      styles.cardInputContainer,
                      { 
                        borderColor: applePayErrors.email ? '#EF4444' : colors.border,
                        backgroundColor: colors.surface,
                      }
                    ]}>
                      <Ionicons name="mail" size={Platform.select({ ios: 20, android: 18 })} color={colors.textSecondary} style={styles.cardInputIcon} />
                      <TextInput
                        style={[styles.cardInput, { color: colors.text }]}
                        placeholder="your.email@icloud.com"
                        placeholderTextColor={colors.textSecondary}
                        value={applePayEmail}
                        onChangeText={(text) => {
                          setApplePayEmail(text);
                          if (applePayErrors.email) {
                            setApplePayErrors({ ...applePayErrors, email: undefined });
                          }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                    {applePayErrors.email && (
                      <Text style={styles.cardErrorText}>{applePayErrors.email}</Text>
                    )}
                  </View>

                  <View style={[styles.applePayNote, { backgroundColor: colors.surface }]}>
                    <Ionicons name="information-circle" size={18} color={colors.textSecondary} />
                    <Text style={[styles.applePayNoteText, { color: colors.textSecondary }]}>
                      You'll be redirected to authenticate with Face ID, Touch ID, or passcode
                    </Text>
                  </View>

                  {/* Pay Button */}
                  <TouchableOpacity
                    style={[styles.cardPayButton, { backgroundColor: '#000000' }]}
                    onPress={() => {
                      if (validateApplePayDetails()) {
                        setShowPaymentDetailsModal(false);
                        processPayment();
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.cardPayButtonText}>
                      Pay ${selectedService?.offer_price || selectedService?.price || '0.00'} with Apple Pay
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Pay Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[
            styles.payButton, 
            { backgroundColor: BLUE_COLOR }, 
            (isProcessing || !vehicleNumber.trim() || !selectedServiceCenter || !selectedService) && styles.payButtonDisabled
          ]} 
          onPress={handlePayment}
          disabled={isProcessing || !vehicleNumber.trim() || !selectedServiceCenter || !selectedService}
        >
          {isProcessing ? (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>Processing...</Text>
          ) : (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
              {selectedPaymentMethod === 'cash' 
                ? 'Confirm Cash Payment' 
                : selectedService 
                  ? `Pay $${selectedService.offer_price || selectedService.price} with ${paymentService.getPaymentMethodName(selectedPaymentMethod)}`
                  : 'Pay'}
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
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
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 6, android: 4 }),
  },
  infoValue: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
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
    marginRight: 8,
  },
  serviceButtonText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginBottom: 2,
  },
  serviceButtonPrice: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  formCard: {
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
  cardHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 18, android: 14 }),
  },
  cardHeaderIcon: {
    width: Platform.select({ ios: 40, android: 36 }),
    height: Platform.select({ ios: 40, android: 36 }),
    borderRadius: Platform.select({ ios: 10, android: 8 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.select({ ios: 12, android: 10 }),
  },
  cardTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontWeight: '500',
    flex: 1,
  },
  inputWrapper: {
    marginBottom: Platform.select({ ios: 20, android: 16 }),
  },
  inputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.select({ ios: 12, android: 8 }),
    marginTop: Platform.select({ ios: 8, android: 4 }),
  },
  paymentCard: {
    width: Platform.select({ ios: '47%', android: '47%' }),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Platform.select({ ios: 16, android: 12 }),
    padding: Platform.select({ ios: 18, android: 14 }),
    minHeight: Platform.select({ ios: 110, android: 85 }),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Platform.select({ ios: 8, android: 6 }),
  },
  paymentCardText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginTop: Platform.select({ ios: 8, android: 4 }),
  },
  checkIcon: {
    position: 'absolute',
    top: Platform.select({ ios: 8, android: 4 }),
    right: Platform.select({ ios: 8, android: 4 }),
  },
  summaryCard: {
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    padding: Platform.select({ ios: 22, android: 18 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(3, 88, 168, 0.08)',
    backgroundColor: BLUE_COLOR + '05',
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.CAPTION_SMALL,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: FONTS.INTER_REGULAR,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
  },
  summaryLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  summaryDiscount: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    textDecorationLine: 'line-through',
  },
  summaryDivider: {
    height: 1,
    marginVertical: Platform.select({ ios: 12, android: 10 }),
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  bottomContainer: {
    padding: Platform.select({ ios: 20, android: 16 }),
    borderTopWidth: 1,
    paddingBottom: Platform.select({ ios: 24, android: 20 }),
  },
  payButton: {
    borderRadius: Platform.select({ ios: 32, android: 28 }),
    paddingVertical: Platform.select({ ios: 18, android: 14 }),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownButtonText: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    flex: 1,
  },
  noServicesText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginTop: Platform.select({ ios: 8, android: 6 }),
    fontStyle: 'italic',
    marginLeft: Platform.select({ ios: 30, android: 28 }),
  },
  selectedServiceCard: {
    flexDirection: 'row',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedServiceInfo: {
    flex: 1,
  },
  selectedServiceName: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    marginBottom: 4,
  },
  selectedServiceDescription: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offerPrice: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  originalPrice: {
    fontSize: FONT_SIZES.BODY_SMALL,
    textDecorationLine: 'line-through',
    fontFamily: FONTS.INTER_REGULAR,
  },
  noServicesText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginTop: 8,
    fontStyle: 'italic',
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
  paymentModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '50%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE_COLOR + '10',
    padding: Platform.select({ ios: 16, android: 14 }),
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    marginBottom: Platform.select({ ios: 24, android: 20 }),
  },
  paymentMethodInfoText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginLeft: 10,
    flex: 1,
  },
  applePayNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Platform.select({ ios: 14, android: 12 }),
    borderRadius: Platform.select({ ios: 10, android: 8 }),
    marginBottom: Platform.select({ ios: 20, android: 16 }),
  },
  applePayNoteText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
  },
  cardDetailsScroll: {
    flexGrow: 1,
  },
  cardDetailsContent: {
    padding: Platform.select({ ios: 20, android: 16 }),
    flexGrow: 1,
  },
  cardInputWrapper: {
    marginBottom: Platform.select({ ios: 20, android: 16 }),
  },
  cardInputLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
  },
  cardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    paddingHorizontal: Platform.select({ ios: 16, android: 14 }),
    minHeight: Platform.select({ ios: 56, android: 52 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInputIcon: {
    marginRight: Platform.select({ ios: 10, android: 8 }),
  },
  cardInput: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    flex: 1,
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
  },
  cardErrorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.CAPTION_SMALL,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: FONTS.INTER_REGULAR,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardPayButton: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    paddingVertical: Platform.select({ ios: 18, android: 16 }),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: Platform.select({ ios: 12, android: 10 }),
    marginBottom: Platform.select({ ios: 20, android: 16 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cardPayButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default PaymentScreen;
