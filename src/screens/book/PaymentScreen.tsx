import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, Platform, Modal, Image, FlatList } from 'react-native';
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

  // Service center and service selection states
  const [selectedServiceCenter, setSelectedServiceCenter] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [loadingCenters, setLoadingCenters] = useState(false);

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
        
        // Use center from selectedServiceCenter or bookingData or acceptedCenter
        const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
        
        if (!centerId) {
          Alert.alert('Error', 'Please select a service center.');
          setIsProcessing(false);
          return;
        }

        if (!selectedService?.id) {
          Alert.alert('Error', 'Please select a service.');
          setIsProcessing(false);
          return;
        }
        
        const payload = {
          service_centre_id: String(centerId),
          booking_date: formatDate(bookingDate),
          booking_time: bookingTime,
          vehicle_no: vehicleNumber.trim(),
          notes: notes?.trim() ? notes.trim() : 'Payment method: Cash',
          service_id: String(selectedService.id),
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

        // Validate service center and service for card/wallet payment
        const centerId = selectedServiceCenter?.id || bookingData?.center?.id || acceptedCenter?.id;
        if (!centerId) {
          Alert.alert('Error', 'Please select a service center.');
          setIsProcessing(false);
          return;
        }

        if (!selectedService?.id) {
          Alert.alert('Error', 'Please select a service.');
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
        
        const payload = {
          service_centre_id: String(centerId),
          booking_date: formatDate(bookingDate),
          booking_time: bookingTime,
          vehicle_no: vehicleNumber.trim(),
          notes: notes?.trim() || '',
          service_id: String(selectedService.id),
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
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
              {selectedService ? selectedService.name : 'Car Wash Service'}
            </Text>
          </View>
          <View style={styles.serviceRow}>
            <Ionicons name="location" size={20} color={BLUE_COLOR} />
            <Text style={[styles.serviceText, { color: colors.textSecondary }]}>
              {selectedServiceCenter?.name || acceptedCenter.name}
            </Text>
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

        {/* Service Center Display (Read-only) */}
        <View style={[styles.serviceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.serviceTitle, { color: colors.text }]}>Service Center</Text>
          <View style={[
            styles.serviceCenterDisplay,
            { 
              borderColor: BLUE_COLOR + '30', 
              backgroundColor: colors.surface 
            }
          ]}>
            <Ionicons name="location" size={20} color={BLUE_COLOR} />
            <Text style={[
              styles.serviceCenterDisplayText,
              { color: selectedServiceCenter ? colors.text : colors.textSecondary }
            ]}>
              {selectedServiceCenter 
                ? selectedServiceCenter.name 
                : acceptedCenter?.name || 'Service Center'}
            </Text>
          </View>

          {/* Service Selection - Show when center is selected */}
          {selectedServiceCenter && selectedServiceCenter.services_offered && selectedServiceCenter.services_offered.length > 0 && (
            <>
              <Text style={[styles.serviceTitle, { color: colors.text, marginTop: 16 }]}>Select Service</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  { 
                    borderColor: BLUE_COLOR + '50', 
                    backgroundColor: colors.surface 
                  }
                ]}
                onPress={() => setShowServiceDropdown(true)}
              >
                <Text style={[
                  styles.dropdownButtonText,
                  { color: selectedService ? colors.text : colors.textSecondary }
                ]}>
                  {selectedService 
                    ? `${selectedService.name} - $${selectedService.offer_price || selectedService.price}` 
                    : 'Select Service'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={BLUE_COLOR} />
              </TouchableOpacity>

              {/* Selected Service Details */}
              {selectedService && (
                <View style={[styles.selectedServiceCard, { backgroundColor: colors.surface, borderColor: BLUE_COLOR + '30' }]}>
                  {selectedService.image && (
                    <Image 
                      source={{ 
                        uri: selectedService.image.startsWith('http') 
                          ? selectedService.image 
                          : `https://carwashapp.shoppypie.in/${selectedService.image}` 
                      }} 
                      style={styles.serviceImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.selectedServiceInfo}>
                    <Text style={[styles.selectedServiceName, { color: colors.text }]}>{selectedService.name}</Text>
                    {selectedService.description && (
                      <Text style={[styles.selectedServiceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                        {selectedService.description}
                      </Text>
                    )}
                    <View style={styles.priceContainer}>
                      {selectedService.offer_price ? (
                        <>
                          <Text style={[styles.offerPrice, { color: BLUE_COLOR }]}>${selectedService.offer_price}</Text>
                          <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>${selectedService.price}</Text>
                        </>
                      ) : (
                        <Text style={[styles.offerPrice, { color: BLUE_COLOR }]}>${selectedService.price}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
          {selectedServiceCenter && (!selectedServiceCenter.services_offered || selectedServiceCenter.services_offered.length === 0) && (
            <Text style={[styles.noServicesText, { color: colors.textSecondary }]}>
              No services available for this center
            </Text>
          )}
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
        {selectedPaymentMethod !== 'cash' && selectedService && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{selectedService.name}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ${selectedService.offer_price || selectedService.price}
              </Text>
            </View>
            
            {selectedService.offer_price && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Original Price</Text>
                <Text style={[styles.summaryValue, { color: colors.textSecondary, textDecorationLine: 'line-through' }]}>
                  ${selectedService.price}
                </Text>
              </View>
            )}
            
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: colors.text }]}>Total Amount</Text>
              <Text style={[styles.summaryTotalValue, { color: colors.text }]}>
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

      {/* Pay Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: colors.background, borderTopColor: BLUE_COLOR + '30' }]}>
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
                  ? `Pay $${selectedService.offer_price || selectedService.price}`
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
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    flex: 1,
  },
  serviceCenterDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    gap: 12,
  },
  serviceCenterDisplayText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    flex: 1,
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
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
});

export default PaymentScreen;
