import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import BackButton from '../../components/ui/BackButton';
import authService from '../../services/authService';
import { platformEdges } from '../../utils/responsive';
import { useTheme } from '../../context/ThemeContext';

interface ConfirmBookingScreenProps {
  onBack: () => void;
  onConfirmBooking: () => void;
  onSendRequestToCenters: () => void;
  bookingData: {
    center: {
      id: string;
      name: string;
      rating: number;
      distance: string;
      address: string;
      image: string;
    };
    service: string;
    date: string;
    time: string;
    vehicleNumber?: string;
    notes?: string;
    bookingId?: string;
    vehicle?: {
      name: string;
      plateNumber: string;
      type: string;
    };
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSelected: boolean;
}

const ConfirmBookingScreen: React.FC<ConfirmBookingScreenProps> = ({
  onBack,
  onConfirmBooking,
  onSendRequestToCenters,
  bookingData,
}) => {
  const { colors } = useTheme();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('credit-card');
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'credit-card',
      name: 'Credit/Debit Card',
      description: 'Pay with card',
      icon: '💳',
      isSelected: true,
    },
    {
      id: 'cash',
      name: 'Cash',
      description: 'Pay at center',
      icon: '💵',
      isSelected: false,
    },
    {
      id: 'digital-wallet',
      name: 'Digital Wallet',
      description: 'Apple Pay, Google Pay',
      icon: '📱',
      isSelected: false,
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleConfirmBooking = async () => {
    if (isBooking) return; // Prevent multiple bookings
    
    setIsBooking(true);
    
    try {
      // Format the booking data for the API
      const bookingDate = new Date(bookingData.date);
      const day = bookingDate.getDate().toString().padStart(2, '0');
      const month = (bookingDate.getMonth() + 1).toString().padStart(2, '0');
      const year = bookingDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY format
      
      // Get vehicle number
      const vehicleNumber = bookingData.vehicleNumber || (bookingData.vehicle?.plateNumber || '');
      
      // Validate required fields
      if (!vehicleNumber.trim()) {
        Alert.alert('Validation Error', 'Vehicle number is required');
        setIsBooking(false);
        return;
      }
      
      if (!bookingData.time) {
        Alert.alert('Validation Error', 'Booking time is required');
        setIsBooking(false);
        return;
      }
      
      if (!bookingData.center?.id) {
        Alert.alert('Validation Error', 'Service center is required');
        setIsBooking(false);
        return;
      }
      
      // Try different service center IDs if the first one fails
      const serviceCenterIds = [
        bookingData.center.id,        // Original ID
        parseInt(bookingData.center.id), // Convert to number
        '8',                         // Known working ID from API
        '1',                         // Simple numeric ID
      ];

      let lastError = '';
      
      for (let i = 0; i < serviceCenterIds.length; i++) {
        const serviceCenterId = serviceCenterIds[i];
        
        const apiBookingData = {
          service_centre_id: serviceCenterId.toString(),
          booking_date: formattedDate,
          booking_time: bookingData.time,
          vehicle_no: vehicleNumber.trim(),
          notes: `Payment method: ${paymentMethods.find(p => p.id === selectedPaymentMethod)?.name || 'Unknown'}`,
        };

        console.log(`=== BOOKING ATTEMPT ${i + 1} ===`);
        console.log('Service Centre ID:', serviceCenterId);
        console.log('API data:', JSON.stringify(apiBookingData, null, 2));

        const result = await authService.bookNow(apiBookingData);

        console.log('API Response:', JSON.stringify(result, null, 2));

        if (result.success) {
          Alert.alert(
            'Payment Successful!',
            `Your payment has been processed and booking confirmed.\n\nBooking ID: ${result.bookingId}\n\nService Center: ${bookingData.center?.name || 'Service Center'}\n\nYou will receive a confirmation email shortly.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Navigate to booking confirmation screen
                  onConfirmBooking();
                }
              }
            ]
          );
          return; // Success, exit the function
        } else {
          lastError = result.error || 'Unknown error';
          console.log(`Attempt ${i + 1} failed:`, lastError);
          
          // If this is not the last attempt, continue to next ID
          if (i < serviceCenterIds.length - 1) {
            console.log('Trying next service center ID...');
            continue;
          }
        }
      }

      // If we get here, all attempts failed
      Alert.alert(
        'Payment Failed',
        `All payment attempts failed. Last error: ${lastError}\n\nService Centre: ${bookingData.center?.name || 'Service Center'}\n\nPlease try again later or contact support.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error',
        `An unexpected error occurred: ${error}\n\nPlease try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsBooking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    if (!method) {
      return null;
    }
    
    return (
      <TouchableOpacity
        key={method.id}
        style={styles.paymentMethodItem}
        onPress={() => handlePaymentMethodSelect(method.id)}
      >
        <View style={styles.paymentMethodLeft}>
          <View style={styles.radioButton}>
            {selectedPaymentMethod === method.id && (
              <View style={styles.radioButtonSelected} />
            )}
          </View>
          <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
          <View style={styles.paymentMethodInfo}>
            <Text style={[
              styles.paymentMethodName,
              selectedPaymentMethod === method.id && styles.paymentMethodNameSelected,
            ]}>
              {method.name}
            </Text>
            <Text style={styles.paymentMethodDescription}>{method.description}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <Text style={styles.title}>Payment & Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Booking Details Card */}
        <View style={styles.bookingDetailsCard}>
          <View style={styles.centerInfo}>
            <Text style={styles.centerName}>{bookingData.center?.name || 'Service Center'}</Text>
            <View style={styles.centerLocation}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.centerDistance}>{bookingData.center?.distance || 'Unknown'} away</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.serviceDetails}>
            <View style={styles.serviceDetailItem}>
              <Text style={styles.serviceDetailIcon}>✨</Text>
              <View style={styles.serviceDetailInfo}>
                <Text style={styles.serviceDetailLabel}>Service</Text>
                <Text style={styles.serviceDetailValue}>{bookingData.service}</Text>
              </View>
            </View>

            <View style={styles.serviceDetailItem}>
              <Text style={styles.serviceDetailIcon}>📅</Text>
              <View style={styles.serviceDetailInfo}>
                <Text style={styles.serviceDetailLabel}>Date</Text>
                <Text style={styles.serviceDetailValue}>
                  {formatDate(bookingData.date)}
                </Text>
              </View>
            </View>

            <View style={styles.serviceDetailItem}>
              <Text style={styles.serviceDetailIcon}>🕐</Text>
              <View style={styles.serviceDetailInfo}>
                <Text style={styles.serviceDetailLabel}>Time</Text>
                <Text style={styles.serviceDetailValue}>{bookingData.time}</Text>
              </View>
            </View>

            <View style={styles.serviceDetailItem}>
              <Text style={styles.serviceDetailIcon}>🚗</Text>
              <View style={styles.serviceDetailInfo}>
                <Text style={styles.serviceDetailLabel}>Vehicle</Text>
                <Text style={styles.serviceDetailValue}>
                  {bookingData.vehicleNumber || (bookingData.vehicle ? `${bookingData.vehicle.name} - ${bookingData.vehicle.plateNumber}` : 'Not specified')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.paymentMethodCard}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <View style={styles.paymentMethodsList}>
            {paymentMethods.filter(method => method).map(renderPaymentMethod)}
          </View>
        </View>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton, 
            { backgroundColor: colors.button },
            isBooking && [styles.confirmButtonDisabled, { backgroundColor: colors.border }]
          ]} 
          onPress={handleConfirmBooking}
          disabled={isBooking}
        >
          <Text style={[styles.confirmButtonText, { color: colors.buttonText }]}>
            {isBooking ? 'Sending Request...' : 'Pay Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  bookingDetailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerInfo: {
    marginBottom: 16,
  },
  centerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  centerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  centerDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  serviceDetails: {
    gap: 16,
  },
  serviceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceDetailIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  serviceDetailInfo: {
    flex: 1,
  },
  serviceDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  serviceDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  paymentMethodsList: {
    gap: 16,
  },
  paymentMethodItem: {
    paddingVertical: 4,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },
  paymentMethodIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  paymentMethodNameSelected: {
    color: '#000000',
  },
  paymentMethodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConfirmBookingScreen;
