import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ImageBackground,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { platformEdges } from '../../utils/responsive';
import { FONTS, FONT_SIZES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OwnerSettingsScreenProps {
  onBack?: () => void;
  onChangePassword?: () => void;
  initialPushNotificationsEnabled?: boolean;
  initialDarkModeEnabled?: boolean;
}

const OwnerSettingsScreen: React.FC<OwnerSettingsScreenProps> = ({
  onBack,
  onChangePassword,
  initialPushNotificationsEnabled = true,
  initialDarkModeEnabled = false,
}) => {
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(initialPushNotificationsEnabled);
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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={platformEdges as any}>
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
              <View style={[styles.settingIcon, { backgroundColor: BLUE_COLOR }]}>
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
              trackColor={{ false: '#D1D5DB', true: `${BLUE_COLOR}33` }}
              thumbColor={pushNotificationsEnabled ? BLUE_COLOR : '#F4F5F7'}
            />
          </View>
        </View>

        <View style={[styles.sectionCard, dynamicStyles.sectionCard]}>
          <Text style={[styles.sectionLabel, dynamicStyles.sectionLabel]}>Preferences</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <View style={[styles.settingIcon, { backgroundColor: YELLOW_COLOR }]}>
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
              trackColor={{ false: '#D1D5DB', true: `${YELLOW_COLOR}33` }}
              thumbColor={darkModeEnabled ? YELLOW_COLOR : '#F4F5F7'}
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
              <View style={[styles.settingIcon, { backgroundColor: BLUE_COLOR }]}>
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
    fontSize: FONT_SIZES.HEADING_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.MONTserrat_SEMIBOLD,
    color: '#111827',
  },
  headerPlaceholder: {
    width: 40,
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
    fontSize: FONT_SIZES.CAPTION_SMALL,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#F9FAFB',
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: FONT_SIZES.HEADING_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.MONTserrat_BOLD,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
    color: '#E5E7EB',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.select({ ios: 26, android: 24 }),
    padding: Platform.select({ ios: 22, android: 20 }),
    shadowColor: '#000000',
    shadowOpacity: Platform.select({ ios: 0.06, android: 0.05 }),
    shadowRadius: Platform.select({ ios: 16, android: 14 }),
    shadowOffset: { width: 0, height: Platform.select({ ios: 7, android: 6 }) },
    elevation: Platform.select({ ios: 0, android: 3 }),
  },
  sectionLabel: {
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '700',
    fontFamily: FONTS.INTER_BOLD,
    color: '#111827',
    marginBottom: Platform.select({ ios: 18, android: 16 }),
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
    fontSize: FONT_SIZES.BODY_LARGE,
    fontWeight: '600',
    fontFamily: FONTS.INTER_SEMIBOLD,
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: FONT_SIZES.BODY_SMALL,
    fontFamily: FONTS.INTER_REGULAR,
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


