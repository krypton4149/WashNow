import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';

interface OwnerSettingsScreenProps {
  onBack?: () => void;
  onChangeLanguage?: () => void;
  onChangePassword?: () => void;
  initialPushNotificationsEnabled?: boolean;
  initialPromotionalAlertsEnabled?: boolean;
  initialDarkModeEnabled?: boolean;
}

const OwnerSettingsScreen: React.FC<OwnerSettingsScreenProps> = ({
  onBack,
  onChangeLanguage,
  onChangePassword,
  initialPushNotificationsEnabled = true,
  initialPromotionalAlertsEnabled = true,
  initialDarkModeEnabled = false,
}) => {
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(initialPushNotificationsEnabled);
  const [promotionalAlertsEnabled, setPromotionalAlertsEnabled] = useState(initialPromotionalAlertsEnabled);
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const [darkModeEnabled, setDarkModeEnabled] = useState(initialDarkModeEnabled || isDarkMode);

  const dynamicStyles = useMemo(() => ({
    container: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      color: colors.text,
    },
    heroOverlay: {
      backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.68)' : 'rgba(17, 24, 39, 0.45)',
    },
    scrollContent: {
      backgroundColor: colors.background,
    },
    sectionCard: {
      backgroundColor: colors.card,
      shadowColor: isDarkMode ? '#020617' : '#000000',
    },
    sectionLabel: {
      color: colors.text,
    },
    settingTitle: {
      color: colors.text,
    },
    settingSubtitle: {
      color: colors.textSecondary,
    },
    bookingBanner: {
      backgroundColor: colors.button,
    },
  }), [colors, isDarkMode]);

  const handleToggleDarkMode = async (value: boolean) => {
    setDarkModeEnabled(value);
    if (value !== isDarkMode) {
      toggleDarkMode();
    }
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['bottom']}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={!onBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={onBack ? colors.text : colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Settings</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=60' }}
          style={styles.heroCard}
          imageStyle={styles.heroImage}
        >
          <View style={[styles.heroOverlay, dynamicStyles.heroOverlay]} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Preview</Text>
            </View>
            <Text style={styles.heroTitle}>Customize Your Experience</Text>
            <Text style={styles.heroSubtitle}>Manage your preferences</Text>
          </View>
        </ImageBackground>

        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Push Notifications</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Receive booking updates</Text>
            </View>
            <Switch
              value={pushNotificationsEnabled}
              onValueChange={setPushNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#2563EB33' }}
              thumbColor={pushNotificationsEnabled ? '#2563EB' : '#F4F5F7'}
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Promotional Alerts</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Special offers and discounts</Text>
            </View>
            <Switch
              value={promotionalAlertsEnabled}
              onValueChange={setPromotionalAlertsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#8B5CF633' }}
              thumbColor={promotionalAlertsEnabled ? '#8B5CF6' : '#F4F5F7'}
            />
          </View>
        </View>

        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>Preferences</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={onChangeLanguage}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="language" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Language</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>English (US)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="moon" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Switch to dark theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#6366F133' }}
              thumbColor={darkModeEnabled ? '#6366F1' : '#F4F5F7'}
            />
          </View>
        </View>

        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>Security</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={onChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, dynamicStyles.settingTitle]}>Change Password</Text>
              <Text style={[styles.settingSubtitle, dynamicStyles.settingSubtitle]}>Update your password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
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
    gap: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F9FAFB',
    letterSpacing: 0.3,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconWrapper: {
    marginRight: 16,
  },
  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
});

export default OwnerSettingsScreen;


