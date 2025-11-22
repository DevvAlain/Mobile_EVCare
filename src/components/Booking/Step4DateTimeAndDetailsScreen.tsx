import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Alert, TouchableWithoutFeedback, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {
  Button,
  Card,
  TextInput,
  useTheme,
  Portal,
  Modal,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppDispatch, useAppSelector } from '../../service/store';
import {
  updateBookingData,
  createBooking,
  resetBooking
} from '../../service/slices/bookingSlice';
// note: clearCurrentPayment not used in this component
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
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [activeTimeDropdown, setActiveTimeDropdown] = useState<'hour' | 'minute' | null>(null);
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const [timeSelectionMode, setTimeSelectionMode] = useState<'preset' | 'custom'>('preset');

  
  const [snack, setSnack] = useState<string>('');
  const [snackType, setSnackType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [snackVisible, setSnackVisible] = useState(false);
  const toastAnim = React.useRef(new Animated.Value(0)).current;
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackType(type);
    setSnack(message);
    setSnackVisible(true);
  };

  useEffect(() => {
    if (!snackVisible) return;
    Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setSnackVisible(false));
    }, 3000);
    return () => clearTimeout(t);
  }, [snackVisible, toastAnim]);

  // Time dropdown overlay (Portal) positioning
  const timeButtonRef = useRef<any>(null);
  const [timeAnchor, setTimeAnchor] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  // Hour/Minute sources
  const hourItems = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minuteItems = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));


  // Update booking data when form changes
  useEffect(() => {
    const finalTime = timeSelectionMode === 'custom' ? customTime : selectedTime;
    const newBookingData = {
      appointmentDate: selectedDate,
      appointmentTime: finalTime,
      serviceDescription,
    };

    const hasChanges = Object.keys(newBookingData).some(key => {
      const currentValue = newBookingData[key as keyof typeof newBookingData];
      const existingValue = bookingData[key as keyof typeof bookingData];
      return currentValue !== existingValue;
    });

    if (hasChanges) {
      dispatch(updateBookingData(newBookingData));
    }
  }, [selectedDate, selectedTime, customTime, timeSelectionMode, serviceDescription, dispatch]);

  const handleDateSelect = (date: Date) => {
    const dateString = dayjs(date).format('YYYY-MM-DD');
    setSelectedDate(dateString);
    setShowDatePicker(false);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCustomTime('');
    setShowTimeDropdown(false);
    setActiveTimeDropdown(null);
  };

  const handlePickHour = (hour: string) => {
    setSelectedHour(hour);
    const minute = selectedMinute || '00';
    const final = `${hour}:${minute}`;
    // Prevent selecting past time for today
    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const dt = dayjs(`${selectedDate} ${final}`, 'YYYY-MM-DD HH:mm');
      if (dt.isBefore(dayjs())) {
        showToast('Không thể chọn giờ trong quá khứ', 'warning');
        return;
      }
    }
    setSelectedTime(final);
    setCustomTime('');
    setActiveTimeDropdown('minute');
  };

  const handlePickMinute = (minute: string) => {
    setSelectedMinute(minute);
    const hour = selectedHour || '01';
    const final = `${hour}:${minute}`;
    // Prevent selecting past time for today
    if (selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const dt = dayjs(`${selectedDate} ${final}`, 'YYYY-MM-DD HH:mm');
      if (dt.isBefore(dayjs())) {
        showToast('Không thể chọn giờ trong quá khứ', 'warning');
        return;
      }
    }
    setSelectedTime(final);
    setCustomTime('');
    setShowTimeDropdown(false);
    setActiveTimeDropdown(null);
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
    setSelectedTime('');
  };

  const validateCustomOnBlur = () => {
    // Only validate when a full HH:mm present
    if (!selectedDate) return;
    if (!/^[0-2]\d:[0-5]\d$/.test(customTime)) return;
    // If selected date is today, ensure time not in past
    if (dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const dt = dayjs(`${selectedDate} ${customTime}`, 'YYYY-MM-DD HH:mm');
      if (dt.isBefore(dayjs())) {
        showToast('Giờ bạn nhập đã ở quá khứ. Vui lòng chọn giờ khác', 'warning');
        setCustomTime('');
      }
    }
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
      showToast('Vui lòng chọn ngày và giờ', 'warning');
      return;
    }

    if (!selectedServiceCenter) {
      showToast('Không tìm thấy trung tâm dịch vụ', 'error');
      return;
    }

    // Prevent submitting past datetime
    if (dayjs(selectedDate).isSame(dayjs(), 'day')) {
      const dt = dayjs(`${selectedDate} ${finalTime}`, 'YYYY-MM-DD HH:mm');
      if (dt.isBefore(dayjs())) {
        showToast('Không thể đặt lịch cho thời gian đã qua', 'warning');
        return;
      }
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
        isInspectionOnly: isInspectionOnlyFromState,
        // BookingData requires paymentPreference; use offline by default since online payment was removed
        paymentPreference: 'offline' as const,
      };
      const result = await dispatch(createBooking(bookingPayload)).unwrap();

      if (result.success) {
        // Always treat as offline payment flow (no online payment option)
        dispatch(resetBooking());
        navigation.reset({ index: 0, routes: [{ name: 'BookingHistory' as never, params: { toastMessage: 'Đặt lịch thành công!', toastType: 'success' } as never }] });
      }
    } catch (error: any) {
      showToast(error.message || 'Có lỗi xảy ra khi đặt lịch', 'error');
    }
  };


  return (
    <TouchableWithoutFeedback onPress={() => setShowTimeDropdown(false)}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top - 16, 0) }]}>
        {/* Top Toast (same style as BookingHistory) */}
        {snackVisible ? (() => {
          const meta = {
            success: { bg: '#ECFDF5', text: '#065F46', border: '#10B981', icon: 'checkmark-circle-outline' },
            error: { bg: '#FEF2F2', text: '#991B1B', border: '#EF4444', icon: 'alert-circle-outline' },
            info: { bg: '#EFF6FF', text: '#1E40AF', border: '#3B82F6', icon: 'information-circle-outline' },
            warning: { bg: '#FFFBEB', text: '#92400E', border: '#F59E0B', icon: 'warning-outline' },
          }[snackType];
          return (
            <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
              <Animated.View style={{ transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, Math.max(insets.top, 8)] }) }], opacity: toastAnim, paddingHorizontal: 16, paddingTop: 8 }}>
                <View style={{ backgroundColor: meta.bg, borderLeftWidth: 4, borderLeftColor: meta.border, padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}>
                  <Icon name={meta.icon as any} size={18} color={meta.border} />
                  <Text style={{ color: meta.text, flex: 1 }}>{snack}</Text>
                </View>
              </Animated.View>
            </View>
          );
        })() : null}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Booking Summary (banner removed) */}
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
                    <View style={styles.timeSelectorsRow}>
                      <TouchableOpacity
                        ref={timeButtonRef}
                        style={styles.timeUnitButton}
                        onPress={() => {
                          if (timeButtonRef.current && (timeButtonRef.current as any).measureInWindow) {
                            (timeButtonRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                              setTimeAnchor({ x, y, width, height });
                              setActiveTimeDropdown('hour');
                              setShowTimeDropdown(true);
                            });
                          } else {
                            setActiveTimeDropdown('hour');
                            setShowTimeDropdown(true);
                          }
                        }}
                      >
                        <Icon name="time-outline" size={20} color="#1890ff" />
                        <Text style={styles.timeDropdownText}>
                          {selectedHour || 'Giờ (01-24)'}
                        </Text>
                        <Icon
                          name={showTimeDropdown && activeTimeDropdown === 'hour' ? "chevron-up-outline" : "chevron-down-outline"}
                          size={16}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.timeUnitButton}
                        onPress={() => {
                          if (timeButtonRef.current && (timeButtonRef.current as any).measureInWindow) {
                            (timeButtonRef.current as any).measureInWindow((x: number, y: number, width: number, height: number) => {
                              setTimeAnchor({ x, y, width, height });
                              setActiveTimeDropdown('minute');
                              setShowTimeDropdown(true);
                            });
                          } else {
                            setActiveTimeDropdown('minute');
                            setShowTimeDropdown(true);
                          }
                        }}
                      >
                        <Icon name="time-outline" size={20} color="#1890ff" />
                        <Text style={styles.timeDropdownText}>
                          {selectedMinute || 'Phút (00-59)'}
                        </Text>
                        <Icon
                          name={showTimeDropdown && activeTimeDropdown === 'minute' ? "chevron-up-outline" : "chevron-down-outline"}
                          size={16}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
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
                      maxLength={5}
                      onBlur={() => {
                        // Auto-complete minutes if only hours entered
                        if (/^\d{2}$/.test(customTime)) {
                          handleCustomTimeChange(`${customTime}:00`);
                        }
                        // validate custom time against selected date
                        validateCustomOnBlur();
                      }}
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

          {/* Payment Preference removed */}

          {/* Spacer to avoid content under bottom actions */}
          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>

        {/* Navigation */}
        {/* compute finalTime and validation booleans to ensure disabled prop is boolean */}
        <View style={[styles.navigationContainer, { paddingBottom: insets.bottom + 50 }]}>
          <Button
            mode="outlined"
            compact
            onPress={onPrev}
            style={styles.backButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Quay lại
          </Button>
          {(() => {
            const finalTime = timeSelectionMode === 'custom' ? customTime : selectedTime;
            const hasTime = !!finalTime;
            const isToday = !!(selectedDate && dayjs(selectedDate).isSame(dayjs(), 'day'));
            const isPast = Boolean(selectedDate && hasTime && isToday && dayjs(`${selectedDate} ${finalTime}`, 'YYYY-MM-DD HH:mm').isBefore(dayjs()));
            const disabled = !selectedDate || !hasTime || isPast;
            return (
              <Button
                mode="contained"
                compact
                onPress={handleCreateBooking}
                loading={createBookingLoading}
                disabled={disabled}
                style={styles.createButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Hoàn tất đặt lịch
              </Button>
            );
          })()}
        </View>

        {/* Date Picker Modal */}
        <Portal>
          {/* Time Dropdown Overlay */}
          {showTimeDropdown && (
            <TouchableWithoutFeedback onPress={() => setShowTimeDropdown(false)}>
              <View style={styles.overlayRoot}>
                <View
                  style={[
                    styles.portalDropdown,
                    {
                      top: Math.max(timeAnchor.y + timeAnchor.height, 0),
                      left: 16,
                      right: 16,
                    },
                  ]}
                >
                  <ScrollView style={styles.timeScroll} showsVerticalScrollIndicator={true}>
                    {(activeTimeDropdown === 'hour' ? hourItems : minuteItems).map((val) => {
                      const isSelected = activeTimeDropdown === 'hour' ? selectedHour === val : selectedMinute === val;
                      const onPress = activeTimeDropdown === 'hour' ? () => handlePickHour(val) : () => handlePickMinute(val);
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[styles.timeDropdownItem, isSelected && styles.selectedTimeDropdownItem]}
                          onPress={onPress}
                        >
                          <Text style={[styles.timeDropdownItemText, isSelected && styles.selectedTimeDropdownItemText]}>
                            {val}
                          </Text>
                          {isSelected && <Icon name="checkmark" size={16} color="#1890ff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </TouchableWithoutFeedback>
          )}
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

        {/* Payment modal removed (online payment disabled) */}
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
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryContent: {
    gap: 12,
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  depositHeader: {
    backgroundColor: "#E6F4FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BBDFFF",
  },

  depositTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1677FF",
  },

  depositSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#444",
  },
  sectionCard: {
    margin: 12,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
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
    gap: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
  navigationContainer: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 6,
  },
  backButton: {
    flex: 1,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#1890ff',
  },
  buttonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    marginBottom: 12,
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
  timeSelectorsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timeUnitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
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
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 4000,
  },
  portalDropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    maxHeight: 280,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  timeScroll: {
    maxHeight: 280,
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
