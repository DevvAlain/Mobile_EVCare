import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, Platform, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Text, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import dayjs from 'dayjs';
import {
  Button,
  Card,
  Divider,
  HelperText,
  Modal,
  Paragraph,
  Portal,
  ProgressBar,
  Snackbar,
  TextInput,
  Chip,
  useTheme,
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
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedStatsHeight = useRef(new Animated.Value(1)).current;

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

  const toggleFilters = () => {
    const newExpanded = !filtersExpanded;
    setFiltersExpanded(newExpanded);
    
    Animated.timing(animatedHeight, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const toggleStats = () => {
    const newExpanded = !statsExpanded;
    setStatsExpanded(newExpanded);
    
    Animated.timing(animatedStatsHeight, {
      toValue: newExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
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
      <Chip style={{ backgroundColor: `${m.color}20` }} textStyle={{ color: m.color }}>
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
    <TouchableOpacity style={styles.bookingCard} onPress={() => openDetail(item._id)}>
      {/* Card Header with Status */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderCode}>#{item._id.slice(-8)}</Text>
          <Text style={styles.bookingDate}>
            {dayjs(item.appointmentTime?.date).format('DD/MM/YYYY')}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {renderStatusChip(item.status)}
          
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Service Info */}
        <View style={styles.serviceSection}>
          <View style={styles.serviceRow}>
            <Icon name="car-outline" size={18} color="#1890ff" />
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>
                {item?.serviceDetails?.isInspectionOnly ? 'Mang xe tới kiểm tra' : (item?.serviceType?.name || 'N/A')}
              </Text>
              <Text style={styles.serviceCenter}>
                {item?.serviceCenter?.name || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Time Info */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Icon name="time-outline" size={18} color="#52c41a" />
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>
                {formatTime12h(item.appointmentTime?.startTime || '')} - {formatTime12h(item.appointmentTime?.endTime || '')}
              </Text>
            </View>
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
                  <Text style={styles.feedbackLabel}>
                    Xem đánh giá
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.feedbackButton}
                onPress={() => openFeedback(item)}
              >
                <Icon name="star-outline" size={16} color="#F59E0B" />
                <Text style={styles.feedbackButtonText}>Đánh giá</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openProgress(item._id)}
        >
          <Icon name="trending-up-outline" size={16} color="#1890ff" />
          <Text style={styles.actionButtonText}>Tiến độ</Text>
        </TouchableOpacity>
      
      {canReschedule(item.status) && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => startReschedule(item)}
        >
          <Icon name="calendar-outline" size={16} color="#52c41a" />
          <Text style={styles.actionButtonText}>Đổi lịch</Text>
        </TouchableOpacity>
      )}
      
      {canCancel(item.status) && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => startCancel(item)}
        >
          <Icon name="close-outline" size={16} color="#ff4d4f" />
          <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Hủy</Text>
        </TouchableOpacity>
      )}
    </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>      
      {/* Collapsible Filters - Moved to top */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity 
          style={styles.filtersHeader}
          onPress={toggleFilters}
        >
          <View style={styles.filtersTitleContainer}>
            <Icon name="filter-outline" size={20} color="#1890ff" />
            <Text style={styles.filtersTitle}>Bộ lọc</Text>
            <View style={styles.filterCount}>
              <Text style={styles.filterCountText}>
                {statusFilter !== 'all' ? '1' : '0'}
              </Text>
            </View>
          </View>
          <View style={styles.filtersHeaderRight}>
            <TouchableOpacity 
              style={styles.clearFiltersButton} 
              onPress={() => { 
                setStatusFilter('all'); 
                setFromDate(null); 
                setToDate(null); 
                setSortBy(''); 
                setSortOrder(''); 
              }}
            >
              <Icon name="refresh-outline" size={16} color="#6b7280" />
              <Text style={styles.clearFiltersText}>Xóa</Text>
            </TouchableOpacity>
            <Icon 
              name={filtersExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6b7280" 
            />
          </View>
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.filtersContent,
            {
              opacity: animatedHeight,
              maxHeight: animatedHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
            }
          ]}
        >
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Trạng thái</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScrollContent}
            >
              {[
                { value: 'all', label: 'Tất cả', icon: 'apps-outline' },
                { value: 'pending_confirmation', label: 'Chờ xác nhận', icon: 'time-outline' },
                { value: 'confirmed', label: 'Đã xác nhận', icon: 'checkmark-circle-outline' },
                { value: 'in_progress', label: 'Đang thực hiện', icon: 'sync-outline' },
                { value: 'completed', label: 'Hoàn thành', icon: 'checkmark-done-outline' },
                { value: 'cancelled', label: 'Đã hủy', icon: 'close-circle-outline' }
              ].map(({ value, label, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.filterChip,
                    statusFilter === value && styles.activeFilterChip
                  ]}
                  onPress={() => setStatusFilter(value)}
                >
                  <Icon 
                    name={icon as any} 
                    size={16} 
                    color={statusFilter === value ? '#ffffff' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.filterChipText,
                    statusFilter === value && styles.activeFilterChipText
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>

      {/* Collapsible Statistics */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statsHeader}
          onPress={toggleStats}
        >
          <View style={styles.statsTitleContainer}>
            <Icon name="analytics-outline" size={20} color="#1890ff" />
            <Text style={styles.statsTitle}>Tổng quan</Text>
            <View style={styles.statsCount}>
              <Text style={styles.statsCountText}>
                {stats.total}
              </Text>
            </View>
          </View>
          <Icon 
            name={statsExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#6b7280" 
          />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.statsContent,
            {
              opacity: animatedStatsHeight,
              maxHeight: animatedStatsHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
              }),
            }
          ]}
        >
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.totalCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="calendar-outline" size={24} color="#1890ff" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Tổng số lịch</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.confirmedCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="checkmark-circle-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.confirmedValue]}>{stats.confirmed}</Text>
                <Text style={styles.statLabel}>Đã xác nhận</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.inProgressCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="sync-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.inProgressValue]}>{stats.inProgress}</Text>
                <Text style={styles.statLabel}>Đang thực hiện</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.completedCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="checkmark-done-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.completedValue]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Error */}
      {!!error && (
        <Card style={{ marginHorizontal: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
          <Card.Content>
            <Text style={{ color: '#EF4444', fontWeight: '700' }}>Lỗi tải dữ liệu</Text>
            <Paragraph>{String(error)}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Booking List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1890ff" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : list.length > 0 ? (
          <FlatList
            data={list}
            renderItem={BookingItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={!!loading} onRefresh={fetchList} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có dữ liệu đặt lịch</Text>
          </View>
        )}
      </View>

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
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Chi tiết lịch hẹn</Text>
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
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Tiến độ lịch hẹn</Text>
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
                    <Card.Title title="Thông tin kiểm tra & báo giá" />
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
                  <Card.Title title="Các mốc tiến độ" />
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
                  <Card.Title title="Phản hồi báo giá" />
                  <Card.Content>
                    <TextInput label="Ghi chú (tùy chọn)" value={quoteNotes} onChangeText={setQuoteNotes} multiline />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Button icon="checkmark" onPress={() => submitQuoteResponse('approved')} loading={progressLoading}>Chấp nhận</Button>
                      <Button icon="close" onPress={() => submitQuoteResponse('rejected')} loading={progressLoading}>Từ chối</Button>
                    </View>
                  </Card.Content>
                </Card>
              )}
            </View>
          )}
        </Modal>

        {/* Reschedule Modal */}
        <Modal visible={rescheduleOpen} onDismiss={() => setRescheduleOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Đổi lịch hẹn</Text>
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
                    <Chip key={`${s.startTime}-${s.endTime}`} selected={slot === s.startTime} onPress={() => setSlot(s.startTime)}>
                      {`${formatTime12h(s.startTime)} - ${formatTime12h(s.endTime)}`}
                    </Chip>
                  ))}
                  {!slots.length && <Text style={{ color: theme.colors.outline }}>Không có khung giờ trống</Text>}
                </View>
              )}
            </View>
          )}
          {!!rescheduleErr && <HelperText type="error">{rescheduleErr}</HelperText>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Button onPress={() => setRescheduleOpen(false)}>Hủy</Button>
            <Button icon="checkmark" onPress={onSubmitReschedule} loading={loading}>Xác nhận</Button>
          </View>
        </Modal>

        {/* Cancel Modal */}
        <Modal visible={cancelOpen} onDismiss={() => setCancelOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Hủy lịch hẹn</Text>
          <Divider style={{ marginVertical: 12 }} />
          <Card style={{ backgroundColor: '#FEF2F2' }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="warning" size={20} color="#EF4444" />
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
            <Button icon="close" onPress={onSubmitCancel} loading={loading}>Xác nhận hủy</Button>
          </View>
        </Modal>

        {/* Enhanced Feedback Modal */}
        <Modal visible={feedbackOpen} onDismiss={() => setFeedbackOpen(false)} contentContainerStyle={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Icon name="star" size={24} color="#F59E0B" />
            <Text style={[styles.modalTitle, { fontSize: 20, fontWeight: 'bold' }]}>
              {feedbackViewOnly ? 'Đánh giá của bạn (Đã hoàn thành)' : 'Đánh giá dịch vụ'}
            </Text>
          </View>
          <Divider style={{ marginVertical: 16 }} />
          
          {!!feedbackFor && (
            <Card style={styles.bookingInfoCard}>
              <Card.Content>
                <View style={styles.bookingInfoHeader}>
                  <Icon name="information-circle" size={20} color="#1890ff" />
                  <Text style={[styles.bookingInfoTitle, { fontSize: 16, fontWeight: '600' }]}>Thông tin lịch hẹn</Text>
                </View>
                <Text style={[styles.bookingServiceName, { fontSize: 16, fontWeight: '600' }]}>
                  {feedbackFor?.serviceType?.name || 'Mang xe tới kiểm tra'} - {feedbackFor?.serviceCenter?.name}
                </Text>
                <Text style={[styles.bookingDateTime, { fontSize: 14, color: '#6B7280' }]}>
                  {dayjs(feedbackFor.appointmentTime?.date).format('ddd, DD MMM YYYY')} - {formatTime12h(feedbackFor.appointmentTime?.startTime || '')}
                </Text>
              </Card.Content>
            </Card>
          )}

          {feedbackViewOnly && (
            <Card style={styles.completedCard}>
              <Card.Content>
                <View style={styles.completedHeader}>
                  <Icon name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={[styles.completedTitle, { fontSize: 16, fontWeight: '600' }]}>Đánh giá đã hoàn thành</Text>
                </View>
                <Text style={[styles.completedText, { fontSize: 14, color: '#059669' }]}>
                  Cảm ơn bạn đã đánh giá dịch vụ. Đánh giá này không thể chỉnh sửa.
                </Text>
              </Card.Content>
            </Card>
          )}

          <View style={styles.ratingSection}>
            <Text style={[styles.ratingLabel, { fontSize: 16, fontWeight: '600' }]}>
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
              <Text style={[styles.errorText, { fontSize: 12, color: '#EF4444' }]}>Vui lòng đánh giá tổng thể</Text>
            )}
          </View>

          <View style={styles.detailedRatings}>
            <View style={styles.ratingRow}>
              <View style={styles.ratingItem}>
                <Text style={[styles.ratingItemLabel, { fontSize: 14, fontWeight: '500' }]}>Chất lượng dịch vụ</Text>
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
                <Text style={[styles.ratingItemLabel, { fontSize: 14, fontWeight: '500' }]}>Thái độ kỹ thuật viên</Text>
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
                <Text style={[styles.ratingItemLabel, { fontSize: 14, fontWeight: '500' }]}>Cơ sở vật chất</Text>
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
            <Text style={[styles.commentLabel, { fontSize: 16, fontWeight: '600', flexDirection: 'row', alignItems: 'center' }]}>
              <Icon name="chatbubble-outline" size={16} color="#6B7280" /> Nhận xét của bạn
            </Text>
            {feedbackViewOnly ? (
              <Card style={styles.commentDisplayCard}>
                <Card.Content>
                  <Text style={[styles.commentText, { fontSize: 14, color: '#374151' }]}>
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
              <Text style={[styles.submittedText, { fontSize: 12, color: '#6B7280' }]}>
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

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>
        {snack}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsCount: {
    backgroundColor: '#1890ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  statsCountText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  statsContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,  
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  confirmedCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  inProgressCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  confirmedValue: {
    color: '#3B82F6',
  },
  inProgressValue: {
    color: '#F59E0B',
  },
  completedValue: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  filtersContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  filtersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterCount: {
    backgroundColor: '#1890ff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  filtersHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filtersContent: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    overflow: 'hidden',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  filterScrollContent: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  filterChipText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },

  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderCode: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  clickHint: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  cardContent: {
    marginBottom: 16,
  },
  serviceSection: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceCenter: {
    fontSize: 14,
    color: '#6b7280',
  },
  timeSection: {
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInfo: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#52c41a',
    fontWeight: '500',
  },
  feedbackSection: {
    marginBottom: 12,
  },
  feedbackDisplay: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  feedbackContent: {
    alignItems: 'center',
    gap: 4,
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 6,
  },
  feedbackButtonText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  primaryButton: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  primaryButtonText: {
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  cancelButtonText: {
    color: '#dc2626',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
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
