import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';
import { STORAGE_BASE_URL } from '../../config/env';

const BLUE_COLOR = '#0358a8';

interface Props {
  onBack?: () => void;
  onNavigateToAvailableNow?: () => void;
  onNavigateToScheduleForLater?: () => void;
  onConfirmBooking?: (filteredCenters: any[]) => void;
  onCenterSelect?: (center: any) => void;
  onServiceSelect?: (service: any, center: any) => void;
}

const BookCarWashScreen: React.FC<Props> = ({ onBack, onNavigateToAvailableNow, onNavigateToScheduleForLater, onConfirmBooking, onCenterSelect, onServiceSelect }) => {
  const [searchText, setSearchText] = useState('');
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(true);
  const [centersError, setCentersError] = useState<string | null>(null);
  const [selectedServiceTab, setSelectedServiceTab] = useState<string>('all');
  const [showServicesSheet, setShowServicesSheet] = useState(false);
  const [selectedCenterForSheet, setSelectedCenterForSheet] = useState<any>(null);
  const [centerServices, setCenterServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const textInputRef = useRef<TextInput>(null);
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
    // Get location and fetch service centers
    getCurrentLocation();
  }, []);

  // Refetch when service tab changes
  useEffect(() => {
    if (currentLocation) {
      fetchServiceCenters(currentLocation.lat, currentLocation.lng);
    } else {
      fetchServiceCenters();
    }
  }, [selectedServiceTab]);

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
    return minPrice.toFixed(2); // Return just the number, we'll format it as "Starting from $X"
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

  // Helper to check if center offers a specific service type
  const centerOffersService = (center: any, serviceType: string): boolean => {
    if (serviceType === 'all') return true;
    
    if (!center.services_offered || !Array.isArray(center.services_offered)) {
      return false;
    }
    
    const serviceName = (center.service_type || '').toLowerCase();
    const serviceNames = center.services_offered.map((s: any) => (s.name || '').toLowerCase());
    
    // Map service types to keywords
    const serviceKeywords: { [key: string]: string[] } = {
      'Car Exterior': ['exterior', 'wash', 'car wash', 'exterior wash', 'exterior cleaning'],
      'Interior Cleaning': ['interior', 'interior cleaning', 'interior detail', 'interior wash'],
      'Full Valet': ['valet', 'full valet', 'full service', 'complete', 'full detail'],
    };
    
    const keywords = serviceKeywords[serviceType] || [];
    
    // Check if any service matches
    return keywords.some(keyword => 
      serviceName.includes(keyword) || 
      serviceNames.some((name: string) => name.includes(keyword))
    );
  };

  const filteredCenters = React.useMemo(() => {
    // First apply text search (if any)
    let result = serviceCenters;
    
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      result = result.filter((center) => {
        const name = (center.name || center.service_center_name || '').toLowerCase();
        const address = (center.address || center.location || '').toLowerCase();
        return name.includes(searchLower) || address.includes(searchLower);
      });
    }
    
    // Then apply service filter
    if (selectedServiceTab !== 'all') {
      result = result.filter((center) => centerOffersService(center, selectedServiceTab));
    }
    
    return result;
  }, [serviceCenters, searchText, selectedServiceTab]);

  const fetchServiceCenters = async (lat?: number, lng?: number) => {
    try {
      // Use provided lat/lng or current location
      const useLat = lat !== undefined ? lat : currentLocation?.lat;
      const useLng = lng !== undefined ? lng : currentLocation?.lng;
      
      // Map service tab to activeService parameter
      const activeService = selectedServiceTab !== 'all' ? selectedServiceTab : undefined;
      
      // First, try to get cached data immediately (stale-while-revalidate pattern)
      const cachedResult = await authService.getServiceCenters(false, useLat, useLng, activeService);
      if (cachedResult.success && cachedResult.serviceCenters && cachedResult.serviceCenters.length > 0) {
        // Show cached data immediately
        const centersWithServices = cachedResult.serviceCenters.filter((center: any) => {
          const hasServices = center.services_offered && 
                             Array.isArray(center.services_offered) && 
                             center.services_offered.length > 0;
          return hasServices;
        });
        setServiceCenters(centersWithServices);
        setCentersError(null);
        setLoadingCenters(false);
        
        // Then fetch fresh data in background
        fetchFreshServiceCenters(useLat, useLng, activeService);
        return;
      }
      
      // If no cache, show loading and fetch fresh data
      setLoadingCenters(true);
      await fetchFreshServiceCenters(useLat, useLng, activeService);
    } catch (error) {
      console.error('Error fetching service centers:', error);
      setLoadingCenters(false);
      // Try to use cached data on error
      const cachedResult = await authService.getServiceCenters(false);
      if (cachedResult.success && cachedResult.serviceCenters) {
        const centersWithServices = cachedResult.serviceCenters.filter((center: any) => {
          const hasServices = center.services_offered && 
                             Array.isArray(center.services_offered) && 
                             center.services_offered.length > 0;
          return hasServices;
        });
        setServiceCenters(centersWithServices);
        setCentersError(null);
      } else {
        setServiceCenters(mockServiceCenters);
        setCentersError('Failed to load service centers');
      }
    }
  };

  const fetchFreshServiceCenters = async (lat?: number, lng?: number, activeService?: string) => {
    try {
      const result = await authService.getServiceCenters(true, lat, lng, activeService);
      
      if (result.success && result.serviceCenters) {
        // Filter out centers with empty services_offered array
        // Only show centers that have at least one service
        const centersWithServices = result.serviceCenters.filter((center: any) => {
          const hasServices = center.services_offered && 
                             Array.isArray(center.services_offered) && 
                             center.services_offered.length > 0;
          return hasServices;
        });
        
        setServiceCenters(centersWithServices);
        setCentersError(null);
      } else {
        // Don't override with mock data if we already have cached data showing
        if (serviceCenters.length === 0) {
          setServiceCenters(mockServiceCenters);
          setCentersError(result.error || 'Failed to load service centers');
        }
      }
    } catch (error) {
      console.error('Error fetching fresh service centers:', error);
      // Don't override if we already have data showing
      if (serviceCenters.length === 0) {
        setServiceCenters(mockServiceCenters);
        setCentersError('Failed to load service centers');
      }
    } finally {
      setLoadingCenters(false);
    }
  };

  // Get location and store it for API use
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Store location for API use
        setCurrentLocation({ lat: latitude, lng: longitude });
        // Fetch service centers with location
        fetchServiceCenters(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      (error) => {
        // Location not available, fetch without location
        fetchServiceCenters();
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
      // Location data available for backend use but not displayed in UI
    } catch (error) {
      // Continue without location
    }
  };

  const handleSearch = () => {
    // Refetch service centers with current location when search is triggered
    if (currentLocation) {
      fetchServiceCenters(currentLocation.lat, currentLocation.lng);
    } else {
      fetchServiceCenters();
    }
    
    // Reset service tab to 'all' after search
    setSelectedServiceTab('all');
    
    if (searchText.trim() && filteredCenters.length === 0) {
      Alert.alert('No Centers Found', `No car wash centers found for "${searchText}". Please try a different location.`);
    }
  };

  const handleCenterClick = async (center: any) => {
    setSelectedCenterForSheet(center);
    setLoadingServices(true);
    setShowServicesSheet(true);

    try {
      // Fetch service centers to get services for this center
      const result = await authService.getServiceCenters(true);
      
      if (result.success && result.serviceCenters) {
        const centerId = center?.id || center?.service_centre_id;
        const foundCenter = result.serviceCenters.find((c: any) => 
          String(c.id) === String(centerId)
        );
        
        if (foundCenter && foundCenter.services_offered) {
          // Sort services by display_order
          const sortedServices = foundCenter.services_offered.sort((a: any, b: any) => 
            (a.display_order || 0) - (b.display_order || 0)
          );
          setCenterServices(sortedServices);
        } else {
          // Use services from center if available
          setCenterServices(center.services_offered || []);
        }
      } else {
        // Fallback to center's services
        setCenterServices(center.services_offered || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      setCenterServices(center.services_offered || []);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceClick = (service: any) => {
    setShowServicesSheet(false);
    // Navigate to ServiceCenterScreen with the selected service
    if (onCenterSelect) {
      // Pass the center with selected service
      onCenterSelect({ ...selectedCenterForSheet, selectedService: service });
    }
  };

  const getImageUrl = (imagePath: string | null | undefined, centerId?: string | number, index?: number, isService: boolean = false): string => {
    if (imagePath) {
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }
      
      // Remove leading slash if present
      let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      
      // API returns paths like "service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      // Server serves images from: "https://carwashapp.shoppypie.in/public/storage/service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      const imageUrl = `${STORAGE_BASE_URL}/${cleanPath}`;
      
      // Log for debugging
      
      return imageUrl;
    }
    
    // Use different placeholder images for services vs centers
    if (isService) {
      // Service-specific placeholder images (car wash services)
      const servicePlaceholderImages = [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', // Car wash service 1
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // Car wash service 2
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop', // Car wash service 3
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop', // Car wash service 4
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop', // Car wash service 5
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop', // Car wash service 6
      ];
      const serviceId = centerId ? String(centerId) : String(index || 0);
      const serviceImageIndex = parseInt(serviceId) % servicePlaceholderImages.length;
      return servicePlaceholderImages[serviceImageIndex];
    }
    
    // Center placeholder images
    const placeholderImages = [
      'https://images.unsplash.com/photo-1685216037287-c9c70a919a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBoaWdod2F5JTIwc3Vuc2V0fGVufDF8fHx8MTc2ODgzODYxNXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1753899762863-af6e21e86438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc3BvcnRzJTIwY2FyfGVufDF8fHx8MTc2ODc3Njk4MHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1685216037287-c9c70a919a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBoaWdod2F5JTIwc3Vuc2V0fGVufDF8fHx8MTc2ODgzODYxNXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1753899762863-af6e21e86438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc3BvcnRzJTIwY2FyfGVufDF8fHx8MTc2ODc3Njk4MHww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1685216037287-c9c70a919a3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBoaWdod2F5JTIwc3Vuc2V0fGVufDF8fHx8MTc2ODgzODYxNXww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1753899762863-af6e21e86438?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibHVlJTIwc3BvcnRzJTIwY2FyfGVufDF8fHx8MTc2ODc3Njk4MHww&ixlib=rb-4.1.0&q=80&w=1080',
    ];
    
    // Use center ID if available, otherwise use index
    const id = centerId ? String(centerId) : String(index || 0);
    const imageIndex = parseInt(id) % placeholderImages.length;
    return placeholderImages[imageIndex];
  };

  const formatPrice = (price: string | number | null | undefined, offerPrice: string | number | null | undefined) => {
    const priceNum = parseFloat(String(price || 0));
    const offerNum = offerPrice ? parseFloat(String(offerPrice)) : null;
    
    if (offerNum && offerNum < priceNum) {
      return {
        original: priceNum,
        discounted: offerNum,
        hasOffer: true,
      };
    }
    
    return {
      original: priceNum,
      discounted: null,
      hasOffer: false,
    };
  };

  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(12, Math.min(insets.bottom || 0, 20));

  return (
    <SafeAreaView style={[styles.container,{backgroundColor: theme.background}]} edges={platformEdges as any}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Book a wash</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Location Input */}
        <View style={[styles.locationContainer, { backgroundColor: theme.card, borderColor: BLUE_COLOR + '30', borderWidth: 1.5 }]}> 
          <View style={styles.searchInputContainer}>
            <Ionicons name="location" size={18} color={BLUE_COLOR} style={styles.searchInputIcon} />
            <TextInput
              ref={textInputRef}
              style={[styles.searchInput, { color: '#000000' }]}
              placeholder="Enter location (city or area)"
              placeholderTextColor="#666666"
              value={searchText}
              onChangeText={setSearchText}
              editable={true}
              keyboardType="default"
              returnKeyType="done"
              autoCorrect={false}
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

          {/* Service Type Tabs - One Line */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.serviceTabsScrollView}
            contentContainerStyle={styles.serviceTabsRow}
          >
            {[
              { label: 'All', value: 'all' },
              { label: 'Car Exterior', value: 'Car Exterior' },
              { label: 'Interior Cleaning', value: 'Interior Cleaning' },
              { label: 'Full Valet', value: 'Full Valet' },
            ].map(option => {
              const isActive = selectedServiceTab === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.serviceTab,
                    { 
                      backgroundColor: isActive ? BLUE_COLOR : theme.chip,
                      borderColor: isActive ? BLUE_COLOR : BLUE_COLOR + '30',
                    },
                  ]}
                  onPress={() => setSelectedServiceTab(option.value)}
                >
                  <Text
                    style={[
                      styles.serviceTabText,
                      { color: isActive ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
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
              // Use starting_price from API if available, otherwise calculate from services
              const priceValue = center.starting_price 
                ? center.starting_price.toString() 
                : getMinPrice(center);
              
              // Use image from API response - prioritize center image
              const centerImagePath = center.image || null;
              const imageUrl = getImageUrl(centerImagePath, center.id || center.service_centre_id, index);
              
              // Use distance_miles from API response
              const distanceMiles = center.distance_miles;
              const distanceDisplay = distanceMiles !== undefined && distanceMiles !== null
                ? `${parseFloat(distanceMiles.toString()).toFixed(2)} miles`
                : (center.distance_km !== undefined && center.distance_km !== null
                    ? `${(parseFloat(center.distance_km.toString()) * 0.621371).toFixed(2)} miles`
                    : 'N/A miles');
              
              // Use availability_text from API response
              const nextAvailability = center.availability_text || 'N/A';
              
              return (
                <TouchableOpacity 
                  key={center.id || index} 
                  style={[styles.centerCard, { backgroundColor: theme.card }, index === filteredCenters.length - 1 && styles.lastCenterCard]}
                  onPress={() => handleCenterClick(center)}
                  activeOpacity={0.7}
                >
                  {/* Center Image */}
                  <View style={styles.centerImageContainer}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.centerImage}
                      resizeMode="cover"
                      onError={(error) => {
                      }}
                      onLoad={() => {
                      }}
                    />
                  </View>
                  
                  <View style={styles.centerCardBody}>
                    {/* Center Name - Bolder and Blue */}
                    <Text style={[styles.centerCardName, { color: BLUE_COLOR }]} numberOfLines={1}>
                      {center.name || center.service_center_name || 'Service Center'}
                    </Text>
                    
                    {/* Address */}
                    <Text style={[styles.centerCardAddress, { color: '#666666' }]} numberOfLines={2}>
                      {center.address || center.location || 'Address not available'}
                    </Text>
                    
                    {/* Details Row - Two Lines */}
                    <View style={styles.centerCardDetails}>
                      {/* First Row: Starting Price and Distance */}
                      <View style={styles.centerCardDetailRow}>
                        {/* Starting Price */}
                        {priceValue && (
                          <View style={styles.centerCardDetailItem}>
                            <View style={styles.centerCardIconContainer}>
                              <Ionicons name="pricetag" size={14} color={BLUE_COLOR} />
                            </View>
                            <Text style={[styles.centerCardDetailLabel, { color: '#666666' }]}>from:</Text>
                            <Text style={[styles.centerCardDetailText, styles.centerCardPriceText, { color: '#000000' }]}>
                              £{parseFloat(priceValue).toFixed(2)}
                            </Text>
                          </View>
                        )}
                        
                        {/* Distance */}
                        <View style={styles.centerCardDetailItem}>
                          <View style={styles.centerCardIconContainer}>
                            <Ionicons name="location" size={14} color={BLUE_COLOR} />
                          </View>
                          <Text style={[styles.centerCardDetailLabel, { color: '#666666' }]}>Distance:</Text>
                          <Text style={[styles.centerCardDetailText, { color: '#000000' }]}>
                            {distanceDisplay}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Second Row: Next Availability */}
                      <View style={styles.centerCardDetailRow}>
                        <View style={styles.centerCardDetailItem}>
                          <View style={styles.centerCardIconContainer}>
                            <Ionicons name="time-outline" size={14} color={BLUE_COLOR} />
                          </View>
                          <Text style={[styles.centerCardDetailLabel, { color: '#666666' }]}>Availability:</Text>
                          <Text style={[styles.centerCardDetailText, { color: '#000000' }]}>
                            {nextAvailability}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Instant Booking info removed as requested */}
      </ScrollView>

      {/* Search Button */}
      <View style={[styles.bottomContainer, { paddingBottom: bottomPadding, backgroundColor: theme.card, borderTopColor: BLUE_COLOR + '30' }]}> 
        <TouchableOpacity style={[styles.confirmButton,{backgroundColor: BLUE_COLOR}]} onPress={handleSearch}>
          <Text style={[styles.confirmButtonText,{color: '#FFFFFF'}]}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Services Modal - Bottom Center */}
      <Modal
        visible={showServicesSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServicesSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowServicesSheet(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Ionicons name="car" size={20} color={BLUE_COLOR} />
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {selectedCenterForSheet?.name || 'Service Center'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowServicesSheet(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Services List */}
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {loadingServices ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color={BLUE_COLOR} />
                  <Text style={[styles.modalLoadingText, { color: theme.textSecondary }]}>
                    Loading services...
                  </Text>
                </View>
              ) : centerServices.length === 0 ? (
                <View style={styles.modalEmptyContainer}>
                  <Ionicons name="construct-outline" size={40} color={theme.textSecondary} />
                  <Text style={[styles.modalEmptyText, { color: theme.textSecondary }]}>
                    No services available
                  </Text>
                </View>
              ) : (
                centerServices.map((service, index) => {
                  const priceInfo = formatPrice(service.price, service.offer_price);
                  const imageUrl = getImageUrl(service.image, service.id, index, true); // true = isService
                  
                  return (
                    <TouchableOpacity
                      key={service.id || index}
                      style={[styles.serviceModalItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleServiceClick(service)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceModalImageContainer}>
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.serviceModalImage}
                          resizeMode="contain"
                          onError={(error) => {
                          }}
                          onLoad={() => {
                          }}
                        />
                      </View>
                      <View style={styles.serviceModalInfo}>
                        <View style={styles.serviceModalHeader}>
                          <Text style={[styles.serviceModalName, { color: theme.textPrimary }]} numberOfLines={1}>
                            {service.name}
                          </Text>
                          {priceInfo.hasOffer && (
                            <View style={[styles.bestDealBadgeSmall, { backgroundColor: '#10B981' }]}>
                              <Text style={styles.bestDealTextSmall}>Best Deal</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.serviceModalPriceRow}>
                          {priceInfo.hasOffer && priceInfo.discounted ? (
                            <>
                              <Text style={[styles.serviceModalOriginalPrice, { color: theme.textSecondary }]}>
                                £{priceInfo.original.toFixed(2)}
                              </Text>
                              <Text style={[styles.serviceModalPrice, { color: '#047857' }]}>
                                £{priceInfo.discounted.toFixed(2)}
                              </Text>
                            </>
                          ) : (
                            <Text style={[styles.serviceModalPrice, { color: theme.textPrimary }]}>
                              £{priceInfo.original.toFixed(2)}
                            </Text>
                          )}
                        </View>
                        {service.description && (
                          <Text style={[styles.serviceModalDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                            {service.description}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
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
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold)
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 20,
    marginTop: 8,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15, // font-size: 15px, font-weight: 400 (Regular) for placeholder
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    minHeight: 40,
    lineHeight: 20,
  },
  centersList: {
    marginBottom: 20,
    marginTop: 8,
  },
  serviceTabsScrollView: {
    marginBottom: 16,
  },
  serviceTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16, // Add padding for last item
  },
  serviceTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0, // Prevent tabs from shrinking
  },
  serviceTabText: {
    fontSize: 15, // font-size: 15px, font-weight: 500 (Medium)
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22, // font-size: 22px, font-weight: 700 (Bold)
    fontWeight: '700',
    marginBottom: Platform.select({ ios: 20, android: 14 }),
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.4,
  },
  centerCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lastCenterCard: {
    marginBottom: 0,
  },
  centerImageContainer: {
    width: '100%',
    height: 140, // Reduced from 180
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
  },
  centerCardBody: {
    padding: 12, // Slightly increased for better spacing
    paddingTop: 10,
    paddingBottom: 10,
  },
  centerCardName: {
    fontSize: 18, // Slightly larger for better emphasis
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_BOLD,
    color: BLUE_COLOR, // Blue color for center name
    marginBottom: 3, // Reduced from 4
    letterSpacing: -0.2,
  },
  centerCardAddress: {
    fontSize: 14, // font-size: 14px, font-weight: 400 (Regular)
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    marginBottom: 6, // Reduced from 8
    lineHeight: 18,
  },
  centerCardDetails: {
    gap: 5, // Reduced from 6
  },
  centerCardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Space between items in the same row
  },
  centerCardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Reduced from 8
    flex: 1, // Allow items to share space in the row
  },
  centerCardIconContainer: {
    width: 18, // Reduced from 20
    height: 18, // Reduced from 20
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCardDetailLabel: {
    fontSize: 12, // Slightly reduced for more compact layout
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
  },
  centerCardDetailText: {
    fontSize: 13, // Slightly reduced for more compact layout
    fontFamily: FONTS.INTER_MEDIUM,
    fontWeight: '500',
  },
  centerCardPriceText: {
    fontSize: 16, // Increased from 13
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600', // Bolder
  },
  centerCardAvailabilityText: {
    fontSize: 16, // Increased from 13
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600', // Bolder
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
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold)
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Center name
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    marginLeft: 8,
    flex: 1,
  },
  modalScrollView: {
    maxHeight: Dimensions.get('window').height * 0.5,
  },
  serviceModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  serviceModalImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceModalImage: {
    width: '100%',
    height: '100%',
  },
  serviceModalInfo: {
    flex: 1,
  },
  serviceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  serviceModalName: {
    fontSize: 17, // font-size: 17px, font-weight: 600 (Semibold) - Service name
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    flex: 1,
  },
  bestDealBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bestDealTextSmall: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  serviceModalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  serviceModalOriginalPrice: {
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Original price (strikethrough)
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  serviceModalPrice: {
    fontSize: 16, // Increased font size for offered price
    fontWeight: '700', // Increased font weight (Bold)
    fontFamily: FONTS.INTER_BOLD,
  },
  serviceModalDescription: {
    fontSize: 13, // font-size: 13px, font-weight: 400 (Regular) - Description
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    lineHeight: 18,
  },
  modalLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  modalLoadingText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
  },
  modalEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    marginTop: 12,
  },
});

export default BookCarWashScreen;