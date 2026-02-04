import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { FONTS, FONT_SIZES, TEXT_STYLES } from '../../utils/fonts';

const BLUE_COLOR = '#0358a8';
const YELLOW_COLOR = '#f4c901';

interface OwnerSettingsScreenProps {
  onBack?: () => void;
  onChangePassword?: () => void;
}

const OwnerSettingsScreen: React.FC<OwnerSettingsScreenProps> = ({
  onBack,
  onChangePassword,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
      backgroundColor: 'rgba(17, 24, 39, 0.45)',
    },
    scrollContent: {
      backgroundColor: colors.background,
    },
    sectionCard: {
      backgroundColor: colors.card,
      shadowColor: '#000000',
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
  }), [colors]);


  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={[styles.header, dynamicStyles.header, { paddingTop: (insets?.top ?? 0) + 4 }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={!onBack}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={onBack ? colors.text : colors.textSecondary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Settings</Text>
        </View>
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
    </View>
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
    paddingHorizontal: Platform.select({ ios: 18, android: 16 }),
    paddingBottom: Platform.select({ ios: 12, android: 10 }),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 4,
  },
  headerTitleRow: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitleSmall,
    color: '#111827',
    letterSpacing: -0.5,
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
    ...TEXT_STYLES.label,
    color: '#F9FAFB',
    letterSpacing: 0.3,
  },
  heroTitle: {
    ...TEXT_STYLES.cardTitleSemiBold,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    ...TEXT_STYLES.bodySecondary,
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
    ...TEXT_STYLES.sectionHeadingMedium,
    color: '#111827',
    marginBottom: Platform.select({ ios: 18, android: 16 }),
    letterSpacing: -0.3,
    includeFontPadding: false,
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
    ...TEXT_STYLES.cardTitleSemiBold,
    color: '#111827',
    includeFontPadding: false,
  },
  settingSubtitle: {
    ...TEXT_STYLES.bodySecondary,
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


