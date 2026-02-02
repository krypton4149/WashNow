import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import axios from 'axios';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const SUPPORT_EMAIL = 'support@washnow.com';
const CONTACT_POINTS = [
  '24/7 support team available',
  'Quick response within 24 hours',
  'Email or chat – choose what works for you',
  'Dedicated help for bookings and payments',
];

interface Props {
  onBack?: () => void;
  onContactSupport?: () => void;
}

interface FAQ {
  id: string | number;
  question: string;
  answer: string;
  isExpanded: boolean;
}

interface APIFAQ {
  id?: string | number;
  question?: string;
  answer?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

const HelpSupportScreen: React.FC<Props> = ({ onBack, onContactSupport }) => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'contact'>('faqs');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await authService.getToken();
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        'https://carwashapp.shoppypie.in/api/v1/visitor/faqlist',
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('FAQ API Response:', JSON.stringify(response.data, null, 2));

      // Handle different response structures
      let faqData: APIFAQ[] = [];
      if (response.data) {
        // Primary structure: response.data.data.faqslist (based on actual API response)
        if (response.data.data && response.data.data.faqslist && Array.isArray(response.data.data.faqslist)) {
          faqData = response.data.data.faqslist;
          console.log('Found FAQs in data.faqslist:', faqData.length);
        }
        // Fallback to other possible structures
        else if (response.data.data && Array.isArray(response.data.data)) {
          faqData = response.data.data;
          console.log('Found FAQs in data array:', faqData.length);
        } else if (Array.isArray(response.data)) {
          faqData = response.data;
          console.log('Found FAQs in root array:', faqData.length);
        } else if (response.data.faqs && Array.isArray(response.data.faqs)) {
          faqData = response.data.faqs;
          console.log('Found FAQs in faqs array:', faqData.length);
        } else {
          console.log('No FAQs found in response structure');
        }
      }

      // Transform API data to FAQ format
      const transformedFAQs: FAQ[] = faqData.map((item: APIFAQ, index: number) => ({
        id: item.id || index + 1,
        question: item.question || item.title || `Question ${index + 1}`,
        answer: item.answer || item.description || 'No answer available.',
        isExpanded: false,
      }));

      console.log('Transformed FAQs:', transformedFAQs.length);
      setFaqs(transformedFAQs);
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again later.');
      // Optionally show fallback FAQs
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFAQ = (id: string | number) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, isExpanded: !faq.isExpanded } : faq
    ));
  };

  const renderFAQs = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BLUE_COLOR} />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFAQs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (faqs.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No FAQs available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFAQs}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.faqsContainer}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1694878981905-b742a32f8121?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBpbnRlcmZhY2UlMjBtb2NrdXB8ZW58MXx8fHwxNzYyMzk4OTM3fDA&ixlib=rb-4.1.0&q=80&w=1080'
            }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
            {/* Decorative shapes */}
            <View style={styles.decorativeShape1} />
            <View style={styles.decorativeShape2} />
            <View style={styles.decorativeShape3} />
            
            {/* Central overlay */}
            <View style={styles.heroContentOverlay}>
              <Text style={styles.heroTitle}>How can we help you?</Text>
              <Text style={styles.heroSubtitle}>Find answers to common questions</Text>
            </View>
          </ImageBackground>
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            style={styles.faqCard}
            onPress={() => toggleFAQ(faq.id)}
            activeOpacity={0.7}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Ionicons
                name={faq.isExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={BLUE_COLOR}
              />
            </View>
            {faq.isExpanded && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {});
  };

  const renderContact = () => (
    <View style={styles.contactContainer}>
      <View style={styles.contactCard}>
        <View style={styles.contactIconWrapper}>
          <Ionicons name="headset" size={28} color={BLUE_COLOR} />
        </View>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <Text style={styles.contactSubtitle}>Our support team is available 24/7. Get in touch and we’ll get back to you quickly.</Text>

        {/* Contact points */}
        <View style={styles.contactPointsList}>
          {CONTACT_POINTS.map((point, index) => (
            <View key={index} style={styles.contactPointRow}>
              <View style={styles.contactPointBullet} />
              <Text style={styles.contactPointText}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Contact email */}
        <TouchableOpacity
          style={styles.emailRow}
          onPress={handleEmailPress}
          activeOpacity={0.7}
        >
          <Ionicons name="mail-outline" size={22} color={BLUE_COLOR} />
          <Text style={styles.emailLabel}>Email us</Text>
          <Text style={styles.emailValue}>{SUPPORT_EMAIL}</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={onContactSupport}
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Chat with Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={Platform.select({ ios: 24, android: 22 })} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faqs' && styles.activeTab]}
          onPress={() => setActiveTab('faqs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.activeTabText]}>
            FAQs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.activeTab]}
          onPress={() => setActiveTab('contact')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.activeTabText]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'faqs' ? renderFAQs() : renderContact()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    letterSpacing: -0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: BLUE_COLOR,
  },
  tabText: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '500',
    fontFamily: FONTS.INTER_MEDIUM,
    color: '#9CA3AF',
  },
  activeTabText: {
    color: BLUE_COLOR,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  content: {
    flex: 1,
    paddingHorizontal: Platform.select({ ios: 20, android: 16 }),
    paddingTop: 24,
  },
  faqsContainer: {
    flex: 1,
  },
  heroSection: {
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
  },
  decorativeShape1: {
    position: 'absolute',
    top: 20,
    right: 40,
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    transform: [{ rotate: '15deg' }],
  },
  decorativeShape2: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    transform: [{ rotate: '-20deg' }],
  },
  decorativeShape3: {
    position: 'absolute',
    top: 50,
    left: 50,
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ rotate: '45deg' }],
  },
  heroContentOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontWeight: '400',
    fontFamily: FONTS.INTER_REGULAR,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    marginBottom: 18,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  faqAnswerText: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
    lineHeight: 22,
  },
  contactContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  contactIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: FONT_SIZES.HEADING_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  contactPointsList: {
    alignSelf: 'stretch',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  contactPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactPointBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE_COLOR,
    marginRight: 12,
  },
  contactPointText: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 20,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  emailLabel: {
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_SEMIBOLD,
    fontWeight: '600',
    color: '#111827',
  },
  emailValue: {
    flex: 1,
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    fontWeight: '400',
    color: BLUE_COLOR,
  },
  contactButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
    justifyContent: 'center',
    shadowColor: BLUE_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: FONT_SIZES.BODY_MEDIUM,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: BLUE_COLOR,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.BUTTON_MEDIUM,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
  },
});

export default HelpSupportScreen;

