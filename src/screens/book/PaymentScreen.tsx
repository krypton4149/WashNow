import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const { colors } = useTheme();

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
    
    // Validate vehicle number for all payment methods
    if (!validateVehicleNumber()) {
      Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'cash') {
        // Validate required inputs
        if (!acceptedCenter?.id) {
          Alert.alert('Error', 'Service center is missing.');
          setIsProcessing(false);
          return;
        }

        // Determine if this is a scheduled booking or instant booking
        const isScheduledBooking = bookingData?.date && bookingData?.time;
        
        let bookingDate: Date;
        let bookingTime: string;
        
        if (isScheduledBooking && bookingData.date && bookingData.time) {
          // Use scheduled date and time
          bookingDate = new Date(bookingData.date);
          bookingTime = convertTimeTo24Hour(bookingData.time);
        } else {
          // Use current date and time for instant booking
          const now = new Date();
          bookingDate = now;
          bookingTime = getCurrentTime(now);
        }
        
        // Use center from bookingData if available (scheduled) or acceptedCenter (instant)
        const centerId = bookingData?.center?.id || acceptedCenter?.id;
        
        const payload = {
          service_centre_id: String(centerId),
          booking_date: formatDate(bookingDate),
          booking_time: bookingTime,
          vehicle_no: vehicleNumber.trim(),
          notes: notes?.trim() ? notes.trim() : 'Payment method: Cash',
        };

        console.log('PaymentScreen: Calling bookNow API with payload:', JSON.stringify(payload, null, 2));
        
        const result = await authService.bookNow(payload);
        if (result.success) {
          const bookingId = result.bookingId || 'N/A';
          // Pass booking date and time (either scheduled or current for instant)
          const bookingDataForResponse = {
            date: bookingDate.toISOString(),
            time: isScheduledBooking && bookingData?.time ? bookingData.time : getCurrentTime(bookingDate),
          };
          onPaymentSuccess?.(bookingId, bookingDataForResponse);
        } else {
          Alert.alert('Booking Failed', result.error || 'Please try again later.');
          setIsProcessing(false);
        }
      } else {
        // Validate vehicle number for card/wallet payment
        if (!vehicleNumber.trim()) {
          Alert.alert('Validation Required', 'Please enter your vehicle number to proceed with payment.');
          setIsProcessing(false);
          return;
        }

        // Simulate card / wallet payment
        const isScheduledBooking = bookingData?.date && bookingData?.time;
        
        let bookingDate: Date;
        let bookingTime: string;
        
        if (isScheduledBooking && bookingData.date && bookingData.time) {
          // Use scheduled date and time
          bookingDate = new Date(bookingData.date);
          bookingTime = bookingData.time;
        } else {
          // Use current date and time for instant booking
          const now = new Date();
          bookingDate = now;
          bookingTime = getCurrentTime(now);
        }
        
        const randomId = Math.floor(10000 + Math.random() * 90000);
        const bookingId = `B${randomId.toString().padStart(5, '0')}`;
        // Pass booking date and time (either scheduled or current for instant)
        const bookingDataForResponse = {
          date: bookingDate.toISOString(),
          time: bookingTime,
        };
        onPaymentSuccess?.(bookingId, bookingDataForResponse);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to process payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={BLUE_COLOR} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Service Details */}
        <View style={[styles.serviceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>Service Details</Text>
          <View style={styles.serviceRow}>
            <Ionicons name="car" size={20} color={BLUE_COLOR} />
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>Car Wash Service</Text>
          </View>
          <View style={styles.serviceRow}>
            <Ionicons name="location" size={20} color={BLUE_COLOR} />
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>{acceptedCenter.name}</Text>
          </View>
          <View style={styles.serviceRow}>
            <Ionicons name="time" size={20} color={BLUE_COLOR} />
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
              {bookingData?.date && bookingData?.time
                ? `${new Date(bookingData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${bookingData.time}`
                : 'Service starts immediately'}
            </Text>
          </View>
        </View>

        {/* Vehicle Details - Show for all payment methods */}
        <View style={[styles.vehicleDetailsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>Vehicle Details</Text>
          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: vehicleNumberError ? '#EF4444' : BLUE_COLOR + '50', 
                color: colors.text, 
                backgroundColor: colors.surface 
              }
            ]}
            placeholder="Vehicle number (e.g., UP68 AB1234)"
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
          {vehicleNumberError ? (
            <Text style={styles.errorText}>{vehicleNumberError}</Text>
          ) : null}
          <TextInput
            style={[styles.input, { marginTop: 12, borderColor: BLUE_COLOR + '50', color: colors.text, backgroundColor: colors.surface }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          
          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity 
              style={[
                styles.paymentMethod,
                { backgroundColor: colors.card, borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'card' && { borderColor: BLUE_COLOR, backgroundColor: colors.surface }
              ]}
              onPress={() => setSelectedPaymentMethod('card')}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="card" size={24} color={BLUE_COLOR} />
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>Credit/Debit Card</Text>
              </View>
              <View style={[
                styles.radioButton,
                { borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'card' && { borderColor: BLUE_COLOR }
              ]}>
                {selectedPaymentMethod === 'card' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: BLUE_COLOR }]} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentMethod,
                { backgroundColor: colors.card, borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'wallet' && { borderColor: BLUE_COLOR, backgroundColor: colors.surface }
              ]}
              onPress={() => setSelectedPaymentMethod('wallet')}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="wallet" size={24} color={BLUE_COLOR} />
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>Digital Wallet</Text>
              </View>
              <View style={[
                styles.radioButton,
                { borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'wallet' && { borderColor: BLUE_COLOR }
              ]}>
                {selectedPaymentMethod === 'wallet' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: BLUE_COLOR }]} />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentMethod,
                { backgroundColor: colors.card, borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'cash' && { borderColor: BLUE_COLOR, backgroundColor: colors.surface }
              ]}
              onPress={() => setSelectedPaymentMethod('cash')}
            >
              <View style={styles.paymentMethodLeft}>
                <Ionicons name="cash" size={24} color={BLUE_COLOR} />
                <Text style={[styles.paymentMethodText, { color: colors.text }]}>Cash</Text>
              </View>
              <View style={[
                styles.radioButton,
                { borderColor: BLUE_COLOR + '50' },
                selectedPaymentMethod === 'cash' && { borderColor: BLUE_COLOR }
              ]}>
                {selectedPaymentMethod === 'cash' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: BLUE_COLOR }]} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Summary (hidden for Cash) */}
        {selectedPaymentMethod !== 'cash' && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Car Wash Service</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>$25.00</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Fee</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>$2.50</Text>
            </View>
            
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.summaryTotalValue, { color: colors.text }]}>$27.50</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: BLUE_COLOR + '30' }]}>
        <TouchableOpacity 
          style={[
            styles.payButton, 
            { backgroundColor: BLUE_COLOR }, 
            (isProcessing || !vehicleNumber.trim()) && styles.payButtonDisabled
          ]} 
          onPress={handlePayment}
          disabled={isProcessing || !vehicleNumber.trim()}
        >
          {isProcessing ? (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>Processing...</Text>
          ) : (
            <Text style={[styles.payButtonText, { color: '#FFFFFF' }]}>
              {selectedPaymentMethod === 'cash' ? 'Confirm Cash Payment' : 'Pay $27.50'}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  serviceCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceTitle: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  serviceText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  paymentMethodsContainer: {
    marginBottom: 0,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleDetailsSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  paymentMethodSelected: {},
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodText: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontFamily: FONTS.INTER_REGULAR,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {},
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZES.CAPTION_SMALL,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: FONTS.INTER_REGULAR,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_MEDIUM,
  },
  summaryValue: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_REGULAR,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZES.NUMBER_SMALL,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  bottomContainer: {
    padding: 16,
    borderTopWidth: 1,
  },
  payButton: {
    borderRadius: 16,
    paddingVertical: 18,
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
});

export default PaymentScreen;
