import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';

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

  const handlePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      if (selectedPaymentMethod === 'cash') {
        // Validate required inputs
        if (!acceptedCenter?.id) {
          Alert.alert('Error', 'Service center is missing.');
          setIsProcessing(false);
          return;
        }
        if (!vehicleNumber.trim()) {
          Alert.alert('Validation', 'Please enter your vehicle number.');
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
    <SafeAreaView style={styles.container} edges={["top","bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Service Details */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>Service Details</Text>
          <View style={styles.serviceRow}>
            <Ionicons name="car" size={20} color="#000" />
            <Text style={styles.serviceText}>Car Wash Service</Text>
          </View>
          <View style={styles.serviceRow}>
            <Ionicons name="location" size={20} color="#000" />
            <Text style={styles.serviceText}>{acceptedCenter.name}</Text>
          </View>
          <View style={styles.serviceRow}>
            <Ionicons name="time" size={20} color="#000" />
            <Text style={styles.serviceText}>
              {bookingData?.date && bookingData?.time
                ? `${new Date(bookingData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${bookingData.time}`
                : 'Service starts immediately'}
            </Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity 
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === 'card' && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedPaymentMethod('card')}
          >
            <View style={styles.paymentMethodLeft}>
              <Ionicons name="card" size={24} color="#000" />
              <Text style={styles.paymentMethodText}>Credit/Debit Card</Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'card' && styles.radioButtonSelected
            ]}>
              {selectedPaymentMethod === 'card' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === 'wallet' && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedPaymentMethod('wallet')}
          >
            <View style={styles.paymentMethodLeft}>
              <Ionicons name="wallet" size={24} color="#000" />
              <Text style={styles.paymentMethodText}>Digital Wallet</Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'wallet' && styles.radioButtonSelected
            ]}>
              {selectedPaymentMethod === 'wallet' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.paymentMethod,
              selectedPaymentMethod === 'cash' && styles.paymentMethodSelected
            ]}
            onPress={() => setSelectedPaymentMethod('cash')}
          >
            <View style={styles.paymentMethodLeft}>
              <Ionicons name="cash" size={24} color="#000" />
              <Text style={styles.paymentMethodText}>Cash</Text>
            </View>
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === 'cash' && styles.radioButtonSelected
            ]}>
              {selectedPaymentMethod === 'cash' && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Vehicle details for Cash */}
        {selectedPaymentMethod === 'cash' && (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>Vehicle Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Vehicle number (e.g., UP68 AB1234)"
              placeholderTextColor="#9CA3AF"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, { marginTop: 12 }]}
              placeholder="Notes (optional)"
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        {/* Payment Summary (hidden for Cash) */}
        {selectedPaymentMethod !== 'cash' && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Car Wash Service</Text>
              <Text style={styles.summaryValue}>$25.00</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee</Text>
              <Text style={styles.summaryValue}>$2.50</Text>
            </View>
            
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total Amount</Text>
              <Text style={styles.summaryTotalValue}>$27.50</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity 
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]} 
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.payButtonText}>Processing...</Text>
          ) : (
            <Text style={styles.payButtonText}>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  serviceText: {
    fontSize: 14,
    color: '#666666',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#000',
    backgroundColor: '#F9FAFB',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentMethodText: {
    fontSize: 16,
    color: '#000',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#000',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#000',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#666666',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default PaymentScreen;
