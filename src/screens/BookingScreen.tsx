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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with quick access to booking history */}
      


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
    padding: 20,
    marginBottom: 16,
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
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
    margin: 16,
    marginTop: 0,
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
    marginBottom: 16,
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
    padding: 16,
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
});

export default BookingScreen;
