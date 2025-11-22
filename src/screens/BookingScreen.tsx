import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Ionicons as Icon } from '@expo/vector-icons';
import {
  Button,
  Card,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../service/store';
import { resetBooking, setCurrentStep } from '../service/slices/bookingSlice';
import { clearCurrentPayment } from '../service/slices/paymentSlice.ts/paymentSlice';
import Step1VehicleSelectionScreen from '../components/Booking/Step1VehicleSelectionScreen';
import Step2ServiceCenterSelectionScreen from '../components/Booking/Step2ServiceCenterSelectionScreen';
import Step3ServiceSelectionScreen from '../components/Booking/Step3ServiceSelectionScreen';
import Step4DateTimeAndDetailsScreen from '../components/Booking/Step4DateTimeAndDetailsScreen';

const BookingScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { currentStep, selectedVehicle, selectedServiceCenter, selectedService } = useAppSelector((state) => state.booking);

  // Clear payment state when starting new booking
  useEffect(() => {
    dispatch(clearCurrentPayment());
  }, [dispatch]);

  const steps = [
    {
      title: 'Chọn xe',
      description: 'Chọn xe hoặc thêm xe mới',
      icon: 'car-outline',
      status: 'wait' as const,
    },
    {
      title: 'Chọn trung tâm',
      description: 'Tìm trung tâm dịch vụ',
      icon: 'business-outline',
      status: 'wait' as const,
    },
    {
      title: 'Chọn dịch vụ',
      description: 'Dịch vụ tương thích',
      icon: 'construct-outline',
      status: 'wait' as const,
    },
    {
      title: 'Thông tin cuối',
      description: 'Ngày giờ & chi tiết',
      icon: 'calendar-outline',
      status: 'wait' as const,
    },
  ];

  const currentStepIndex = currentStep - 1;

  const updateStepStatus = () => {
    return steps.map((step, index) => {
      if (index < currentStepIndex) {
        return { ...step, status: 'finish' as const };
      } else if (index === currentStepIndex) {
        return { ...step, status: 'process' as const };
      } else {
        return { ...step, status: 'wait' as const };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      dispatch(setCurrentStep(currentStep + 1));
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow going back to previous steps
    if (step + 1 <= currentStep) {
      dispatch(setCurrentStep(step + 1));
    }
  };

  const handleBackToHome = () => {
    dispatch(clearCurrentPayment());
    dispatch(resetBooking());
    // Navigate back to home screen
  };

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0:
        return <Step1VehicleSelectionScreen onNext={handleNext} />;
      case 1:
        return <Step2ServiceCenterSelectionScreen onNext={handleNext} onPrev={handlePrev} />;
      case 2:
        return <Step3ServiceSelectionScreen onNext={handleNext} onPrev={handlePrev} />;
      case 3:
        return <Step4DateTimeAndDetailsScreen onPrev={handlePrev} />;
      default:
        return <Step1VehicleSelectionScreen onNext={handleNext} />;
    }
  };

  const canProceedToStep = (stepIndex: number) => {
    const stepNumber = stepIndex + 1; // Convert 0-based index to 1-based step number
    switch (stepNumber) {
      case 1:
        return true; // Always can start
      case 2:
        return !!selectedVehicle;
      case 3:
        return !!selectedVehicle && !!selectedServiceCenter;
      case 4:
        return !!selectedVehicle && !!selectedServiceCenter && !!selectedService;
      default:
        return false;
    }
  };

  const getStepIconColor = (index: number) => {
    if (index < currentStepIndex) {
      return '#10B981'; // Green for completed
    } else if (index === currentStepIndex) {
      return '#1890ff'; // Blue for current
    } else {
      return '#9ca3af'; // Gray for upcoming
    }
  };

  const getStepTextColor = (index: number) => {
    if (index <= currentStepIndex) {
      return '#1890ff';
    } else {
      return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { paddingTop: 16 }]}>
      {/* Header: Improved layout */}
      <View style={styles.headerContainer}>
        <View style={styles.headerMain}>
          <Text style={styles.headerTitle}>Tạo lịch hẹn dịch vụ</Text>
          <Text style={styles.headerSubtitle}>Chọn xe, trung tâm và dịch vụ</Text>
        </View>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('BookingHistory')}
        >
          <Icon name="time-outline" size={18} color="#1A40B8" />
          <Text style={styles.historyButtonText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>


      {/* Progress Steps - Horizontal Layout */}
      <Card style={styles.stepsCard}>
        <Card.Content>
          <View style={styles.stepsContainer}>
            {updateStepStatus().map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.stepItem,
                  canProceedToStep(index) && styles.stepItemEnabled,
                  !canProceedToStep(index) && styles.stepItemDisabled
                ]}
                onPress={() => canProceedToStep(index) && handleStepClick(index)}
                disabled={!canProceedToStep(index)}
              >
                <View style={styles.stepIconContainer}>
                  <Icon
                    name={step.icon as any}
                    size={16}
                    color={getStepIconColor(index)}
                  />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    { color: getStepTextColor(index) }
                  ]} numberOfLines={1}>
                    {step.title}
                  </Text>
                </View>
                {index < currentStepIndex && (
                  <Icon name="checkmark-circle" size={16} color="#10B981" />
                )}
                {index < steps.length - 1 && (
                  <View style={styles.stepConnector} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Bước {currentStepIndex + 1} / {steps.length}
          </Text>
          <View style={styles.progressBarContainer}>
            <ProgressBar
              progress={(currentStepIndex + 1) / steps.length}
              color="#1890ff"
              style={styles.progressBar}
            />
          </View>
        </View>
      </View>

      {/* Step Content */}
      <View style={styles.stepContentContainer}>
        {renderStepContent()}
      </View>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1890ff',
    padding: 10,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A40B8',
    marginBottom: 4,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    paddingTop: 30,
  },
  headerMain: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A40B8',
    marginLeft: 6,
  },

  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  homeButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  stepsCard: {
    margin: 10,
    marginTop: 10,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginHorizontal: 2,
    position: 'relative',
  },
  stepItemEnabled: {
    backgroundColor: '#f8fafc',
  },
  stepItemDisabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.6,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  stepConnector: {
    position: 'absolute',
    right: -8,
    top: 16,
    width: 16,
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 2,
    marginTop: 10,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  stepContentContainer: {
    flex: 1,
  },
  helpSection: {
    padding: 10,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  helpPhone: {
    fontSize: 12,
    color: '#1890ff',
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  mainCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  mainCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  historyCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  historyCardText: {
    color: '#1A40B8',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default BookingScreen;
