import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, TouchableWithoutFeedback } from 'react-native';
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
  RadioButton,
  Divider,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../service/store';
import {
  updateBookingData,
  createBooking,
  resetBooking
} from '../../service/slices/bookingSlice';
import { clearCurrentPayment } from '../../service/slices/paymentSlice.ts/paymentSlice';
import PaymentModal from '../../screens/Payment/PaymentModal';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

interface Step4DateTimeAndDetailsScreenProps {
  onPrev: () => void;
}

const Step4DateTimeAndDetailsScreen: React.FC<Step4DateTimeAndDetailsScreenProps> = ({ onPrev }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const {
    selectedService,
    selectedVehicle,
    selectedServiceCenter,
    createBookingLoading,
    bookingData
  } = useAppSelector((state) => state.booking);
  const isInspectionOnlyFromState = useAppSelector((s) => s.booking.bookingData.isInspectionOnly) || false;
  const user = useAppSelector((s) => s.auth.user);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [customTime, setCustomTime] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [serviceDescription, setServiceDescription] = useState<string>('');
  const [paymentPreference, setPaymentPreference] = useState<'online' | 'offline'>('offline');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [timeSelectionMode, setTimeSelectionMode] = useState<'preset' | 'custom'>('preset');

  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<any>(null);

  // Predefined time slots
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];


  // Update booking data when form changes
  useEffect(() => {
    const finalTime = timeSelectionMode === 'custom' ? customTime : selectedTime;
    const newBookingData = {
      appointmentDate: selectedDate,
      appointmentTime: finalTime,
      serviceDescription,
      paymentPreference,
    };

    const hasChanges = Object.keys(newBookingData).some(key => {
      const currentValue = newBookingData[key as keyof typeof newBookingData];
      const existingValue = bookingData[key as keyof typeof bookingData];
      return currentValue !== existingValue;
    });

    if (hasChanges) {
      dispatch(updateBookingData(newBookingData));
    }
  }, [selectedDate, selectedTime, customTime, timeSelectionMode, serviceDescription, paymentPreference, dispatch, bookingData]);

  const handleDateSelect = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    setSelectedDate(dateString);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCustomTime('');
    setShowTimeDropdown(false);
  };

  const handleCustomTimeChange = (time: string) => {
    setCustomTime(time);
    setSelectedTime('');
  };

  const handleTimeModeChange = (mode: 'preset' | 'custom') => {
    setTimeSelectionMode(mode);
    if (mode === 'custom') {
      setSelectedTime('');
    } else {
      setCustomTime('');
    }
  };

  const formatTime12h = (time: string) => {
    if (!time) return 'N/A';
    const [h, m] = time.split(':').map(Number);
    const ap = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
  };

  const handleCreateBooking = async () => {
    const finalTime = timeSelectionMode === 'custom' ? customTime : selectedTime;
    if (!selectedDate || !finalTime) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày và giờ');
      return;
    }

    if (!selectedServiceCenter) {
      Alert.alert('Lỗi', 'Không tìm thấy trung tâm dịch vụ');
      return;
    }

    try {
      const bookingPayload = {
        customerId: user?.id as string,
        priority: 'low' as const,
        vehicleId: selectedVehicle?._id as string,
        serviceCenterId: selectedServiceCenter._id,
        serviceTypeId: selectedService?._id,
        appointmentDate: selectedDate,
        appointmentTime: finalTime,
        serviceDescription,
        paymentPreference,
        isInspectionOnly: isInspectionOnlyFromState,
      };

      const result = await dispatch(createBooking(bookingPayload)).unwrap();
      setBookingResponse(result);

      if (result.success) {
        if (paymentPreference === 'online' && result.data.requiresPayment) {
          // Chọn thanh toán online và cần thanh toán -> hiển thị PaymentModal
          setPaymentModalVisible(true);
        } else if (paymentPreference === 'online' && !result.data.requiresPayment) {
          // Chọn thanh toán online nhưng không cần thanh toán -> chuyển đến PaymentHistory
          Alert.alert('Thành công', 'Đặt lịch thành công!', [
            {
              text: 'OK',
              onPress: () => {
                dispatch(resetBooking());
                // Reset navigation stack và chuyển đến PaymentHistory
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'PaymentHistory' as never }],
                });
              }
            }
          ]);
        } else {
          // Chọn thanh toán offline -> chuyển đến PaymentHistory
          Alert.alert('Thành công', 'Đặt lịch thành công!', [
            {
              text: 'OK',
              onPress: () => {
                dispatch(resetBooking());
                // Reset navigation stack và chuyển đến PaymentHistory
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'PaymentHistory' as never }],
                });
              }
            }
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra khi đặt lịch');
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentModalVisible(false);
    Alert.alert('Thành công', 'Thanh toán thành công! Đặt lịch hoàn tất.', [
      {
        text: 'OK',
        onPress: () => {
          dispatch(resetBooking());
          // Reset navigation stack và chuyển đến PaymentHistory
          navigation.reset({
            index: 0,
            routes: [{ name: 'PaymentHistory' as never }],
          });
        }
      }
    ]);
  };


  return (
    <TouchableWithoutFeedback onPress={() => setShowTimeDropdown(false)}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Sticky Header with Payment Info */}
        <View style={[styles.headerContainer, styles.stickyHeader]}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconWrapper}>
              <Icon name="flash-outline" size={20} color="#1890ff" />
            </View> 
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Đặt Lịch Nhanh Nhất</Text>
              <Text style={styles.headerSubtitle}>
                <Text style={styles.highlightText}>Cọc 20%</Text> trước • <Text style={styles.highlightText}>80%</Text> sau
              </Text>
            </View>
            <View style={styles.headerBadge}> 
              <Text style={styles.headerBadgeText}>Nhanh Nhất</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Booking Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>Thông tin đặt lịch</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Icon name="car-outline" size={16} color="#1890ff" />
                <Text style={styles.summaryLabel}>Xe:</Text>
                <Text style={styles.summaryValue}>
                  {selectedVehicle?.vehicleInfo.vehicleModel.brand} {selectedVehicle?.vehicleInfo.vehicleModel.modelName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Icon name="business-outline" size={16} color="#1890ff" />
                <Text style={styles.summaryLabel}>Trung tâm:</Text>
                <Text style={styles.summaryValue}>{selectedServiceCenter?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Icon name="construct-outline" size={16} color="#1890ff" />
                <Text style={styles.summaryLabel}>Dịch vụ:</Text>
                <Text style={styles.summaryValue}>
                  {isInspectionOnlyFromState ? 'Chỉ kiểm tra' : (selectedService?.name || 'N/A')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Date Selection */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Chọn ngày</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar-outline" size={20} color="#1890ff" />
              <Text style={styles.dateTimeButtonText}>
                {selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : 'Chọn ngày'}
              </Text>
              <Icon name="chevron-forward-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Chọn giờ đến</Text>
              
              {/* Time Selection Mode Toggle */}
              <View style={styles.timeModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.timeModeButton,
                    timeSelectionMode === 'preset' && styles.timeModeButtonActive
                  ]}
                  onPress={() => handleTimeModeChange('preset')}
                >
                  <Text style={[
                    styles.timeModeButtonText,
                    timeSelectionMode === 'preset' && styles.timeModeButtonTextActive
                  ]}>
                    Giờ có sẵn
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timeModeButton,
                    timeSelectionMode === 'custom' && styles.timeModeButtonActive
                  ]}
                  onPress={() => handleTimeModeChange('custom')}
                >
                  <Text style={[
                    styles.timeModeButtonText,
                    timeSelectionMode === 'custom' && styles.timeModeButtonTextActive
                  ]}>
                    Tự chọn giờ
                  </Text>
                </TouchableOpacity>
              </View>

              {timeSelectionMode === 'preset' ? (
                <View style={styles.timeDropdownContainer}>
                  <TouchableOpacity
                    style={styles.timeDropdownButton}
                    onPress={() => setShowTimeDropdown(!showTimeDropdown)}
                  >
                    <Icon name="time-outline" size={20} color="#1890ff" />
                    <Text style={styles.timeDropdownText}>
                      {selectedTime ? formatTime12h(selectedTime) : 'Chọn giờ đến'}
                    </Text>
                    <Icon 
                      name={showTimeDropdown ? "chevron-up-outline" : "chevron-down-outline"} 
                      size={16} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                  
                  {showTimeDropdown && (
                    <View style={styles.timeDropdownList}>
                      {timeSlots.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeDropdownItem,
                            selectedTime === time && styles.selectedTimeDropdownItem
                          ]}
                          onPress={() => handleTimeSelect(time)}
                        >
                          <Text style={[
                            styles.timeDropdownItemText,
                            selectedTime === time && styles.selectedTimeDropdownItemText
                          ]}>
                            {formatTime12h(time)}
                          </Text>
                          {selectedTime === time && (
                            <Icon name="checkmark" size={16} color="#1890ff" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.customTimeContainer}>
                  <TextInput
                    mode="outlined"
                    label="Giờ đến (VD: 14:30)"
                    placeholder="Nhập giờ bạn muốn đến"
                    value={customTime}
                    onChangeText={handleCustomTimeChange}
                    style={styles.customTimeInput}
                    keyboardType="numeric"
                  />
                  <Text style={styles.customTimeNote}>
                    * Giờ đến sẽ được xác nhận lại với trung tâm
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Service Description */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Mô tả dịch vụ (tùy chọn)</Text>
            <TextInput
              mode="outlined"
              placeholder="Mô tả chi tiết về vấn đề hoặc yêu cầu của bạn..."
              value={serviceDescription}
              onChangeText={setServiceDescription}
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
            />
          </Card.Content>
        </Card>

        {/* Payment Preference */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => setPaymentPreference('offline')}
              >
                <RadioButton
                  value="offline"
                  status={paymentPreference === 'offline' ? 'checked' : 'unchecked'}
                  onPress={() => setPaymentPreference('offline')}
                />
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>Thanh toán tại trung tâm</Text>
                  <Text style={styles.paymentOptionDescription}>
                    Thanh toán khi hoàn thành dịch vụ
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => setPaymentPreference('online')}
              >
                <RadioButton
                  value="online"
                  status={paymentPreference === 'online' ? 'checked' : 'unchecked'}
                  onPress={() => setPaymentPreference('online')}
                />
                <View style={styles.paymentOptionContent}>
                  <Text style={styles.paymentOptionTitle}>Thanh toán online</Text>
                  <Text style={styles.paymentOptionDescription}>
                    Thanh toán trước qua ví điện tử
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Create Booking Button */}
        <View style={styles.createButtonContainer}>
          <Button
            mode="contained"
            onPress={handleCreateBooking}
            loading={createBookingLoading}
            disabled={!selectedDate || (!selectedTime && !customTime)}
            style={styles.createButton}
            contentStyle={styles.createButtonContent}
          >
            Hoàn tất đặt lịch
          </Button>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <Button
          mode="outlined"
          onPress={onPrev}
          style={styles.backButton}
          contentStyle={styles.buttonContent}
        >
          Quay lại
        </Button>
      </View>

      {/* Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => setShowDatePicker(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Chọn ngày</Text>
          <DateTimePicker
            value={selectedDate ? new Date(selectedDate) : new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              if (date) { 
                handleDateSelect(date);
              }
            }}
          />
        </Modal>
      </Portal>

      {/* Payment Modal */}
      {paymentModalVisible && bookingResponse && bookingResponse.data?.payment && (
        <PaymentModal
          visible={paymentModalVisible}
          paymentData={bookingResponse.data.payment}
          onPaymentSuccess={handlePaymentSuccess}
          onCancel={() => {
            setPaymentModalVisible(false);
            // Khi hủy thanh toán, vẫn chuyển đến PaymentHistory để xem trạng thái
            Alert.alert('Thông báo', 'Bạn có thể tiếp tục thanh toán sau từ trang lịch sử thanh toán.', [
              {
                text: 'OK',
                onPress: () => {
                  dispatch(resetBooking());
                  // Reset navigation stack và chuyển đến PaymentHistory
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'PaymentHistory' as never }],
                  });
                }
              }
            ]);
          }}
          description={bookingResponse.data.payment.description || 'Thanh toán đặt lịch'}
        />
      )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    paddingTop: 90, // Space for sticky header
  },
  headerContainer: {
    backgroundColor: '#1890ff',
    margin: 16,
    borderRadius: 16,
    shadowColor: '#1890ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stickyHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
    margin: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  highlightText: {
    color: 'white',
    fontWeight: '700',
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  dateTimeButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  descriptionInput: {
    backgroundColor: 'white',
  },
  paymentOptions: {
    gap: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: 12,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  createButtonContainer: {
    padding: 16,
  },
  createButton: {
    backgroundColor: '#1890ff',
  },
  createButtonContent: {
    paddingVertical: 12,
  },
  navigationContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  backButton: {
    flex: 1,
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
    marginBottom: 16,
  },
  timeModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  timeModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeModeButtonActive: {
    backgroundColor: '#1890ff',
  },
  timeModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  timeModeButtonTextActive: {
    color: 'white',
  },
  timeDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  timeDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  timeDropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  timeDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  timeDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedTimeDropdownItem: {
    backgroundColor: '#f0f9ff',
  },
  timeDropdownItemText: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  selectedTimeDropdownItemText: {
    color: '#1890ff',
    fontWeight: '500',
  },
  customTimeContainer: {
    marginTop: 8,
  },
  customTimeInput: {
    backgroundColor: 'white',
  },
  customTimeNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default Step4DateTimeAndDetailsScreen;
