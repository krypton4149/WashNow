import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { platformEdges } from '../../utils/responsive';
import authService from '../../services/authService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface OwnerSupportScreenProps {
  onBack?: () => void;
  onStartChat?: () => void;
  onContactEmail?: () => void;
}

const OwnerSupportScreen: React.FC<OwnerSupportScreenProps> = ({
  onBack,
  onStartChat,
  onContactEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'contact'>('faqs');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState<boolean>(true);
  const [faqError, setFaqError] = useState<string | null>(null);

  // Clear FAQs when switching away from FAQs tab
  useEffect(() => {
    if (activeTab !== 'faqs') {
      setFaqs([]);
      setFaqError(null);
      setIsLoadingFaqs(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;

    const loadFaqs = async () => {
      if (activeTab !== 'faqs') {
        return;
      }

      setIsLoadingFaqs(true);
      setFaqError(null);

      try {
        console.log('[OwnerSupportScreen] Loading FAQs...');
        const result = await authService.getFaqList();
        
        if (!isMounted) return;

        console.log('[OwnerSupportScreen] FAQ result:', JSON.stringify(result, null, 2));

        if (result.success && result.faqs && Array.isArray(result.faqs) && result.faqs.length > 0) {
          // Map API response to expected format
          const mappedFaqs = result.faqs.map((faq: any, index: number) => ({
            id: faq.id?.toString() || faq.faq_id?.toString() || `faq-${index}`,
            question: faq.question || faq.title || 'Question',
            answer: faq.answer || faq.description || 'Answer not available',
          }));
          console.log('[OwnerSupportScreen] Mapped FAQs:', mappedFaqs.length, 'items', mappedFaqs);
          setFaqs(mappedFaqs);
        } else {
          console.log('[OwnerSupportScreen] FAQ error or empty:', result.error, 'faqs:', result.faqs);
          setFaqError(result.error || 'No FAQs available');
          setFaqs([]);
        }
      } catch (error: any) {
        console.error('[OwnerSupportScreen] FAQ load error:', error);
        if (!isMounted) return;
        
        // Handle network errors specifically
        let errorMessage = 'Failed to load FAQs';
        if (error.message && (error.message.includes('Network Error') || error.message.includes('timeout'))) {
          errorMessage = 'Network Error - Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setFaqError(errorMessage);
        setFaqs([]);
      } finally {
        if (isMounted) {
          setIsLoadingFaqs(false);
        }
      }
    };

    loadFaqs();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleToggleQuestion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedQuestion((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={platformEdges as any}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={!onBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={onBack ? '#111827' : '#D1D5DB'}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'faqs' && styles.tabButtonActive]}
          onPress={() => setActiveTab('faqs')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'faqs' && styles.tabTextActive]}>FAQs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'contact' && styles.tabButtonActive]}
          onPress={() => setActiveTab('contact')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Contact</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=60' }}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {activeTab === 'faqs' ? 'How can we help you?' : 'Need to talk to us?'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {activeTab === 'faqs'
                ? 'Find answers to common questions'
                : 'Reach our support team any time'}
            </Text>
          </View>
        </ImageBackground>

        {activeTab === 'faqs' ? (
          <>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {isLoadingFaqs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#111827" />
                <Text style={styles.loadingText}>Loading FAQs...</Text>
              </View>
            ) : faqError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
                <Text style={styles.errorText}>{faqError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setFaqError(null);
                    setIsLoadingFaqs(true);
                    authService.getFaqList().then((result) => {
                      if (result.success && result.faqs) {
                        const mappedFaqs = result.faqs.map((faq: any, index: number) => ({
                          id: faq.id?.toString() || faq.faq_id?.toString() || `faq-${index}`,
                          question: faq.question || faq.title || 'Question',
                          answer: faq.answer || faq.description || 'Answer not available',
                        }));
                        setFaqs(mappedFaqs);
                        setFaqError(null);
                      } else {
                        setFaqError(result.error || 'Failed to load FAQs');
                      }
                      setIsLoadingFaqs(false);
                    }).catch((error: any) => {
                      setFaqError(error.message || 'Failed to load FAQs');
                      setIsLoadingFaqs(false);
                    });
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : faqs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>No FAQs available</Text>
              </View>
            ) : (
              <View style={styles.faqList}>
                {faqs.map((faq) => {
                  const expanded = faq.id === expandedQuestion;
                  return (
                    <View key={faq.id} style={styles.faqItem}>
                      <TouchableOpacity
                        style={styles.faqHeader}
                        onPress={() => handleToggleQuestion(faq.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color="#6B7280"
                        />
                      </TouchableOpacity>
                      {expanded && (
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Get In Touch</Text>
            <Text style={styles.contactDescription}>
              Our support team is available 24/7. Choose the option that works best for you.
            </Text>

            <TouchableOpacity
              style={styles.contactOption}
              onPress={onStartChat}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#111827' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Chat with Support</Text>
                <Text style={styles.contactSubtitle}>Instant replies within a few minutes</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactOption}
              onPress={onContactEmail}
              activeOpacity={0.8}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactTitle}>Email Us</Text>
                <Text style={styles.contactSubtitle}>support@washnow.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportSubtitle}>Our support team is available 24/7</Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={onStartChat}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>Chat with Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.select({ ios: 26, android: 24 }),
    paddingVertical: Platform.select({ ios: 14, android: 12 }),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Platform.select({ ios: 21, android: 20 }),
    fontWeight: '700',
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.select({ ios: 26, android: 24 }),
    paddingTop: Platform.select({ ios: 16, android: 14 }),
    paddingBottom: Platform.select({ 
      ios: 80, // Extra padding for iOS devices (5.4", 6.1", 6.3", 6.4", 6.5", 6.7")
      android: 70 // Extra padding for Android devices (5.4", 5.5", 6.1", 6.3", 6.4", 6.5", 6.7")
    }),
    gap: Platform.select({ ios: 22, android: 20 }),
  },
  heroCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 20,
  } as any,
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
  },
  heroContent: {
    padding: 20,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  faqList: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 22, android: 20 }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: Platform.select({ ios: 0.05, android: 0.04 }),
    shadowRadius: Platform.select({ ios: 14, android: 12 }),
    shadowOffset: { width: 0, height: Platform.select({ ios: 5, android: 4 }) || 4 },
    elevation: Platform.select({ ios: 0, android: 2 }),
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingRight: 16,
  },
  faqAnswer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 26, android: 24 }),
    padding: Platform.select({ ios: 22, android: 20 }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: Platform.select({ ios: 0.06, android: 0.05 }),
    shadowRadius: Platform.select({ ios: 16, android: 14 }),
    shadowOffset: { width: 0, height: Platform.select({ ios: 7, android: 6 }) || 6 },
    elevation: Platform.select({ ios: 0, android: 3 }),
    gap: Platform.select({ ios: 20, android: 18 }) || 18,
  },
  contactDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  contactSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 12,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 22, android: 20 }),
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 22, android: 20 }),
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderRadius: 20,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 22, android: 20 }),
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default OwnerSupportScreen;


