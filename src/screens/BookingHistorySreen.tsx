import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, RefreshControl, Platform, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import {
  Appbar,
  Button,
  Card,
  Divider,
  HelperText,
  Modal,
  Paragraph,
  Portal,
  ProgressBar,
  RadioButton,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  Chip,
  Badge,
  useTheme,
  Surface,
  IconButton
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';


import { axiosInstance } from '../service/constants/axiosConfig';
import {
  BOOKING_DETAILS_ENDPOINT,
  BOOKING_TIME_SLOTS_ENDPOINT,
  APPOINTMENT_PROGRESS_ENDPOINT,
  TECHNICIAN_PROGRESS_QUOTE_RESPONSE_ENDPOINT
} from '../service/constants/apiConfig';
import { useAppDispatch, useAppSelector } from '../service/store';
import {
  cancelBooking,
  rescheduleBooking,
  fetchMyBookings,
  submitCustomerFeedback,
  updateBookingFeedback,
  getCustomerFeedback
} from '../service/slices/bookingSlice';
import { Booking } from '../types/booking';

// --- Enhanced StarRating for RN ---
const StarRating = ({ 
  value = 0, 
  size = 18, 
  editable = false, 
  onChange, 
  showNumber = true,
  interactive = true 
}: { 
  value?: number; 
  size?: number; 
  editable?: boolean; 
  onChange?: (n: number) => void;
  showNumber?: boolean;
  interactive?: boolean;
}) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {stars.map(n => (
        <TouchableOpacity
          key={n}
          onPress={editable && interactive ? () => onChange && onChange(n) : undefined}
          disabled={!editable || !interactive}
          style={{ marginRight: 2 }}
        >
          <Icon
            name={n <= Math.round(value) ? 'star' : 'star-outline'}
            size={size}
            color={n <= Math.round(value) ? "#F59E0B" : "#D1D5DB"}
          />
        </TouchableOpacity>
      ))}
      {showNumber && (
        <Text style={{ marginLeft: 6, fontWeight: '600', color: '#374151' }}>
          {value.toFixed(1)}/5
        </Text>
      )}
    </View>
  );
};

// Helpers
const formatTime12h = (time: string) => {
  if (!time) return 'N/A';
  const [h, m] = time.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
};

const statusMeta: Record<string, { color: string; icon: string; label: string }> = {
  pending_confirmation: { color: '#F59E0B', icon: 'time-outline', label: 'CHỜ XÁC NHẬN' },
  confirmed: { color: '#3B82F6', icon: 'checkmark-circle-outline', label: 'ĐÃ XÁC NHẬN' },
  in_progress: { color: '#8B5CF6', icon: 'sync-outline', label: 'ĐANG THỰC HIỆN' },
  inspection_completed: { color: '#A855F7', icon: 'information-circle-outline', label: 'HOÀN THÀNH KIỂM TRA' },
  quote_provided: { color: '#06B6D4', icon: 'pricetag-outline', label: 'ĐÃ BÁO GIÁ' },
  quote_approved: { color: '#10B981', icon: 'checkmark-done-outline', label: 'ĐÃ DUYỆT GIÁ' },
  quote_rejected: { color: '#EF4444', icon: 'close-circle-outline', label: 'TỪ CHỐI GIÁ' },
  maintenance_in_progress: { color: '#3B82F6', icon: 'build-outline', label: 'ĐANG BẢO TRÌ' },
  maintenance_completed: { color: '#10B981', icon: 'checkmark-done-outline', label: 'HOÀN THÀNH BẢO TRÌ' },
  payment_pending: { color: '#F59E0B', icon: 'card-outline', label: 'CHỜ THANH TOÁN' },
  completed: { color: '#16A34A', icon: 'checkmark-circle', label: 'HOÀN THÀNH' },
  cancelled: { color: '#EF4444', icon: 'close-circle', label: 'ĐÃ HỦY' },
  rescheduled: { color: '#F59E0B', icon: 'calendar-outline', label: 'ĐÃ ĐỔI LỊCH' },
  no_show: { color: '#6B7280', icon: 'alert-circle-outline', label: 'KHÔNG ĐẾN' }
};

const canCancel = (status: string) => [
  'pending_confirmation',
  'in_progress',
  'inspection_completed',
  'quote_provided',
  'quote_rejected',
  'payment_pending'
].includes(status);

const canReschedule = (status: string) => ['pending_confirmation', 'confirmed'].includes(status);

// --- Screen ---
const BookingHistoryScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { myBookings, loading, error } = useAppSelector((s) => s.booking);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [snack, setSnack] = useState<string>('');

  // Details modal
  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Progress modal
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Reschedule
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [rescheduleFor, setRescheduleFor] = useState<Booking | null>(null);
  const [rescheduleErr, setRescheduleErr] = useState('');

  // Cancel
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelFor, setCancelFor] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackViewOnly, setFeedbackViewOnly] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<Booking | null>(null);
  const [fbOverall, setFbOverall] = useState(5);
  const [fbService, setFbService] = useState(5);
  const [fbTech, setFbTech] = useState(5);
  const [fbFacility, setFbFacility] = useState(5);
  const [fbComment, setFbComment] = useState('');

  const list = Array.isArray(myBookings) ? myBookings : [];

  const stats = useMemo(() => ({
    total: list.length,
    confirmed: list.filter(b => b.status === 'confirmed').length,
    inProgress: list.filter(b => ['in_progress', 'maintenance_in_progress'].includes(b.status)).length,
    completed: list.filter(b => b.status === 'completed').length,
    cancelled: list.filter(b => b.status === 'cancelled').length
  }), [list]);

  const fetchList = useCallback(async () => {
    const params: Record<string, any> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sortBy && sortOrder) { params.sortBy = sortBy; params.sortOrder = sortOrder; }
    if (fromDate && toDate) {
      params.startDate = dayjs(fromDate).format('YYYY-MM-DD');
      params.endDate = dayjs(toDate).format('YYYY-MM-DD');
    }
    const result: any = await dispatch(fetchMyBookings(params) as any);
    if (result.type?.endsWith('/fulfilled') && result.payload?.appointments) {
      const completed = result.payload.appointments.filter((b: Booking) => b.status === 'completed' && (!b.feedback || !b.feedback.overall));
      for (const b of completed) {
        try { await dispatch(getCustomerFeedback(b._id) as any); } catch {}
      }
    }
  }, [dispatch, statusFilter, sortBy, sortOrder, fromDate, toDate]);

  const handleSearch = () => {
    setShowFilters(false);
    fetchList();
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  const openDetail = async (id: string) => {
    try {
      const res = await axiosInstance.get(BOOKING_DETAILS_ENDPOINT(id));
      setDetail(res.data?.data);
      setDetailOpen(true);
    } catch (e: any) {
      setSnack(e?.message || 'Không thể tải chi tiết lịch hẹn');
    }
  };

  const openProgress = async (appointmentId: string) => {
    setProgressOpen(true);
    setProgressLoading(true);
    setProgressData(null);
    try {
      const res = await axiosInstance.get(APPOINTMENT_PROGRESS_ENDPOINT(appointmentId));
      setProgressData(res.data?.data || { notFound: true });
    } catch {
      setProgressData({ notFound: true });
    } finally {
      setProgressLoading(false);
    }
  };

  const submitQuoteResponse = async (status: 'approved' | 'rejected') => {
    try {
      if (!progressData?._id) return;
      setProgressLoading(true);
      const res = await axiosInstance.put(TECHNICIAN_PROGRESS_QUOTE_RESPONSE_ENDPOINT(progressData._id), { status, notes: quoteNotes });
      if (res.data?.success) {
        setSnack(status === 'approved' ? 'Đã chấp nhận báo giá' : 'Đã từ chối báo giá');
        setProgressOpen(false);
        await fetchList();
      } else {
        setSnack('Cập nhật thất bại');
      }
    } catch {
      setSnack('Cập nhật thất bại');
    } finally { setProgressLoading(false); }
  };

  // Reschedule flow
  const startReschedule = async (b: Booking) => {
    try {
      setRescheduleErr('');
      const res = await axiosInstance.get(BOOKING_DETAILS_ENDPOINT(b._id));
      const detail = res.data?.data || b;
      setRescheduleFor(detail);
      const d = (detail.appointmentTime?.date || b.appointmentTime?.date || '').substring(0, 10);
      setNewDate(d ? new Date(d) : new Date());
      setSlot('');
      setRescheduleOpen(true);
    } catch (e: any) {
      setSnack(e?.message || 'Không thể tải chi tiết');
    }
  };

  useEffect(() => {
    const loadSlots = async () => {
      try {
        if (!rescheduleOpen || !newDate || !rescheduleFor) return;
        const centerId = (rescheduleFor as any)?.serviceCenter?._id || (rescheduleFor as any)?.serviceCenterId;
        if (!centerId) return;
        setSlotLoading(true);
        const theDate = dayjs(newDate).format('YYYY-MM-DD');
        const res = await axiosInstance.get(BOOKING_TIME_SLOTS_ENDPOINT(centerId, theDate));
        setSlots(res.data?.data?.availableSlots || []);
      } catch (e: any) {
        setSnack(e?.message || 'Không thể tải khung giờ');
      } finally { setSlotLoading(false); }
    };
    loadSlots();
  }, [rescheduleOpen, newDate, rescheduleFor]);

  const onSubmitReschedule = async () => {
    if (!rescheduleFor) return;
    if (!newDate) return setRescheduleErr('Vui lòng chọn ngày mới');
    if (!slot) return setRescheduleErr('Vui lòng chọn khung giờ mới');
    setRescheduleErr('');
    try {
      await dispatch(rescheduleBooking({ bookingId: rescheduleFor._id, appointmentDate: dayjs(newDate).format('YYYY-MM-DD'), appointmentTime: slot }) as any);
      setRescheduleOpen(false);
      await fetchList();
    } catch (e: any) {
      setSnack(e?.message || 'Đổi lịch thất bại');
    }
  };

  // Cancel flow
  const startCancel = (b: Booking) => { setCancelFor(b); setCancelReason(''); setCancelOpen(true); };
  const onSubmitCancel = async () => {
    if (!cancelFor) return;
    try {
      await dispatch(cancelBooking({ bookingId: cancelFor._id, reason: cancelReason }) as any);
      setCancelOpen(false);
      await fetchList();
    } catch (e: any) { setSnack(e?.message || 'Hủy lịch thất bại'); }
  };

  // Feedback flow
  const openFeedback = (b: Booking) => {
    setFeedbackFor(b);
    const has = !!(b.feedback && b.feedback.overall);
    setFeedbackViewOnly(has);
    if (has) {
      setFbOverall(b.feedback?.overall || 0);
      setFbService(b.feedback?.service || 0);
      setFbTech(b.feedback?.technician || 0);
      setFbFacility(b.feedback?.facility || 0);
      setFbComment(b.feedback?.comment || '');
    } else {
      setFbOverall(5); setFbService(5); setFbTech(5); setFbFacility(5); setFbComment('');
    }
    setFeedbackOpen(true);
  };

  const submitFeedbackRN = async () => {
    if (!feedbackFor) return;
    if (fbOverall < 1 || fbOverall > 5) { setSnack('Vui lòng đánh giá tổng thể 1-5 sao'); return; }
    try {
      const payload = { overall: fbOverall, service: fbService, technician: fbTech, facility: fbFacility, comment: fbComment };
      const result: any = await dispatch(submitCustomerFeedback({ appointmentId: feedbackFor._id, feedback: payload }) as any);
      if (result.type?.endsWith('/fulfilled')) {
        setSnack('Cảm ơn bạn đã đánh giá!');
        // cập nhật cục bộ
        await dispatch(updateBookingFeedback({ bookingId: feedbackFor._id, feedback: { ...payload, submittedAt: new Date().toISOString() } }));
        setFeedbackOpen(false);
      } else {
        setSnack('Gửi đánh giá thất bại');
      }
    } catch (e: any) { setSnack(e?.message || 'Gửi đánh giá thất bại'); }
  };

  const renderStatusChip = (status: string) => {
    const m = statusMeta[status] || { color: theme.colors.outline, icon: 'information-circle-outline', label: status };
    return (
      <Chip icon={m.icon as any} style={{ backgroundColor: `${m.color}20` }} textStyle={{ color: m.color }}>
        {m.label}
      </Chip>
    );
  };

  const averageDetailed = (fb: any) => {
    if (!fb) return 0;
    const arr = [fb.service, fb.technician, fb.facility].filter((n: any) => typeof n === 'number' && n > 0);
    if (arr.length) return Number((arr.reduce((a: number, b: number) => a + Number(b || 0), 0) / arr.length).toFixed(1));
    return typeof fb.overall === 'number' ? Number(Number(fb.overall).toFixed(1)) : 0;
  };

  const BookingItem = ({ item }: { item: Booking }) => (
    <Card style={styles.bookingCard} elevation={2}>
      <Card.Content>
        {/* Header with Date and Status */}
        <View style={styles.bookingHeader}>
          <View style={styles.dateSection}>
            <View style={styles.dateRowBooking}>
              <Icon name="calendar-outline" size={20} color="#1890ff" />
              <Text variant="titleMedium" style={styles.bookingDate}>
                {dayjs(item.appointmentTime?.date).format('DD/MM/YYYY')}
              </Text>
              <Badge style={styles.dayBadge}>
                {dayjs(item.appointmentTime?.date).format('ddd')}
              </Badge>
            </View>
            <Text variant="bodyMedium" style={styles.bookingTime}>
              {formatTime12h(item.appointmentTime?.startTime || '')} - {formatTime12h(item.appointmentTime?.endTime || '')}
            </Text>
          </View>
          {renderStatusChip(item.status)}
        </View>

        {/* Service Information */}
        <View style={styles.serviceSection}>
          <Text variant="labelMedium" style={styles.sectionLabel}>Dịch vụ</Text>
          <Text variant="bodyLarge" style={styles.serviceName}>
            {item?.serviceDetails?.isInspectionOnly ? 'Mang xe tới kiểm tra' : (item?.serviceType?.name || 'N/A')}
          </Text>
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={16} color="#6B7280" />
            <Text variant="bodyMedium" style={styles.locationText}>
              {item?.serviceCenter?.name || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Feedback Section for Completed Bookings */}
        {item.status === 'completed' && (
          <View style={styles.feedbackSection}>
            {item.feedback && (item.feedback.service || item.feedback.technician || item.feedback.facility || item.feedback.overall) ? (
              <TouchableOpacity 
                style={styles.feedbackDisplay}
                onPress={() => openFeedback(item)}
              >
                <View style={styles.feedbackContent}>
                  <StarRating 
                    value={averageDetailed(item.feedback)} 
                    size={16}
                    showNumber={true}
                    interactive={false}
                  />
                  <Text variant="labelSmall" style={styles.feedbackLabel}>
                    Bấm để xem chi tiết đánh giá
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <Button 
                mode="contained" 
                icon="star" 
                onPress={() => openFeedback(item)}
                style={styles.rateButton}
                buttonColor="#F59E0B"
              >
                Đánh giá
              </Button>
            )}
          </View>
        )}
      </Card.Content>

      {/* Action Buttons */}
      <Card.Actions style={styles.cardActions}>
        <Button 
          mode="outlined" 
          onPress={() => openDetail(item._id)} 
          icon="eye-outline"
          compact
          style={styles.actionButton}
        >
          Chi tiết
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => openProgress(item._id)} 
          icon="information-circle-outline"
          compact
          style={styles.actionButton}
        >
          Tiến độ
        </Button>
        {canReschedule(item.status) && (
          <Button 
            mode="outlined" 
            onPress={() => startReschedule(item)} 
            icon="create-outline"
            compact
            style={styles.actionButton}
          >
            Đổi lịch
          </Button>
        )}
        {canCancel(item.status) && (
          <Button 
            mode="outlined" 
            textColor="#EF4444" 
            onPress={() => startCancel(item)} 
            icon="close-circle-outline"
            compact
            style={[styles.actionButton, styles.cancelButton]}
          >
            Hủy
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#1890ff', '#722ed1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <View style={styles.headerTitleRow}>
              <Icon name="time-outline" size={28} color="white" />
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Lịch sử đặt lịch
              </Text>
            </View>
            <Text variant="bodyLarge" style={styles.headerSubtitle}>
              Xem và quản lý lịch sử đặt lịch của bạn
            </Text>
          </View>
          <IconButton
            icon="refresh"
            iconColor="white"
            size={24}
            onPress={handleSearch}
            disabled={loading}
            style={styles.refreshButton}
          />
        </View>
      </LinearGradient>

      {/* Enhanced Statistics Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
        style={styles.statsScrollView}
      >
        <Surface style={[styles.statCard, { backgroundColor: '#1890ff' }]} elevation={1}>
          <View style={styles.statContent}>
            <Icon name="calendar-outline" size={16} color="white" />
            <Text variant="labelMedium" style={styles.statLabel}>Tổng số lịch</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.total}</Text>
          </View>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#52c41a' }]} elevation={2}>
          <View style={styles.statContent}>
            <Icon name="checkmark-circle-outline" size={16} color="white" />
            <Text variant="labelMedium" style={styles.statLabel}>Đã xác nhận</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.confirmed}</Text>
          </View>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#faad14' }]} elevation={2}>
          <View style={styles.statContent}>
            <Icon name="time-outline" size={16} color="white" />
            <Text variant="labelMedium" style={styles.statLabel}>Đang thực hiện</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.inProgress}</Text>
          </View>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#52c41a' }]} elevation={2}>
          <View style={styles.statContent}>
            <Icon name="checkmark-done-outline" size={16} color="white" />
            <Text variant="labelMedium" style={styles.statLabel}>Hoàn thành</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.completed}</Text>
          </View>
        </Surface>
        
        <Surface style={[styles.statCard, { backgroundColor: '#ff4d4f' }]} elevation={2}>
          <View style={styles.statContent}>
            <Icon name="close-circle-outline" size={16} color="white" />
            <Text variant="labelMedium" style={styles.statLabel}>Đã hủy</Text>
            <Text variant="headlineMedium" style={styles.statValue}>{stats.cancelled}</Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Filter Toggle Button */}
      <Card style={styles.filterToggleCard} elevation={1}>
        <Card.Content style={styles.filterToggleContent}>
          <Button
            mode="outlined"
            icon={showFilters ? "filter-remove" : "filter"}
            onPress={() => setShowFilters(!showFilters)}
            style={styles.filterToggleButton}
            labelStyle={styles.filterToggleLabel}
          >
            {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
          </Button>
          {showFilters && (
            <View style={styles.filterToggleContent}></View>
          )}
        </Card.Content>
      </Card>

      {/* Modern Filters - Conditional Render */}
      {showFilters && (
        <Card style={styles.filtersCard} elevation={1}>
          <Card.Content style={styles.filtersContent}>
            <View style={styles.filterHeader}>
              <Icon name="filter-outline" size={18} color="#6B7280" />
              <Text variant="titleSmall" style={styles.filterTitle}>Bộ lọc</Text>
            </View>
          
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text variant="labelSmall" style={styles.filterLabel}>Trạng thái</Text>
            <View style={styles.statusButtons}>
              {[
                { value: 'all', label: 'Tất cả', icon: 'apps-outline' },
                { value: 'pending_confirmation', label: 'Chờ xác nhận', icon: 'time-outline' },
                { value: 'confirmed', label: 'Đã xác nhận', icon: 'checkmark-circle-outline' }
              ].map(({ value, label, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.statusButton,
                    statusFilter === value && styles.statusButtonActive
                  ]}
                  onPress={() => setStatusFilter(value)}
                >
                  <Icon 
                    name={icon as any} 
                    size={14} 
                    color={statusFilter === value ? 'white' : '#1890ff'} 
                  />
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.statusButtonText,
                      statusFilter === value && styles.statusButtonTextActive
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text variant="labelSmall" style={styles.filterLabel}>Khoảng thời gian</Text>
            <View style={styles.dateRowFilter}>
              <View style={styles.dateInput}>
                <TextInput
                  mode="outlined"
                  label="Từ ngày"
                  value={fromDate ? dayjs(fromDate).format('DD/MM/YYYY') : ''}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowFromPicker(true)} />}
                  editable={false}
                  style={styles.dateField}
                  contentStyle={styles.dateFieldContent}
                />
              </View>
              <View style={styles.dateInput}>
                <TextInput
                  mode="outlined"
                  label="Đến ngày"
                  value={toDate ? dayjs(toDate).format('DD/MM/YYYY') : ''}
                  right={<TextInput.Icon icon="calendar" onPress={() => setShowToPicker(true)} />}
                  editable={false}
                  style={styles.dateField}
                  contentStyle={styles.dateFieldContent}
                />
              </View>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text variant="labelSmall" style={styles.filterLabel}>Sắp xếp</Text>
            <View style={styles.sortButtons}>
              {[
                { value: 'none-', label: 'Không sắp xếp', icon: 'swap-vertical-outline' },
                { value: 'appointmentTime.date-desc', label: 'Mới nhất', icon: 'arrow-down-outline' },
                { value: 'appointmentTime.date-asc', label: 'Cũ nhất', icon: 'arrow-up-outline' }
              ].map(({ value, label, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sortButton,
                    (sortBy && sortOrder ? `${sortBy}-${sortOrder}` : 'none-') === value && styles.sortButtonActive
                  ]}
                  onPress={() => {
                    const [sb, so] = value.split('-');
                    setSortBy(sb === 'none' ? '' : sb);
                    setSortOrder((so as any) || '');
                  }}
                >
                  <Icon 
                    name={icon as any} 
                    size={14} 
                    color={(sortBy && sortOrder ? `${sortBy}-${sortOrder}` : 'none-') === value ? 'white' : '#1890ff'} 
                  />
                  <Text 
                    variant="labelSmall" 
                    style={[
                      styles.sortButtonText,
                      (sortBy && sortOrder ? `${sortBy}-${sortOrder}` : 'none-') === value && styles.sortButtonTextActive
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.filterActions}>
            <Button 
              mode="outlined" 
              icon="filter-remove" 
              onPress={() => { 
                setStatusFilter('all'); 
                setFromDate(null); 
                setToDate(null); 
                setSortBy(''); 
                setSortOrder(''); 
              }}
              style={styles.clearButton}
              labelStyle={styles.clearButtonLabel}
            >
              Xóa bộ lọc
            </Button>
           
          </View>
        </Card.Content>
      </Card>
      )}

      {/* Error */}
      {!!error && (
        <Card style={{ marginHorizontal: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
          <Card.Content>
            <Text style={{ color: '#EF4444', fontWeight: '700' }}>Lỗi tải dữ liệu</Text>
            <Paragraph>{String(error)}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* List */}
      <FlatList
        data={list}
        keyExtractor={(it) => it._id}
        renderItem={BookingItem}
        contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <Divider style={{ opacity: 0 }} />}
        refreshControl={<RefreshControl refreshing={!!loading} onRefresh={fetchList} />}
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Icon name="file-tray-outline" size={48} color={theme.colors.outline} />
            <Text style={{ marginTop: 8, color: theme.colors.outline }}>Không có dữ liệu đặt lịch</Text>
          </View>
        ) : null}
      />

      {/* Date pickers */}
      {showFromPicker && (
        <DateTimePicker
          value={fromDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, d) => { setShowFromPicker(false); if (d) setFromDate(d); }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, d) => { setShowToPicker(false); if (d) setToDate(d); }}
        />
      )}

      <Portal>
        {/* Detail Modal */}
        <Modal visible={detailOpen} onDismiss={() => setDetailOpen(false)} contentContainerStyle={styles.modalBox}>
          {!detail ? (
            <View style={{ padding: 24 }}><ProgressBar indeterminate /><Text style={{ marginTop: 12 }}>Đang tải...</Text></View>
          ) : (
            <View>
              <Text variant="titleMedium">Chi tiết lịch hẹn</Text>
              <Divider style={{ marginVertical: 12 }} />
              <View style={{ gap: 10 }}>
                <View>
                  <Text style={styles.label}>Ngày hẹn</Text>
                  <Text style={styles.value}>{dayjs(detail.appointmentTime?.date).format('ddd, DD MMM YYYY')}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Thời gian</Text>
                  <Text style={styles.value}>{detail.appointmentTime?.startTime && detail.appointmentTime?.endTime ? `${formatTime12h(detail.appointmentTime.startTime)} - ${formatTime12h(detail.appointmentTime.endTime)}` : 'N/A'}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Dịch vụ</Text>
                  <Text style={styles.value}>{detail?.serviceDetails?.isInspectionOnly ? 'Mang xe tới kiểm tra' : (detail?.serviceType?.name || 'N/A')}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Trung tâm</Text>
                  <Text style={styles.value}>{detail?.serviceCenter?.name || 'N/A'}</Text>
                </View>
                <View>
                  <Text style={styles.label}>Trạng thái</Text>
                  {renderStatusChip(detail.status)}
                </View>
                {!!detail?.serviceDetails?.description && (
                  <View>
                    <Text style={styles.label}>Mô tả</Text>
                    <Paragraph>{detail.serviceDetails.description}</Paragraph>
                  </View>
                )}
                {!!detail?.feedback && (
                  <View>
                    <Text style={styles.label}>Đánh giá trung bình</Text>
                    <StarRating value={averageDetailed(detail.feedback)} />
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                <Button onPress={() => setDetailOpen(false)}>Đóng</Button>
              </View>
            </View>
          )}
        </Modal>

        {/* Progress Modal */}
        <Modal visible={progressOpen} onDismiss={() => setProgressOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text variant="titleMedium">Tiến độ lịch hẹn</Text>
          <Divider style={{ marginVertical: 12 }} />
          {progressLoading ? (
            <View style={{ paddingVertical: 12 }}>
              <ProgressBar indeterminate />
              <Text style={{ marginTop: 8 }}>Đang tải dữ liệu...</Text>
            </View>
          ) : progressData?.notFound ? (
            <View style={{ padding: 12 }}>
              <Text>Không tìm thấy bản ghi tiến độ cho lịch hẹn này</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {/* Inspection & Quote */}
              {(() => {
                const iq = progressData?.appointmentId?.inspectionAndQuote || progressData?.inspectionAndQuote || progressData?.quote || {};
                const formatVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));
                return (
                  <Card>
                    <Card.Title title="Thông tin kiểm tra & báo giá" left={(p) => <Icon {...p} name="pricetag-outline" />} />
                    <Card.Content>
                      <Text>Ghi chú kiểm tra: {iq?.inspectionNotes || '-'}</Text>
                      <Text>Hoàn thành kiểm tra: {iq?.inspectionCompletedAt ? new Date(iq?.inspectionCompletedAt).toLocaleString('vi-VN') : '-'}</Text>
                      <Text>Tình trạng xe: {iq?.vehicleCondition || '-'}</Text>
                      <Text>Chẩn đoán: {iq?.diagnosisDetails || '-'}</Text>
                      <Text>Số tiền báo giá: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{iq?.quoteAmount ? formatVND(iq?.quoteAmount) : '-'}</Text></Text>
                      <Text>Trạng thái báo giá: {iq?.quoteStatus || 'pending'}</Text>
                      {!!iq?.quoteDetails && <Paragraph style={{ marginTop: 6 }}>Chi tiết: {iq?.quoteDetails}</Paragraph>}
                    </Card.Content>
                  </Card>
                );
              })()}

              {!!progressData?.milestones?.length && (
                <Card>
                  <Card.Title title="Các mốc tiến độ" left={(p) => <Icon {...p} name="flag-outline" />} />
                  <Card.Content>
                    {progressData.milestones.map((m: any) => (
                      <View key={m._id || m.name} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <Icon name="ellipse-outline" size={12} />
                        <Text style={{ marginLeft: 8, fontWeight: '600' }}>{m.name}</Text>
                        {!!m.status && <Chip style={{ marginLeft: 8 }} compact>{m.status}</Chip>}
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              )}

              {String(progressData?.currentStatus || '').toLowerCase() !== 'completed' && (
                <Card>
                  <Card.Title title="Phản hồi báo giá" left={(p) => <Icon {...p} name="chatbox-ellipses-outline" />} />
                  <Card.Content>
                    <TextInput mode="outlined" label="Ghi chú (tùy chọn)" value={quoteNotes} onChangeText={setQuoteNotes} multiline />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Button mode="contained" icon="checkmark" onPress={() => submitQuoteResponse('approved')} loading={progressLoading}>Chấp nhận</Button>
                      <Button mode="outlined" icon="close" onPress={() => submitQuoteResponse('rejected')} loading={progressLoading}>Từ chối</Button>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}
        </Modal>

        {/* Reschedule Modal */}
        <Modal visible={rescheduleOpen} onDismiss={() => setRescheduleOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text variant="titleMedium">Đổi lịch hẹn</Text>
          <Divider style={{ marginVertical: 12 }} />
          <TextInput
            mode="outlined"
            label="Ngày mới"
            value={newDate ? dayjs(newDate).format('YYYY-MM-DD') : ''}
            right={<TextInput.Icon icon="calendar" onPress={() => setNewDate(newDate || new Date())} />}
            editable={false}
          />
          {/* Quick date pick trigger */}
          <View style={{ marginTop: 6 }}>
            <Button icon="calendar" onPress={() => setNewDate(new Date())}>Chọn hôm nay</Button>
          </View>
          {!!newDate && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Khung giờ mới</Text>
              {slotLoading ? (
                <View style={{ paddingVertical: 8 }}><ProgressBar indeterminate /></View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {slots.map((s) => (
                    <Chip key={`${s.startTime}-${s.endTime}`} selected={slot === s.startTime} onPress={() => setSlot(s.startTime)} icon="time-outline">
                      {`${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`}
                    </Chip>
                  ))}
                  {!slots.length && <Text style={{ color: theme.colors.outline }}>Không có khung giờ trống</Text>}
                </View>
              )}
            </View>
          )}
          {!!rescheduleErr && <HelperText type="error" visible>{rescheduleErr}</HelperText>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Button onPress={() => setRescheduleOpen(false)}>Hủy</Button>
            <Button mode="contained" icon="checkmark" onPress={onSubmitReschedule} loading={loading}>Xác nhận</Button>
          </View>
        </Modal>

        {/* Cancel Modal */}
        <Modal visible={cancelOpen} onDismiss={() => setCancelOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text variant="titleMedium">Hủy lịch hẹn</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Card mode="contained" style={{ backgroundColor: '#FEF2F2' }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="warning-outline" size={20} color="#EF4444" />
                <View>
                  <Text style={{ color: '#991B1B', fontWeight: '700' }}>Cảnh báo</Text>
                  <Paragraph style={{ color: '#B91C1C' }}>Hành động này không thể hoàn tác. Lịch hẹn của bạn sẽ bị hủy.</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
          <TextInput
            mode="outlined"
            label="Lý do hủy (tùy chọn)"
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
            style={{ marginTop: 12 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Button onPress={() => setCancelOpen(false)}>Hủy</Button>
            <Button mode="contained" buttonColor="#EF4444" icon="close" onPress={onSubmitCancel} loading={loading}>Xác nhận hủy</Button>
          </View>
        </Modal>

        {/* Enhanced Feedback Modal */}
        <Modal visible={feedbackOpen} onDismiss={() => setFeedbackOpen(false)} contentContainerStyle={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Icon name="star-outline" size={24} color="#F59E0B" />
            <Text variant="headlineSmall" style={styles.modalTitle}>
              {feedbackViewOnly ? 'Đánh giá của bạn (Đã hoàn thành)' : 'Đánh giá dịch vụ'}
            </Text>
          </View>
          <Divider style={{ marginVertical: 16 }} />
          
          {!!feedbackFor && (
            <Card mode="outlined" style={styles.bookingInfoCard}>
              <Card.Content>
                <View style={styles.bookingInfoHeader}>
                  <Icon name="information-circle-outline" size={20} color="#1890ff" />
                  <Text variant="titleSmall" style={styles.bookingInfoTitle}>Thông tin lịch hẹn</Text>
                </View>
                <Text variant="bodyLarge" style={styles.bookingServiceName}>
                  {feedbackFor?.serviceType?.name || 'Mang xe tới kiểm tra'} - {feedbackFor?.serviceCenter?.name}
                </Text>
                <Text variant="bodyMedium" style={styles.bookingDateTime}>
                  {dayjs(feedbackFor.appointmentTime?.date).format('ddd, DD MMM YYYY')} - {formatTime12h(feedbackFor.appointmentTime?.startTime || '')}
                </Text>
              </Card.Content>
            </Card>
          )}

          {feedbackViewOnly && (
            <Card mode="contained" style={styles.completedCard}>
              <Card.Content>
                <View style={styles.completedHeader}>
                  <Icon name="checkmark-circle-outline" size={20} color="#10B981" />
                  <Text variant="titleSmall" style={styles.completedTitle}>Đánh giá đã hoàn thành</Text>
                </View>
                <Text variant="bodyMedium" style={styles.completedText}>
                  Cảm ơn bạn đã đánh giá dịch vụ. Đánh giá này không thể chỉnh sửa.
                </Text>
              </Card.Content>
            </Card>
          )}

          <View style={styles.ratingSection}>
            <Text variant="titleMedium" style={styles.ratingLabel}>
              Đánh giá tổng thể {!feedbackViewOnly && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <StarRating 
              value={fbOverall} 
              editable={!feedbackViewOnly} 
              onChange={setFbOverall} 
              size={28}
              showNumber={true}
              interactive={!feedbackViewOnly}
            />
            {!feedbackViewOnly && fbOverall < 1 && (
              <Text variant="bodySmall" style={styles.errorText}>Vui lòng đánh giá tổng thể</Text>
            )}
          </View>

          <View style={styles.detailedRatings}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text variant="bodyMedium" style={styles.ratingItemLabel}>Chất lượng dịch vụ</Text>
                <StarRating 
                  value={fbService} 
                  editable={!feedbackViewOnly} 
                  onChange={setFbService} 
                  size={20}
                  showNumber={true}
                  interactive={!feedbackViewOnly}
                />
              </View>
              <View style={styles.ratingItem}>
                <Text variant="bodyMedium" style={styles.ratingItemLabel}>Thái độ kỹ thuật viên</Text>
                <StarRating 
                  value={fbTech} 
                  editable={!feedbackViewOnly} 
                  onChange={setFbTech} 
                  size={20}
                  showNumber={true}
                  interactive={!feedbackViewOnly}
                />
              </View>
            </View>
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text variant="bodyMedium" style={styles.ratingItemLabel}>Cơ sở vật chất</Text>
                <StarRating 
                  value={fbFacility} 
                  editable={!feedbackViewOnly} 
                  onChange={setFbFacility} 
                  size={20}
                  showNumber={true}
                  interactive={!feedbackViewOnly}
                />
              </View>
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text variant="titleMedium" style={styles.commentLabel}>
              <Icon name="chatbubble-outline" size={16} color="#6B7280" /> Nhận xét của bạn
            </Text>
            {feedbackViewOnly ? (
              <Card mode="contained" style={styles.commentDisplayCard}>
                <Card.Content>
                  <Text variant="bodyMedium" style={styles.commentText}>
                    {fbComment || 'Không có nhận xét'}
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              <TextInput 
                mode="outlined" 
                value={fbComment} 
                onChangeText={setFbComment} 
                multiline 
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ..."
                style={styles.commentInput}
                numberOfLines={4}
              />
            )}
          </View>

          {feedbackViewOnly && feedbackFor?.feedback?.submittedAt && (
            <View style={styles.submittedInfo}>
              <Text variant="bodySmall" style={styles.submittedText}>
                Đánh giá lúc: {new Date(feedbackFor.feedback.submittedAt).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setFeedbackOpen(false)}
              style={styles.cancelButtonModal}
            >
              {feedbackViewOnly ? 'Đóng' : 'Hủy'}
            </Button>
            {!feedbackViewOnly && (
              <Button 
                mode="contained" 
                icon="star" 
                onPress={submitFeedbackRN} 
                loading={loading} 
                disabled={!fbOverall || fbOverall < 1}
                style={styles.submitButton}
                buttonColor="#F59E0B"
              >
                Gửi đánh giá
              </Button>
            )}
          </View>
        </Modal>
      </Portal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')} duration={2500}>
        {snack}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  
  // Header styles
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 2,
  },
  headerTitle: {
    color: 'white',
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Stats styles
  statsScrollView: {
    marginBottom: 12, 
  },
  statsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: 140,
    borderRadius: 12,
    padding: 12,
  },
  statContent: {
    alignItems: 'center',
    gap: 8,
    padding: 4,
    margin: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  statValue: {
    color: 'white',
    fontWeight: '700',
  },

  // Filter styles
  filterToggleCard: {
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  filterToggleContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterToggleButton: {
    borderRadius: 20,
    borderColor: '#8B5CF6',
    borderWidth: 1,
    backgroundColor: 'white',
  },
  filterToggleLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  searchButton: {
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  searchButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  filtersCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  filtersContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  filterTitle: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 11,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1890ff',
    backgroundColor: 'white',
  },
  statusButtonActive: {
    backgroundColor: '#1890ff',
  },
  statusButtonText: {
    color: '#1890ff',
    fontWeight: '500',
    fontSize: 11,
  },
  statusButtonTextActive: {
    color: 'white',
  },
  dateRowFilter: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  dateField: {
    backgroundColor: 'white',
    borderRadius: 12,
  },
  dateFieldContent: {
    fontSize: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1890ff',
    backgroundColor: 'white',
  },
  sortButtonActive: {
    backgroundColor: '#1890ff',
  },
  sortButtonText: {
    color: '#1890ff',
    fontWeight: '500',
    fontSize: 11,
  },
  sortButtonTextActive: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    borderRadius: 20,
    borderColor: '#8B5CF6',
    borderWidth: 1,
    backgroundColor: 'white',
  },
  clearButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  refreshButtonAction: {
    flex: 1,
  },

  // Booking card styles
  bookingCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateSection: {
    flex: 1,
  },
  dateRowBooking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bookingDate: {
    fontWeight: '600',
    color: '#1F2937',
  },
  dayBadge: {
    backgroundColor: '#E5E7EB',
    color: '#374151',
  },
  bookingTime: {
    color: '#6B7280',
    marginLeft: 28,
  },
  serviceSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  serviceName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#6B7280',
  },
  feedbackSection: {
    marginTop: 8,
  },
  feedbackDisplay: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedbackContent: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackLabel: {
    color: '#6B7280',
  },
  rateButton: {
    borderRadius: 8,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    borderRadius: 8,
  },
  cancelButton: {
    borderColor: '#EF4444',
  },

  // Modal styles
  modalBox: { 
    margin: 16, 
    backgroundColor: 'white', 
    padding: 20, 
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontWeight: '700',
    color: '#1F2937',
  },
  bookingInfoCard: {
    marginBottom: 16,
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  bookingInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bookingInfoTitle: {
    fontWeight: '600',
    color: '#1890ff',
  },
  bookingServiceName: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  bookingDateTime: {
    color: '#6B7280',
  },
  completedCard: {
    marginBottom: 16,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  completedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  completedTitle: {
    fontWeight: '600',
    color: '#10B981',
  },
  completedText: {
    color: '#059669',
  },
  ratingSection: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    marginTop: 4,
  },
  detailedRatings: {
    marginBottom: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  ratingItem: {
    flex: 1,
    gap: 8,
  },
  ratingItemLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  commentSection: {
    marginBottom: 20,
  },
  commentLabel: {
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentDisplayCard: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  commentText: {
    color: '#374151',
  },
  commentInput: {
    backgroundColor: 'white',
  },
  submittedInfo: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  submittedText: {
    color: '#6B7280',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButtonModal: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  radioRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  label: { 
    color: '#6B7280', 
    fontSize: 12 
  },
  value: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
});

export default BookingHistoryScreen;
