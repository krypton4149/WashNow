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
          <View style={styles.infoRow}>
            <View style={[styles.infoIconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="time" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Service Date & Time</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {bookingData?.date && bookingData?.time
                  ? `${new Date(bookingData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at ${bookingData.time}`
                  : 'Service starts immediately'}
              </Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: Platform.select({ ios: 16, android: 10 }) }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
              <Ionicons name="location" size={Platform.select({ ios: 18, android: 16 })} color={BLUE_COLOR} />
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
          <Text style={[styles.cardTitle, { color: colors.text }]}>Vehicle Information</Text>
          
          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Vehicle Number</Text>
            <TextInput
              style={[
                styles.modernInput, 
                { 
                  borderColor: vehicleNumberError ? '#EF4444' : colors.border, 
                  color: colors.text, 
                  backgroundColor: colors.surface 
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
            {vehicleNumberError ? (
              <Text style={styles.errorText}>{vehicleNumberError}</Text>
            ) : null}
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notes (Optional)</Text>
            <TextInput
              style={[
                styles.modernInput, 
                { 
                  borderColor: colors.border, 
                  color: colors.text, 
                  backgroundColor: colors.surface,
                  minHeight: Platform.select({ ios: 100, android: 80 })
                }
              ]}
              placeholder="Add any special instructions"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={[styles.formCard, { backgroundColor: colors.card, marginTop: Platform.select({ ios: 20, android: 16 }) }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Method</Text>
          
          <View style={styles.paymentMethodsContainer}>
            <TouchableOpacity 
              style={[
                styles.paymentCard,
                { 
                  backgroundColor: selectedPaymentMethod === 'card' ? BLUE_COLOR : colors.surface,
                  borderColor: selectedPaymentMethod === 'card' ? BLUE_COLOR : colors.border
                }
              ]}
              onPress={() => setSelectedPaymentMethod('card')}
              activeOpacity={0.7}
            >
                <Ionicons 
                name="card" 
                size={Platform.select({ ios: 24, android: 20 })} 
                color={selectedPaymentMethod === 'card' ? '#FFFFFF' : BLUE_COLOR} 
              />
              <Text style={[
                styles.paymentCardText,
                { color: selectedPaymentMethod === 'card' ? '#FFFFFF' : colors.text }
              ]}>
                Card
              </Text>
              {selectedPaymentMethod === 'card' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentCard,
                { 
                  backgroundColor: selectedPaymentMethod === 'wallet' ? BLUE_COLOR : colors.surface,
                  borderColor: selectedPaymentMethod === 'wallet' ? BLUE_COLOR : colors.border
                }
              ]}
              onPress={() => setSelectedPaymentMethod('wallet')}
              activeOpacity={0.7}
            >
                <Ionicons 
                name="wallet" 
                size={Platform.select({ ios: 24, android: 20 })} 
                color={selectedPaymentMethod === 'wallet' ? '#FFFFFF' : BLUE_COLOR} 
              />
              <Text style={[
                styles.paymentCardText,
                { color: selectedPaymentMethod === 'wallet' ? '#FFFFFF' : colors.text }
              ]}>
                Wallet
              </Text>
              {selectedPaymentMethod === 'wallet' && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={Platform.select({ ios: 20, android: 18 })} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

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
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
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
    fontSize: Platform.select({ ios: FONT_SIZES.HEADING_MEDIUM, android: FONT_SIZES.HEADING_SMALL }),
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
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
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 20, android: 16 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconContainer: {
    width: Platform.select({ ios: 40, android: 32 }),
    height: Platform.select({ ios: 40, android: 32 }),
    borderRadius: Platform.select({ ios: 12, android: 8 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.select({ ios: 12, android: 8 }),
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_MEDIUM, android: FONT_SIZES.BODY_SMALL }),
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 6, android: 4 }),
  },
  infoValue: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_LARGE, android: FONT_SIZES.BODY_MEDIUM }),
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    padding: Platform.select({ ios: 16, android: 14 }),
    minHeight: Platform.select({ ios: 56, android: 52 }),
  },
  serviceButtonContent: {
    flex: 1,
    marginRight: 8,
  },
  serviceButtonText: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_LARGE, android: FONT_SIZES.BODY_MEDIUM }),
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginBottom: 2,
  },
  serviceButtonPrice: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_MEDIUM }),
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 20, android: 16 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: Platform.select({ ios: FONT_SIZES.HEADING_MEDIUM, android: FONT_SIZES.BODY_LARGE }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 18, android: 14 }),
  },
  inputWrapper: {
    marginBottom: Platform.select({ ios: 20, android: 16 }),
  },
  inputLabel: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_MEDIUM, android: FONT_SIZES.BODY_SMALL }),
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 10, android: 8 }),
  },
  modernInput: {
    borderWidth: 1.5,
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_LARGE, android: FONT_SIZES.BODY_MEDIUM }),
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    minHeight: Platform.select({ ios: 52, android: 48 }),
  },
  paymentMethodsContainer: {
    flexDirection: 'row',
    gap: Platform.select({ ios: 12, android: 8 }),
    marginTop: Platform.select({ ios: 8, android: 4 }),
  },
  paymentCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: Platform.select({ ios: 14, android: 10 }),
    padding: Platform.select({ ios: 16, android: 10 }),
    minHeight: Platform.select({ ios: 100, android: 70 }),
    position: 'relative',
  },
  paymentCardText: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_MEDIUM }),
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
    marginTop: Platform.select({ ios: 8, android: 4 }),
  },
  checkIcon: {
    position: 'absolute',
    top: Platform.select({ ios: 8, android: 4 }),
    right: Platform.select({ ios: 8, android: 4 }),
  },
  summaryCard: {
    borderRadius: Platform.select({ ios: 16, android: 14 }),
    padding: Platform.select({ ios: 20, android: 16 }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_LARGE }),
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_LARGE }),
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  summaryDiscount: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_LARGE }),
    fontFamily: FONTS.INTER_REGULAR,
    textDecorationLine: 'line-through',
  },
  summaryDivider: {
    height: 1,
    marginVertical: Platform.select({ ios: 12, android: 10 }),
  },
  summaryTotalLabel: {
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_MEDIUM, android: FONT_SIZES.BODY_SMALL }),
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  summaryTotalValue: {
    fontSize: Platform.select({ ios: FONT_SIZES.HEADING_SMALL, android: FONT_SIZES.BODY_LARGE }),
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
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
    fontSize: Platform.select({ ios: FONT_SIZES.BODY_SMALL, android: FONT_SIZES.CAPTION_MEDIUM }),
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
