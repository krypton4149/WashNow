import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  TextInput,
  Keyboard,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { TEXT_STYLES, FONT_SIZES } from '../../utils/fonts';
import { moderateScale, iconScale } from '../../utils/responsive';

const BLUE_COLOR = '#0358a8';

interface OwnerPaymentsScreenProps {
  onBack?: () => void;
}

const OwnerPaymentsScreen: React.FC<OwnerPaymentsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingNoSearch, setBookingNoSearch] = useState('');
  const [referenceNoSearch, setReferenceNoSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  type DateFilterKey = 'all' | 'today' | 'last7' | 'last30' | 'date';
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const getDateRange = useCallback((key: DateFilterKey, customDate?: Date | null): { start: number; end: number } => {
    const now = customDate || new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    let start: number;
    if (key === 'all') {
      return { start: 0, end: end + 1 };
    }
    if (key === 'today' || key === 'date') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      return { start, end };
    }
    if (key === 'last7') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      return { start, end };
    }
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    return { start, end };
  }, []);

  const dateOptions = useMemo(() => {
    const list: { date: Date; label: string; key: string }[] = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      list.push({
        date: d,
        label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        key: d.toISOString().slice(0, 10),
      });
    }
    return list;
  }, []);

  const filteredPayments = useMemo(() => {
    if (dateFilter === 'all') return payments;
    const range = dateFilter === 'date' && selectedDate
      ? getDateRange('date', selectedDate)
      : getDateRange(dateFilter);
    const { start, end } = range;
    return payments.filter((item: any) => {
      const raw = item?.created_at ?? item?.date ?? item?.payment_date ?? item?.updated_at;
      if (!raw) return false;
      const t = new Date(raw).getTime();
      return t >= start && t <= end;
    });
  }, [payments, dateFilter, selectedDate, getDateRange]);

  const loadPayments = useCallback(async (params?: { bookingno?: string; reference_no?: string }) => {
    const result = await authService.getOwnerPaymentsList(params);
    if (result.success && Array.isArray(result.payments)) {
      setPayments(result.payments);
      setError(null);
    } else {
      setPayments([]);
      setError(result.error || 'Failed to load payments');
    }
  }, []);

  const fetchPayments = useCallback(async (showRefresh = false, searchParams?: { bookingno?: string; reference_no?: string }) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    await loadPayments(searchParams);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [loadPayments]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    const bookingno = bookingNoSearch.trim() || undefined;
    const reference_no = referenceNoSearch.trim() || undefined;
    if (!bookingno && !reference_no) {
      setIsLoading(true);
      fetchPayments(false);
      return;
    }
    setIsSearching(true);
    setError(null);
    loadPayments({ bookingno, reference_no }).finally(() => {
      setIsSearching(false);
    });
  }, [bookingNoSearch, referenceNoSearch, fetchPayments, loadPayments]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefresh = useCallback(() => {
    fetchPayments(true);
  }, [fetchPayments]);

  const getPaymentLabel = (item: any, key: string): string => {
    const v = item?.[key] ?? item?.[key.replace(/_/g, '')];
    if (v == null) return '—';
    return String(v).trim() || '—';
  };

  const getStatusColor = (status: string): string => {
    const s = String(status || '').toLowerCase();
    if (['completed', 'paid', 'success', 'confirmed'].includes(s)) return '#16A34A';
    if (['pending', 'processing'].includes(s)) return '#B45309';
    if (['failed', 'cancelled', 'refunded'].includes(s)) return '#DC2626';
    return colors.textSecondary || '#6B7280';
  };

  const formatPaymentDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || String(dateStr).trim() === '' || dateStr === '—') return '—';
    try {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={iconScale(24)} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Payment List</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={BLUE_COLOR} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.searchSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.searchSectionTitleRow}>
            <Ionicons name="search-outline" size={iconScale(20)} color={BLUE_COLOR} />
            <Text style={[styles.searchSectionTitle, { color: colors.text }]}>Search payments</Text>
          </View>
          <Text style={[styles.searchLabel, { color: colors.textSecondary }]}>Booking No (Optional)</Text>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. B00185"
            placeholderTextColor={colors.textSecondary}
            value={bookingNoSearch}
            onChangeText={setBookingNoSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <Text style={[styles.searchLabel, { color: colors.textSecondary }]}>Reference No (Optional)</Text>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. ref number"
            placeholderTextColor={colors.textSecondary}
            value={referenceNoSearch}
            onChangeText={setReferenceNoSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: BLUE_COLOR }]}
            onPress={handleSearch}
            disabled={isSearching}
            activeOpacity={0.8}
          >
            {isSearching || isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.filterSection, { borderColor: colors.border }]}>
          <View style={styles.filterLabelRow}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by date</Text>
            <TouchableOpacity
              style={[styles.calendarIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setCalendarModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={iconScale(20)} color={BLUE_COLOR} />
            </TouchableOpacity>
          </View>
          <View style={styles.filterRow}>
            {(['all', 'today', 'last7', 'last30'] as const).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filterChip,
                  { borderColor: colors.border },
                  dateFilter === key && !selectedDate ? { backgroundColor: BLUE_COLOR, borderColor: BLUE_COLOR } : { backgroundColor: colors.card },
                ]}
                onPress={() => { setDateFilter(key); setSelectedDate(null); }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: dateFilter === key && !selectedDate ? '#FFF' : colors.text },
                  ]}
                >
                  {key === 'all' ? 'All' : key === 'today' ? 'Today' : key === 'last7' ? 'Last 7 days' : 'Last 30 days'}
                </Text>
              </TouchableOpacity>
            ))}
            {selectedDate && (
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: BLUE_COLOR, borderColor: BLUE_COLOR }]}
                onPress={() => setCalendarModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: '#FFF' }]}>
                  {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Modal
          visible={calendarModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <View style={styles.dateModalOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setCalendarModalVisible(false)} />
            <View style={[styles.dateModalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.dateModalTitle, { color: colors.text }]}>Select date</Text>
              <TouchableOpacity
                style={[styles.dateModalAllBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setDateFilter('all'); setSelectedDate(null); setCalendarModalVisible(false); }}
              >
                <Text style={[styles.dateModalAllText, { color: colors.text }]}>All dates</Text>
              </TouchableOpacity>
              <Text style={[styles.dateModalListTitle, { color: colors.textSecondary }]}>Or pick a day</Text>
              <FlatList
                data={dateOptions}
                keyExtractor={(item) => item.key}
                style={styles.dateModalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dateModalRow,
                      { borderColor: colors.border },
                      selectedDate?.toDateString() === item.date.toDateString() ? { backgroundColor: BLUE_COLOR + '20' } : {},
                    ]}
                    onPress={() => {
                      setSelectedDate(item.date);
                      setDateFilter('date');
                      setCalendarModalVisible(false);
                    }}
                  >
                    <Text style={[styles.dateModalRowText, { color: colors.text }]}>{item.label}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={[styles.dateModalClose, { backgroundColor: colors.border }]} onPress={() => setCalendarModalVisible(false)}>
                <Text style={[styles.dateModalCloseText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {isLoading && payments.length === 0 && !bookingNoSearch.trim() && !referenceNoSearch.trim() ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={BLUE_COLOR} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading payments...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={iconScale(48)} color={colors.textSecondary} />
            <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: BLUE_COLOR }]} onPress={() => fetchPayments()} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="card-outline" size={iconScale(48)} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {bookingNoSearch.trim() || referenceNoSearch.trim() ? 'No payments found' : 'No payments yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {bookingNoSearch.trim() || referenceNoSearch.trim()
                ? 'Try a different booking or reference number.'
                : 'Payment history will appear here.'}
            </Text>
          </View>
        ) : filteredPayments.length === 0 ? (
          <View style={styles.centerBox}>
            <Ionicons name="calendar-outline" size={iconScale(48)} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No payments in this date range</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try another date filter or search.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {(filteredPayments.length > 1 || dateFilter !== 'all') && (
              <View style={[styles.resultCountWrap, { backgroundColor: BLUE_COLOR + '12' }]}>
                <Ionicons name="list-outline" size={iconScale(16)} color={BLUE_COLOR} />
                <Text style={[styles.resultCount, { color: colors.text }]}>
                  {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            {filteredPayments.map((item: any, index: number) => {
              const bookingNo = getPaymentLabel(item, 'booking_no') || getPaymentLabel(item, 'bookingno') || getPaymentLabel(item, 'booking_number');
              const refNo = getPaymentLabel(item, 'reference_no') || getPaymentLabel(item, 'ref_no');
              const amount = getPaymentLabel(item, 'amount') || getPaymentLabel(item, 'total') || getPaymentLabel(item, 'price');
              const status = getPaymentLabel(item, 'status') || getPaymentLabel(item, 'payment_status') || getPaymentLabel(item, 'payment_status');
              const dateRaw = getPaymentLabel(item, 'created_at') || getPaymentLabel(item, 'date') || getPaymentLabel(item, 'payment_date');
              const dateFormatted = formatPaymentDate(dateRaw);
              const paymentMode = getPaymentLabel(item, 'provider') || getPaymentLabel(item, 'payment_method') || getPaymentLabel(item, 'method');
              const statusColor = getStatusColor(status);
              const amountStr = amount.startsWith('£') ? amount : `£${amount}`;

              return (
                <View key={item?.id ?? index} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />
                  <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
                    <View style={styles.cardHeaderLeft}>
                      <Ionicons name="receipt-outline" size={iconScale(20)} color={BLUE_COLOR} />
                      <Text style={[styles.cardBookingNo, { color: colors.text }]}>{bookingNo}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
                      <Text style={[styles.statusPillText, { color: statusColor }]}>{status}</Text>
                    </View>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>Amount</Text>
                    <Text style={[styles.amountValue, { color: colors.text }]}>{amountStr}</Text>
                  </View>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{dateFormatted}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment mode</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{paymentMode}</Text>
                    </View>
                    {refNo !== '—' && (
                      <View style={[styles.detailItem, styles.detailItemFull]}>
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reference</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{refNo}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(18),
    paddingBottom: moderateScale(4),
    paddingTop: Platform.select({ ios: 4, android: 4 }),
    borderBottomWidth: 1,
  },
  backBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 0,
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TEXT_STYLES.screenTitleSmall,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerRight: { width: moderateScale(40) },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: moderateScale(16) },
  searchSection: {
    borderWidth: 1,
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    marginBottom: moderateScale(20),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  searchSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(14),
  },
  searchSectionTitle: {
    ...TEXT_STYLES.sectionHeadingMedium,
    fontSize: 15,
  },
  searchLabel: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(6),
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    fontSize: FONT_SIZES.body,
    marginBottom: moderateScale(12),
  },
  searchButton: {
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(44),
  },
  searchButtonText: {
    ...TEXT_STYLES.buttonProduction,
    color: '#FFFFFF',
  },
  filterSection: {
    marginBottom: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderBottomWidth: 1,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  filterLabel: {
    ...TEXT_STYLES.label,
  },
  calendarIconBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  filterChip: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    borderWidth: 1,
  },
  filterChipText: {
    ...TEXT_STYLES.label,
    fontSize: 13,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  dateModalContent: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
  },
  dateModalTitle: {
    ...TEXT_STYLES.sectionHeadingMedium,
    marginBottom: moderateScale(12),
    textAlign: 'center',
  },
  dateModalAllBtn: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    marginBottom: moderateScale(12),
  },
  dateModalAllText: {
    ...TEXT_STYLES.bodyPrimary,
    textAlign: 'center',
  },
  dateModalListTitle: {
    ...TEXT_STYLES.label,
    marginBottom: moderateScale(8),
  },
  dateModalList: {
    maxHeight: moderateScale(240),
    marginBottom: moderateScale(12),
  },
  dateModalRow: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 1,
  },
  dateModalRowText: {
    ...TEXT_STYLES.bodyPrimary,
  },
  dateModalClose: {
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  dateModalCloseText: {
    ...TEXT_STYLES.buttonProduction,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    paddingVertical: moderateScale(20),
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(48),
  },
  loadingText: { ...TEXT_STYLES.bodyPrimary },
  errorText: { ...TEXT_STYLES.bodyPrimary, marginTop: moderateScale(12), textAlign: 'center' },
  retryBtn: { marginTop: moderateScale(16), paddingHorizontal: moderateScale(24), paddingVertical: moderateScale(12), borderRadius: moderateScale(12) },
  retryBtnText: { ...TEXT_STYLES.buttonProduction, color: '#FFFFFF' },
  emptyText: { ...TEXT_STYLES.sectionHeadingMedium, marginTop: moderateScale(12) },
  emptySubtext: { ...TEXT_STYLES.bodySecondary, marginTop: moderateScale(6) },
  list: { gap: moderateScale(16) },
  resultCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  resultCount: {
    ...TEXT_STYLES.label,
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    borderRadius: moderateScale(14),
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: moderateScale(14),
    borderBottomLeftRadius: moderateScale(14),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: moderateScale(14 + 4),
    paddingRight: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  cardBookingNo: {
    ...TEXT_STYLES.sectionHeadingMedium,
    fontSize: 15,
  },
  statusPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(20),
  },
  statusPillText: {
    ...TEXT_STYLES.label,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: moderateScale(14 + 4),
    paddingRight: moderateScale(14),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(10),
  },
  amountLabel: { ...TEXT_STYLES.label, fontSize: 13 },
  amountValue: {
    ...TEXT_STYLES.sectionHeadingMedium,
    fontSize: 20,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: moderateScale(14 + 4),
    paddingRight: moderateScale(14),
    paddingBottom: moderateScale(14),
    gap: moderateScale(12),
  },
  detailItem: {
    width: '48%',
    minWidth: 0,
  },
  detailItemFull: { width: '100%' },
  detailLabel: {
    ...TEXT_STYLES.label,
    fontSize: 11,
    marginBottom: moderateScale(2),
  },
  detailValue: {
    ...TEXT_STYLES.bodyPrimary,
    fontSize: 13,
  },
});

export default OwnerPaymentsScreen;
