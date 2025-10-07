import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { getMyPayments } from '../../service/slices/paymentSlice.ts/paymentSlice';
import PaymentStatus from './PaymentStatus';
import PaymentModal from './PaymentModal';
import { formatCurrencyVND } from '../../utils/paymentUtils';
import { PaymentStatus as PaymentStatusType, Payment } from '../../types/payment';
import { PAYMENT_STATUS_ENDPOINT } from '../../service/constants/apiConfig';
import { axiosInstance } from '../../service/constants/axiosConfig';
import dayjs from 'dayjs';

const { width } = Dimensions.get('window');

const PaymentHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { myPayments, pagination, loading } = useAppSelector((state: any) => state.payment);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | 'all'>('all');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | ''>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Payment detail modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [paymentDetail, setPaymentDetail] = useState<Payment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPayments = React.useCallback(() => {
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

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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
  const stats = {
    totalPaid: myPayments.filter((p: Payment) => p.status === 'paid').length,
    totalPending: myPayments.filter((p: Payment) => p.status === 'pending').length,
    totalFailed: myPayments.filter((p: Payment) => ['failed', 'cancelled', 'expired'].includes(p.status)).length,
    totalAmount: myPayments.filter((p: Payment) => p.status === 'paid').reduce((sum: number, p: Payment) => sum + p.paymentInfo.amount, 0)
  };

  // Mobile-friendly payment card component
  const PaymentCard: React.FC<{ payment: Payment }> = ({ payment }) => {
    const appointment = typeof payment.appointment === 'object' ? payment.appointment : null;
    
    return (
      <View style={styles.paymentCard}>
        {/* Header with order code and status */}
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderCode}>#{payment.paymentInfo.orderCode}</Text>
            <PaymentStatus status={payment.status} />
          </View>
          <View style={styles.amountInfo}>
            <Text style={styles.amount}>{formatCurrencyVND(payment.paymentInfo.amount)}</Text>
            <Text style={styles.date}>
              {dayjs(payment.createdAt).format('DD/MM/YYYY HH:mm')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Service info */}
        {appointment && (
          <View style={styles.serviceInfo}>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceLabel}>Dịch vụ:</Text>
              <Text style={styles.serviceText}>
              {typeof appointment.serviceType === 'object'
                ? appointment.serviceType?.name
                : 'Không xác định'}
              </Text>
            </View>
            <View style={styles.serviceItem}>
              <Text style={styles.serviceLabel}>Trung tâm:</Text>
              <Text style={styles.serviceText}>
                {typeof appointment.serviceCenter === 'object'
                  ? appointment.serviceCenter?.name
                  : 'Không xác định'}
              </Text>
            </View>
            {appointment.appointmentTime && (
              <View style={styles.serviceItem}>
                <Text style={styles.serviceLabel}>Thời gian hẹn:</Text>
                <Text style={styles.serviceText}>
                  {dayjs(appointment.appointmentTime.date).format('DD/MM/YYYY')} - {appointment.appointmentTime.startTime}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleViewDetails(payment._id)}
            disabled={detailLoading}
          >
            <Text style={styles.actionButtonText}>Chi tiết</Text>
          </TouchableOpacity>
          
          {payment.status === 'pending' && payment.payosInfo && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleContinuePayment(payment)}
            >
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>Thanh toán</Text>
            </TouchableOpacity>
          )}
          
          {payment.status === 'paid' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadReceipt(payment._id)}
            >
              <Text style={styles.actionButtonText}>Hóa đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <PaymentCard payment={item} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Lịch sử thanh toán</Text>
          <Text style={styles.headerSubtitle}>Quản lý giao dịch</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchPayments}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>Làm mới</Text>
        </TouchableOpacity>
      </View> */}

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalPaid}</Text>
            <Text style={styles.statLabel}>Đã thanh toán</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.pendingValue]}>{stats.totalPending}</Text>
            <Text style={styles.statLabel}>Chờ thanh toán</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.failedValue]}>{stats.totalFailed}</Text>
            <Text style={styles.statLabel}>Thất bại/Hủy</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.amountValue]}>
              {formatCurrencyVND(stats.totalAmount)}
            </Text>
            <Text style={styles.statLabel}>Tổng tiền</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Bộ lọc</Text>
        
        {/* Status Filter */}
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Trạng thái:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterButtons}>
              {['all', 'pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterButton,
                    statusFilter === status && styles.activeFilterButton
                  ]}
                  onPress={() => handleStatusFilterChange(status as PaymentStatusType | 'all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    statusFilter === status && styles.activeFilterButtonText
                  ]}>
                    {status === 'all' ? 'Tất cả' : 
                     status === 'pending' ? 'Chờ thanh toán' :
                     status === 'paid' ? 'Đã thanh toán' :
                     status === 'failed' ? 'Thất bại' :
                     status === 'cancelled' ? 'Đã hủy' :
                     status === 'expired' ? 'Hết hạn' : 'Đã hoàn tiền'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
        </TouchableOpacity>
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

      {/* Pagination */}
      {pagination && pagination.totalItems > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationText}>
            {pagination.currentPage} / {Math.ceil(pagination.totalItems / pagination.itemsPerPage)} trang
          </Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                pagination.currentPage <= 1 && styles.disabledButton
              ]}
              onPress={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
            >
              <Text style={styles.paginationButtonText}>Trước</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.itemsPerPage) && styles.disabledButton
              ]}
              onPress={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
            >
              <Text style={styles.paginationButtonText}>Sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
    padding: 16,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  pendingValue: {
    color: '#faad14',
  },
  failedValue: {
    color: '#ff4d4f',
  },
  amountValue: {
    color: '#52c41a',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#1890ff',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
  },
  activeFilterButtonText: {
    color: 'white',
  },
  clearFiltersButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#666',
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
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
  },
  orderCode: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52c41a',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  serviceInfo: {
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  serviceText: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1890ff',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  primaryButtonText: {
    color: 'white',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  paginationText: {
    fontSize: 14,
    color: '#666',
  },
  paginationButtons: {
    flexDirection: 'row',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  paginationButtonText: {
    fontSize: 14,
    color: '#666',
  },
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