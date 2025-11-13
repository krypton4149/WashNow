import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

  const faqs = useMemo(
    () => [
      {
        id: 'faq-1',
        question: 'How do I book a car wash?',
        answer:
          'You can accept new requests from the Requests tab. Customers can also schedule directly and you will receive a notification instantly.',
      },
      {
        id: 'faq-2',
        question: 'Can I cancel my booking?',
        answer:
          'Yes, go to the booking details screen and choose Cancel Booking. Please provide a quick note so the customer is informed.',
      },
      {
        id: 'faq-3',
        question: 'What payment methods are accepted?',
        answer:
          'WashNow supports card payments, Apple Pay, and Google Pay. You can enable cash payments from the Payments settings page.',
      },
      {
        id: 'faq-4',
        question: 'How do I track my service status?',
        answer:
          'Service status is shown on the Requests and Activity tabs. Updates are sent automatically as you progress through each step.',
      },
    ],
    []
  );

  const handleToggleQuestion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedQuestion((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    fontSize: 20,
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
    padding: 24,
    paddingTop: 16,
    paddingBottom: 50, // Increased for all screen sizes (5.4", 6.1", 6.4", 6.7", etc.)
    gap: 20,
  },
  heroCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: 20,
  },
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 18,
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
});

export default OwnerSupportScreen;


