import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import axios from 'axios';

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
          <ActivityIndicator size="large" color="#000" />
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
                size={20}
                color="#000000"
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

  const renderContact = () => (
    <View style={styles.contactContainer}>
      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Still need help?</Text>
        <Text style={styles.contactSubtitle}>Our support team is available 24/7</Text>
        <TouchableOpacity style={styles.contactButton} onPress={onContactSupport}>
          <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
          <Text style={styles.contactButtonText}>Chat with Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 24 }} />
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  faqAnswerText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  contactContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  contactCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  contactButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpSupportScreen;

