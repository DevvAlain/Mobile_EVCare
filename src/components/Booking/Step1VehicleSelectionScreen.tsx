import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons as Icon } from '@expo/vector-icons';
import {
  Button,
  Card,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '../../service/store';
import { fetchVehicles, setSelectedVehicle } from '../../service/slices/bookingSlice';
import { Vehicle } from '../../types/vehicle';
import { Text } from 'react-native';
import VehicleForm from '../VehicleForm';

interface Step1VehicleSelectionScreenProps {
  onNext: () => void;
}

const Step1VehicleSelectionScreen: React.FC<Step1VehicleSelectionScreenProps> = ({ onNext }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { vehicles, selectedVehicle, loading } = useAppSelector((state) => state.booking);
  const { user } = useAppSelector((state) => state.auth);

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchVehicles());
    }
  }, [dispatch, user?.id]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    if (selectedVehicle?._id === vehicle._id) {
      dispatch(setSelectedVehicle(null));
    } else {
      dispatch(setSelectedVehicle(vehicle));
    }
  };

  const handleVehicleCreated = () => {
    setShowCreateForm(false);
    dispatch(fetchVehicles()); // Refresh the vehicles list
  };

  const handleNext = () => {
    if (!selectedVehicle) {
      Alert.alert('Lỗi', 'Vui lòng chọn xe hoặc tạo xe mới');
      return;
    }
    onNext();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ProgressBar indeterminate />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {!showCreateForm && (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Existing Vehicles */}
          {vehicles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Xe hiện có</Text>
              <View style={styles.vehiclesGrid}>
                {vehicles.map((vehicle: Vehicle) => (
                  <TouchableOpacity
                    key={vehicle._id}
                    style={[
                      styles.vehicleCard,
                      selectedVehicle?._id === vehicle._id && styles.selectedVehicleCard
                    ]}
                    onPress={() => handleSelectVehicle(vehicle)}
                  >
                    <View style={styles.vehicleContent}>
                      <View style={styles.vehicleIcon}>
                        <Icon name="car" size={24} color="#1890ff" />
                      </View>
                      <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>
                          {vehicle.vehicleInfo.vehicleModel.brand} {vehicle.vehicleInfo.vehicleModel.modelName}
                        </Text>
                        <Text style={styles.vehicleDetails}>
                          {vehicle.vehicleInfo.licensePlate} • {vehicle.vehicleInfo.year}
                        </Text>
                        <Text style={styles.vehicleSpecs}>
                          {vehicle.vehicleInfo.color} • {vehicle.vehicleInfo.vehicleModel.batteryType}
                        </Text>
                      </View>
                      {selectedVehicle?._id === vehicle._id && (
                        <Icon name="checkmark-circle" size={24} color="#1890ff" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Add New Vehicle Button */}
          <View style={styles.addVehicleSection}>
            <TouchableOpacity
              style={styles.addVehicleButton}
              onPress={() => setShowCreateForm(!showCreateForm)}
            >
              <Icon name="add-circle-outline" size={24} color="#1890ff" />
              <Text style={styles.addVehicleText}>
                {showCreateForm ? 'Hủy thêm xe' : 'Thêm xe mới'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Create Vehicle Form - Full Screen */}
      {showCreateForm && (
        <View style={styles.fullScreenForm}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Thông tin xe mới</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCreateForm(false)}
            >
              <Icon name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <VehicleForm
            onSuccess={handleVehicleCreated}
            onCancel={() => setShowCreateForm(false)}
            showCancelButton={true}
            submitButtonText="Thêm xe"
          />
        </View>
      )}

      {/* Next Button - Only show when not creating vehicle */}
      {!showCreateForm && (
        <View style={styles.nextButtonContainer}>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!selectedVehicle}
            style={styles.nextButton}
            contentStyle={styles.nextButtonContent}
          >
            Tiếp theo
          </Button>
        </View>
      )}
    </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  vehiclesGrid: {
    gap: 12,
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedVehicleCard: {
    borderColor: '#1890ff',
    backgroundColor: '#f0f9ff',
  },
  vehicleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f9ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  vehicleSpecs: {
    fontSize: 12,
    color: '#9ca3af',
  },
  addVehicleSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
  },
  addVehicleText: {
    fontSize: 16,
    color: '#1890ff',
    fontWeight: '500',
    marginLeft: 8,
  },
  fullScreenForm: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  nextButtonContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nextButton: {
    backgroundColor: '#1890ff',
  },
  nextButtonContent: {
    paddingVertical: 8,
  },
});

export default Step1VehicleSelectionScreen;
