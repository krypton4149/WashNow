import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BackButton from '../../components/ui/BackButton';
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


  const renderCarWashCenter = (center: CarWashCenter, index: number) => (
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
        <Ionicons name="location" size={18} color={BLUE_COLOR} />
      </View>
      <View style={styles.centerInfo}>
        <Text style={[styles.centerName, { color: colors.text }]}>{center.name || 'Service Center'}</Text>
        <Text style={[styles.centerAddress, { color: colors.textSecondary }]}>{center.address || 'Address not available'}</Text>
      </View>
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={platformEdges as any}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: Math.max(12, Math.min(insets.bottom || 0, 20)) }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onBack} />
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>Schedule for Later</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose location and center first</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: BLUE_COLOR + '50' }]}>
            <Ionicons name="search-outline" size={20} color={BLUE_COLOR} style={styles.searchIcon} />
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
                  <ActivityIndicator size="large" color={colors.text} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading service centers...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                  <TouchableOpacity style={[styles.retryButton, { backgroundColor: BLUE_COLOR }]} onPress={fetchServiceCenters}>
                    <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredCenters.length > 0 ? (
                <View style={styles.centersList}>
                  {filteredCenters.map((center, index) => renderCarWashCenter(center, index))}
                </View>
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={[styles.noResultsText, { color: colors.text }]}>
                    {searchText.length > 0 
                      ? `No service centers found for "${searchText}"` 
                      : 'No service centers available'
                    }
                  </Text>
                  <Text style={[styles.noResultsSubtext, { color: colors.textSecondary }]}>
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
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: FONT_SIZES.APP_TITLE_SMALL,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: FONTS.MONTserrat_BOLD,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
  },
  locationsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '700',
    marginBottom: 16,
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    letterSpacing: -0.3,
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
    paddingHorizontal: 20,
  },
  locationSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    fontFamily: 'System',
  },
  centersList: {
    // Container for center cards
  },
  centerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BLUE_COLOR + '40',
    backgroundColor: '#FFFFFF',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  centerCardSpacing: {
    marginBottom: 12,
  },
  centerLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  centerLocationIconText: {
    fontSize: 16,
    color: '#000000',
  },
  centerInfo: {
    flex: 1,
  },
  centerName: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: FONTS.INTER_BOLD,
  },
  centerAddress: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    lineHeight: 18,
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
        color: '#666666',
        marginTop: 12,
        fontFamily: FONTS.INTER_REGULAR,
      },
      errorContainer: {
        alignItems: 'center',
        paddingVertical: 40,
      },
      errorText: {
        fontSize: FONT_SIZES.BODY_LARGE,
        color: '#FF6B6B',
        textAlign: 'center',
        marginBottom: 16,
        fontFamily: FONTS.INTER_REGULAR,
      },
      retryButton: {
        backgroundColor: BLUE_COLOR,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
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
        fontWeight: '700',
        color: '#666666',
        marginBottom: 8,
        fontFamily: FONTS.MONTserrat_SEMIBOLD,
      },
      noResultsSubtext: {
        fontSize: FONT_SIZES.BODY_SMALL,
        color: '#999999',
        fontFamily: FONTS.INTER_REGULAR,
      },
    });

    export default ScheduleForLaterScreen;
