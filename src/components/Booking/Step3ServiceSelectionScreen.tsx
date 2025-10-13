import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, FlatList, Alert } from 'react-native';
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
import { fetchCompatibleServices, setSelectedService, updateBookingData } from '../../service/slices/bookingSlice';
import { ServiceType } from '../../types/booking';

interface Step3ServiceSelectionScreenProps {
  onNext: () => void;
  onPrev: () => void;
}

const Step3ServiceSelectionScreen: React.FC<Step3ServiceSelectionScreenProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {
    compatibleServices,
    selectedService,
    selectedVehicle,
    loading
  } = useAppSelector((state) => state.booking);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const isInspectionOnly = useAppSelector((s) => s.booking.bookingData.isInspectionOnly) || false;

  useEffect(() => {
    if (selectedVehicle?._id) {
      dispatch(fetchCompatibleServices(selectedVehicle._id));
    }
  }, [dispatch, selectedVehicle?._id]);

  const filteredServices = compatibleServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(compatibleServices.map(service => service.category))];

  const handleSelectService = (service: ServiceType) => {
    if (selectedService?._id === service._id) {
      dispatch(setSelectedService(null));
      return;
    }
    if (isInspectionOnly) dispatch(updateBookingData({ isInspectionOnly: false }));
    dispatch(setSelectedService(service));
  };

  const handleToggleInspectionOnly = () => {
    const nextVal = !isInspectionOnly;
    dispatch(updateBookingData({ isInspectionOnly: nextVal }));
    if (nextVal) {
      dispatch(setSelectedService(null));
    }
  };

  const handleNext = () => {
    if (!selectedService && !isInspectionOnly) {
      Alert.alert('Lỗi', 'Vui lòng chọn dịch vụ hoặc chỉ kiểm tra');
      return;
    }
    onNext();
  };

  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'repair': return 'Sửa chữa';
      case 'inspection': return 'Kiểm tra';
      case 'maintenance': return 'Bảo dưỡng';
      default: return category;
    }
  };

  const toggleCardExpansion = (serviceId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  const renderService = ({ item: service }: { item: ServiceType }) => {
    const isSelected = selectedService?._id === service._id;
    const isExpanded = expandedCards.has(service._id);

    return (
      <View style={[
        styles.serviceCard,
        isSelected && styles.selectedServiceCard
      ]}>
        {/* Card Header - Always Visible */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => handleSelectService(service)}
        >
          <View style={styles.headerLeft}>
            <View style={styles.serviceTitleRow}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.isPopular && (
                <View style={styles.popularChip}>
                  <Text style={styles.popularText}>Phổ biến</Text>
                </View>
              )}
            </View>
            <Text style={styles.serviceDescription} numberOfLines={1}>
              {service.description}
            </Text>
            <View style={styles.quickInfo}>
              <Icon name="cash-outline" size={12} color="#10B981" />
              <Text style={styles.quickInfoText}>
                {formatPrice(service?.pricing?.basePrice)}
              </Text>
              <Icon name="people-outline" size={12} color="#6B7280" />
              <Text style={styles.quickInfoText}>
                {service?.serviceDetails?.minTechnicians || 1}-{service?.serviceDetails?.maxTechnicians || 1} kỹ thuật viên
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.statusChip, { backgroundColor: service?.status === 'active' ? '#05966920' : '#D9770620' }]}>
              <Text style={[styles.statusChipText, { color: service?.status === 'active' ? '#059669' : '#D97706' }]}>
                {service?.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
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
            <View style={styles.serviceInfo}>
              <View style={styles.infoRow}>
                <Icon name="cash-outline" size={16} color="#10B981" />
                <Text style={styles.infoText}>
                  {formatPrice(service?.pricing?.basePrice)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>
                  {service?.serviceDetails?.minTechnicians || 1}-{service?.serviceDetails?.maxTechnicians || 1} kỹ thuật viên
                </Text>
              </View>
            </View>

            <View style={styles.serviceDetails}>
              <Text style={styles.detailsTitle}>Chi tiết dịch vụ</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Giá cơ bản:</Text>
                  <Text style={styles.detailValue}>
                    {formatPrice(service?.pricing?.basePrice)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Có thể thương lượng:</Text>
                  <Text style={styles.detailValue}>
                    {service?.pricing?.isNegotiable ? 'Có' : 'Không'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kỹ thuật viên tối thiểu:</Text>
                  <Text style={styles.detailValue}>
                    {service?.serviceDetails?.minTechnicians || 1}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Kỹ thuật viên tối đa:</Text>
                  <Text style={styles.detailValue}>
                    {service?.serviceDetails?.maxTechnicians || 1}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>
                    {service?.status || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Expand/Collapse Button */}
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => toggleCardExpansion(service._id)}
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
          placeholder="Tìm kiếm dịch vụ..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          left={<TextInput.Icon icon="magnify" size={16} />}
          style={styles.searchInput}
          contentStyle={styles.searchInputContent}
        />
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterOpen(true)}
        >
          <Icon name="filter-outline" size={16} color="#1890ff" />
          <Text style={styles.filterButtonText}>Bộ lọc</Text>
        </TouchableOpacity>
      </View>

      {/* Services List */}
      <View style={styles.listContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dịch vụ ({filteredServices.length})</Text>
        </View>

        {filteredServices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="construct-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Không tìm thấy dịch vụ nào</Text>
            <Text style={styles.emptySubtitle}>
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredServices}
            renderItem={renderService}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Inspection-only Option */}
      <Card style={[
        styles.inspectionCard,
        isInspectionOnly && styles.selectedInspectionCard
      ]}>
        <Card.Content>
          <View style={styles.inspectionContent}>
            <View style={styles.inspectionInfo}>
              <Text style={styles.inspectionTitle}>Chỉ mang xe tới kiểm tra</Text>
              <Text style={styles.inspectionDescription}>
                Không chọn dịch vụ cụ thể, chỉ kiểm tra tình trạng
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.inspectionButton,
                isInspectionOnly && styles.selectedInspectionButton
              ]}
              onPress={handleToggleInspectionOnly}
            >
              <Text style={[
                styles.inspectionButtonText,
                isInspectionOnly && styles.selectedInspectionButtonText
              ]}>
                {isInspectionOnly ? 'Đã chọn' : 'Chọn'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

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
          disabled={!selectedService && !isInspectionOnly}
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
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Danh mục</Text>
            <View style={styles.categoryContainer}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    tempCategory === category && styles.selectedCategoryButton
                  ]}
                  onPress={() => setTempCategory(category)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    tempCategory === category && styles.selectedCategoryButtonText
                  ]}>
                    {getCategoryText(category)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setTempCategory('all');
                setFilterOpen(false);
              }}
              style={styles.modalButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                setCategoryFilter(tempCategory);
                setFilterOpen(false);
              }}
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    gap: 4,
    height: 40,
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
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  listContent: {
    paddingBottom: 16,
  },
  serviceCard: {
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
  selectedServiceCard: {
    borderColor: '#1890ff',
    backgroundColor: '#f0f9ff',
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
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  popularChip: {
    backgroundColor: '#10B98120',
    borderColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickInfoText: {
    fontSize: 11,
    color: '#6b7280',
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    marginBottom: 4,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
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
  serviceDetails: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailsGrid: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
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
  inspectionCard: {
    margin: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedInspectionCard: {
    borderColor: '#1890ff',
    backgroundColor: '#f0f9ff',
  },
  inspectionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inspectionInfo: {
    flex: 1,
    marginRight: 16,
  },
  inspectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  inspectionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  inspectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedInspectionButton: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  inspectionButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedInspectionButtonText: {
    color: 'white',
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
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  selectedCategoryButton: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: 'white',
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

export default Step3ServiceSelectionScreen;
