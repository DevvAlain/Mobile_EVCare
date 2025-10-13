import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  Animated,
  BackHandler
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
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
import { useAppDispatch, useAppSelector } from '../../service/store';
import { getMyPayments } from '../../service/slices/paymentSlice.ts/paymentSlice';
import PaymentStatus from './PaymentStatus';
import PaymentModal from './PaymentModal';
import { formatCurrencyVND } from '../../utils/paymentUtils';
import { PaymentStatus as PaymentStatusType, Payment } from '../../types/payment';
import { PAYMENT_STATUS_ENDPOINT } from '../../service/constants/apiConfig';
import { axiosInstance } from '../../service/constants/axiosConfig';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');

const PaymentHistory: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { myPayments, pagination, loading } = useAppSelector((state: any) => state.payment);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | 'all'>('all');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Collapsible sections
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(true);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedStatsHeight = useRef(new Animated.Value(1)).current;

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Payment detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [snack, setSnack] = useState<string>('');

  const fetchPayments = useCallback(() => {
    const params: Record<string, string | number> = {
      page: currentPage,
      limit: pageSize
    };

    if (sortBy && sortOrder) {
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      params.startDate = dateRange[0].format('YYYY-MM-DD');
      params.endDate = dateRange[1].format('YYYY-MM-DD');
    }

    dispatch(getMyPayments(params));
  }, [currentPage, pageSize, statusFilter, sortBy, sortOrder, dateRange, dispatch]);

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

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Override back button behavior to go to Home instead of booking steps
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Navigate to Home instead of going back to booking steps
        navigation.navigate('Home' as never);
        return true; // Prevent default back behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [navigation])
  );

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  const handleStatusFilterChange = (value: PaymentStatusType | 'all') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    if (value === 'none') {
      setSortBy('');
      setSortOrder('');
    } else {
      const [newSortBy, newSortOrder] = value.split('-');
      setSortBy(newSortBy);
      setSortOrder(newSortOrder as 'asc' | 'desc');
    }
    setCurrentPage(1);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    setDateRange(dates);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateRange(null);
    setSortBy('');
    setSortOrder('');
    setCurrentPage(1);
  };

  const handleViewDetails = async (paymentId: string) => {
    setDetailLoading(true);
    try {
      const response = await axiosInstance.get(PAYMENT_STATUS_ENDPOINT(paymentId));
      if (response.data?.success) {
        setPaymentDetail(response.data.data);
        setDetailModalVisible(true);
      } else {
        Alert.alert('Lỗi', 'Không thể tải chi tiết thanh toán');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      Alert.alert('Lỗi', 'Lỗi khi tải chi tiết thanh toán');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadReceipt = (paymentId: string) => {
    Alert.alert('Thông báo', 'Download receipt feature coming soon');
    console.log('Download receipt:', paymentId);
  };

  const handleContinuePayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentModalVisible(true);
  };

  const handlePaymentModalCancel = () => {
    setPaymentModalVisible(false);
    setSelectedPayment(null);
  };

  const handlePaymentSuccess = () => {
    Alert.alert('Thành công', 'Thanh toán thành công!');
    setPaymentModalVisible(false);
    setSelectedPayment(null);
    fetchPayments();
  };

  const handleCloseDetailModal = () => {
    setDetailModalVisible(false);
    setPaymentDetail(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
    setRefreshing(false);
  };

  // Calculate statistics
  const stats = useMemo(() => ({
    total: myPayments.length,
    paid: myPayments.filter((p: Payment) => p.status === 'paid').length,
    pending: myPayments.filter((p: Payment) => p.status === 'pending').length,
    failed: myPayments.filter((p: Payment) => ['failed', 'cancelled', 'expired'].includes(p.status)).length,
    totalAmount: myPayments.filter((p: Payment) => p.status === 'paid').reduce((sum: number, p: Payment) => sum + p.paymentInfo.amount, 0)
  }), [myPayments]);

  // Modern payment card component
  const PaymentCard: React.FC<{ payment: Payment }> = ({ payment }) => {
    const appointment = typeof payment.appointment === 'object' ? payment.appointment : null;
    
    return (
      <TouchableOpacity style={styles.paymentCard} onPress={() => handleViewDetails(payment._id)}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderCode}>#{payment.paymentInfo.orderCode}</Text>
            <Text style={styles.paymentDate}>
              {dayjs(payment.createdAt).format('DD/MM/YYYY')}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <PaymentStatus status={payment.status} />
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Amount Info */}
          <View style={styles.amountSection}>
            <View style={styles.amountRow}>
              <Icon name="card-outline" size={18} color="#1890ff" />
              <View style={styles.amountInfo}>
                <Text style={styles.amountText}>
                  {formatCurrencyVND(payment.paymentInfo.amount)}
                </Text>
                <Text style={styles.paymentMethod}>
                  {payment.paymentMethod.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Service Info */}
          {appointment && (
            <View style={styles.serviceSection}>
              <View style={styles.serviceRow}>
                <Icon name="car-outline" size={18} color="#52c41a" />
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>
                    {typeof appointment.serviceType === 'object'
                      ? appointment.serviceType?.name
                      : 'Không xác định'}
                  </Text>
                  <Text style={styles.serviceCenter}>
                    {typeof appointment.serviceCenter === 'object'
                      ? appointment.serviceCenter?.name
                      : 'Không xác định'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Time Info */}
          {appointment?.appointmentTime && (
            <View style={styles.timeSection}>
              <View style={styles.timeRow}>
                <Icon name="time-outline" size={18} color="#52c41a" />
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>
                    {dayjs(appointment.appointmentTime.date).format('DD/MM/YYYY')} - {appointment.appointmentTime.startTime}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {payment.status === 'pending' && payment.payosInfo && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleContinuePayment(payment)}
            >
              <Icon name="card-outline" size={16} color="#ffffff" />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Thanh toán</Text>
            </TouchableOpacity>
          )}
          
          {payment.status === 'paid' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadReceipt(payment._id)}
            >
              <Icon name="download-outline" size={16} color="#52c41a" />
              <Text style={styles.actionButtonText}>Hóa đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <PaymentCard payment={item} />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Collapsible Filters */}
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
              onPress={clearFilters}
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
                { value: 'pending', label: 'Chờ thanh toán', icon: 'time-outline' },
                { value: 'paid', label: 'Đã thanh toán', icon: 'checkmark-circle-outline' },
                { value: 'failed', label: 'Thất bại', icon: 'close-circle-outline' },
                { value: 'cancelled', label: 'Đã hủy', icon: 'close-circle-outline' },
                { value: 'expired', label: 'Hết hạn', icon: 'time-outline' },
                { value: 'refunded', label: 'Đã hoàn tiền', icon: 'refresh-outline' }
              ].map(({ value, label, icon }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.filterChip,
                    statusFilter === value && styles.activeFilterChip
                  ]}
                  onPress={() => handleStatusFilterChange(value as PaymentStatusType | 'all')}
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
                <Icon name="card-outline" size={24} color="#1890ff" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Tổng giao dịch</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.paidCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="checkmark-circle-outline" size={24} color="#10B981" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.paidValue]}>{stats.paid}</Text>
                <Text style={styles.statLabel}>Đã thanh toán</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.pendingCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="time-outline" size={24} color="#F59E0B" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.pendingValue]}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Chờ thanh toán</Text>
              </View>
            </View>
            
            <View style={[styles.statCard, styles.failedCard]}>
              <View style={styles.statIconContainer}>
                <Icon name="close-circle-outline" size={24} color="#EF4444" />
              </View>
              <View style={styles.statContent}>
                <Text style={[styles.statValue, styles.failedValue]}>{stats.failed}</Text>
                <Text style={styles.statLabel}>Thất bại/Hủy</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      {/* Payment List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1890ff" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : myPayments.length > 0 ? (
          <FlatList
            data={myPayments}
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có dữ liệu thanh toán</Text>
          </View>
        )}
      </View>


      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          visible={paymentModalVisible}
          onCancel={handlePaymentModalCancel}
          paymentData={{
            paymentId: selectedPayment._id,
            orderCode: selectedPayment.paymentInfo.orderCode,
            paymentLink: selectedPayment.payosInfo.paymentLink,
            qrCode: selectedPayment.payosInfo.qrCode,
            checkoutUrl: selectedPayment.payosInfo.checkoutUrl,
            amount: selectedPayment.paymentInfo.amount,
            expiresAt: selectedPayment.expiresAt
          }}
          description={selectedPayment.paymentInfo.description}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payment Detail Modal */}
      {detailModalVisible && paymentDetail && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết thanh toán</Text>
              <TouchableOpacity onPress={handleCloseDetailModal}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Thông tin thanh toán</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.detailValue}>#{paymentDetail.paymentInfo.orderCode}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                    <PaymentStatus status={paymentDetail.status} />
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                      {formatCurrencyVND(paymentDetail.paymentInfo.amount)} VND
                    </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phương thức:</Text>
                  <Text style={styles.detailValue}>{paymentDetail.paymentMethod.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mô tả:</Text>
                  <Text style={styles.detailValue}>{paymentDetail.paymentInfo.description}</Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalButton} onPress={handleCloseDetailModal}>
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
  },
  
  // Filters
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
  filtersHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  // Statistics
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
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
  paidCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  pendingCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fed7aa',
  },
  failedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
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
  paidValue: {
    color: '#10B981',
  },
  pendingValue: {
    color: '#F59E0B',
  },
  failedValue: {
    color: '#EF4444',
  },
  amountValue: {
    color: '#10B981',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Payment Cards
  paymentCard: {
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
  paymentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    marginBottom: 16,
  },
  amountSection: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInfo: {
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
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

  // List
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


  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: width * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  modalBody: {
    maxHeight: 400,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    backgroundColor: '#1890ff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    padding: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default PaymentHistory;