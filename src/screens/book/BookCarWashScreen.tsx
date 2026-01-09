import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface Props {
  onBack?: () => void;
  onNavigateToAvailableNow?: () => void;
  onNavigateToScheduleForLater?: () => void;
  onConfirmBooking?: (filteredCenters: any[]) => void;
}

const BookCarWashScreen: React.FC<Props> = ({ onBack, onNavigateToAvailableNow, onNavigateToScheduleForLater, onConfirmBooking }) => {
  const [searchText, setSearchText] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [selectedTimeOption, setSelectedTimeOption] = useState<'now' | 'later'>('now');
  const [currentLocation, setCurrentLocation] = useState('Getting location...');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centersError, setCentersError] = useState<string | null>(null);
  const [whereToWash, setWhereToWash] = useState(false);
  const { isDarkMode, colors } = useTheme();
  
  // Map theme colors to component-specific theme object
  const theme = {
    background: colors.background,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    card: colors.card,
    chip: isDarkMode ? colors.surface : '#F5F5F5',
    accent: colors.button,
  };

  // Mock data for service centers based on the exact image
  const mockServiceCenters = [
    {
      id: '1',
      name: 'Elite Car Care',
      rating: 4.6,
      distance: '0.7 mi',
      address: 'Madison, Midtown, New York',
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Pro Shine Detail',
      rating: 4.9,
      distance: '0.9 mi',
      address: 'Upper East Side, New York',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'Auto Detail Express',
      rating: 4.7,
      distance: '1.3 mi',
      address: '321 5th Avenue, Chelsea, New York',
      isAvailable: true,
    },
    {
      id: '4',
      name: 'Platinum Car Wash Center',
      rating: 4.5,
      distance: '1.7 mi',
      address: '654 Lexington Ave, Gramercy, New York',
      isAvailable: true,
    },
  ];

  useEffect(() => {
    getCurrentLocation();
    fetchServiceCenters();
  }, []);

  // Filter service centers based on search text
  // Helper function to calculate minimum price from services_offered
  const getMinPrice = (center: any): string | null => {
    if (!center.services_offered || !Array.isArray(center.services_offered) || center.services_offered.length === 0) {
      return null;
    }
    
    const prices = center.services_offered
      .map((service: any) => {
        // Use offer_price if available, otherwise use price
        const price = service.offer_price || service.price;
        return price ? parseFloat(price) : null;
      })
      .filter((price: number | null) => price !== null && !isNaN(price));
    
    if (prices.length === 0) {
      return null;
    }
    
    const minPrice = Math.min(...prices);
    return `$${minPrice.toFixed(2)}`;
  };

  // Helper function to format weekoff days for display
  const formatWeekoffDays = (weekoffDays: string[] | null | undefined): string | null => {
    if (!weekoffDays || !Array.isArray(weekoffDays) || weekoffDays.length === 0) {
      return null;
    }
    
    // Shorten day names for display (e.g., "Monday" -> "Mon")
    const dayAbbreviations: { [key: string]: string } = {
      'Sunday': 'Sun',
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
    };
    
    const abbreviatedDays = weekoffDays.map(day => dayAbbreviations[day] || day);
    return abbreviatedDays.join(', ');
  };

  const filteredCenters = React.useMemo(() => {
    if (!searchText.trim()) {
      return serviceCenters;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    return serviceCenters.filter((center) => {
      const name = (center.name || center.service_center_name || '').toLowerCase();
      const address = (center.address || center.location || '').toLowerCase();
      
      return name.includes(searchLower) || address.includes(searchLower);
    });
  }, [serviceCenters, searchText]);

  const fetchServiceCenters = async () => {
    try {
      setLoadingCenters(true);
      const result = await authService.getServiceCenters();
      
      if (result.success && result.serviceCenters) {
        // Filter out centers with empty services_offered array
        // Only show centers that have at least one service
        const centersWithServices = result.serviceCenters.filter((center: any) => {
          const hasServices = center.services_offered && 
                             Array.isArray(center.services_offered) && 
                             center.services_offered.length > 0;
          return hasServices;
        });
        
        console.log(`Filtered ${result.serviceCenters.length} centers to ${centersWithServices.length} centers with services`);
        setServiceCenters(centersWithServices);
        setCentersError(null);
      } else {
        // Fallback to mock data if API fails
        console.log('API failed, using mock data:', result.error);
        setServiceCenters(mockServiceCenters);
        setCentersError(result.error || 'Failed to load service centers');
      }
    } catch (error) {
      console.error('Error fetching service centers:', error);
      // Fallback to mock data on error
      setServiceCenters(mockServiceCenters);
      setCentersError('Failed to load service centers');
    } finally {
      setLoadingCenters(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        console.log('Location error:', error);
        setCurrentLocation('Downtown, New York - 123 Main Street');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      if (data.city && data.principalSubdivision) {
        setCurrentLocation(`${data.city}, ${data.principalSubdivision} - ${data.locality || 'Current Location'}`);
      } else {
        setCurrentLocation('Downtown, New York - 123 Main Street');
      }
    } catch (error) {
      console.log('Reverse geocoding error:', error);
      setCurrentLocation('Downtown, New York - 123 Main Street');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleConfirmBooking = () => {
    console.log('=== Confirm booking pressed ===');
    console.log('Search text:', searchText);
    console.log('Filtered centers count:', filteredCenters.length);
    console.log('All service centers count:', serviceCenters.length);
    console.log('Filtered centers:', JSON.stringify(filteredCenters, null, 2));
    
    // Use filteredCenters if search is active, otherwise use all centers
    const centersToSend = searchText.trim() ? filteredCenters : serviceCenters;
    console.log(`=== Sending request to ${centersToSend.length} center(s) ===`);
    console.log('Centers to send:', JSON.stringify(centersToSend, null, 2));
    
    if (centersToSend.length === 0) {
      Alert.alert('No Centers', 'Please select or search for service centers before confirming.');
      return;
    }
    
    onConfirmBooking?.(centersToSend);
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container,{backgroundColor: theme.background}]} edges={platformEdges as any}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Plan your wash</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selection Buttons */}
        <View style={styles.selectionContainer}>
          <TouchableOpacity 
            style={[styles.selectionButton, { backgroundColor: theme.chip, borderColor: BLUE_COLOR + '40', borderWidth: 1.5 }]}
            onPress={() => setShowTimeModal(true)}
          >
            <Ionicons name="time-outline" size={14} color="#000000" />
            <Text style={[styles.selectionText, { color: '#000000' }]}>Wash now</Text>
            <Ionicons name="chevron-down-outline" size={14} color="#000000" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.selectionButton, { backgroundColor: theme.chip, borderColor: BLUE_COLOR + '40', borderWidth: 1.5 }]}> 
            <Text style={[styles.selectionText, { color: '#000000' }]}>For me</Text>
            <Ionicons name="chevron-down-outline" size={14} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Location Input */}
        <View style={[styles.locationContainer, { backgroundColor: theme.card, borderColor: BLUE_COLOR + '30', borderWidth: 1.5 }]}> 
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: BLUE_COLOR }]} />
            <Text style={[styles.locationText, { color: '#000000' }]}>{currentLocation}</Text>
          </View>
          
          <View style={[styles.separatorLine, { backgroundColor: '#E5E7EB' }]} />
          
          <View style={styles.whereToWashRow}>
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, { borderColor: '#000000' }, whereToWash && { backgroundColor: BLUE_COLOR }]}> 
                {whereToWash && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </View>
            <TextInput
              style={[styles.searchInput, { color: '#000000' }]}
              placeholder="Where to?"
              placeholderTextColor="#666666"
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (text.length > 0) {
                  setWhereToWash(true);
                }
              }}
              onFocus={() => setWhereToWash(true)}
            />
          </View>
        </View>

        {/* Service Centers List */}
        <View style={styles.centersList}>
          <Text style={[styles.sectionTitle, { color: '#000000' }]}>
            {searchText.length > 0 
              ? `Service centers for "${searchText}" (${filteredCenters.length})`
              : `Nearby car wash centers (${serviceCenters.length})`
            }
          </Text>
          
          {loadingCenters ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={[styles.loadingText, { color: '#000000' }]}>Loading service centers...</Text>
            </View>
          ) : centersError ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: '#000000' }]}>{centersError}</Text>
              <TouchableOpacity onPress={fetchServiceCenters} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredCenters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: '#000000' }]}>
                {searchText.length > 0 
                  ? `No service centers found for "${searchText}"`
                  : 'No service centers available'
                }
              </Text>
              {searchText.length > 0 && (
                <Text style={[styles.emptySubtext, { color: '#000000' }]}>
                  Try searching with different keywords or check spelling
                </Text>
              )}
            </View>
          ) : (
            filteredCenters.map((center, index) => {
              const minPrice = getMinPrice(center);
              const weekoffDaysFormatted = formatWeekoffDays(center.weekoff_days);
              return (
                <View 
                  key={center.id || index} 
                  style={[styles.centerRow, { borderBottomColor: BLUE_COLOR + '20' }, index === filteredCenters.length - 1 && styles.lastCenterRow]}
                >
                  <View style={styles.centerLeft}>
                    <View style={[styles.locationIconContainer, { backgroundColor: BLUE_COLOR + '15' }]}>
                      <Ionicons name="location" size={18} color={BLUE_COLOR} />
                    </View>
                  </View>
                  <View style={styles.centerBody}>
                    <View style={styles.centerHeader}>
                      <Text style={[styles.centerName, { color: '#000000' }]}>{center.name || center.service_center_name || 'Service Center'}</Text>
                      {minPrice && (
                        <View style={[styles.priceBadge, { backgroundColor: BLUE_COLOR + '15' }]}>
                          <Text style={[styles.minPrice, { color: '#000000' }]}>{minPrice}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.centerAddress, { color: '#000000' }]}>{center.address || center.location || 'Address not available'}</Text>
                    {weekoffDaysFormatted && (
                      <View style={styles.weekoffContainer}>
                        <Ionicons name="close-circle-outline" size={Platform.select({ ios: 14, android: 12 })} color="#FF6B6B" />
                        <Text style={[styles.weekoffText, { color: '#FF6B6B' }]}>
                          Closed: {weekoffDaysFormatted}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Instant Booking info removed as requested */}
      </ScrollView>

      {/* Confirm Booking Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: theme.card, borderTopColor: BLUE_COLOR + '30' }]}> 
        <TouchableOpacity style={[styles.confirmButton,{backgroundColor: BLUE_COLOR}]} onPress={handleConfirmBooking}>
          <Text style={[styles.confirmButtonText,{color: '#FFFFFF'}]}>Confirm Booking</Text>
        </TouchableOpacity>
        <Text style={[styles.bottomText, { color: '#000000' }]}>
          {searchText.trim() 
            ? `Request will be sent to ${filteredCenters.length} matching center${filteredCenters.length !== 1 ? 's' : ''}.`
            : `Request will be sent to all ${serviceCenters.length} available car wash centers.`
          }
        </Text>
      </View>

      {/* Time Selection Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{backgroundColor: theme.card}]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle,{color: theme.textPrimary}]}>When do you want your car washed?</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Ionicons name="close" size={24} color={BLUE_COLOR} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeOptions}>
              <TouchableOpacity 
                style={[styles.timeOption,{backgroundColor: isDarkMode ? colors.surface : '#F9FAFB', borderColor: BLUE_COLOR + '30', borderWidth: 1}]}
                onPress={() => {
                  setSelectedTimeOption('now');
                  setShowTimeModal(false);
                }}
              >
                <View style={[styles.timeOptionIcon,{backgroundColor: BLUE_COLOR}]}> 
                  <Ionicons name="flash" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={[styles.timeOptionTitle,{color: theme.textPrimary}]}>Now</Text>
                  <Text style={[styles.timeOptionDescription,{color: theme.textSecondary}]}> 
                    Get matched with nearby car wash centers who can wash your car immediately
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.timeOption,{backgroundColor: isDarkMode ? colors.surface : '#F9FAFB', borderColor: BLUE_COLOR + '30', borderWidth: 1}]}
                onPress={() => {
                  setSelectedTimeOption('later');
                  setShowTimeModal(false);
                  onNavigateToScheduleForLater?.();
                }}
              >
                <View style={[styles.timeOptionIcon,{backgroundColor: BLUE_COLOR}]}> 
                  <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.timeOptionContent}>
                  <Text style={[styles.timeOptionTitle,{color: theme.textPrimary}]}>Schedule for later</Text>
                  <Text style={[styles.timeOptionDescription,{color: theme.textSecondary}]}> 
                    Choose a specific date, time, and location for your car wash
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
  },
  selectionContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
    flex: 1,
    borderWidth: 1.5,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 36,
  },
  selectionText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    flex: 1,
    fontFamily: FONTS.INTER_REGULAR,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 16,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  locationText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    flex: 1,
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
  },
  separatorLine: {
    height: 1,
    width: '100%',
    marginVertical: 6,
  },
  whereToWashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_SMALL,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    minHeight: 32,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  whereToWashText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  centersList: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Platform.select({ ios: FONT_SIZES.HEADING_LARGE, android: FONT_SIZES.HEADING_MEDIUM }),
    fontWeight: '600',
    marginBottom: Platform.select({ ios: 20, android: 14 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.4,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Platform.select({ ios: 18, android: 12 }),
    paddingHorizontal: Platform.select({ ios: 4, android: 2 }),
    borderBottomWidth: 1.5,
    borderBottomColor: BLUE_COLOR + '20',
  },
  lastCenterRow: {
    borderBottomWidth: 0,
  },
  centerLeft: {
    width: 40,
    alignItems: 'center',
    marginTop: 2,
  },
  locationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBody: {
    flex: 1,
    paddingLeft: 14,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  centerName: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    flex: 1,
    fontFamily: FONTS.INTER_MEDIUM,
    lineHeight: 20,
  },
  priceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  minPrice: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
  },
  centerAddress: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
    marginTop: 2,
  },
  weekoffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.select({ ios: 6, android: 5 }),
    gap: Platform.select({ ios: 6, android: 4 }),
  },
  weekoffText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    flex: 1,
  },
  centerDistance: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  instantBookingContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instantBookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  instantBookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  instantBookingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  confirmButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.INTER_SEMIBOLD,
    letterSpacing: 0.5,
  },
  bottomText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  timeOptions: {
    gap: 16,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
  },
  timeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BLUE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  timeOptionContent: {
    flex: 1,
  },
  timeOptionTitle: {
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
  },
  timeOptionDescription: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: FONTS.INTER_REGULAR,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#000000',
    fontFamily: FONTS.INTER_REGULAR,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: FONTS.INTER_REGULAR,
  },
  retryButton: {
    backgroundColor: BLUE_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#000000',
    textAlign: 'center',
    fontFamily: FONTS.INTER_REGULAR,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.BODY_SMALL,
    color: '#000000',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: FONTS.INTER_REGULAR,
  },
});

export default BookCarWashScreen;