import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useStripe } from '@stripe/stripe-react-native';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';
import { createPaymentIntent } from '../../services/stripeBackend';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'cash' | null>(null);
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
        <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking Details Card */}
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

          {/* Service Selection - Only show if center has services */}
          {hasServices() && (
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

        {/* Payment Method - Card and Cash */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <View style={styles.cardHeaderSection}>
            <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="card" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Method</Text>
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
                <View style={[styles.paymentIconWrapper, { backgroundColor: selectedPaymentMethod === 'stripe' ? 'rgba(255,255,255,0.2)' : BLUE_COLOR + '12' }]}>
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
                    <View style={[styles.methodBadge, { backgroundColor: selectedPaymentMethod === 'stripe' ? 'rgba(255,255,255,0.25)' : colors.background, borderColor: selectedPaymentMethod === 'stripe' ? 'rgba(255,255,255,0.35)' : colors.border }]}>
                      <Ionicons 
                        name="card-outline" 
                        size={11} 
                        color={selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.textSecondary} 
                        style={{ marginRight: 3 }}
                      />
                      <Text style={[styles.methodBadgeText, { color: selectedPaymentMethod === 'stripe' ? '#FFFFFF' : colors.textSecondary }]}>
                        Card
                      </Text>
                    </View>
                    {Platform.OS === 'ios' && (
                      <View style={[styles.methodBadge, styles.applePayBadgeMain, { backgroundColor: selectedPaymentMethod === 'stripe' ? 'rgba(255,255,255,0.25)' : BLUE_COLOR + '12', borderColor: selectedPaymentMethod === 'stripe' ? 'rgba(255,255,255,0.35)' : BLUE_COLOR + '25' }]}>
                        <Ionicons name="logo-apple" size={12} color={selectedPaymentMethod === 'stripe' ? '#FFFFFF' : BLUE_COLOR} />
                        <Text style={[styles.methodBadgeText, styles.applePayBadgeText, { color: selectedPaymentMethod === 'stripe' ? '#FFFFFF' : BLUE_COLOR }]}>
                          Apple Pay
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {selectedPaymentMethod === 'stripe' && (
                <View style={styles.checkIcon}>
                  <View style={styles.checkIconBackground}>
                    <Ionicons name="checkmark" size={Platform.select({ ios: 14, android: 12 })} color="#FFFFFF" />
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
                <View style={[styles.paymentIconWrapper, { backgroundColor: selectedPaymentMethod === 'cash' ? 'rgba(255,255,255,0.2)' : BLUE_COLOR + '12' }]}>
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
                    { color: selectedPaymentMethod === 'cash' ? 'rgba(255,255,255,0.85)' : colors.textSecondary }
                  ]}>
                    Cash on delivery
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'cash' && (
                <View style={styles.checkIcon}>
                  <View style={styles.checkIconBackground}>
                    <Ionicons name="checkmark" size={Platform.select({ ios: 14, android: 12 })} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary - Only show if service is selected */}
        {selectedService && hasServices() && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 16, android: 12 }) }]}>
            <View style={styles.cardHeaderSection}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
                <Ionicons name="receipt" size={Platform.select({ ios: 22, android: 20 })} color={BLUE_COLOR} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
            </View>
            
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
            
            {selectedService.offer_price && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>You Save</Text>
                <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '600' }]}>
                  ${(selectedService.price - selectedService.offer_price).toFixed(2)}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryDivider, { backgroundColor: colors.border, marginVertical: Platform.select({ ios: 12, android: 10 }) }]} />
            <View style={[styles.summaryRow, { marginTop: Platform.select({ ios: 4, android: 2 }) }]}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Amount</Text>
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
              {hasServices() && !selectedService 
                ? 'Select Service'
                : !selectedPaymentMethod
                ? 'Select Payment Method'
                : selectedPaymentMethod === 'cash'
                ? (hasServices() && selectedService 
                    ? `Pay $${selectedService.offer_price || selectedService.price} at Centre`
                    : 'Pay at Centre')
                : Platform.OS === 'ios'
                ? `Pay $${selectedService?.offer_price || selectedService?.price || 0} - Card or Apple Pay`
                : `Pay $${selectedService?.offer_price || selectedService?.price || 0} with Card`}
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
    marginBottom: Platform.select({ ios: 14, android: 12 }),
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
    marginTop: Platform.select({ ios: 12, android: 10 }),
    gap: Platform.select({ ios: 10, android: 8 }),
  },
  paymentCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    padding: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    minHeight: Platform.select({ ios: 72, android: 68 }),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Platform.select({ ios: 8, android: 6 }),
  },
  paymentIconWrapper: {
    width: Platform.select({ ios: 44, android: 40 }),
    height: Platform.select({ ios: 44, android: 40 }),
    borderRadius: Platform.select({ ios: 10, android: 8 }),
    marginRight: Platform.select({ ios: 12, android: 10 }),
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 4, android: 3 }),
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
    paddingHorizontal: Platform.select({ ios: 8, android: 7 }),
    paddingVertical: Platform.select({ ios: 4, android: 3 }),
    borderRadius: Platform.select({ ios: 6, android: 5 }),
    borderWidth: 1,
  },
  methodBadgeText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  applePayBadgeMain: {
    gap: Platform.select({ ios: 4, android: 3 }),
  },
  applePayBadgeText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  applePayBadge: {
    marginTop: Platform.select({ ios: 4, android: 2 }),
    paddingHorizontal: Platform.select({ ios: 6, android: 5 }),
    paddingVertical: Platform.select({ ios: 2, android: 1 }),
    borderRadius: Platform.select({ ios: 4, android: 3 }),
  },
  applePayText: {
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
  },
  paymentCardSubtext: {
    fontSize: FONT_SIZES.CAPTION_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginTop: Platform.select({ ios: 2, android: 1 }),
    letterSpacing: 0.1,
  },
  checkIcon: {
    position: 'absolute',
    top: Platform.select({ ios: 12, android: 10 }),
    right: Platform.select({ ios: 12, android: 10 }),
  },
  checkIconBackground: {
    width: Platform.select({ ios: 22, android: 20 }),
    height: Platform.select({ ios: 22, android: 20 }),
    borderRadius: Platform.select({ ios: 11, android: 10 }),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  summaryCard: {
    borderRadius: Platform.select({ ios: 18, android: 16 }),
    padding: Platform.select({ ios: 22, android: 18 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: BLUE_COLOR + '20',
    backgroundColor: BLUE_COLOR + '08',
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
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
});

export default PaymentScreen;
