import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';

interface ScheduleForLaterScreenProps {
  onBack: () => void;
  onCenterSelect: (center: any) => void;
  selectedLocation: {
    id: string;
    name: string;
    centersCount: number;
  };
}

interface CarWashCenter {
  id: string;
  name: string;
  rating: number;
  distance: string;
  address: string;
  image: string;
  isAvailable: boolean;
}

const ScheduleForLaterScreen: React.FC<ScheduleForLaterScreenProps> = ({
  onBack,
  onCenterSelect,
  selectedLocation,
}) => {
  const { colors } = useTheme();
  // Start with empty search so ALL centers are visible by default
  const [searchText, setSearchText] = useState('');
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceCenters();
  }, []);

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

  const fetchServiceCenters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.getServiceCenters();
      
      if (result.success && result.serviceCenters && result.serviceCenters.length > 0) {
        // Transform API data to match our interface
        const transformedCenters = result.serviceCenters.map((center: any) => ({
          id: center.id?.toString() || Math.random().toString(),
          name: center.name || center.service_center_name || 'Service Center',
          rating: 4.5, // Default rating since API doesn't provide it
          distance: '0.5 mi', // Default distance
          address: center.address || center.location || 'Address not available',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop', // Default image
          isAvailable: center.status === 'Active',
          email: center.email,
          phone: center.phone,
          weekoff_days: center.weekoff_days,
          clat: center.clat,
          clong: center.clong,
          services_offered: center.services_offered || [], // Preserve services_offered for min price calculation
        }));
        
        console.log('Fetched service centers:', transformedCenters);
        setServiceCenters(transformedCenters);
      } else {
        // Fallback to mock data if API fails or returns empty
        console.log('Using mock data - API failed or empty:', result.error);
        const mockCenters = [
          {
            id: '1',
            name: 'Elite Car Care',
            rating: 4.6,
            distance: '0.7 mi',
            address: 'Madison Ave, Midtown, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'info@elitecar.com',
            phone: '+1 (555) 123-4567',
          },
          {
            id: '2',
            name: 'Pro Shine Detail',
            rating: 4.9,
            distance: '0.9 mi',
            address: 'Upper East Side, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'contact@proshine.com',
            phone: '+1 (555) 234-5678',
          },
          {
            id: '3',
            name: 'Auto Detail Express',
            rating: 4.7,
            distance: '1.3 mi',
            address: '321 5th Avenue, Chelsea, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'service@autodetail.com',
            phone: '+1 (555) 345-6789',
          },
          {
            id: '4',
            name: 'Platinum Car Wash Center',
            rating: 4.5,
            distance: '1.7 mi',
            address: '654 Lexington Ave, Gramercy, New York',
            image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
            isAvailable: true,
            email: 'info@platinumwash.com',
            phone: '+1 (555) 456-7890',
          },
        ];
        setServiceCenters(mockCenters);
      }
    } catch (err) {
      console.error('Error fetching service centers:', err);
      // Use mock data as fallback
      const mockCenters = [
        {
          id: '1',
          name: 'Elite Car Care',
          rating: 4.6,
          distance: '0.7 mi',
          address: 'Madison Ave, Midtown, New York',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
          isAvailable: true,
          email: 'info@elitecar.com',
          phone: '+1 (555) 123-4567',
        },
        {
          id: '2',
          name: 'Pro Shine Detail',
          rating: 4.9,
          distance: '0.9 mi',
          address: 'Upper East Side, New York',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=80&fit=crop',
          isAvailable: true,
          email: 'contact@proshine.com',
          phone: '+1 (555) 234-5678',
        },
      ];
      setServiceCenters(mockCenters);
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = serviceCenters.filter(center => {
    if (!searchText.trim()) return true;
    
    const searchLower = searchText.toLowerCase().trim();
    const nameMatch = center.name?.toLowerCase().includes(searchLower) || false;
    const addressMatch = center.address?.toLowerCase().includes(searchLower) || false;
    const emailMatch = center.email?.toLowerCase().includes(searchLower) || false;
    const phoneMatch = center.phone?.toLowerCase().includes(searchLower) || false;
    
    return nameMatch || addressMatch || emailMatch || phoneMatch;
  });

  const centersCount = filteredCenters.length;

  // Remove this line since we're not using popularLocations anymore
  // const filteredLocations = popularLocations.filter(location =>
  //   location.name.toLowerCase().includes(searchText.toLowerCase())
  // );


  const renderCarWashCenter = (center: any, index: number) => {
    const minPrice = getMinPrice(center);
    return (
      <TouchableOpacity
        key={center.id}
        style={[
          styles.centerCard, 
          { backgroundColor: colors.card },
          index < filteredCenters.length - 1 && styles.centerCardSpacing
        ]}
        onPress={() => onCenterSelect(center)}
        activeOpacity={0.7}
      >
        <View style={[styles.centerLocationIcon, { backgroundColor: BLUE_COLOR + '15' }]}>
          <Ionicons name="location" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} />
        </View>
        <View style={styles.centerInfo}>
          <View style={styles.centerHeader}>
            <Text style={[styles.centerName, { color: colors.text }]} numberOfLines={1}>{center.name || 'Service Center'}</Text>
            {minPrice && (
              <View style={[styles.priceBadge, { backgroundColor: BLUE_COLOR + '10' }]}>
                <Text style={[styles.minPrice, { color: BLUE_COLOR }]}>{minPrice}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.centerAddress, { color: colors.textSecondary }]} numberOfLines={2}>{center.address || 'Address not available'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Math.max(12, Math.min(insets.bottom || 0, 20)) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Schedule for Later</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={Platform.select({ ios: 20, android: 18 })} color={BLUE_COLOR} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Where do you want the car wash?"
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Car Wash Centers */}
        <View style={styles.centersContainer}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {searchText.length > 0 
                  ? `Service Centers matching "${searchText}" (${centersCount})` 
                  : `Available Service Centers (${centersCount})`
                }
              </Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#000000" />
                  <Text style={[styles.loadingText, { color: '#000000' }]}>Loading service centers...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: '#000000' }]}>{error}</Text>
                  <TouchableOpacity style={[styles.retryButton, { backgroundColor: BLUE_COLOR }]} onPress={fetchServiceCenters}>
                    <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredCenters.length > 0 ? (
                <View style={styles.centersListContainer}>
                  <View style={styles.centersList}>
                    {filteredCenters.map((center, index) => renderCarWashCenter(center, index))}
                  </View>
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={[styles.noResultsText, { color: '#000000' }]}>
                    {searchText.length > 0 
                      ? `No service centers found for "${searchText}"` 
                      : 'No service centers available'
                    }
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: '#666666' }]}>
                    {searchText.length > 0 
                      ? 'Try searching with different keywords or check spelling' 
                      : 'Please try again later'
                    }
                  </Text>
                </View>
              )}
              
              {/* Schedule Ahead Info removed as requested */}
            </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  searchContainer: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    marginTop: Platform.select({ ios: 16, android: 12 }),
    marginBottom: Platform.select({ ios: 12, android: 10 }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    paddingHorizontal: Platform.select({ ios: 14, android: 12 }),
    paddingVertical: Platform.select({ ios: 8, android: 6 }),
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: Platform.select({ ios: 44, android: 40 }),
  },
  searchIcon: {
    marginRight: Platform.select({ ios: 10, android: 8 }),
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    paddingVertical: 0,
    marginVertical: 0,
  },
  locationsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '500',
    marginBottom: Platform.select({ ios: 16, android: 14 }),
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.2,
  },
  locationsList: {
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationIconText: {
    fontSize: 18,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'System',
  },
  centersCount: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'System',
  },
  centersContainer: {
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: Platform.select({ ios: 8, android: 6 }),
    paddingBottom: Platform.select({ ios: 24, android: 20 }),
  },
  locationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  centersListContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Platform.select({ ios: 0, android: 0 }),
  },
  centersList: {
    width: '100%',
    maxWidth: Platform.select({ ios: 580, android: '100%' }),
    gap: Platform.select({ ios: 12, android: 10 }),
    alignItems: 'stretch',
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    paddingHorizontal: Platform.select({ ios: 16, android: 14 }),
    borderRadius: Platform.select({ ios: 14, android: 12 }),
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minHeight: Platform.select({ ios: 80, android: 72 }),
  },
  centerCardSpacing: {
    marginBottom: 0,
  },
  centerLocationIcon: {
    width: Platform.select({ ios: 44, android: 40 }),
    height: Platform.select({ ios: 44, android: 40 }),
    borderRadius: Platform.select({ ios: 22, android: 20 }),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Platform.select({ ios: 12, android: 10 }),
    flexShrink: 0,
  },
  centerLocationIconText: {
    fontSize: 16,
    color: '#000000',
  },
  centerInfo: {
    flex: 1,
    minWidth: 0,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Platform.select({ ios: 6, android: 5 }),
    gap: Platform.select({ ios: 8, android: 6 }),
  },
  centerName: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    flex: 1,
    fontFamily: FONTS.INTER_MEDIUM,
    lineHeight: Platform.select({ ios: 22, android: 20 }),
    marginBottom: Platform.select({ ios: 4, android: 3 }),
    flexShrink: 1,
  },
  priceBadge: {
    paddingHorizontal: Platform.select({ ios: 12, android: 10 }),
    paddingVertical: Platform.select({ ios: 5, android: 4 }),
    borderRadius: Platform.select({ ios: 12, android: 10 }),
    flexShrink: 0,
  },
  minPrice: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  centerAddress: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: Platform.select({ ios: 18, android: 16 }),
    marginTop: Platform.select({ ios: 2, android: 1 }),
    flexShrink: 1,
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scheduleIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  scheduleTextContainer: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'System',
  },
      scheduleDescription: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'System',
      },
      loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      loadingText: {
        fontSize: FONT_SIZES.BODY_LARGE,
        color: '#000000',
        marginTop: 12,
        fontFamily: FONTS.INTER_REGULAR,
        fontWeight: '400',
      },
      errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      errorText: {
        fontSize: FONT_SIZES.BODY_LARGE,
        color: '#000000',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: FONTS.INTER_REGULAR,
        fontWeight: '400',
      },
      retryButton: {
        backgroundColor: BLUE_COLOR,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: BLUE_COLOR,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
      retryButtonText: {
        color: '#FFFFFF',
        fontSize: FONT_SIZES.BUTTON_MEDIUM,
        fontWeight: '600',
        fontFamily: FONTS.INTER_SEMIBOLD,
        letterSpacing: 0.5,
      },
      noResultsContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      noResultsText: {
        fontSize: FONT_SIZES.HEADING_SMALL,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 8,
        fontFamily: FONTS.MONTserrat_SEMIBOLD,
      },
      noResultsSubtext: {
        fontSize: FONT_SIZES.BODY_SMALL,
        color: '#666666',
        fontFamily: FONTS.INTER_REGULAR,
        fontWeight: '400',
      },
    });

    export default ScheduleForLaterScreen;
