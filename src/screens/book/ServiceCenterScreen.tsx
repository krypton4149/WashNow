import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';
import authService from '../../services/authService';
import { API_URL, STORAGE_BASE_URL } from '../../config/env';

const BLUE_COLOR = '#0358a8';
const PLACEHOLDER_IMAGE = require('../../assets/images/Centre.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = (SCREEN_WIDTH - (CARD_MARGIN * 3)) / 2; // 2 columns with margins

interface Props {
  onBack?: () => void;
  onServiceSelect?: (service: any, center: any) => void;
  center: any;
}

const ServiceCenterScreen: React.FC<Props> = ({ onBack, onServiceSelect, center }) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imageLoaded, setImageLoaded] = useState<{ [key: string]: boolean }>({});
  const [selectedService, setSelectedService] = useState<any>(null);
  const [centerDetails, setCenterDetails] = useState<any>(null);
  const { isDarkMode, colors } = useTheme();
  const insets = useSafeAreaInsets();

  const theme = {
    background: colors.background,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    border: colors.border,
    card: colors.card,
    surface: colors.surface,
    accent: colors.button,
  };

  useEffect(() => {
    loadCenterDetails();
    // Check if a service was pre-selected from the bottom sheet
    if (center?.selectedService) {
      setSelectedService(center.selectedService);
    }
  }, [center]);

  const loadCenterDetails = async () => {
    try {
      // Use passed center data immediately (no loading state for initial render)
      if (center?.services_offered && center.services_offered.length > 0) {
        setCenterDetails(center);
        const sortedServices = (center.services_offered || []).sort((a: any, b: any) => 
          (a.display_order || 0) - (b.display_order || 0)
        );
        setServices(sortedServices);
        setLoading(false);
      } else {
        setLoading(true);
      }
      
      // Fetch fresh data in background (don't force refresh - use cache first)
      const result = await authService.getServiceCenters(false); // Use cache first for faster response
      
      if (result.success && result.serviceCenters) {
        // Find the selected center by ID
        const centerId = center?.id || center?.service_centre_id;
        const foundCenter = result.serviceCenters.find((c: any) => 
          String(c.id) === String(centerId)
        );
        
        if (foundCenter) {
          setCenterDetails(foundCenter);
          // Sort services by display_order
          const sortedServices = (foundCenter.services_offered || []).sort((a: any, b: any) => 
            (a.display_order || 0) - (b.display_order || 0)
          );
          setServices(sortedServices);
          // Update load time to force image refresh
          setLastLoadTime(Date.now());
        } else if (!center?.services_offered || center.services_offered.length === 0) {
          // Only use fallback if we don't have initial data
          setCenterDetails(center);
          setServices(center.services_offered || []);
        }
      } else if (!center?.services_offered || center.services_offered.length === 0) {
        // Only use fallback if we don't have initial data
        setCenterDetails(center);
        setServices(center.services_offered || []);
      }
    } catch (error) {
      console.error('Error loading center details:', error);
      // Fallback to center data passed as prop
      if (!centerDetails) {
        setCenterDetails(center);
        setServices(center.services_offered || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // Track last load time to ensure images refresh on data reload
  const [lastLoadTime, setLastLoadTime] = useState<number>(Date.now());

  const getImageUrl = (imagePath: string | null | undefined, serviceId?: string | number, index?: number, updatedAt?: string | null): string => {
    if (imagePath) {
      // If image path is already a full URL, return it with cache busting
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        const separator = imagePath.includes('?') ? '&' : '?';
        // Use updated_at if available, otherwise use lastLoadTime for consistency
        const cacheBuster = updatedAt ? `t=${new Date(updatedAt).getTime()}` : `t=${lastLoadTime}`;
        return `${imagePath}${separator}${cacheBuster}`;
      }
      
      // Remove leading slash if present
      let cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
      
      // API returns paths like "service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      // Server serves images from: "https://carwashapp.shoppypie.in/public/storage/service_types/01KEBNEJX30YRC1T1QE0K58JGX.jpg"
      const imageUrl = `${STORAGE_BASE_URL}/${cleanPath}`;
      
      // Add cache busting query parameter using updated_at timestamp or lastLoadTime
      // This ensures images are reloaded when updated on the server or when data is refreshed
      const separator = imageUrl.includes('?') ? '&' : '?';
      const cacheBuster = updatedAt ? `t=${new Date(updatedAt).getTime()}` : `t=${lastLoadTime}`;
      return `${imageUrl}${separator}${cacheBuster}`;
    }
    
    // Use different placeholder images for services based on ID or index
    const servicePlaceholderImages = [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', // Car wash service 1
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', // Car wash service 2
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop', // Car wash service 3
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop', // Car wash service 4
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop', // Car wash service 5
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop', // Car wash service 6
    ];
    
    const id = serviceId ? String(serviceId) : String(index || 0);
    const imageIndex = parseInt(id) % servicePlaceholderImages.length;
    return servicePlaceholderImages[imageIndex];
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

  const handleServiceSelect = (service: any) => {
    // Only select the service, don't navigate yet
    setSelectedService(service);
  };

  const renderServiceCard = (service: any, index: number) => {
    const isSelected = selectedService?.id === service.id;
    const priceInfo = formatPrice(service.price, service.offer_price);
    // Use updated_at from centerDetails or center for cache busting
    const updatedAt = centerDetails?.updated_at || center?.updated_at || null;
    const imageUrl = getImageUrl(service.image, service.id, index, updatedAt);

    return (
      <TouchableOpacity
        key={service.id || index}
        style={[
          styles.serviceCard,
          {
            backgroundColor: theme.card,
            borderColor: isSelected ? BLUE_COLOR : '#E5E7EB',
            borderWidth: isSelected ? 2.5 : 1,
          },
        ]}
        onPress={() => {
          // Only select the service, don't navigate yet
          setSelectedService(service);
        }}
        activeOpacity={0.7}
      >
        {/* Selected Checkmark */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: BLUE_COLOR }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}

        {/* Service Image */}
        <View style={styles.imageContainer}>
          {/* Placeholder Image - Always shown first */}
          <Image
            source={PLACEHOLDER_IMAGE}
            style={[
              styles.serviceImage,
              imageLoaded[`service-${service.id}`] && !imageErrors[`service-${service.id}`] && styles.hiddenImage
            ]}
            resizeMode="cover"
          />
          {/* Server Image - Shown when loaded */}
          {!imageErrors[`service-${service.id}`] && (
            <Image
              key={`service-${service.id}-${updatedAt || lastLoadTime}`}
              source={{ uri: imageUrl, cache: 'default' }}
              style={[
                styles.serviceImage,
                styles.overlayImage,
                !imageLoaded[`service-${service.id}`] && styles.hiddenImage
              ]}
              resizeMode="cover"
              onError={(error) => {
                setImageErrors(prev => ({ ...prev, [`service-${service.id}`]: true }));
                setImageLoaded(prev => ({ ...prev, [`service-${service.id}`]: false }));
              }}
              onLoad={() => {
                setImageLoaded(prev => ({ ...prev, [`service-${service.id}`]: true }));
                setImageErrors(prev => ({ ...prev, [`service-${service.id}`]: false }));
              }}
            />
          )}
          {priceInfo.hasOffer && (
            <View style={[styles.bestDealBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.bestDealText}>Best Deal</Text>
            </View>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <Text style={[styles.serviceName, { color: BLUE_COLOR }]} numberOfLines={2}>
            {service.name}
          </Text>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            {priceInfo.hasOffer ? (
              <>
                <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>
                  £{priceInfo.original.toFixed(2)}
                </Text>
                <Text style={[styles.discountedPrice, { color: '#047857' }]}>
                  £{priceInfo.discounted.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={[styles.discountedPrice, { color: theme.textPrimary }]}>
                £{priceInfo.original.toFixed(2)}
              </Text>
            )}
          </View>

          {/* Description */}
          {service.description && (
            <Text style={[styles.serviceDescription, { color: theme.textSecondary }]} numberOfLines={3}>
              {service.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Ionicons name="car" size={20} color={BLUE_COLOR} style={styles.carIcon} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {centerDetails?.name || center?.name || 'Service Center'}
            </Text>
          </View>
          {centerDetails?.address && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {centerDetails.address}
            </Text>
          )}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Our Services Heading */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Our Services</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BLUE_COLOR} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading services...
            </Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No services available at this center
            </Text>
          </View>
        ) : (
          <View style={styles.servicesGrid}>
            {services.map((service, index) => renderServiceCard(service, index))}
          </View>
        )}
      </ScrollView>

      {/* Selected Service Summary and Continue Button */}
      {selectedService && (
        <View style={[
          styles.bottomSection, 
          { 
            backgroundColor: theme.surface, 
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom || 0, 20),
          }
        ]}>
          <View style={styles.selectedServiceInfo}>
            <View style={styles.selectedServiceLeft}>
              <Text style={[styles.selectedServiceLabel, { color: theme.textSecondary }]}>Selected Service</Text>
              <Text style={[styles.selectedServiceName, { color: BLUE_COLOR }]}>{selectedService.name}</Text>
            </View>
            <View style={styles.selectedServiceRight}>
              <Text style={[styles.selectedServicePrice, { color: theme.textPrimary }]}>
                £{formatPrice(selectedService.price, selectedService.offer_price).discounted?.toFixed(2) || formatPrice(selectedService.price, selectedService.offer_price).original.toFixed(2)}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: BLUE_COLOR }]}
            onPress={() => {
              if (selectedService && onServiceSelect) {
                // Navigate to next screen (schedule booking) with selected service
                onServiceSelect(selectedService, centerDetails || center);
              } else {
                // Show alert if no service is selected
                Alert.alert('Please Select a Service', 'Please select a service before continuing to booking.');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue to Booking</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carIcon: {
    marginRight: 6,
  },
  title: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    ...TEXT_STYLES.screenTitle,
    letterSpacing: -0.4,
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  serviceCard: {
    width: CARD_WIDTH,
    borderRadius: 16, // Increased for more modern look
    marginBottom: CARD_MARGIN,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light gray border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Reduced for subtler shadow
    shadowRadius: 6,
    elevation: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28, // Slightly smaller for better proportions
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  imageContainer: {
    width: '100%',
    height: 100,
    position: 'relative',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hiddenImage: {
    opacity: 0,
  },
  bestDealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  bestDealText: {
    ...TEXT_STYLES.caption,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#FFFFFF',
  },
  serviceInfo: {
    padding: 14,
  },
  serviceName: {
    ...TEXT_STYLES.cardTitleSemiBold,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  originalPrice: {
    ...TEXT_STYLES.bodySecondaryLarge,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    ...TEXT_STYLES.sectionHeading,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  serviceDescription: {
    ...TEXT_STYLES.bodySecondaryLarge,
    marginTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.select({ ios: 20, android: 20 }),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedServiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedServiceLeft: {
    flex: 1,
  },
  selectedServiceLabel: {
    ...TEXT_STYLES.bodySecondaryLarge,
    marginBottom: 4,
  },
  selectedServiceName: {
    ...TEXT_STYLES.cardTitleSemiBold,
  },
  selectedServiceRight: {
    alignItems: 'flex-end',
  },
  selectedServicePrice: {
    ...TEXT_STYLES.sectionHeading,
    fontSize: FONT_SIZES.SECTION_HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
  },
  continueButton: {
    borderRadius: Platform.select({ ios: 30, android: 28 }),
    paddingVertical: Platform.select({ ios: 16, android: 14 }),
    alignItems: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default ServiceCenterScreen;
