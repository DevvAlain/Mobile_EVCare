import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {
  Button,
  Card,
  TextInput,
  Chip,
  useTheme,
  ProgressBar,
  Portal,
  Modal,
  Checkbox,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { fetchServiceCenters } from '../../service/slices/serviceCenterSlice';
import { setSelectedServiceCenter } from '../../service/slices/bookingSlice';
import { ServiceCenter } from '../../types/serviceCenter';
import RealTimeStatus from '../ServiceCenter/RealTimeStatus';
import { isCurrentlyOpen } from '../../utils/timeUtils';
import { useServiceCenterRatings } from '../../hooks/useServiceCenterRatings';
import { Alert } from 'react-native';

interface Step2ServiceCenterSelectionScreenProps {
  onNext: () => void;
  onPrev: () => void;
}

const Step2ServiceCenterSelectionScreen: React.FC<Step2ServiceCenterSelectionScreenProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { serviceCenters, loading } = useAppSelector((state) => state.serviceCenter);
  const { selectedServiceCenter } = useAppSelector((state) => state.booking);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterSelection, setFilterSelection] = useState<'all' | 'nearby'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Use the ratings hook
  const { getEnhancedServiceCenters, loading: ratingsLoading } = useServiceCenterRatings(serviceCenters);

  useEffect(() => {
    dispatch(fetchServiceCenters());
  }, [dispatch]);

  // Get enhanced service centers with ratings
  const enhancedServiceCenters = getEnhancedServiceCenters();

  const filteredServiceCenters = enhancedServiceCenters.filter((center: ServiceCenter) => {
    const matchesSearch = center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address.street.toLowerCase().includes(searchTerm.toLowerCase()) ||
      center.address.district.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || center.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectServiceCenter = (center: ServiceCenter) => {
    if (!canSelectServiceCenter(center)) {
      return;
    }

    if (selectedServiceCenter?._id === center._id) {
      dispatch(setSelectedServiceCenter(null));
    } else {
      // Convert ServiceCenter to BookingServiceCenter format
      const bookingServiceCenter = {
        _id: center._id,
        name: center.name,
        description: center.description,
        address: center.address,
        contact: {
          phone: center.contact.phone,
          email: center.contact.email,
          website: center.contact.website || ''
        },
        operatingHours: center.operatingHours,
        capacity: center.capacity,
        rating: center.rating,
        aiSettings: center.aiSettings,
        services: center.services,
        staff: center.staff,
        status: center.status,
        images: center.images,
        paymentMethods: center.paymentMethods,
        createdAt: center.createdAt,
        updatedAt: center.updatedAt,
        __v: center.__v
      };
      dispatch(setSelectedServiceCenter(bookingServiceCenter as any));
    }
  };

  const handleNext = () => {
    if (!selectedServiceCenter) {
      Alert.alert('Lỗi', 'Vui lòng chọn trung tâm dịch vụ');
      return;
    }

    if (!canSelectServiceCenter(selectedServiceCenter as any)) {
      Alert.alert('Lỗi', 'Trung tâm đã chọn hiện không hoạt động. Vui lòng chọn trung tâm khác.');
      return;
    }

    onNext();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#059669';
      case 'maintenance': return '#D97706';
      case 'inactive': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'maintenance': return 'Bảo trì';
      case 'inactive': return 'Tạm dừng';
      default: return status;
    }
  };

  const isServiceCenterOpen = (center: ServiceCenter) => {
    if (!center.operatingHours) return false;
    return isCurrentlyOpen(center.operatingHours);
  };

  const canSelectServiceCenter = (center: ServiceCenter) => {
    return center.status === 'active' && isServiceCenterOpen(center);
  };

  const toggleCardExpansion = (centerId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(centerId)) {
        newSet.delete(centerId);
      } else {
        newSet.add(centerId);
      }
      return newSet;
    });
  };

  const handleFilterApply = () => {
    setFilterOpen(false);
    if (filterSelection === 'all') {
      setStatusFilter('all');
      dispatch(fetchServiceCenters());
    } else {
      // For mobile, we'll use a simple approach - just fetch all service centers
      // In a real app, you'd use @react-native-community/geolocation
      dispatch(fetchServiceCenters());
    }
  };

  if (loading || ratingsLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const renderServiceCenter = ({ item: center }: { item: ServiceCenter }) => {
    const canSelect = canSelectServiceCenter(center);
    const isSelected = selectedServiceCenter?._id === center._id;
    const isExpanded = expandedCards.has(center._id);

    return (
      <View style={[
        styles.serviceCenterCard,
        isSelected && styles.selectedServiceCenterCard,
        !canSelect && styles.disabledServiceCenterCard
      ]}>
        {/* Card Header - Always Visible */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => canSelect && handleSelectServiceCenter(center)}
          disabled={!canSelect}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.centerName}>{center.name}</Text>
            <Text style={styles.centerDescription} numberOfLines={1}>
              {center.description}
            </Text>
            <View style={styles.quickInfo}>
              <Icon name="location-outline" size={12} color="#6b7280" />
              <Text style={styles.quickInfoText}>
                {center.address.district}, {center.address.city}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusChip, { backgroundColor: `${getStatusColor(center.status)}20` }]}>
              <Text style={[styles.statusChipText, { color: getStatusColor(center.status) }]}>
                {getStatusText(center.status)}
              </Text>
            </View>
            {isSelected && (
              <Icon name="checkmark-circle" size={20} color="#1890ff" style={styles.selectedIcon} />
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.addressSection}>
              <Icon name="location-outline" size={16} color="#1890ff" />
              <View style={styles.addressInfo}>
                <Text style={styles.addressStreet}>{center.address.street}</Text>
                <Text style={styles.addressDetail}>
                  {center.address.ward}, {center.address.district}, {center.address.city}
                </Text>
              </View>
            </View>

            <View style={styles.contactSection}>
              <Icon name="call-outline" size={16} color="#10B981" />
              <Text style={styles.contactText}>{center.contact.phone}</Text>
            </View>

            <View style={styles.hoursSection}>
              <RealTimeStatus
                operatingHours={center.operatingHours}
                showNextOpening={true}
              />
            </View>

            <View style={styles.servicesSection}>
              <Text style={styles.servicesTitle}>Dịch vụ có sẵn:</Text>
              <View style={styles.servicesContainer}>
                {center.services.slice(0, 3).map((service) => (
                  <Chip key={service._id} style={styles.serviceChip} textStyle={styles.serviceChipText}>
                    {service.name}
                  </Chip>
                ))}
                {center.services.length > 3 && (
                  <Chip style={styles.moreServicesChip} textStyle={styles.moreServicesText}>
                    +{center.services.length - 3}
                  </Chip>
                )}
              </View>
            </View>

            {!canSelect && (
              <View style={styles.disabledMessage}>
                <Text style={styles.disabledText}>
                  {center.status !== 'active'
                    ? 'Trung tâm tạm dừng hoạt động'
                    : 'Trung tâm đang đóng cửa'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Expand/Collapse Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => toggleCardExpansion(center._id)}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? 'Thu gọn' : 'Xem thêm'}
          </Text>
          <Icon 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#1890ff" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
     

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <TextInput
          mode="outlined"
          placeholder="Tìm kiếm trung tâm..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          left={<TextInput.Icon icon="magnify" size={16} />}
          style={styles.searchInput}
          contentStyle={styles.searchInputContent}
        />
      </View>

      {/* Service Centers List */}
      <View style={styles.listContainer}>
        {filteredServiceCenters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Không tìm thấy trung tâm nào</Text>
            <Text style={styles.emptySubtitle}>
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredServiceCenters}
            renderItem={renderServiceCenter}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={onPrev}
          style={styles.backButton}
          contentStyle={styles.buttonContent}
        >
          Quay lại
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={!selectedServiceCenter}
          style={styles.nextButton}
          contentStyle={styles.buttonContent}
        >
          Tiếp theo
        </Button>
      </View>

      {/* Filter Modal */}
      <Portal>
        <Modal
          visible={filterOpen}
          onDismiss={() => setFilterOpen(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Bộ lọc</Text>
          
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setFilterSelection('all')}
            >
              <Checkbox
                status={filterSelection === 'all' ? 'checked' : 'unchecked'}
                onPress={() => setFilterSelection('all')}
              />
              <Text style={styles.filterOptionText}>Tất cả</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.filterOption}
              onPress={() => setFilterSelection('nearby')}
            >
              <Checkbox
                status={filterSelection === 'nearby' ? 'checked' : 'unchecked'}
                onPress={() => setFilterSelection('nearby')}
              />
              <Text style={styles.filterOptionText}>Gần tôi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setFilterOpen(false)}
              style={styles.modalButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={handleFilterApply}
              style={styles.modalButton}
            >
              Áp dụng
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#1890ff',
    padding: 20,
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: 'white',
    height: 40,
  },
  searchInputContent: {
    height: 40,
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  serviceCenterCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedServiceCenterCard: {
    borderColor: '#1890ff',
    backgroundColor: '#f0f9ff',
  },
  disabledServiceCenterCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  centerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  centerDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 4,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickInfoText: {
    fontSize: 11,
    color: '#6b7280',
  },
  statusChip: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedIcon: {
    marginTop: 4,
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  expandButtonText: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '500',
  },
  servicesTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressInfo: {
    flex: 1,
    marginLeft: 8,
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  addressDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  contactSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  hoursSection: {
    marginBottom: 8,
  },
  servicesSection: {
    marginBottom: 8,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceChip: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  serviceChipText: {
    fontSize: 12,
    color: '#1890ff',
  },
  moreServicesChip: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  moreServicesText: {
    fontSize: 12,
    color: '#6b7280',
  },
  disabledMessage: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  disabledText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  selectedText: {
    fontSize: 14,
    color: '#1890ff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1890ff',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
  },
  filterOptions: {
    gap: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});

export default Step2ServiceCenterSelectionScreen;
