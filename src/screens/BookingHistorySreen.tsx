import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, FlatList, RefreshControl, Platform, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Text, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
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
  Menu,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';


import { axiosInstance } from '../service/constants/axiosConfig';
import {
  BOOKING_DETAILS_ENDPOINT,
  BOOKING_TIME_SLOTS_ENDPOINT,
  APPOINTMENT_PROGRESS_ENDPOINT,
  APPOINTMENT_QUOTE_RESPONSE_ENDPOINT,
  TECHNICIAN_PROGRESS_QUOTE_RESPONSE_ENDPOINT,
  WORK_PROGRESS_LIST_ENDPOINT,
  WORK_PROGRESS_DETAIL_ENDPOINT,
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
          {Number.isInteger(value) ? value : value.toFixed(1)}/5
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
  const [snackType, setSnackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackType(type);
    setSnack(message);
  };
  const route = useRoute<any>();
  const navToastShownRef = useRef(false);
  useEffect(() => {
    if (navToastShownRef.current) return;
    const p: any = route.params;
    if (p && p.toastMessage) {
      navToastShownRef.current = true;
      showToast(String(p.toastMessage), p.toastType || 'info');
    }
  }, []);
  useEffect(() => {
    if (!snack) return;
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSnack(''));
    }, 3000);
    return () => clearTimeout(t);
  }, [snack, toastAnim]);


  // Details modal
  const [detail, setDetail] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Progress modal
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const [progressRaw, setProgressRaw] = useState<any>(null);
  const [progressRawOpen, setProgressRawOpen] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Reschedule
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState('');
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [rescheduleFor, setRescheduleFor] = useState<Booking | null>(null);
  const [rescheduleErr, setRescheduleErr] = useState('');
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);
  const [showTimeMenu, setShowTimeMenu] = useState(false);
  const [timeMode, setTimeMode] = useState<'preset' | 'custom'>('preset');
  const [customTime, setCustomTime] = useState('');
  const timeButtonRef = useRef<any>(null);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [timeAnchor, setTimeAnchor] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

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
        try { await dispatch(getCustomerFeedback(b._id) as any); } catch { }
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
      showToast(e?.message || 'Không thể tải chi tiết lịch hẹn', 'error');
    }
  };

  const openProgress = async (appointmentId: string) => {
    setProgressOpen(true);
    setProgressLoading(true);
    setProgressData(null);
    setProgressRaw(null);
    try {
      const res = await axiosInstance.get(APPOINTMENT_PROGRESS_ENDPOINT(appointmentId));
      const data = res.data?.data;
      // If backend returns progress under data, use it
      if (data) {
        setProgressData(data);
        setProgressRaw(res.data || null);
      } else {
        // Try fallback: query work-progress list by appointmentId
        // Some backends store progress resources under /work-progress
        try {
          const listRes = await axiosInstance.get(`${WORK_PROGRESS_LIST_ENDPOINT}?appointmentId=${appointmentId}`);
          // listRes.data?.data may be array of progress entries
          const listData = listRes.data?.data;
          if (Array.isArray(listData) && listData.length > 0) {
            const wp = listData[0];
            setProgressData(wp);
            setProgressRaw(listRes.data || null);
          } else if (listRes.data?.success && listRes.data?.data) {
            // sometimes API returns object
            setProgressData(listRes.data.data);
            setProgressRaw(listRes.data || null);
          } else {
            setProgressData({ notFound: true });
            setProgressRaw(listRes.data || null);
          }
        } catch (e) {
          // final fallback: mark not found
          setProgressData({ notFound: true });
        }
      }
    } catch (err) {
      try {
        const listRes = await axiosInstance.get(`${WORK_PROGRESS_LIST_ENDPOINT}?appointmentId=${appointmentId}`);
        const listData = listRes.data?.data;
        if (Array.isArray(listData) && listData.length > 0) {
          const wp = listData[0];
          setProgressData(wp);
          setProgressRaw(listRes.data || null);
        } else {
          setProgressData({ notFound: true });
          setProgressRaw(listRes.data || null);
        }
      } catch (e2) {
        setProgressData({ notFound: true });
      }
    } finally {
      setProgressLoading(false);
    }
  };

  // Open progress modal using local booking data when available (customer view)
  const openProgressFromBooking = async (b: Booking) => {
    setProgressOpen(true);
    setProgressLoading(false);
    setProgressRaw(null);
    // If booking already contains inspectionAndQuote, show it immediately
    if (b?.inspectionAndQuote) {
      setProgressData({ inspectionAndQuote: b.inspectionAndQuote });
      setProgressRaw({ fromBooking: true, bookingId: b._id, inspectionAndQuote: b.inspectionAndQuote });
      return;
    }

    // Fallback to network fetch by appointment id
    await openProgress(b._id);
  };

  const submitQuoteResponse = async (status: 'approved' | 'rejected') => {
    try {
      setProgressLoading(true);

      let progressId: string | undefined = (progressData as any)?._id;
      const bookingId = (progressData as any)?.bookingId || (progressRaw as any)?.bookingId || null;

      if (!progressId && bookingId) {
        try {
          const r = await axiosInstance.get(APPOINTMENT_PROGRESS_ENDPOINT(bookingId));
          const d = r.data?.data;
          if (d && d._id) {
            progressId = d._id;
            setProgressData((prev: any) => ({ ...(prev || {}), ...d }));
            setProgressRaw(r.data || null);
          }
        } catch (e) { }
      }

      if (!progressId && bookingId) {
        try {
          const listRes = await axiosInstance.get(`${WORK_PROGRESS_LIST_ENDPOINT}?appointmentId=${bookingId}`);
          const listData = listRes.data?.data;
          const found = Array.isArray(listData) && listData.length > 0 ? listData[0] : (listRes.data?.data || null);
          if (found && found._id) {
            progressId = found._id;
            setProgressData((prev: any) => ({ ...(prev || {}), ...found }));
            setProgressRaw(listRes.data || null);
          }
        } catch (e) { }
      }

      if (!progressId) {
        if (bookingId) {
          try {
            const res2 = await axiosInstance.put(APPOINTMENT_QUOTE_RESPONSE_ENDPOINT(bookingId), { status, notes: quoteNotes });
            if (res2.data?.success) {
              showToast(status === 'approved' ? 'Đã chấp nhận báo giá' : 'Đã từ chối báo giá', 'success');
              setProgressOpen(false);
              await fetchList();
              return;
            }
          } catch (e) { }
        }
        showToast('Không tìm thấy tiến trình để xác nhận báo giá', 'error');
        return;
      }

      const res = await axiosInstance.put(TECHNICIAN_PROGRESS_QUOTE_RESPONSE_ENDPOINT(progressId), { status, notes: quoteNotes });
      if (res.data?.success) {
        showToast(status === 'approved' ? 'Đã chấp nhận báo giá' : 'Đã từ chối báo giá', 'success');
        setProgressOpen(false);
        await fetchList();
      } else {
        showToast('Cập nhật thất bại', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'Cập nhật thất bại', 'error');
    } finally {
      setProgressLoading(false);
    }
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
      setSlots([]);
      setShowRescheduleDatePicker(false);
      setShowTimeMenu(false);
      setRescheduleOpen(true);
      setTimeMode('preset');
      setCustomTime('');
    } catch (e: any) {
      showToast(e?.message || 'Không thể tải chi tiết', 'error');
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
        const nextSlots = res.data?.data?.availableSlots || [];
        setSlots(nextSlots);
        // Auto-switch to custom if no preset slots for selected day
        if (Array.isArray(nextSlots) && nextSlots.length === 0) {
          setTimeMode('custom');
        }
      } catch (e: any) {
        showToast(e?.message || 'Không thể tải khung giờ', 'error');
      } finally { setSlotLoading(false); }
    };
    loadSlots();
  }, [rescheduleOpen, newDate, rescheduleFor]);

  const onSubmitReschedule = async () => {
    if (!rescheduleFor) return;
    if (!newDate) return setRescheduleErr('Vui lòng chọn ngày mới');
    // Normalize custom time to HH:MM
    let finalTime = timeMode === 'custom' ? customTime : slot;
    if (timeMode === 'custom') {
      if (/^\d{2}$/.test(finalTime)) finalTime = `${finalTime}:00`;
      if (!/^\d{2}:\d{2}$/.test(finalTime)) return setRescheduleErr('Giờ không hợp lệ (HH:MM)');
    }
    if (!finalTime) return setRescheduleErr('Vui lòng chọn hoặc nhập giờ đến');

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return setRescheduleErr('Không thể chọn ngày trong quá khứ');
    }

    setRescheduleErr('');
    try {
      await dispatch(rescheduleBooking({
        bookingId: rescheduleFor._id,
        appointmentDate: dayjs(newDate).format('YYYY-MM-DD'),
        appointmentTime: finalTime
      }) as any);
      showToast('Đổi lịch thành công!', 'success');
      setRescheduleOpen(false);
      await fetchList();
    } catch (e: any) {
      showToast(e?.message || 'Đổi lịch thất bại', 'error');
    }
  };

  const handleCustomTimeChange = (time: string) => {
    const digits = time.replace(/\D/g, '').slice(0, 4);
    let hours = digits.slice(0, 2);
    let minutes = digits.slice(2, 4);

    if (hours.length === 2) {
      const hNum = Math.min(Math.max(parseInt(hours || '0', 10), 0), 23);
      hours = String(isNaN(hNum) ? 0 : hNum).padStart(2, '0');
    }

    if (minutes.length > 0) {
      const mNum = Math.min(Math.max(parseInt(minutes || '0', 10), 0), 59);
      minutes = String(isNaN(mNum) ? 0 : mNum).padStart(2, '0');
    }

    const formatted = minutes.length > 0 ? `${hours}:${minutes}` : hours;
    setCustomTime(formatted);
    setSlot('');
  };

  // Cancel flow
  const startCancel = (b: Booking) => { setCancelFor(b); setCancelReason(''); setCancelOpen(true); };
  const onSubmitCancel = async () => {
    if (!cancelFor) return;
    try {
      await dispatch(cancelBooking({ bookingId: cancelFor._id, reason: cancelReason }) as any);
      setCancelOpen(false);
      showToast('Hủy lịch thành công', 'success');
      await fetchList();
    } catch (e: any) { showToast(e?.message || 'Hủy lịch thất bại', 'error'); }
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
        showToast('Cảm ơn bạn đã đánh giá!', 'success');
        // cập nhật cục bộ
        await dispatch(updateBookingFeedback({ bookingId: feedbackFor._id, feedback: { ...payload, submittedAt: new Date().toISOString() } }));
        setFeedbackOpen(false);
      } else {
        showToast('Gửi đánh giá thất bại', 'error');
      }
    } catch (e: any) { showToast(e?.message || 'Gửi đánh giá thất bại', 'error'); }
  };

  const renderStatusChip = (status: string) => {
    const m = statusMeta[status] || { color: theme.colors.outline, icon: 'information-circle-outline', label: status };
    return (
      <Chip style={{ backgroundColor: `${m.color}20`, maxWidth: 120 }} textStyle={{ color: m.color }}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: m.color, fontWeight: '700' }}>{m.label}</Text>
      </Chip>
    );
  };

  const averageDetailed = (fb: any) => {
    if (!fb) return 0;
    const arr = [fb.service, fb.technician, fb.facility].filter((n: any) => typeof n === 'number' && n > 0);
    if (arr.length) return Number((arr.reduce((a: number, b: number) => a + Number(b || 0), 0) / arr.length).toFixed(1));
    return typeof fb.overall === 'number' ? Number(Number(fb.overall).toFixed(1)) : 0;
  };

  // Render values that may be string/number/array/object to avoid passing raw objects into Text
  const renderValueNode = (v: any) => {
    if (v === null || v === undefined) return <Text>-</Text>;
    if (typeof v === 'string' || typeof v === 'number') return <Paragraph>{String(v)}</Paragraph>;
    if (Array.isArray(v)) {
      return (
        <View>
          {v.map((it, i) => (
            <Text key={i} style={{ marginBottom: 4 }}>{typeof it === 'object' ? JSON.stringify(it) : String(it)}</Text>
          ))}
        </View>
      );
    }
    if (typeof v === 'object') {
      // Common shape: { items: [...] }
      if (Array.isArray((v as any).items)) {
        const items = (v as any).items as any[];
        const formatVND = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n || 0));
        return (
          <View>
            {items.map((it: any, i: number) => {
              const name = it?.name || it?.partName || it?.part?.name || 'Linh kiện';
              const qty = Number(it?.quantity || 0);
              const price = Number(it?.unitPrice || it?.unit_price || 0);
              const subtotal = qty && price ? qty * price : price || 0;
              return (
                <View key={i} style={{ marginBottom: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                  <Text style={{ fontWeight: '700', color: '#111827' }}>{name}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ color: '#6b7280' }}>Số lượng: {qty || '-'}</Text>
                    <Text style={{ color: '#1f2937', fontWeight: '600' }}>{formatVND(price)}</Text>
                  </View>
                  <Text style={{ marginTop: 6, color: '#2563EB', fontWeight: '700' }}>Thành tiền: {formatVND(subtotal)}</Text>
                  {it?.partId && <Text style={{ marginTop: 4, color: '#9CA3AF', fontSize: 12 }}>partId: {String(it.partId)}</Text>}
                </View>
              );
            })}
          </View>
        );
      }

      // Fallback: pretty print object
      try {
        return <Paragraph>{JSON.stringify(v)}</Paragraph>;
      } catch {
        return <Text>-</Text>;
      }
    }
    return <Text>{String(v)}</Text>;
  };

  const BookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.bookingCard} onPress={() => openDetail(item._id)} activeOpacity={0.95}>
      <View style={styles.itemRow}>
        {/* Left: Date box */}
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{dayjs(item.appointmentTime?.date).format('DD')}</Text>
          <Text style={styles.dateMonth}>{dayjs(item.appointmentTime?.date).format('MMM').toUpperCase()}</Text>
          <Text style={styles.dateWeek}>{dayjs(item.appointmentTime?.date).format('ddd')}</Text>
        </View>

        {/* Middle: Details */}
        <View style={styles.itemMiddle}>
          <Text style={styles.serviceName} numberOfLines={1}>{item?.serviceDetails?.isInspectionOnly ? 'Mang xe tới kiểm tra' : (item?.serviceType?.name || 'N/A')}</Text>
          <Text style={styles.serviceCenter} numberOfLines={1}>{item?.serviceCenter?.name || 'N/A'}</Text>
          <View style={styles.metaRowSmall}>
            <Icon name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.metaTextSmall}>{formatTime12h(item.appointmentTime?.startTime || '')} - {formatTime12h(item.appointmentTime?.endTime || '')}</Text>
          </View>
        </View>

        {/* Right: Status & actions */}
        <View style={styles.itemRight}>
          <View style={{ alignItems: 'flex-end' }}>{renderStatusChip(item.status)}</View>

          {(() => {
            const quoteAllowed = ['quote_provided', 'quote_approved', 'quote_rejected', 'inspection_completed'].includes(item.status);
            const rescheduleAllowed = canReschedule(item.status);
            const cancelAllowed = canCancel(item.status);
            return (
              <View style={styles.actionRow}>
                {/* Quote: show always (web shows it except in rare cases) */}
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openProgressFromBooking(item)}
                  accessibilityLabel="Xem báo giá"
                >
                  <Icon name="pricetag-outline" size={18} color="#06B6D4" />
                </TouchableOpacity>

                {/* Progress / status timeline - always visible */}
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => openProgress(item._id)}
                  accessibilityLabel="Xem tiến độ"
                >
                  <Icon name="trending-up-outline" size={18} color="#1890ff" />
                </TouchableOpacity>

                {/* Reschedule - render only when allowed (match web behavior) */}
                {rescheduleAllowed && (
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => startReschedule(item)}
                    accessibilityLabel="Đổi lịch"
                  >
                    <Icon name="calendar-outline" size={18} color="#16a34a" />
                  </TouchableOpacity>
                )}

                {/* Cancel - render only when allowed (match web behavior) */}
                {cancelAllowed && (
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => startCancel(item)}
                    accessibilityLabel="Hủy lịch"
                  >
                    <Icon name="close-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })()}

          {item.status === 'completed' && (
            <View style={{ marginTop: 8, alignItems: 'flex-end' }}>
              {item.feedback && (item.feedback.service || item.feedback.technician || item.feedback.facility || item.feedback.overall) ? (
                <TouchableOpacity onPress={() => openFeedback(item)} style={styles.feedbackSmall}>
                  <StarRating value={averageDetailed(item.feedback)} size={14} interactive={false} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.rateBtn} onPress={() => openFeedback(item)}>
                  <Icon name="star-outline" size={14} color="#F59E0B" />
                  <Text style={styles.feedbackButtonText}>Đánh giá</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top - 30, 0) }]}>
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
            <View style={[styles.statCard, styles.statTotalCard]}>
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


      {/* Reschedule Date Picker */}
      {showRescheduleDatePicker && (
        <DateTimePicker
          value={newDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={new Date()}
          onChange={(_, d) => {
            setShowRescheduleDatePicker(false);
            if (d) {
              setNewDate(d);
              setSlot(''); // Reset slot when date changes
              setShowTimeMenu(false);
            }
          }}
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

        <Modal
          visible={progressOpen}
          onDismiss={() => setProgressOpen(false)}
          contentContainerStyle={[styles.modalBox, styles.progressModal]}
        >
          {progressLoading ? (
            <View style={{ paddingVertical: 20 }}>
              <ProgressBar indeterminate />
              <Text style={{ marginTop: 12, textAlign: 'center' }}>Đang tải dữ liệu...</Text>
            </View>
          ) : progressData?.notFound ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Icon name="alert-circle-outline" size={48} color="#6b7280" />
              <Text style={{ marginTop: 12, textAlign: 'center' }}>Không tìm thấy bản ghi tiến độ cho lịch hẹn này</Text>
            </View>
          ) : (
            (() => {
              const iq = progressData?.appointmentId?.inspectionAndQuote || progressData?.inspectionAndQuote || progressData?.quote || {};
              const formatVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));
              const items: any[] = Array.isArray(iq?.quoteDetails?.items) ? iq.quoteDetails.items : [];
              const itemsTotal = items.reduce((acc: number, it: any) => {
                const qty = Number(it?.quantity || 0);
                const price = Number(it?.unitPrice || it?.unit_price || 0);
                return acc + (qty > 0 ? qty * price : price || 0);
              }, 0);
              const total = Number(iq?.quoteAmount || itemsTotal || 0);

              return (
                <View style={styles.progressModalContent}>
                  {/* Scrollable Content - Chiếm 75% chiều cao */}
                  <ScrollView
                    style={styles.progressScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    {/* Header: service center + quote meta */}
                    <View style={styles.progressHeader}>
                      <View style={styles.serviceCenterInfo}>
                        <Text style={styles.sectionLabel}>Trung tâm dịch vụ</Text>
                        <Text style={styles.serviceCenterName}>
                          {progressData?.serviceCenter?.name || progressData?.centerName || 'EVCare'}
                        </Text>
                      </View>
                      <View style={styles.quoteMeta}>
                        <View style={styles.quoteMetaRow}>
                          <Text style={styles.sectionLabel}>Số báo giá:</Text>
                          <Text style={styles.quoteNumber}>
                            {progressData?.quoteNumber || (progressData?._id ? `#${String(progressData._id).slice(0, 8)}` : '')}
                          </Text>
                        </View>
                        <View style={styles.quoteMetaRow}>
                          <Text style={styles.sectionLabel}>Ngày báo giá:</Text>
                          <Text style={styles.quoteDate}>
                            {progressData?.quoteDate ? dayjs(progressData.quoteDate).format('DD/MM/YYYY') : (iq?.quotedAt ? dayjs(iq.quotedAt).format('DD/MM/YYYY') : '')}
                          </Text>
                        </View>
                        <View style={styles.quoteStatusContainer}>
                          <Chip
                            style={[
                              styles.quoteStatusChip,
                              {
                                backgroundColor: iq?.quoteStatus === 'approved' ? '#DCFCE7' :
                                  iq?.quoteStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7'
                              }
                            ]}
                            compact
                          >
                            {(iq?.quoteStatus || 'pending').toUpperCase()}
                          </Chip>
                        </View>
                      </View>
                    </View>

                    {/* Info cards: customer + vehicle */}
                    <View style={styles.infoCardsContainer}>
                      <Card style={styles.infoCard}>
                        <Card.Content>
                          <Text style={styles.infoCardTitle}>Thông tin khách hàng</Text>
                          <Text style={styles.infoCardText}>
                            {progressData?.customer?.fullName || progressData?.customerName || 'Khách hàng'}
                          </Text>
                        </Card.Content>
                      </Card>
                      <Card style={styles.infoCard}>
                        <Card.Content>
                          <Text style={styles.infoCardTitle}>Thông tin xe</Text>
                          <Text style={styles.infoCardText}>
                            Tình trạng: {iq?.vehicleCondition || '-'}
                          </Text>
                          <Text style={styles.infoCardText}>
                            Chẩn đoán: {iq?.diagnosisDetails || '-'}
                          </Text>
                        </Card.Content>
                      </Card>
                    </View>

                    {/* Inspection notes box */}
                    <Card style={styles.inspectionNotesCard}>
                      <Card.Content>
                        <Text style={styles.inspectionNotesTitle}>Ghi chú kiểm tra</Text>
                        <Text style={styles.inspectionNotesText}>
                          {iq?.inspectionNotes || 'Không có ghi chú kiểm tra'}
                        </Text>
                        {!!iq?.inspectionCompletedAt && (
                          <Text style={styles.inspectionCompletedAt}>
                            Hoàn thành kiểm tra: {new Date(iq?.inspectionCompletedAt).toLocaleString('vi-VN')}
                          </Text>
                        )}
                      </Card.Content>
                    </Card>

                    {/* Items table */}
                    <Card style={styles.itemsTableCard}>
                      <Card.Content style={{ padding: 0 }}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>STT</Text>
                          <Text style={[styles.tableHeaderText, { flex: 4 }]}>Tên linh kiện</Text>
                          <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>SL</Text>
                          <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Đơn giá</Text>
                          <Text style={[styles.tableHeaderText, { flex: 2, textAlign: 'right' }]}>Thành tiền</Text>
                        </View>

                        {items.length === 0 ? (
                          <View style={styles.emptyItems}>
                            <Text style={styles.emptyItemsText}>Không có linh kiện trong báo giá</Text>
                          </View>
                        ) : (
                          items.map((it: any, idx: number) => {
                            const name = it?.name || it?.partName || it?.part?.name || 'Linh kiện';
                            const qty = Number(it?.quantity || 0);
                            const price = Number(it?.unitPrice || it?.unit_price || 0);
                            const subtotal = qty && price ? qty * price : price || 0;

                            return (
                              <View
                                key={idx}
                                style={[
                                  styles.tableRow,
                                  idx % 2 === 0 && styles.tableRowEven
                                ]}
                              >
                                <Text style={[styles.tableCell, { flex: 0.6 }]}>{idx + 1}</Text>
                                <Text style={[styles.tableCell, { flex: 4 }]} numberOfLines={2}>{name}</Text>
                                <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{qty || '-'}</Text>
                                <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{formatVND(price)}</Text>
                                <Text style={[styles.tableCell, styles.subtotalCell, { flex: 2, textAlign: 'right' }]}>
                                  {formatVND(subtotal)}
                                </Text>
                              </View>
                            );
                          })
                        )}
                      </Card.Content>
                    </Card>

                    {/* Total amount */}
                    <Card style={styles.totalCard}>
                      <Card.Content>
                        <View style={styles.totalContainer}>
                          <Text style={styles.totalLabel}>Tổng cộng</Text>
                          <Text style={styles.totalAmount}>{formatVND(total)}</Text>
                        </View>
                      </Card.Content>
                    </Card>

                    {/* Milestones (if any) */}
                    {!!progressData?.milestones?.length && (
                      <Card style={styles.milestonesCard}>
                        <Card.Title title="Các mốc tiến độ" titleStyle={styles.milestonesTitle} />
                        <Card.Content>
                          {progressData.milestones.map((m: any, index: number) => (
                            <View key={m._id || m.name} style={styles.milestoneItem}>
                              <View style={styles.milestoneIcon}>
                                <Icon
                                  name={m.status === 'completed' ? "checkmark-circle" : "ellipse-outline"}
                                  size={16}
                                  color={m.status === 'completed' ? '#10B981' : '#6B7280'}
                                />
                              </View>
                              <View style={styles.milestoneContent}>
                                <Text style={styles.milestoneName}>{m.name}</Text>
                                {m.completedAt && (
                                  <Text style={styles.milestoneDate}>
                                    {new Date(m.completedAt).toLocaleString('vi-VN')}
                                  </Text>
                                )}
                              </View>
                              {!!m.status && (
                                <Chip
                                  style={[
                                    styles.milestoneChip,
                                    m.status === 'completed' && styles.milestoneChipCompleted
                                  ]}
                                  compact
                                >
                                  {m.status}
                                </Chip>
                              )}
                            </View>
                          ))}
                        </Card.Content>
                      </Card>
                    )}
                  </ScrollView>

                  {/* Fixed Actions - Chiếm 25% chiều cao */}
                  {(['', 'pending'].includes(String((iq?.quoteStatus || '')).toLowerCase())) && (
                    <View style={styles.progressActions}>
                      <View style={styles.actionsHeader}>
                        <Text style={styles.actionsTitle}>Xác nhận báo giá</Text>
                        <Text style={styles.actionsSubtitle}>Vui lòng xem xét và đưa ra quyết định</Text>
                      </View>

                      <View style={styles.actionsButtons}>
                        <Button
                          mode="contained"
                          icon="check"
                          onPress={() => submitQuoteResponse('approved')}
                          loading={progressLoading}
                          style={styles.approveButton}
                          contentStyle={styles.buttonContent}
                          labelStyle={styles.buttonLabel}
                        >
                          Chấp nhận
                        </Button>

                        <Button
                          mode="outlined"
                          icon="close"
                          onPress={() => submitQuoteResponse('rejected')}
                          loading={progressLoading}
                          style={styles.rejectButton}
                          contentStyle={styles.buttonContent}
                          labelStyle={styles.buttonLabel}
                        >
                          Từ chối
                        </Button>
                      </View>
                    </View>
                  )}
                </View>
              );
            })()
          )}
        </Modal>

        {/* Reschedule Modal */}
        <Modal visible={rescheduleOpen} onDismiss={() => setRescheduleOpen(false)} contentContainerStyle={styles.modalBox}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Đổi lịch hẹn</Text>
          <Divider style={{ marginVertical: 12 }} />

          {/* Date Selection */}
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.label, { fontSize: 14, fontWeight: '600', marginBottom: 8 }]}>Chọn ngày mới</Text>
            <TextInput
              mode="outlined"
              label="Ngày mới"
              value={newDate ? dayjs(newDate).format('DD/MM/YYYY') : ''}
              right={<TextInput.Icon icon="calendar" onPress={() => setShowRescheduleDatePicker(true)} />}
              editable={false}
              style={{ marginBottom: 8 }}
            />

            {/* Quick date option */}
            <View style={{ marginTop: 8 }}>
              <Button
                mode="outlined"
                compact
                onPress={() => setNewDate(new Date())}
                style={{ alignSelf: 'flex-start' }}
              >
                Chọn hôm nay
              </Button>
            </View>
          </View>
          {!!newDate && (
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Icon name="time-outline" size={20} color="#1890ff" />
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#1f2937',
                  marginLeft: 8
                }}>
                  Chọn giờ đến
                </Text>
              </View>

              {/* Toggle time selection mode */}
              <View style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 4, marginBottom: 12 }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: timeMode === 'preset' ? '#1890ff' : 'transparent' }}
                  onPress={() => { setTimeMode('preset'); setRescheduleErr(''); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: timeMode === 'preset' ? 'white' : '#6b7280' }}>Giờ có sẵn</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: timeMode === 'custom' ? '#1890ff' : 'transparent' }}
                  onPress={() => { setTimeMode('custom'); setRescheduleErr(''); }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: timeMode === 'custom' ? 'white' : '#6b7280' }}>Tự chọn giờ</Text>
                </TouchableOpacity>
              </View>

              {slotLoading ? (
                <View style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 12,
                  padding: 20,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <ProgressBar indeterminate color="#1890ff" />
                  <Text style={{
                    textAlign: 'center',
                    marginTop: 12,
                    color: '#6b7280',
                    fontSize: 14
                  }}>
                    Đang tải khung giờ...
                  </Text>
                </View>
              ) : (
                <View>
                  {timeMode === 'preset' && slots.length > 0 ? (
                    <>
                      <TouchableOpacity
                        ref={timeButtonRef}
                        style={{
                          borderWidth: 1,
                          borderColor: slot ? '#1890ff' : '#e2e8f0',
                          borderRadius: 10,
                          padding: 12,
                          backgroundColor: slot ? '#f0f9ff' : 'white',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onPress={() => {
                          if (timeButtonRef.current && (timeButtonRef.current as any).measureInWindow) {
                            (timeButtonRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                              setTimeAnchor({ x, y, width, height });
                              setShowTimeDropdown(true);
                            });
                          } else {
                            setShowTimeDropdown(true);
                          }
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            color: slot ? '#1890ff' : '#6b7280',
                            fontSize: 16,
                            fontWeight: slot ? '600' : '400'
                          }}>
                            {slot ?
                              slots.find(s => s.startTime === slot) ?
                                `${formatTime12h(slots.find(s => s.startTime === slot)!.startTime)}` :
                                'Chọn giờ đến'
                              : 'Chọn giờ đến'
                            }
                          </Text>
                          {!slot && (
                            <Text style={{
                              color: '#9ca3af',
                              fontSize: 11,
                              marginTop: 2
                            }}>
                              Tap để xem các giờ đến có sẵn
                            </Text>
                          )}
                        </View>
                        <View style={{
                          backgroundColor: slot ? '#1890ff' : '#f3f4f6',
                          borderRadius: 6,
                          padding: 4
                        }}>
                          <Icon
                            name="chevron-down"
                            size={16}
                            color={slot ? 'white' : '#6b7280'}
                          />
                        </View>
                      </TouchableOpacity>

                      {showTimeDropdown && (
                        <Portal>
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => setShowTimeDropdown(false)}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                          >
                            {(() => {
                              const { height: screenH } = Dimensions.get('window');
                              const dropdownHeight = Math.min(280, Math.max(44 * Math.min(slots.length, 6), 160));
                              const below = timeAnchor.y + timeAnchor.height + dropdownHeight + 8 <= screenH;
                              const top = below ? timeAnchor.y + timeAnchor.height + 8 : Math.max(timeAnchor.y - dropdownHeight - 8, 8);
                              return (
                                <View
                                  style={{
                                    position: 'absolute',
                                    left: 16,
                                    right: 16,
                                    top,
                                    backgroundColor: 'white',
                                    borderWidth: 1,
                                    borderColor: '#e5e7eb',
                                    borderRadius: 8,
                                    maxHeight: 280,
                                    elevation: 12,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 8,
                                    overflow: 'hidden'
                                  }}
                                >
                                  <ScrollView style={{ maxHeight: 280 }}>
                                    {slots.map((s) => (
                                      <TouchableOpacity
                                        key={`${s.startTime}-${s.endTime}`}
                                        onPress={() => { setSlot(s.startTime); setShowTimeDropdown(false); }}
                                        style={{ paddingVertical: 10, paddingHorizontal: 12, backgroundColor: slot === s.startTime ? '#f0f9ff' : 'white' }}
                                      >
                                        <Text style={{ fontSize: 14, color: '#1f2937' }}>{`${formatTime12h(s.startTime)}`}</Text>
                                      </TouchableOpacity>
                                    ))}
                                  </ScrollView>
                                </View>
                              );
                            })()}
                          </TouchableOpacity>
                        </Portal>
                      )}
                    </>
                  ) : timeMode === 'custom' ? (
                    <TextInput
                      mode="outlined"
                      label="Giờ đến (VD: 14:30)"
                      placeholder="Nhập giờ bạn muốn đến"
                      value={customTime}
                      onChangeText={handleCustomTimeChange}
                      keyboardType="numeric"
                      maxLength={5}
                      onBlur={() => { if (/^\d{2}$/.test(customTime)) handleCustomTimeChange(`${customTime}:00`); }}
                    />
                  ) : (
                    <View style={{
                      backgroundColor: '#fef2f2',
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#fecaca',
                      alignItems: 'center'
                    }}>
                      <Icon name="alert-circle-outline" size={24} color="#dc2626" />
                      <Text style={{
                        color: '#dc2626',
                        textAlign: 'center',
                        fontWeight: '600',
                        marginTop: 8,
                        fontSize: 14
                      }}>
                        Không có khung giờ trống
                      </Text>
                      <Text style={{
                        color: '#991b1b',
                        textAlign: 'center',
                        marginTop: 4,
                        fontSize: 12
                      }}>
                        Vui lòng chọn ngày khác
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          {!!rescheduleErr && <HelperText type="error">{rescheduleErr}</HelperText>}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
            <Button onPress={() => setRescheduleOpen(false)}>Hủy</Button>
            <Button onPress={onSubmitReschedule} loading={loading}>Xác nhận</Button>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Icon name="chatbubble-outline" size={16} color="#6B7280" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>Nhận xét của bạn</Text>
            </View>
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

      <Portal>
        {snack ? (() => {
          const meta = {
            success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981', icon: 'checkmark-circle-outline' },
            error: { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444', icon: 'alert-circle-outline' },
            info: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6', icon: 'information-circle-outline' },
            warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B', icon: 'warning-outline' },
          }[snackType];
          return (
            <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
              <Animated.View style={{ transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, Math.max(insets.top, 8)] }) }], opacity: toastAnim, paddingHorizontal: 16, paddingTop: 8 }}>
                <TouchableOpacity onPress={() => setSnack('')} activeOpacity={0.95}>
                  <View style={{ backgroundColor: meta.bg, borderLeftWidth: 4, borderLeftColor: meta.border, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}>
                    <Icon name={meta.icon as any} size={18} color={meta.border} />
                    <Text style={{ color: meta.text, flex: 1 }}>{snack}</Text>
                    <Icon name="close" size={16} color={meta.text} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          );
        })() : null}
      </Portal>
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
  statTotalCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBox: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dateDay: { fontSize: 20, fontWeight: '800', color: '#111827' },
  dateMonth: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dateWeek: { fontSize: 11, color: '#9CA3AF' },
  itemMiddle: { flex: 1, justifyContent: 'center' },
  metaRowSmall: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaTextSmall: { marginLeft: 6, color: '#6B7280', fontSize: 13 },
  itemRight: { width: 180, alignItems: 'flex-end', justifyContent: 'flex-start' },
  actionRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' },
  iconBtn: { padding: 6, marginLeft: 6, borderRadius: 10, backgroundColor: '#f8fafc' },
  iconBtnDisabled: { padding: 6, marginLeft: 6, borderRadius: 10, backgroundColor: '#f8fafc', opacity: 0.45 },
  feedbackSmall: { backgroundColor: '#F0FDF4', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#BBF7D0' },
  rateBtn: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
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
  progressModal: {
    margin: 8,
    backgroundColor: 'white',
    padding: 0,
    borderRadius: 16,
    maxHeight: '90%',
    height: '90%',
  },
  progressModalContent: {
    flex: 1,
    flexDirection: 'column',
  },
  progressScrollContent: {
    flex: 0.75, // 75% cho nội dung scroll
    padding: 16,
  },
  progressActions: {
    flex: 0.25, // 25% cho phần actions
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    justifyContent: 'space-between',
  },

  // Progress Header
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  serviceCenterInfo: {
    flex: 1,
  },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  serviceCenterName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  quoteMeta: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quoteNumber: {
    fontWeight: '700',
    color: '#1f2937',
    marginLeft: 6,
  },
  quoteDate: {
    color: '#1f2937',
    marginLeft: 6,
  },
  quoteStatusContainer: {
    marginTop: 8,
  },
  quoteStatusChip: {
    borderWidth: 0,
  },

  // Info Cards
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  infoCardTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#374151',
    fontSize: 14,
  },
  infoCardText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },

  // Inspection Notes
  inspectionNotesCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    marginBottom: 16,
  },
  inspectionNotesTitle: {
    fontWeight: '700',
    marginBottom: 8,
    color: '#2563EB',
    fontSize: 14,
  },
  inspectionNotesText: {
    color: '#1E40AF',
    fontSize: 13,
    lineHeight: 18,
  },
  inspectionCompletedAt: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Items Table
  itemsTableCard: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderColor: '#e6edf8',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderText: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 50,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 13,
    color: '#4B5563',
  },
  subtotalCell: {
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyItems: {
    padding: 24,
    alignItems: 'center',
  },
  emptyItemsText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  // Total Card
  totalCard: {
    marginBottom: 16,
    backgroundColor: '#1E40AF',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },

  // Milestones
  milestonesCard: {
    marginBottom: 16,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  milestoneIcon: {
    marginRight: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneName: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 14,
  },
  milestoneDate: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  milestoneChip: {
    marginLeft: 8,
  },
  milestoneChipCompleted: {
    backgroundColor: '#DCFCE7',
  },

  // Actions Section
  actionsHeader: {
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionsButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
  },
  rejectButton: {
    flex: 1,
    borderColor: '#EF4444',
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingHistoryScreen;
