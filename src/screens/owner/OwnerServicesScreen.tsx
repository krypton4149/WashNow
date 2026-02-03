import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { TEXT_STYLES } from '../../utils/fonts';
import { moderateScale } from '../../utils/responsive';
import authService from '../../services/authService';

const BLUE_COLOR = '#0358a8';
const GREEN_ACTIVE = '#059669';
const GRAY_INACTIVE = '#6B7280';

interface OwnerServicesScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
}

type ServiceEdit = {
  id: string | number;
  service_centre_id: string | number;
  name: string;
  description: string;
  price: string;
  offer_price: string;
  status: 'active' | 'inactive';
  display_order?: number;
  _original?: { price: string; offer_price: string; status: 'active' | 'inactive' };
};

const OwnerServicesScreen: React.FC<OwnerServicesScreenProps> = ({ onBack, onLogout }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [services, setServices] = useState<ServiceEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const lastFocusedKey = useRef<string | null>(null);

  const loadServices = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.getOwnerServices(forceRefresh);
      if (!result.success) {
        setError(result.error || 'Failed to load services');
        setServices([]);
        return;
      }
      const rawList = result.services || [];
      const centreId = result.center?.id ?? result.center?.service_centre_id;
      const list = rawList.map((s: any) => {
        const price = s.price != null ? String(s.price) : '';
        const offerPrice = s.offer_price != null ? String(s.offer_price) : '';
        const statusStr = (s.status ?? s.is_active ?? '').toString().toLowerCase();
        const status: 'active' | 'inactive' =
          statusStr === 'inactive' || s.is_active === 0 || s.is_active === false ? 'inactive' : 'active';
        const serviceCentreId = s.service_centre_id ?? centreId ?? s.service_center_id;
        return {
          id: s.id,
          service_centre_id: serviceCentreId ?? centreId ?? 0,
          name: s.name || s.service_name || 'Service',
          description: s.description != null ? String(s.description).trim() : '',
          price,
          offer_price: offerPrice,
          status,
          display_order: s.display_order,
          _original: { price, offer_price: offerPrice, status },
        };
      });
      setServices(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load services');
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const updateLocalService = (id: string | number, updates: Partial<ServiceEdit>) => {
    setServices((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s))
    );
  };

  const saveService = async (item: ServiceEdit) => {
    const orig = item._original;
    if (!orig) return;
    const priceChanged = item.price !== orig.price;
    const offerChanged = item.offer_price !== orig.offer_price;
    const statusChanged = item.status !== orig.status;
    if (!priceChanged && !offerChanged && !statusChanged) return;

    const serviceCentreId = item.service_centre_id;
    if (!serviceCentreId) {
      Alert.alert('Error', 'Service centre not found. Please try again.');
      return;
    }

    setSavingId(item.id);
    try {
      const payload: { price?: string; offer_price?: string; status?: 'active' | 'inactive'; display_order?: number } = {};
      if (priceChanged && item.price !== '') payload.price = item.price;
      if (offerChanged) payload.offer_price = item.offer_price;
      if (statusChanged) payload.status = item.status;
      if (item.display_order != null) payload.display_order = item.display_order;

      const result = await authService.updateOwnerService(item.id, serviceCentreId, payload);
      if (result.success) {
        updateLocalService(item.id, { _original: { price: item.price, offer_price: item.offer_price, status: item.status } });
        const key = lastFocusedKey.current;
        if (key && inputRefs.current[key]) {
          setTimeout(() => inputRefs.current[key]?.focus(), 100);
        }
      } else {
        const msg = result.error || 'Could not update service. Please try again.';
        const isSessionExpired = result.isAuthError || /session\s*expired|login\s*again|unauthorized|401/i.test(msg);
        if (isSessionExpired && onLogout) {
          Alert.alert(
            'Session expired',
            'Please login again to continue.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Login again',
                onPress: async () => {
                  try {
                    await authService.logoutOwner();
                  } catch (_) {}
                  onLogout();
                },
              },
            ]
          );
        } else {
          const isTimeout = /timeout|taking too long/i.test(msg);
          if (isTimeout) {
            Alert.alert(
              'Update failed',
              msg,
              [
                { text: 'OK', style: 'cancel' },
                { text: 'Retry', onPress: () => saveService(item) },
              ]
            );
          } else {
            Alert.alert('Update failed', msg);
          }
        }
      }
    } catch (e: any) {
      const msg = e?.message || 'Something went wrong.';
      const isSessionExpired = /session\s*expired|unauthorized|401/i.test(msg);
      const isTimeout = /timeout|taking too long/i.test(msg);
      if (isSessionExpired && onLogout) {
        Alert.alert(
          'Session expired',
          'Please login again to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Login again',
              onPress: async () => {
                try {
                  await authService.logoutOwner();
                } catch (_) {}
                onLogout();
              },
            },
          ]
        );
      } else if (isTimeout) {
        Alert.alert(
          'Update failed',
          msg,
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Retry', onPress: () => saveService(item) },
          ]
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setSavingId(null);
    }
  };

  const hasChanges = (item: ServiceEdit) => {
    const o = item._original;
    if (!o) return false;
    return item.price !== o.price || item.offer_price !== o.offer_price || item.status !== o.status;
  };

  const scrollBottomPadding = Math.max(insets.bottom + 80, 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={!onBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Services & Pricing</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={BLUE_COLOR} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading services...</Text>
            </View>
          ) : error ? (
            <View style={styles.loadingBox}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadServices(true)} activeOpacity={0.8}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : services.length === 0 ? (
            <View style={styles.loadingBox}>
              <Ionicons name="pricetags-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No services added yet.</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Add services from your business profile or dashboard.</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionTop}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  Edit price and toggle Active/Inactive per service.
                </Text>
                <View style={[styles.countBadge, { backgroundColor: BLUE_COLOR + '18' }]}>
                  <Text style={[styles.countBadgeText, { color: BLUE_COLOR }]}>
                    {services.length} service{services.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              {services.map((item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.serviceNameBlock}>
                      <Text style={[styles.serviceName, { color: colors.text }]}>{item.name}</Text>
                      {item.description ? (
                        <Text style={[styles.serviceDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.statusWrap}>
                      <View style={[
                        styles.statusPill,
                        { backgroundColor: item.status === 'active' ? GREEN_ACTIVE + '18' : GRAY_INACTIVE + '20' },
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          { color: item.status === 'active' ? GREEN_ACTIVE : GRAY_INACTIVE },
                        ]}>
                          {item.status === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                      <Switch
                        value={item.status === 'active'}
                        onValueChange={(v) => updateLocalService(item.id, { status: v ? 'active' : 'inactive' })}
                        trackColor={{ false: '#D1D5DB', true: BLUE_COLOR + '99' }}
                        thumbColor={item.status === 'active' ? BLUE_COLOR : '#9CA3AF'}
                      />
                    </View>
                  </View>
                  <View style={[styles.priceSummary, { backgroundColor: colors.background }]}>
                    <View style={styles.priceSummaryItem}>
                      <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>Price</Text>
                      <Text style={[styles.priceSummaryValue, { color: colors.text }]}>£{item.price || '0.00'}</Text>
                    </View>
                    {item.offer_price ? (
                      <View style={[styles.priceSummaryDivider, { backgroundColor: colors.border }]} />
                    ) : null}
                    {item.offer_price ? (
                      <View style={styles.priceSummaryItem}>
                        <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>Offer</Text>
                        <Text style={[styles.priceSummaryValue, { color: BLUE_COLOR }]}>£{item.offer_price}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.priceRow}>
                    <View style={styles.priceFieldWrap}>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price (£)</Text>
                      <TextInput
                        ref={(r) => { inputRefs.current[`${item.id}-price`] = r; }}
                        style={[styles.priceInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={item.price}
                        onChangeText={(t) => updateLocalService(item.id, { price: t.replace(/[^0-9.]/g, '') })}
                        placeholder="0.00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        onFocus={() => { lastFocusedKey.current = `${item.id}-price`; }}
                      />
                    </View>
                    <View style={styles.priceFieldWrap}>
                      <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Offer (£)</Text>
                      <TextInput
                        ref={(r) => { inputRefs.current[`${item.id}-offer`] = r; }}
                        style={[styles.priceInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                        value={item.offer_price}
                        onChangeText={(t) => updateLocalService(item.id, { offer_price: t.replace(/[^0-9.]/g, '') })}
                        placeholder="Optional"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        onFocus={() => { lastFocusedKey.current = `${item.id}-offer`; }}
                      />
                    </View>
                  </View>
                  {hasChanges(item) && (
                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: BLUE_COLOR }]}
                      onPress={() => saveService(item)}
                      disabled={savingId !== null}
                      activeOpacity={0.85}
                    >
                      {savingId === item.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={styles.saveBtnIcon} />
                          <Text style={styles.saveBtnText}>Save changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...TEXT_STYLES.sectionHeading,
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: moderateScale(16),
    flexGrow: 1,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: moderateScale(16),
    gap: moderateScale(8),
  },
  sectionLabel: {
    ...TEXT_STYLES.bodySecondary,
    flex: 1,
    minWidth: 0,
  },
  countBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
  },
  countBadgeText: {
    ...TEXT_STYLES.label,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(48),
  },
  loadingText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: moderateScale(12),
  },
  errorText: {
    ...TEXT_STYLES.bodyPrimary,
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  emptyText: {
    ...TEXT_STYLES.sectionHeading,
    marginTop: moderateScale(12),
  },
  emptySubtext: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  retryButton: {
    marginTop: moderateScale(16),
    paddingHorizontal: moderateScale(24),
    paddingVertical: moderateScale(12),
    backgroundColor: BLUE_COLOR,
    borderRadius: moderateScale(12),
  },
  retryButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  card: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    padding: moderateScale(14),
    marginBottom: moderateScale(14),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(10),
  },
  serviceNameBlock: {
    flex: 1,
    marginRight: moderateScale(10),
    minWidth: 0,
  },
  serviceName: {
    ...TEXT_STYLES.cardTitleSemiBold,
  },
  serviceDescription: {
    ...TEXT_STYLES.bodySecondary,
    marginTop: moderateScale(2),
    lineHeight: Math.round(12 * 1.4),
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  statusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  statusPillText: {
    ...TEXT_STYLES.caption,
    fontWeight: '600',
  },
  priceSummary: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  priceSummaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSummaryDivider: {
    width: 1,
    marginVertical: 2,
  },
  priceSummaryLabel: {
    ...TEXT_STYLES.caption,
    marginBottom: 2,
  },
  priceSummaryValue: {
    ...TEXT_STYLES.cardTitleSemiBold,
  },
  priceRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  priceFieldWrap: {
    flex: 1,
  },
  priceLabel: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(4),
  },
  priceInput: {
    ...TEXT_STYLES.input,
    borderWidth: 1,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  saveBtn: {
    marginTop: moderateScale(10),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  saveBtnIcon: {
    marginRight: 0,
  },
  saveBtnText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
});

export default OwnerServicesScreen;
